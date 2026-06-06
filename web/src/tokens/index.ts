export const radius = {
  sm: "4px",
  md: "8px",
  lg: "12px",
  xl: "16px",
  full: "9999px",
} as const;

export const spacing = {
  px1: "4px",
  px2: "8px",
  px3: "12px",
  px4: "16px",
  px5: "20px",
  px6: "24px",
  px7: "28px",
  px8: "32px",
  px10: "40px",
} as const;

export const shadows = {
  card: "0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px rgba(45,48,61,0.5)",
  elevated: "0 4px 24px rgba(0,0,0,0.5)",
} as const;

export * from "./colors";
export * from "./typography";
