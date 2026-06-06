import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { TextArea } from "@/components/ui/TextArea";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/hooks/useAuth";
import type { CreateAnalysisInput, Team } from "@/types";

const MAX_BYTES = 50 * 1024 * 1024;
const ACCEPTED = [".xlsx", ".pdf"];

interface AnalysisFormProps {
  onSubmit: (input: CreateAnalysisInput) => Promise<void> | void;
  isSubmitting?: boolean;
  errorMessage?: string | null;
  /** Optional list of teams (defaults to user's teams). */
  availableTeams?: Team[];
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function fileExt(name: string): string {
  const i = name.lastIndexOf(".");
  return i < 0 ? "" : name.slice(i).toLowerCase();
}

export function AnalysisForm({
  onSubmit,
  isSubmitting,
  errorMessage,
  availableTeams,
}: AnalysisFormProps) {
  const { user } = useAuth();
  const teams = availableTeams ?? user?.teams ?? [];
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tagsRaw, setTagsRaw] = useState("");
  const [selectedTeams, setSelectedTeams] = useState<Set<string>>(new Set());
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<{
    title?: string;
    description?: string;
    teams?: string;
    file?: string;
  }>({});

  function toggleTeam(id: string) {
    setSelectedTeams((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function onFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    if (!f) {
      setFile(null);
      return;
    }
    const ext = fileExt(f.name);
    if (!ACCEPTED.includes(ext)) {
      setErrors((prev) => ({ ...prev, file: "Only .xlsx and .pdf are accepted" }));
      setFile(null);
      e.target.value = "";
      return;
    }
    if (f.size > MAX_BYTES) {
      setErrors((prev) => ({
        ...prev,
        file: `File is ${formatBytes(f.size)} — maximum is 50 MB`,
      }));
      setFile(null);
      e.target.value = "";
      return;
    }
    setErrors((prev) => ({ ...prev, file: undefined }));
    setFile(f);
  }

  function clearFile() {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function validate() {
    const next: typeof errors = {};
    if (!title.trim()) next.title = "Title is required";
    if (!description.trim()) next.description = "Description is required";
    if (selectedTeams.size === 0) {
      next.teams = "Select at least one team to grant access";
    }
    if (!file) next.file = "Attach a .xlsx or .pdf file";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate() || !file) return;
    const tags = tagsRaw
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    await onSubmit({
      title: title.trim(),
      description: description.trim(),
      tags,
      team_access: Array.from(selectedTeams),
      file,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="auth-form" style={{ maxWidth: 720 }}>
      <Input
        label="Title"
        placeholder="What does this analysis cover?"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        error={errors.title}
        autoFocus
      />
      <TextArea
        label="Description"
        placeholder="Brief description, methodology, findings…"
        value={description}
        rows={6}
        onChange={(e) => setDescription(e.target.value)}
        error={errors.description}
      />
      <Input
        label="Tags"
        placeholder="Tactics, Physical, Scouting"
        value={tagsRaw}
        onChange={(e) => setTagsRaw(e.target.value)}
        hint="Comma-separated tags"
      />

      <div className="field">
        <span className="field__label">Attachment</span>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.pdf"
          onChange={onFilePicked}
          style={{ display: "none" }}
        />
        {file ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              className="filter-pill filter-pill--active"
              onClick={() => fileInputRef.current?.click()}
              title="Replace file"
            >
              {fileExt(file.name).replace(".", "").toUpperCase()} · {file.name} · {formatBytes(file.size)}
            </button>
            <Button type="button" variant="ghost" size="sm" onClick={clearFile}>
              Remove
            </Button>
          </div>
        ) : (
          <button
            type="button"
            className="filter-pill"
            onClick={() => fileInputRef.current?.click()}
          >
            + Attach .xlsx or .pdf (max 50 MB)
          </button>
        )}
        {errors.file ? (
          <span className="field__error">{errors.file}</span>
        ) : (
          <span className="caption">
            Accepted: Excel workbooks (.xlsx) and PDF reports.
          </span>
        )}
      </div>

      <div className="field">
        <span className="field__label">Team access</span>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {teams.length === 0 ? (
            <span className="caption">
              You're not in any team yet. Ask an admin to add you to a team before publishing.
            </span>
          ) : (
            teams.map((t) => {
              const active = selectedTeams.has(t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  className={`filter-pill ${active ? "filter-pill--active" : ""}`}
                  onClick={() => toggleTeam(t.id)}
                  aria-pressed={active}
                >
                  {t.name}
                </button>
              );
            })
          )}
        </div>
        {errors.teams ? (
          <span className="field__error">{errors.teams}</span>
        ) : (
          <span className="caption">
            {selectedTeams.size === 0
              ? "At least one team is required to publish."
              : `${selectedTeams.size} team${selectedTeams.size === 1 ? "" : "s"} will see this analysis.`}
          </span>
        )}
      </div>

      {errorMessage ? (
        <div className="callout callout--error" role="alert">
          {errorMessage}
        </div>
      ) : null}

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
        {tagsRaw.trim() ? (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginRight: "auto" }}>
            <span className="caption">Preview:</span>
            {tagsRaw
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
              .slice(0, 6)
              .map((tag) => (
                <Badge key={tag} tone="tag" colorFromText>
                  {tag}
                </Badge>
              ))}
          </div>
        ) : null}
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? "Publishing…" : "Publish analysis"}
        </Button>
      </div>
    </form>
  );
}
