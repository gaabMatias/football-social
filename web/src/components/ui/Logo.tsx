interface LogoProps {
  showWordmark?: boolean;
}

export function Logo({ showWordmark = true }: LogoProps) {
  return (
    <span className="logo">
      <span className="logo__mark">AC</span>
      {showWordmark ? <span className="logo__wordmark">analysis_core</span> : null}
    </span>
  );
}
