import { forwardRef, type SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, children, className = "", id, ...rest },
  ref,
) {
  const selectId = id ?? rest.name ?? `sel-${Math.random().toString(36).slice(2, 8)}`;
  return (
    <div className="field">
      {label && (
        <label className="field__label" htmlFor={selectId}>
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        className={["select", className].filter(Boolean).join(" ")}
        aria-invalid={Boolean(error)}
        {...rest}
      >
        {children}
      </select>
      {error ? <span className="field__error">{error}</span> : null}
    </div>
  );
});
