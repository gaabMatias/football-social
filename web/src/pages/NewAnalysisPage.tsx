import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnalysisForm } from "@/components/analysis/AnalysisForm";
import { useCreateAnalysis } from "@/hooks/useAnalysis";
import { extractErrorMessage } from "@/api/client";

export function NewAnalysisPage() {
  const navigate = useNavigate();
  const createMutation = useCreateAnalysis();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="page" style={{ maxWidth: 760 }}>
      <div className="page__header">
        <div>
          <h1 className="page__title">New analysis</h1>
          <p className="page__subtitle">
            Publish a new analysis and choose which teams can see it.
          </p>
        </div>
      </div>

      <AnalysisForm
        isSubmitting={createMutation.isPending}
        errorMessage={error}
        onSubmit={async (input) => {
          setError(null);
          try {
            const result = await createMutation.mutateAsync(input);
            navigate(`/analyses/${result.id}`, { replace: true });
          } catch (err) {
            setError(extractErrorMessage(err));
          }
        }}
      />
    </div>
  );
}
