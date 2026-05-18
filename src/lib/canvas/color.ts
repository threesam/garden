/** Parse a 6-digit hex color string into normalised [0..1] RGB components. */
export function parseHex(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16) / 255,
    parseInt(hex.slice(3, 5), 16) / 255,
    parseInt(hex.slice(5, 7), 16) / 255,
  ];
}

/**
 * Read a CSS custom property from an element, parse it as a hex color,
 * and fall back to `fallback` if the property is absent or empty.
 */
export function readCssColor(
  el: Element,
  prop: string,
  fallback: string,
): [number, number, number] {
  const value = getComputedStyle(el).getPropertyValue(prop).trim();
  return parseHex(value || fallback);
}
