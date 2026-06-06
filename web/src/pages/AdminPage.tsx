import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { TabToggle } from "@/components/ui/TabToggle";
import {
  clearAdminToken,
  getAdminToken,
  setAdminToken,
} from "@/api/admin";
import {
  useAddTeamMember,
  useCreateCompany,
  useCreateTeam,
} from "@/hooks/useAdmin";
import { extractErrorMessage } from "@/api/client";

type Tab = "company" | "team" | "member";

export function AdminPage() {
  const [tab, setTab] = useState<Tab>("company");
  const [adminToken, setAdminTokenState] = useState<string>(getAdminToken() ?? "");
  const [tokenSaved, setTokenSaved] = useState<boolean>(Boolean(getAdminToken()));

  useEffect(() => {
    setTokenSaved(Boolean(getAdminToken()));
  }, []);

  function saveAdminToken() {
    if (!adminToken.trim()) {
      clearAdminToken();
      setTokenSaved(false);
      return;
    }
    setAdminToken(adminToken.trim());
    setTokenSaved(true);
  }

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1 className="page__title">Admin</h1>
          <p className="page__subtitle">
            Bootstrap companies, teams, and memberships. All admin actions require
            the server-side <code className="mono">ADMIN_TOKEN</code>.
          </p>
        </div>
        <TabToggle<Tab>
          value={tab}
          onChange={setTab}
          options={[
            { id: "company", label: "Company" },
            { id: "team", label: "Team" },
            { id: "member", label: "Member" },
          ]}
        />
      </div>

      <section className="section-card">
        <h2>Admin token</h2>
        <p className="caption">
          The <code className="mono">X-Admin-Token</code> header is sent with every admin request.
          Stored only in your browser's localStorage.
        </p>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <Input
              label="ADMIN_TOKEN"
              type="password"
              placeholder="Paste your admin token"
              value={adminToken}
              onChange={(e) => setAdminTokenState(e.target.value)}
              autoComplete="off"
            />
          </div>
          <Button onClick={saveAdminToken} variant="secondary">
            {tokenSaved ? "Update" : "Save"}
          </Button>
        </div>
        {tokenSaved ? (
          <span className="caption" style={{ color: "var(--success)" }}>
            Token saved.
          </span>
        ) : null}
      </section>

      {tab === "company" ? <CreateCompanyCard /> : null}
      {tab === "team" ? <CreateTeamCard /> : null}
      {tab === "member" ? <AddMemberCard /> : null}
    </div>
  );
}

function CreateCompanyCard() {
  const mutation = useCreateCompany();
  const [name, setName] = useState("");

  return (
    <section className="section-card">
      <h2>Create company</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate({ name: name.trim() });
        }}
        className="auth-form"
      >
        <Input
          label="Company name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        {mutation.isError ? (
          <div className="callout callout--error">{extractErrorMessage(mutation.error)}</div>
        ) : null}
        {mutation.isSuccess ? (
          <div className="callout callout--success">
            Created company <span className="mono">{mutation.data.id}</span>
          </div>
        ) : null}
        <Button type="submit" variant="primary" disabled={mutation.isPending}>
          {mutation.isPending ? "Creating…" : "Create company"}
        </Button>
      </form>
    </section>
  );
}

function CreateTeamCard() {
  const mutation = useCreateTeam();
  const [name, setName] = useState("");
  const [companyId, setCompanyId] = useState("");

  return (
    <section className="section-card">
      <h2>Create team</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate({ name: name.trim(), companyId: companyId.trim() });
        }}
        className="auth-form"
      >
        <Input
          label="Team name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Input
          label="Company ID"
          value={companyId}
          onChange={(e) => setCompanyId(e.target.value)}
          placeholder="UUID"
          required
        />
        {mutation.isError ? (
          <div className="callout callout--error">{extractErrorMessage(mutation.error)}</div>
        ) : null}
        {mutation.isSuccess ? (
          <div className="callout callout--success">
            Created team <span className="mono">{mutation.data.id}</span>
          </div>
        ) : null}
        <Button type="submit" variant="primary" disabled={mutation.isPending}>
          {mutation.isPending ? "Creating…" : "Create team"}
        </Button>
      </form>
    </section>
  );
}

function AddMemberCard() {
  const mutation = useAddTeamMember();
  const [teamId, setTeamId] = useState("");
  const [userId, setUserId] = useState("");

  return (
    <section className="section-card">
      <h2>Add team member</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate({ team_id: teamId.trim(), user_id: userId.trim() });
        }}
        className="auth-form"
      >
        <Input
          label="Team ID"
          value={teamId}
          onChange={(e) => setTeamId(e.target.value)}
          placeholder="UUID"
          required
        />
        <Input
          label="User ID"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="UUID"
          required
        />
        {mutation.isError ? (
          <div className="callout callout--error">{extractErrorMessage(mutation.error)}</div>
        ) : null}
        {mutation.isSuccess ? (
          <div className="callout callout--success">
            User <span className="mono">{mutation.data.user_id}</span> added to team{" "}
            <span className="mono">{mutation.data.team_id}</span>
          </div>
        ) : null}
        <Button type="submit" variant="primary" disabled={mutation.isPending}>
          {mutation.isPending ? "Adding…" : "Add member"}
        </Button>
      </form>
    </section>
  );
}
