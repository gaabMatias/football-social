import { Link } from "react-router-dom";
import type { FeedCardModel } from "@/types";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { TeamChip } from "@/components/ui/TeamChip";

interface FeedCardProps {
  card: FeedCardModel;
}

function timeAgo(iso: string): string {
  const now = Date.now();
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const diff = Math.max(0, Math.floor((now - t) / 1000));
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

export function FeedCard({ card }: FeedCardProps) {
  return (
    <article className="feed-card">
      <header className="feed-card__header">
        <div className="feed-card__tags">
          {card.tags.map((tag) => (
            <Badge key={tag} tone="tag" colorFromText>
              {tag}
            </Badge>
          ))}
        </div>
        <span className="feed-card__time" title={card.created_at}>
          {timeAgo(card.created_at)}
        </span>
      </header>

      <h2 className="feed-card__title">
        <Link to={`/analyses/${card.id}`} className="feed-card__title-link">
          {card.title}
        </Link>
      </h2>

      {card.description ? (
        <p className="feed-card__body">{card.description}</p>
      ) : null}

      <div className="feed-card__file">
        <span className={`file-kind-badge file-kind-badge--${card.file.kind.toLowerCase()}`}>
          {card.file.kind}
        </span>
        <span className="feed-card__file-name">{card.file.original_filename}</span>
        <span className="caption">{formatBytes(card.file.size)}</span>
      </div>

      <footer className="feed-card__footer">
        <div className="feed-card__author">
          <Avatar name={card.author.name} size="md" />
          <div>
            <div className="feed-card__author-name">{card.author.name}</div>
            <div className="feed-card__author-meta">Analysis report</div>
          </div>
        </div>

        <div className="feed-card__access">
          <div className="feed-card__teams">
            {card.team_access.slice(0, 3).map((t) => (
              <TeamChip key={t.id} name={t.name} />
            ))}
            {card.team_access.length > 3 ? (
              <TeamChip name={`+${card.team_access.length - 3}`} />
            ) : null}
          </div>
        </div>
      </footer>
    </article>
  );
}
