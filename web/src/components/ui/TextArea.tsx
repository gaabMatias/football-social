import { forwardRef, type TextareaHTMLAttributes } from "react";

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { label, error, hint, className = "", id, ...rest },
  ref,
) {
  const textareaId = id ?? rest.name ?? `ta-${Math.random().toString(36).slice(2, 8)}`;
  return (
    <div className="field">
      {label && (
        <label className="field__label" htmlFor={textareaId}>
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        className={["textarea", error ? "textarea--error" : "", className]
          .filter(Boolean)
          .join(" ")}
        aria-invalid={Boolean(error)}
        {...rest}
      />
      {error ? <span className="field__error">{error}</span> : null}
      {!error && hint ? <span className="caption">{hint}</span> : null}
    </div>
  );
});
