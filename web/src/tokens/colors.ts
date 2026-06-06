export const colors = {
  bgDeep: "#0F1117",
  bgPrimary: "#14161E",
  bgSurface: "#1B1D27",
  bgElevated: "#23262F",
  bgHover: "#2B2E3A",
  bgInput: "#121319",

  borderDefault: "#2D303D",
  borderSubtle: "#22242E",
  borderFocus: "#6C6DCC",

  textPrimary: "#E6E7EC",
  textSecondary: "#8C8E9C",
  textTertiary: "#5A5C6A",

  accent: "#9B9CF8",
  accentSolid: "#7C7DE0",
  accentDim: "#2B2B50",
  accentBg: "rgba(155,156,248,0.08)",

  success: "#7DD3A8",
  successBg: "rgba(125,211,168,0.08)",
  warning: "#F0C38E",
  warningBg: "rgba(240,195,142,0.08)",
  error: "#E88B8B",
  errorBg: "rgba(232,139,139,0.08)",
  info: "#7EB8E5",
  infoBg: "rgba(126,184,229,0.08)",

  tag1: "#B39DDB",
  tag2: "#90CAF9",
  tag3: "#A5D6A7",
  tag4: "#F48FB1",
} as const;

export type ColorToken = keyof typeof colors;

export const tagPalette = [colors.tag1, colors.tag2, colors.tag3, colors.tag4] as const;

export function colorForTag(tag: string): string {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = (hash * 31 + tag.charCodeAt(i)) | 0;
  }
  return tagPalette[Math.abs(hash) % tagPalette.length];
}
