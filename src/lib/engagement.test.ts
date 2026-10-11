import { describe, expect, it } from 'vitest';
import { crossed } from './engagement';

describe('crossed', () => {
  const marks = [25, 50, 75, 100];

  it('gives nothing while no mark is reached', () => {
    expect(crossed(marks, 0, 24)).toEqual([]);
  });

  it('gives a mark the moment it is reached', () => {
    expect(crossed(marks, 24, 25)).toEqual([25]);
  });

  it('gives every mark a jump passes, in order', () => {
    expect(crossed(marks, 10, 80)).toEqual([25, 50, 75]);
  });

  it('never gives a mark twice', () => {
    expect(crossed(marks, 25, 49)).toEqual([]);
  });

  it('gives nothing on the way back up', () => {
    expect(crossed(marks, 80, 10)).toEqual([]);
  });
});
