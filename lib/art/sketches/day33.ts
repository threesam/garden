import type { Sketch } from "../types";

// Webcam view — displays the user's camera feed. We don't auto-request on
// mount (browsers reject un-gestured prompts, and auto-requesting feels
// invasive on scroll). Instead we paint a "tap to enable" hint and wait for
// a canvas click.
export const day33: Sketch = {
  slug: "33",
  title: "self view",
  date: "2022-02-xx",
  setup(api, canvas) {
    const { ctx, w, h } = api;
    let video: HTMLVideoElement | null = null;
    let stream: MediaStream | null = null;
    let cancelled = false;
    let armed = false;
    let started = false;
    let errorText: string | null = null;

    function paintMessage(text: string) {
      ctx.fillStyle = "rgb(0,0,0)";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.font = "14px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, w / 2, h / 2);
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
    }

    paintMessage("tap / click to enable camera");

    async function enable() {
      if (started || cancelled) return;
      started = true;
      paintMessage("requesting camera…");
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        video = document.createElement("video");
        video.srcObject = stream;
        video.autoplay = true;
        video.playsInline = true;
        video.muted = true;
        await video.play();
      } catch {
        errorText = "camera unavailable";
        started = false;
        paintMessage(errorText);
      }
    }

    function onClick() {
      if (!armed) return;
      enable();
    }
    // Arm the click handler after one tick so the sketch doesn't grab the
    // very scroll-click that landed the user on the section.
    const armTimer = window.setTimeout(() => {
      armed = true;
    }, 600);
    canvas.addEventListener("click", onClick);
    canvas.addEventListener("touchend", onClick);

    return {
      tick() {
        if (!video || video.readyState < 2) {
          if (!started && !errorText) paintMessage("tap / click to enable camera");
          return;
        }
        ctx.fillStyle = "rgb(0,0,0)";
        ctx.fillRect(0, 0, w, h);
        const vw = video.videoWidth;
        const vh = video.videoHeight;
        if (!vw || !vh) return;
        const aspect = vw / vh;
        let dw = w;
        let dh = w / aspect;
        if (dh > h) {
          dh = h;
          dw = h * aspect;
        }
        const dx = (w - dw) / 2;
        const dy = (h - dh) / 2;
        ctx.save();
        ctx.translate(dx + dw, dy);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, dw, dh);
        ctx.restore();
      },
      cleanup() {
        cancelled = true;
        window.clearTimeout(armTimer);
        canvas.removeEventListener("click", onClick);
        canvas.removeEventListener("touchend", onClick);
        if (stream) stream.getTracks().forEach((t) => t.stop());
        if (video) video.srcObject = null;
      },
    };
  },
};
