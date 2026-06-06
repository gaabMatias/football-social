interface PdfViewerProps {
  src: string;
  filename: string;
}

export function PdfViewer({ src, filename }: PdfViewerProps) {
  return (
    <div className="file-viewer file-viewer--pdf">
      <iframe
        src={src}
        title={filename}
        className="file-viewer__pdf-frame"
        // Most browsers handle PDFs natively; if the user's browser does not,
        // the iframe falls back to a download prompt.
      />
    </div>
  );
}
