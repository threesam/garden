/** Build a proxy URL for the /api/img resizing endpoint. */
export function proxyImg(url: string, w: number): string {
  return `/api/img?url=${encodeURIComponent(url)}&w=${w}`;
}
