"use client";

import { useEffect } from "react";

export function ArtRedirect({ target }: { target: string }) {
  useEffect(() => {
    window.location.replace(target);
  }, [target]);
  return null;
}
