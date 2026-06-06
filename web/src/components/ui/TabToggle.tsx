interface TabOption<T extends string> {
  id: T;
  label: string;
}

interface TabToggleProps<T extends string> {
  options: TabOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function TabToggle<T extends string>({ options, value, onChange }: TabToggleProps<T>) {
  return (
    <div className="tab-toggle" role="tablist">
      {options.map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            role="tab"
            aria-selected={active}
            type="button"
            className={`tab-toggle__btn ${active ? "tab-toggle__btn--active" : ""}`}
            onClick={() => onChange(opt.id)}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
