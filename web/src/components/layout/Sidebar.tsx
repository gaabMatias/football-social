import { Logo } from "@/components/ui/Logo";
import { Avatar } from "@/components/ui/Avatar";
import { SidebarItem } from "./SidebarItem";
import { useAuth } from "@/hooks/useAuth";

const iconStyle = {
  width: 16,
  height: 16,
  stroke: "currentColor",
  strokeWidth: 1.7,
  fill: "none",
} as const;

function FeedIcon() {
  return (
    <svg viewBox="0 0 16 16" {...iconStyle}>
      <rect x="2.5" y="3" width="11" height="3" rx="1" />
      <rect x="2.5" y="8" width="11" height="5" rx="1" />
    </svg>
  );
}
function NewIcon() {
  return (
    <svg viewBox="0 0 16 16" {...iconStyle}>
      <path d="M8 3v10M3 8h10" strokeLinecap="round" />
    </svg>
  );
}
function AdminIcon() {
  return (
    <svg viewBox="0 0 16 16" {...iconStyle}>
      <circle cx="8" cy="6" r="2.5" />
      <path d="M3 13c1-2.2 2.9-3.3 5-3.3s4 1.1 5 3.3" strokeLinecap="round" />
    </svg>
  );
}
function LogoutIcon() {
  return (
    <svg viewBox="0 0 16 16" {...iconStyle}>
      <path d="M9 3H4v10h5" strokeLinecap="round" />
      <path d="M11 6l3 2-3 2M7 8h7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="sidebar" aria-label="Primary navigation">
      <Logo />

      <nav className="sidebar__section" aria-label="Pages">
        <span className="sidebar__section-label">Page Layouts</span>
        <SidebarItem to="/feed" icon={<FeedIcon />} label="Feed" />
        <SidebarItem to="/analyses/new" icon={<NewIcon />} label="New analysis" />
        <SidebarItem to="/admin" icon={<AdminIcon />} label="Admin" />
      </nav>

      <div className="sidebar__section">
        <span className="sidebar__section-label">Reference</span>
        <span className="caption" style={{ padding: "0 12px", color: "var(--text-tertiary)" }}>
          Design system, components, and tokens (coming soon).
        </span>
      </div>

      <div className="sidebar__spacer" />

      {user ? (
        <div className="sidebar__profile">
          <Avatar name={user.name} size="md" />
          <div className="sidebar__profile-info">
            <span className="sidebar__profile-name">{user.name}</span>
            <span className="sidebar__profile-role">{user.company.name}</span>
          </div>
          <button
            type="button"
            className="sidebar__logout"
            onClick={logout}
            aria-label="Log out"
            title="Log out"
          >
            <LogoutIcon />
          </button>
        </div>
      ) : null}
    </aside>
  );
}
