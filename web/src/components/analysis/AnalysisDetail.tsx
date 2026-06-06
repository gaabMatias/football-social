import type { FeedCardModel } from "@/types";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TeamChip } from "@/components/ui/TeamChip";
import { FileViewer } from "./FileViewer";

interface AnalysisDetailProps {
  card: FeedCardModel;
  onDelete?: () => void;
  canDelete?: boolean;
}

export function AnalysisDetail({ card, onDelete, canDelete = false }: AnalysisDetailProps) {
  return (
    <div className="page" style={{ maxWidth: 880 }}>
      <div className="page__header">
        <div>
          <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
            {card.tags.map((tag) => (
              <Badge key={tag} tone="tag" colorFromText>
                {tag}
              </Badge>
            ))}
          </div>
          <h1 className="page__title">{card.title}</h1>
          <p className="page__subtitle">
            Posted {new Date(card.created_at).toLocaleString()}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {canDelete && onDelete ? (
            <Button variant="danger" onClick={onDelete}>
              Delete
            </Button>
          ) : null}
        </div>
      </div>

      <section className="section-card">
        <h2>Description</h2>
        <p className="feed-card__body">{card.description}</p>
      </section>

      <section className="section-card">
        <h2>File</h2>
        <FileViewer file={card.file} />
      </section>

      <section className="section-card">
        <h2>Author & access</h2>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div className="feed-card__author">
            <Avatar name={card.author.name} size="lg" />
            <div>
              <div className="feed-card__author-name">{card.author.name}</div>
              <div className="feed-card__author-meta">Analyst</div>
            </div>
          </div>
          <div className="feed-card__teams">
            {card.team_access.length === 0 ? (
              <span className="caption">No teams have access</span>
            ) : (
              card.team_access.map((t) => <TeamChip key={t.id} name={t.name} />)
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
