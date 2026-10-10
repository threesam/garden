import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { videoVisibility } from './video-visibility';

// A video and an observer reduced to what the action touches.
const setup = (options: { autoplay: boolean }) => {
  const listeners = new Map<string, () => void>();
  const node = {
    paused: true,
    addEventListener: (name: string, cb: () => void) => listeners.set(name, cb),
    removeEventListener: (name: string) => listeners.delete(name),
    play() {
      this.paused = false;
      listeners.get('play')?.();
      return Promise.resolve();
    },
    pause() {
      this.paused = true;
      listeners.get('pause')?.();
    },
  };
  let seen: (entries: { isIntersecting: boolean }[]) => void = () => undefined;
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(cb: typeof seen) {
        seen = cb;
      }
      observe() {
        return undefined;
      }
      disconnect() {
        return undefined;
      }
    },
  );
  const action = videoVisibility(node as unknown as HTMLVideoElement, options);
  const scroll = (isIntersecting: boolean) => {
    seen([{ isIntersecting }]);
  };
  return { node, action, scroll };
};

describe('videoVisibility', () => {
  beforeEach(() => vi.unstubAllGlobals());
  afterEach(() => vi.unstubAllGlobals());

  it('autoplay: plays in view, pauses out of view, plays again on return', () => {
    const { node, scroll } = setup({ autoplay: true });
    scroll(true);
    expect(node.paused).toBe(false);
    scroll(false);
    expect(node.paused).toBe(true);
    scroll(true);
    expect(node.paused).toBe(false);
  });

  it('autoplay: a clip the reader paused stays paused when it scrolls back in', () => {
    const { node, scroll } = setup({ autoplay: true });
    scroll(true);
    node.pause();
    scroll(false);
    scroll(true);
    expect(node.paused).toBe(true);
  });

  it('autoplay: pressing play again hands the clip back to the scroll', () => {
    const { node, scroll } = setup({ autoplay: true });
    scroll(true);
    node.pause();
    void node.play();
    scroll(false);
    scroll(true);
    expect(node.paused).toBe(false);
  });

  it('turning autoplay off stops a clip that is playing', () => {
    const { node, action, scroll } = setup({ autoplay: true });
    scroll(true);
    if (action && 'update' in action) action.update({ autoplay: false });
    expect(node.paused).toBe(true);
    scroll(false);
    scroll(true);
    expect(node.paused).toBe(true);
  });

  it('a resume owed from before autoplay does not outlive it', () => {
    const { node, action, scroll } = setup({ autoplay: false });
    const set = (autoplay: boolean) => {
      if (action && 'update' in action) action.update({ autoplay });
    };
    scroll(true);
    void node.play();
    scroll(false);
    set(true);
    scroll(true);
    set(false);
    expect(node.paused).toBe(true);
    scroll(false);
    scroll(true);
    expect(node.paused).toBe(true);
  });

  it('no autoplay: resumes only what the scroll itself paused', () => {
    const { node, scroll } = setup({ autoplay: false });
    scroll(true);
    expect(node.paused).toBe(true);
    void node.play();
    scroll(false);
    expect(node.paused).toBe(true);
    scroll(true);
    expect(node.paused).toBe(false);
  });
});
