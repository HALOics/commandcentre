import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createTeamUser, findTeamUser, loadTeamRoles, loadTeamUsers, updateTeamUser } from "../data/dbClient";
import type { TeamUser, TeamUserRole, TeamUserStatus } from "../mock/store";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true">
      <path
        d="M13.5 3.5l3 3-9 9H4.5v-3.9l9-9zM12 5l3 3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function TeamMemberPage() {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const [member, setMember] = useState<TeamUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [managerOptions, setManagerOptions] = useState<string[]>([]);
  const [roleOptions, setRoleOptions] = useState<string[]>([]);
  const [isLineManager, setIsLineManager] = useState(false);
  const isNew = !teamId || teamId === "new";

  useEffect(() => {
    let cancelled = false;
    if (!teamId) return;

    setLoading(true);
    Promise.all([isNew ? Promise.resolve(null) : findTeamUser(teamId!), loadTeamUsers(), loadTeamRoles()])
      .then(([user, all, roles]) => {
        if (cancelled) return;
        const managers = Array.from(new Set(all.map((u) => u.lineManager).filter(Boolean))).sort();
        setManagerOptions(managers);
        setRoleOptions(roles);
        if (isNew) {
          const defaultRole = roles[0] || "Carer";
          const blank: TeamUser = {
            id: "",
            name: "",
            role: defaultRole as TeamUserRole,
            status: "active",
            lineManager: managers[0] || "",
            email: "",
            phone: "",
            isLineManager: false
          };
          setMember(blank);
          setIsLineManager(false);
        } else {
          setMember(user);
          setIsLineManager(user?.isLineManager ?? false);
        }
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError("Unable to load team member.");
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [teamId]);

  const canSave = useMemo(() => !!member, [member]);

  async function handleSave() {
    if (!member) return;
    setSaving(true);
    const payload = { ...member, avatarUrl: avatarUrl ?? member.avatarUrl, isLineManager };
    try {
      if (isNew) {
        await createTeamUser(payload);
      } else {
        await updateTeamUser(payload);
      }
      navigate("/team");
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "Unable to save changes.";
      setError(message || "Unable to save changes.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section className="module-page">
        <div className="module-panel">Loading team member…</div>
      </section>
    );
  }

  if (!member) {
    return (
      <section className="module-page">
        <div className="module-panel">
          <p>Team member not found.</p>
          <button className="btn-outline" onClick={() => navigate("/team")}>
            Back to Team
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="module-page">
      <header className="module-hero">
        <div className="member-hero">
          <div className="avatar-wrap">
            <div
              className="team-avatar large"
              style={
                avatarUrl
                  ? {
                      backgroundImage: `url(${avatarUrl})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      color: "transparent"
                    }
                  : undefined
              }
            >
              {!avatarUrl ? getInitials(member.name) : null}
            </div>
            <button
              className="avatar-edit"
              type="button"
              aria-label="Change profile photo"
              onClick={() => {
                const fileInput = document.createElement("input");
                fileInput.type = "file";
                fileInput.accept = "image/*";
                fileInput.onchange = (e: Event) => {
                  const target = e.target as HTMLInputElement;
                  const file = target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => {
                    const result = reader.result as string;
                    setAvatarUrl(result);
                  };
                  reader.readAsDataURL(file);
                };
                fileInput.click();
              }}
            >
              <PencilIcon />
            </button>
          </div>
          <div>
            <p className="eyebrow">Team member</p>
            <h1>{member.name}</h1>
            <p>{member.role} · {member.status === "active" ? "Active" : "Inactive"}</p>
          </div>
        </div>
        <div className="hero-actions">
          <button className="btn-ghost" onClick={() => navigate(-1)}>Back</button>
          <button className="btn-primary" disabled={!canSave || saving} onClick={handleSave}>
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </header>

      {error ? <div className="alert error">{error}</div> : null}

      <div className="module-panel">
        <div className="form-grid">
          <label className="form-field">
            <span>Name</span>
            <input
              value={member.name}
              onChange={(e) => setMember({ ...member, name: e.target.value })}
            />
          </label>

          <label className="form-field">
            <span>Email</span>
            <input
              value={member.email}
              onChange={(e) => setMember({ ...member, email: e.target.value })}
            />
          </label>

          <label className="form-field">
            <span>Phone</span>
            <input
              value={member.phone}
              onChange={(e) => setMember({ ...member, phone: e.target.value })}
            />
          </label>

          <label className="form-field">
            <span>Role</span>
            <select
              value={member.role}
              onChange={(e) => setMember({ ...member, role: e.target.value as TeamUserRole })}
            >
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </label>

          <label className="form-field">
            <span>Status</span>
            <select
              value={member.status}
              onChange={(e) => setMember({ ...member, status: e.target.value as TeamUserStatus })}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>

          <label className="form-field">
            <span>Line manager</span>
            <select
              value={member.lineManager}
              onChange={(e) => setMember({ ...member, lineManager: e.target.value })}
            >
              {[...(isLineManager && member ? [member.name] : []), ...managerOptions]
                .filter(Boolean)
                .filter((v, idx, arr) => arr.indexOf(v) === idx)
                .map((mgr) => (
                  <option key={mgr} value={mgr}>
                    {mgr}
                  </option>
                ))}
            </select>
          </label>

          <label className="form-field form-field-inline">
            <input
              type="checkbox"
              checked={isLineManager}
              onChange={(e) => {
                const next = e.target.checked;
                setIsLineManager(next);
                if (next && member) {
                  setMember({ ...member, lineManager: member.lineManager || member.name, isLineManager: true });
                } else if (member) {
                  setMember({ ...member, isLineManager: false });
                }
              }}
            />
            <span>Mark as line manager</span>
          </label>
        </div>
      </div>
    </section>
  );
}
