import { absoluteFileUrl } from "@/api/analyses";
import { Button } from "@/components/ui/Button";
import type { AnalysisFile } from "@/types";
import { PdfViewer } from "./PdfViewer";
import { XlsxViewer } from "./XlsxViewer";

interface FileViewerProps {
  file: AnalysisFile;
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

export function FileViewer({ file }: FileViewerProps) {
  if (!file.url) {
    return (
      <div className="callout callout--info">
        File is missing or you don't have access.
      </div>
    );
  }

  const absolute = absoluteFileUrl(file.url);

  return (
    <div className="file-block">
      <div className="file-block__header">
        <div className="file-block__meta">
          <span className={`file-kind-badge file-kind-badge--${file.kind.toLowerCase()}`}>
            {file.kind}
          </span>
          <span className="file-block__filename">{file.original_filename}</span>
          <span className="caption">{formatBytes(file.size)}</span>
        </div>
        <a href={absolute} download={file.original_filename}>
          <Button variant="ghost" size="sm">
            Download
          </Button>
        </a>
      </div>

      {file.kind === "PDF" ? (
        <PdfViewer src={absolute} filename={file.original_filename} />
      ) : (
        <XlsxViewer src={absolute} filename={file.original_filename} />
      )}
    </div>
  );
}
