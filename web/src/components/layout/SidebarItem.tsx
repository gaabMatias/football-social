import { NavLink } from "react-router-dom";
import type { ReactNode } from "react";

interface SidebarItemProps {
  to: string;
  icon: ReactNode;
  label: string;
  end?: boolean;
}

export function SidebarItem({ to, icon, label, end }: SidebarItemProps) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `sidebar-item ${isActive ? "sidebar-item--active" : ""}`
      }
    >
      <span aria-hidden="true" style={{ display: "inline-flex", width: 16 }}>
        {icon}
      </span>
      <span>{label}</span>
    </NavLink>
  );
}
