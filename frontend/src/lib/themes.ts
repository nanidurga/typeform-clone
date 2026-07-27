import type { FormTheme } from "./types";

/** Accent presets: main color + a soft tint used for option boxes. */
export const ACCENTS: Record<string, { main: string; soft: string }> = {
  blue: { main: "#0445af", soft: "#e8f0fd" },
  ink: { main: "#191919", soft: "#ececec" },
  green: { main: "#027a48", soft: "#e4f3ec" },
  purple: { main: "#7c3aed", soft: "#f1eafe" },
  orange: { main: "#c2410c", soft: "#fdeee6" },
  pink: { main: "#be185d", soft: "#fbe9f2" },
};

/** Background presets: page color + matching text colors for contrast. */
export const BACKGROUNDS: Record<
  string,
  { bg: string; ink: string; inkSoft: string; label: string }
> = {
  white: { bg: "#ffffff", ink: "#191919", inkSoft: "#5e5e5e", label: "White" },
  cream: { bg: "#fdf6ec", ink: "#3d3128", inkSoft: "#7a6a58", label: "Cream" },
  mint: { bg: "#eef7f2", ink: "#1c3a2c", inkSoft: "#537a66", label: "Mint" },
  lavender: { bg: "#f4f1fb", ink: "#2b2440", inkSoft: "#6c6491", label: "Lavender" },
  midnight: { bg: "#141414", ink: "#f5f5f5", inkSoft: "#b3b3b3", label: "Midnight" },
};

export const FONTS: Record<string, { family: string; label: string }> = {
  sans: {
    family: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
    label: "Sans",
  },
  serif: { family: 'Georgia, "Times New Roman", serif', label: "Serif" },
  mono: {
    family: 'ui-monospace, "Cascadia Mono", "Courier New", monospace',
    label: "Mono",
  },
};

/** CSS variables + background/font for a themed container. The respondent UI
 *  reads all its colors from these variables, so setting them here re-skins
 *  every component inside the wrapper. */
export function themeStyle(theme: FormTheme | null | undefined): React.CSSProperties {
  const accent = ACCENTS[theme?.accent ?? ""] ?? ACCENTS.blue;
  const background = BACKGROUNDS[theme?.background ?? ""] ?? BACKGROUNDS.white;
  const font = FONTS[theme?.font ?? ""] ?? FONTS.sans;
  return {
    "--tf-accent": accent.main,
    "--tf-accent-soft": accent.soft,
    "--tf-ink": background.ink,
    "--tf-ink-soft": background.inkSoft,
    background: background.bg,
    fontFamily: font.family,
  } as React.CSSProperties;
}
