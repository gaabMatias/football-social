import type { ReactNode } from "react";
import { colorForTag } from "@/tokens/colors";

type Tone = "default" | "tag" | "accent" | "success" | "warning" | "error" | "info";

interface BadgeProps {
  children: ReactNode;
  tone?: Tone;
  /** When true (and tone="tag"), pick a deterministic pastel color from the tag palette. */
  colorFromText?: boolean;
}

export function Badge({ children, tone = "default", colorFromText = false }: BadgeProps) {
  const className =
    tone === "default" ? "badge" : `badge badge--${tone}`;

  if (colorFromText && tone === "tag" && typeof children === "string") {
    const c = colorForTag(children);
    return (
      <span
        className={className}
        style={{
          color: c,
          borderColor: "rgba(255,255,255,0.06)",
          background: "rgba(255,255,255,0.03)",
        }}
      >
        {children}
      </span>
    );
  }

  return <span className={className}>{children}</span>;
}
