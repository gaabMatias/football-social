interface AvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
  /** Optional override color (defaults to deterministic from name). */
  color?: string;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]?.slice(0, 2).toUpperCase() ?? "?";
  return ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase();
}

const palette = ["#7C7DE0", "#90CAF9", "#A5D6A7", "#F48FB1", "#F0C38E", "#B39DDB"];

function colorFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return palette[Math.abs(hash) % palette.length] as string;
}

export function Avatar({ name, size = "md", color }: AvatarProps) {
  const bg = color ?? colorFor(name);
  return (
    <span
      className={`avatar avatar--${size}`}
      style={{ background: bg, color: "#0F1117", borderColor: "transparent" }}
      aria-label={name}
      title={name}
    >
      {initials(name)}
    </span>
  );
}
