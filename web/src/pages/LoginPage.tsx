import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Logo } from "@/components/ui/Logo";
import { TabToggle } from "@/components/ui/TabToggle";
import { useAuth } from "@/hooks/useAuth";
import { extractErrorMessage } from "@/api/client";

type Tab = "login" | "register";

interface LoginPageProps {
  initialTab?: Tab;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function LoginPage({ initialTab = "login" }: LoginPageProps) {
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const [tab, setTab] = useState<Tab>(initialTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [teamIdsRaw, setTeamIdsRaw] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    companyId?: string;
    teamIds?: string;
  }>({});

  function parseTeamIds(): string[] | null {
    const raw = teamIdsRaw.trim();
    if (!raw) return [];
    const parts = raw
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.some((p) => !UUID_RE.test(p))) return null;
    return parts;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    if (tab === "register") {
      const errs: typeof fieldErrors = {};
      if (!UUID_RE.test(companyId.trim())) {
        errs.companyId = "Must be a valid UUID";
      }
      const teamIds = parseTeamIds();
      if (teamIds === null) {
        errs.teamIds = "Each team ID must be a valid UUID";
      }
      if (Object.keys(errs).length > 0) {
        setFieldErrors(errs);
        return;
      }
      setSubmitting(true);
      try {
        await register({
          name,
          email,
          password,
          companyId: companyId.trim(),
          teamIds: teamIds ?? [],
        });
        navigate("/feed", { replace: true });
      } catch (err) {
        setError(extractErrorMessage(err));
      } finally {
        setSubmitting(false);
      }
      return;
    }

    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/feed", { replace: true });
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-card__header">
          <Logo />
          <h1 className="auth-card__title">
            {tab === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="auth-card__subtitle">
            {tab === "login"
              ? "Sign in to access your team's analyses."
              : "Join an existing company. Your admin will share its ID with you."}
          </p>
        </div>

        <div style={{ display: "flex", justifyContent: "center" }}>
          <TabToggle<Tab>
            options={[
              { id: "login", label: "Sign in" },
              { id: "register", label: "Create account" },
            ]}
            value={tab}
            onChange={(t) => {
              setTab(t);
              setError(null);
              setFieldErrors({});
            }}
          />
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {tab === "register" ? (
            <>
              <Input
                label="Full name"
                placeholder="Jane Analyst"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
              />
              <Input
                label="Company ID"
                placeholder="b0c2c0e3-1f2d-4a91-…"
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                required
                error={fieldErrors.companyId}
                hint="UUID of the company you're joining (ask your admin)."
              />
              <Input
                label="Team IDs (optional)"
                placeholder="uuid1, uuid2"
                value={teamIdsRaw}
                onChange={(e) => setTeamIdsRaw(e.target.value)}
                error={fieldErrors.teamIds}
                hint="Comma-separated UUIDs of teams within that company."
              />
            </>
          ) : null}
          <Input
            label="Email"
            type="email"
            placeholder="you@club.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete={tab === "login" ? "current-password" : "new-password"}
          />

          {error ? (
            <div className="callout callout--error" role="alert">
              {error}
            </div>
          ) : null}

          <Button type="submit" variant="primary" block disabled={submitting}>
            {submitting
              ? "Please wait…"
              : tab === "login"
                ? "Sign in"
                : "Create account"}
          </Button>
        </form>
      </div>
    </div>
  );
}
