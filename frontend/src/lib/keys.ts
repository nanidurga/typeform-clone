/** Normalized key name — some automation tools dispatch trusted key events
 *  with an empty `key`, so fall back to `code`/`keyCode`. */
export function keyOf(e: {
  key?: string;
  code?: string;
  keyCode?: number;
}): string {
  if (e.key) return e.key;
  if (e.keyCode === 13) return "Enter";
  return e.code ?? "";
}
