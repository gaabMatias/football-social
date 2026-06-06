import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, className = "", id, ...rest },
  ref,
) {
  const inputId = id ?? rest.name ?? `input-${Math.random().toString(36).slice(2, 8)}`;
  return (
    <div className="field">
      {label && (
        <label className="field__label" htmlFor={inputId}>
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={["input", error ? "input--error" : "", className].filter(Boolean).join(" ")}
        aria-invalid={Boolean(error)}
        {...rest}
      />
      {error ? <span className="field__error">{error}</span> : null}
      {!error && hint ? <span className="caption">{hint}</span> : null}
    </div>
  );
});
