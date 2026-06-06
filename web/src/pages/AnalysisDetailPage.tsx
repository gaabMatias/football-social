import { useNavigate, useParams } from "react-router-dom";
import { useAnalysis, useDeleteAnalysis } from "@/hooks/useAnalysis";
import { AnalysisDetail } from "@/components/analysis/AnalysisDetail";
import { useAuth } from "@/hooks/useAuth";
import { extractErrorMessage } from "@/api/client";
import { Button } from "@/components/ui/Button";

export function AnalysisDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, isLoading, isError, error } = useAnalysis(id);
  const deleteMutation = useDeleteAnalysis();

  async function handleDelete() {
    if (!id) return;
    if (!confirm("Delete this analysis? This cannot be undone.")) return;
    await deleteMutation.mutateAsync(id);
    navigate("/feed", { replace: true });
  }

  if (isLoading) {
    return <div className="feed-list__loading">Loading analysis…</div>;
  }

  if (isError || !data) {
    return (
      <div className="page">
        <div className="callout callout--error" role="alert">
          {isError ? extractErrorMessage(error) : "Analysis not found."}
        </div>
        <div>
          <Button variant="secondary" onClick={() => navigate(-1)}>
            ← Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <AnalysisDetail
      card={data}
      canDelete={user?.id === data.author.id}
      onDelete={handleDelete}
    />
  );
}
