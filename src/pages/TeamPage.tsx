import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { loadTeamUsers } from "../data/dbClient";
import { mockTeamUsers, type TeamUser } from "../mock/store";

type MemberStatus = TeamUser["status"];

const roleOptions: TeamUser["role"][] = ["Carer", "Admin", "Senior Carer", "Safeguarding Officer"];

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg className={`team-chevron ${open ? "open" : ""}`} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M7 10l5 5 5-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M11 4a7 7 0 105.1 11.8L20 19.7l1.4-1.4-3.8-3.8A7 7 0 0011 4z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 6h16v12H4z M4 7l8 6 8-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M6.6 4.8l2.8 2.8-1.8 3a14 14 0 006.6 6.6l3-1.8 2.8 2.8-2.5 2.5a2.5 2.5 0 01-2.4.6A17.8 17.8 0 012.5 8.8a2.5 2.5 0 01.6-2.4z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M5 6h14a2 2 0 012 2v7a2 2 0 01-2 2H10l-4 3v-3H5a2 2 0 01-2-2V8a2 2 0 012-2z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function InviteIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 7h16v10H4z M4 8l8 5 8-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function TeamPage() {
  const [teamMembers, setTeamMembers] = useState<TeamUser[]>(mockTeamUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilters, setStatusFilters] = useState<MemberStatus[]>(["active"]);
  const [roleFilters, setRoleFilters] = useState<TeamUser["role"][]>([]);
  const [lineManagerFilters, setLineManagerFilters] = useState<string[]>([]);
  const [statusOpen, setStatusOpen] = useState(true);
  const [roleOpen, setRoleOpen] = useState(true);
  const [lineManagerOpen, setLineManagerOpen] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    loadTeamUsers().then((users) => {
      if (!isCancelled) {
        setTeamMembers(users);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, []);

  const lineManagerOptions = useMemo(
    () => Array.from(new Set(teamMembers.map((member) => member.lineManager))).sort(),
    [teamMembers]
  );

  const activeCount = useMemo(
    () => teamMembers.filter((member) => member.status === "active").length,
    [teamMembers]
  );
  const inactiveCount = useMemo(
    () => teamMembers.filter((member) => member.status === "inactive").length,
    [teamMembers]
  );
  const specialistCount = useMemo(
    () =>
      teamMembers.filter(
        (member) => member.role === "Senior Carer" || member.role === "Safeguarding Officer"
      ).length,
    [teamMembers]
  );

  const filteredMembers = useMemo(() => {
    return teamMembers.filter((member) => {
      const query = searchQuery.trim().toLowerCase();
      const matchesQuery =
        query.length === 0 ||
        member.name.toLowerCase().includes(query) ||
        member.email.toLowerCase().includes(query) ||
        member.role.toLowerCase().includes(query) ||
        member.lineManager.toLowerCase().includes(query);

      const matchesStatus = statusFilters.length === 0 || statusFilters.includes(member.status);
      const matchesRole = roleFilters.length === 0 || roleFilters.includes(member.role);
      const matchesLineManager = lineManagerFilters.length === 0 || lineManagerFilters.includes(member.lineManager);
      return matchesQuery && matchesStatus && matchesRole && matchesLineManager;
    });
  }, [lineManagerFilters, roleFilters, searchQuery, statusFilters, teamMembers]);

  function toggleStatusFilter(nextStatus: MemberStatus): void {
    setStatusFilters((current) =>
      current.includes(nextStatus) ? current.filter((status) => status !== nextStatus) : [...current, nextStatus]
    );
  }

  function toggleRoleFilter(nextRole: TeamUser["role"]): void {
    setRoleFilters((current) => (current.includes(nextRole) ? current.filter((role) => role !== nextRole) : [...current, nextRole]));
  }

  function toggleLineManagerFilter(nextLineManager: string): void {
    setLineManagerFilters((current) =>
      current.includes(nextLineManager)
        ? current.filter((lineManager) => lineManager !== nextLineManager)
        : [...current, nextLineManager]
    );
  }

  return (
    <section className="team-page">
      <header className="team-header-card">
        <h1>Team Members</h1>
        <div className="team-header-actions">
          <label className="team-search" aria-label="Search team members">
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Type to search..."
            />
            <button type="button" aria-label="Search">
              <SearchIcon />
            </button>
          </label>

          <button type="button" className="btn-solid team-invite-btn">
            <InviteIcon />
            Invite a Team Member
          </button>
        </div>
      </header>

      <div className="team-summary-grid" aria-label="Team overview">
        <article className="team-summary-card">
          <p>Total members</p>
          <strong>{teamMembers.length}</strong>
          <span>Across all registered teams</span>
        </article>
        <article className="team-summary-card">
          <p>Active</p>
          <strong>{activeCount}</strong>
          <span>Ready for shift allocation</span>
        </article>
        <article className="team-summary-card">
          <p>Inactive</p>
          <strong>{inactiveCount}</strong>
          <span>Temporarily unavailable</span>
        </article>
        <article className="team-summary-card">
          <p>Specialist roles</p>
          <strong>{specialistCount}</strong>
          <span>Senior and safeguarding coverage</span>
        </article>
      </div>

      <div className="team-layout">
        <aside className="team-filters">
          <section className="team-filter-section">
            <div className="team-filter-header">
              <button
                type="button"
                className="team-filter-toggle"
                onClick={() => setStatusOpen((current) => !current)}
                aria-expanded={statusOpen}
              >
                <ChevronIcon open={statusOpen} />
                <span>Status</span>
              </button>

              <div className="team-filter-meta">
                <button type="button" className="team-clear-btn" onClick={() => setStatusFilters([])}>
                  Clear
                </button>
                <span className="team-count-pill">{statusFilters.length}</span>
              </div>
            </div>

            {statusOpen ? (
              <div className="team-filter-options">
                <label>
                  <input
                    type="checkbox"
                    checked={statusFilters.includes("active")}
                    onChange={() => toggleStatusFilter("active")}
                  />
                  Active
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={statusFilters.includes("inactive")}
                    onChange={() => toggleStatusFilter("inactive")}
                  />
                  Inactive
                </label>
              </div>
            ) : null}
          </section>

          <section className="team-filter-section">
            <div className="team-filter-header">
              <button
                type="button"
                className="team-filter-toggle"
                onClick={() => setRoleOpen((current) => !current)}
                aria-expanded={roleOpen}
              >
                <ChevronIcon open={roleOpen} />
                <span>Role</span>
              </button>

              <div className="team-filter-meta">
                <button type="button" className="team-clear-btn" onClick={() => setRoleFilters([])}>
                  Clear
                </button>
                <span className="team-count-pill">{roleFilters.length}</span>
              </div>
            </div>

            {roleOpen ? (
              <div className="team-filter-options">
                {roleOptions.map((role) => (
                  <label key={role}>
                    <input type="checkbox" checked={roleFilters.includes(role)} onChange={() => toggleRoleFilter(role)} />
                    {role}
                  </label>
                ))}
              </div>
            ) : null}
          </section>

          <section className="team-filter-section">
            <div className="team-filter-header">
              <button
                type="button"
                className="team-filter-toggle"
                onClick={() => setLineManagerOpen((current) => !current)}
                aria-expanded={lineManagerOpen}
              >
                <ChevronIcon open={lineManagerOpen} />
                <span>Line Manager</span>
              </button>

              <div className="team-filter-meta">
                <button type="button" className="team-clear-btn" onClick={() => setLineManagerFilters([])}>
                  Clear
                </button>
                <span className="team-count-pill">{lineManagerFilters.length}</span>
              </div>
            </div>

            {lineManagerOpen ? (
              <div className="team-filter-options">
                {lineManagerOptions.map((lineManager) => (
                  <label key={lineManager}>
                    <input
                      type="checkbox"
                      checked={lineManagerFilters.includes(lineManager)}
                      onChange={() => toggleLineManagerFilter(lineManager)}
                    />
                    {lineManager}
                  </label>
                ))}
              </div>
            ) : null}
          </section>
        </aside>

        <div className="team-list-area">
          {filteredMembers.length === 0 ? (
            <article className="team-empty-state">
              <h2>No team members found</h2>
              <p>Try removing filters or broadening your search query.</p>
            </article>
          ) : (
            <ul className="team-member-list">
              {filteredMembers.map((member, index) => (
                <li key={member.id} className="team-member-row">
                  <div className="team-member-main">
                    <div className={`team-avatar palette-${index % 6}`}>{getInitials(member.name)}</div>
                    <strong className="team-member-name">{member.name}</strong>
                    <a className="team-icon-link" href={`mailto:${member.email}`} aria-label={`Email ${member.name}`}>
                      <MailIcon />
                    </a>
                    <a className="team-icon-link" href={`tel:${member.phone}`} aria-label={`Call ${member.name}`}>
                      <PhoneIcon />
                    </a>
                    <Link
                      className="team-icon-link"
                      to={`/messenger?contact=${encodeURIComponent(member.name)}&contactRole=${encodeURIComponent(
                        member.role
                      )}&contactStatus=${member.status}`}
                      aria-label={`Message ${member.name}`}
                    >
                      <MessageIcon />
                    </Link>
                  </div>
                  <div className="team-member-meta">
                    <span className="team-member-role">{member.role}</span>
                    <small className="team-member-line-manager">Line manager: {member.lineManager}</small>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
