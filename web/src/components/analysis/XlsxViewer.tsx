import { useEffect, useMemo, useState } from "react";
import { TabToggle } from "@/components/ui/TabToggle";

interface XlsxViewerProps {
  src: string;
  filename: string;
}

interface SheetData {
  name: string;
  rows: (string | number | boolean | null)[][];
}

const MAX_ROWS = 200;
const MAX_COLS = 30;

export function XlsxViewer({ src, filename }: XlsxViewerProps) {
  const [sheets, setSheets] = useState<SheetData[] | null>(null);
  const [activeSheet, setActiveSheet] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setSheets(null);
    setError(null);

    (async () => {
      try {
        const res = await fetch(src, { credentials: "include" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buf = await res.arrayBuffer();
        const xlsx = await import("xlsx");
        const wb = xlsx.read(buf, { type: "array" });
        const parsed: SheetData[] = wb.SheetNames.map((name) => {
          const ws = wb.Sheets[name];
          const rows = xlsx.utils.sheet_to_json<(string | number | boolean | null)[]>(
            ws,
            { header: 1, defval: null, blankrows: false },
          );
          return { name, rows: rows.slice(0, MAX_ROWS) };
        });
        if (!cancelled) {
          setSheets(parsed);
          setActiveSheet(parsed[0]?.name ?? null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load workbook");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [src]);

  const active = useMemo(
    () => sheets?.find((s) => s.name === activeSheet) ?? null,
    [sheets, activeSheet],
  );

  if (error) {
    return (
      <div className="callout callout--error" role="alert">
        Could not preview {filename}: {error}
      </div>
    );
  }

  if (!sheets) {
    return (
      <div className="file-viewer file-viewer--xlsx">
        <div className="caption">Loading workbook…</div>
      </div>
    );
  }

  if (sheets.length === 0 || !active) {
    return <div className="callout callout--info">Workbook is empty.</div>;
  }

  const headerRow = active.rows[0] ?? [];
  const bodyRows = active.rows.slice(1);
  const colCount = Math.min(MAX_COLS, headerRow.length || (bodyRows[0]?.length ?? 0));
  const truncatedRows = active.rows.length >= MAX_ROWS;

  return (
    <div className="file-viewer file-viewer--xlsx">
      {sheets.length > 1 ? (
        <TabToggle
          options={sheets.map((s) => ({ id: s.name, label: s.name }))}
          value={active.name}
          onChange={setActiveSheet}
        />
      ) : null}

      <div className="file-viewer__table-wrap">
        <table className="file-viewer__table">
          <thead>
            <tr>
              {Array.from({ length: colCount }, (_, i) => (
                <th key={i}>{cellText(headerRow[i])}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bodyRows.map((row, ri) => (
              <tr key={ri}>
                {Array.from({ length: colCount }, (_, ci) => (
                  <td key={ci}>{cellText(row[ci])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="caption">
        {bodyRows.length} row{bodyRows.length === 1 ? "" : "s"} shown
        {truncatedRows ? ` · preview capped at ${MAX_ROWS}` : ""}
        {(headerRow.length || (bodyRows[0]?.length ?? 0)) > MAX_COLS
          ? ` · ${MAX_COLS} of ${headerRow.length || bodyRows[0]!.length} columns`
          : ""}
      </div>
    </div>
  );
}

function cellText(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "number") return Number.isInteger(v) ? String(v) : v.toLocaleString();
  return String(v);
}
