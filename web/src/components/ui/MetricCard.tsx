interface MetricCardProps {
  label: string;
  value: number | string;
  unit?: string;
  /** Format numeric values with up to N significant digits. */
  precision?: number;
}

function formatValue(value: number | string, precision = 3): string {
  if (typeof value === "string") return value;
  if (!Number.isFinite(value)) return "—";
  if (Math.abs(value) >= 1000) return value.toLocaleString();
  return Number(value.toPrecision(precision)).toString();
}

export function MetricCard({ label, value, unit, precision }: MetricCardProps) {
  return (
    <div className="metric-card">
      <span className="metric-card__label">{label}</span>
      <span className="metric-card__value">
        {formatValue(value, precision)}
        {unit ? <span className="metric-card__unit">{unit}</span> : null}
      </span>
    </div>
  );
}
