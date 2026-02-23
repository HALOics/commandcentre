import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import moodBestIcon from "../assets/moods/mood_best.png";
import moodGoodIcon from "../assets/moods/mood_good.png";
import moodNeutralIcon from "../assets/moods/mood_neutral.png";
import moodLowIcon from "../assets/moods/mood_low.png";
import moodLowestIcon from "../assets/moods/mood_lowest.png";
import { getAppSessionToken } from "../auth/appSession";
import { loadTeamUsers } from "../data/dbClient";
import type { TeamUser } from "../mock/store";
import { WidgetId, WidgetSize } from "./dashboardConfig";

type MoodLevel = "best" | "good" | "neutral" | "low" | "lowest";
type PeopleSortKey = "none" | "keyWorker" | "zone" | "recentMood";
type TeamSortKey = "none" | "lineManager" | "role";

type PersonCard = {
  name: string;
  mood: MoodLevel;
  keyWorker: string;
  zone: string;
  moodUpdatedMinutes: number; // minutes ago for ordering
};

const PEOPLE_WIDGET_MOOD_KEY = "halo_people_widget_mood_enabled";

const people: PersonCard[] = [
  { name: "Arden Finch", mood: "best", keyWorker: "T. Quinn", zone: "Maple", moodUpdatedMinutes: 18 },
  { name: "Blaire Mason", mood: "good", keyWorker: "R. Lang", zone: "Harbor", moodUpdatedMinutes: 42 },
  { name: "Delaney Price", mood: "neutral", keyWorker: "A. Reed", zone: "Orchard", moodUpdatedMinutes: 63 },
  { name: "Elliot Shore", mood: "good", keyWorker: "S. Ives", zone: "Maple", moodUpdatedMinutes: 27 },
  { name: "Gray Monroe", mood: "best", keyWorker: "P. North", zone: "Harbor", moodUpdatedMinutes: 35 },
  { name: "Indigo Hart", mood: "low", keyWorker: "C. Bloom", zone: "Orbit", moodUpdatedMinutes: 9 },
  { name: "Jules Carter", mood: "good", keyWorker: "D. Flynn", zone: "Orchard", moodUpdatedMinutes: 51 },
  { name: "Kieran West", mood: "neutral", keyWorker: "V. Mercer", zone: "Maple", moodUpdatedMinutes: 75 }
];

const moodIcons: Record<MoodLevel, string> = {
  best: moodBestIcon,
  good: moodGoodIcon,
  neutral: moodNeutralIcon,
  low: moodLowIcon,
  lowest: moodLowestIcon
};

const alerts = [
  { title: "Door sensor offline", time: "07:48", person: "Unit Maple-4" },
  { title: "Missing shift handoff note", time: "06:22", person: "Team Orbit-B" },
  { title: "Late medication confirmation", time: "05:36", person: "Room Cedar-9" }
];

const rotaItems = [
  { shift: "Early Shift", time: "07:00 - 15:00", detail: "Coverage 8/9" },
  { shift: "Late Shift", time: "15:00 - 23:00", detail: "Coverage 7/8" },
  { shift: "Night Shift", time: "23:00 - 07:00", detail: "Coverage 5/6" },
  { shift: "On-call", time: "All day", detail: "2 clinicians assigned" }
];

const calendarItems = [
  { title: "Care Review Huddle", time: "09:30", location: "Ops Room 2" },
  { title: "Clinical Governance", time: "11:00", location: "Conference A" },
  { title: "Housing Coordination", time: "13:45", location: "Teams Call" },
  { title: "Family Touchpoint Window", time: "16:00", location: "Hub Desk" }
];

const emarItems = [
  { area: "Maple-4", status: "Due now", note: "3 confirmations pending" },
  { area: "Cedar-9", status: "Escalation", note: "1 late confirmation" },
  { area: "Harbor-2", status: "On track", note: "All rounds verified" }
];

const supportFeedbackEntries = [
  { serviceUser: "Atlas-01", rating: 5, comment: "Staff explained every step clearly and checked in often." },
  { serviceUser: "Beacon-14", rating: 4, comment: "Great support this week, response time felt faster." },
  { serviceUser: "Cedar-22", rating: 5, comment: "Team was kind and helped me feel listened to." },
  { serviceUser: "Delta-07", rating: 3, comment: "Good visit overall, but arrival time was later than expected." }
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function PeopleWidgetBody({ size }: { size: WidgetSize }): JSX.Element {
  const [showMood, setShowMood] = useState<boolean>(() => {
    if (typeof window === "undefined") {
      return true;
    }

    const saved = window.localStorage.getItem(PEOPLE_WIDGET_MOOD_KEY);
    return saved !== "0";
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(PEOPLE_WIDGET_MOOD_KEY, showMood ? "1" : "0");
  }, [showMood]);

  const [sortKey, setSortKey] = useState<PeopleSortKey>("none");
  const [filterValue, setFilterValue] = useState<string>("all");

  const keyWorkerOptions = Array.from(new Set(people.map((p) => p.keyWorker))).sort();
  const zoneOptions = Array.from(new Set(people.map((p) => p.zone))).sort();

  const sortedPeople = (() => {
    const baseList = size === "detailed" ? people : people.slice(0, 8);
    let list = [...baseList];

    if (sortKey === "keyWorker" && filterValue !== "all") {
      list = list.filter((p) => p.keyWorker === filterValue);
    }

    if (sortKey === "zone" && filterValue !== "all") {
      list = list.filter((p) => p.zone === filterValue);
    }

    switch (sortKey) {
      case "keyWorker":
        return list.sort((a, b) => a.keyWorker.localeCompare(b.keyWorker) || a.name.localeCompare(b.name));
      case "zone":
        return list.sort((a, b) => a.zone.localeCompare(b.zone) || a.name.localeCompare(b.name));
      case "recentMood":
        return list.sort((a, b) => a.moodUpdatedMinutes - b.moodUpdatedMinutes);
      default:
        return list;
    }
  })();

  if (size === "brief") {
    return (
      <>
        <div className="brief-block">
          <p className="summary-copy">
            <strong>8</strong> active profiles
          </p>
        </div>
        <div className="widget-actions">
          <label className="people-widget-toggle" aria-label="Show mood emojis in people widget">
            <input type="checkbox" checked={showMood} onChange={(event) => setShowMood(event.target.checked)} />
            <span>Mood emojis</span>
          </label>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="widget-row">
        <label className="widget-select" aria-label="Arrange service users">
          <span>Arrange</span>
          <select
            value={sortKey}
            onChange={(event) => {
              const next = event.target.value as PeopleSortKey;
              setSortKey(next);
              setFilterValue("all");
            }}
          >
            <option value="none">Show all</option>
            <option value="keyWorker">Key Worker</option>
            <option value="zone">Zone</option>
            <option value="recentMood">Recent mood update</option>
          </select>
        </label>

        {sortKey === "keyWorker" ? (
          <label className="widget-select" aria-label="Filter by key worker">
            <span>Key Worker</span>
            <select value={filterValue} onChange={(event) => setFilterValue(event.target.value)}>
              <option value="all">All</option>
              {keyWorkerOptions.map((worker) => (
                <option key={worker} value={worker}>
                  {worker}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {sortKey === "zone" ? (
          <label className="widget-select" aria-label="Filter by zone">
            <span>Zone</span>
            <select value={filterValue} onChange={(event) => setFilterValue(event.target.value)}>
              <option value="all">All</option>
              {zoneOptions.map((zone) => (
                <option key={zone} value={zone}>
                  {zone}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <label className="people-widget-toggle" aria-label="Show mood emojis in people widget">
          <input type="checkbox" checked={showMood} onChange={(event) => setShowMood(event.target.checked)} />
          <span>Mood emojis</span>
        </label>
      </div>

      <div className="avatar-grid">
        {sortedPeople.map((person) => (
          <div key={person.name} className="avatar-chip">
            <span className="avatar-face">
              {person.name.slice(0, 2).toUpperCase()}
              {showMood ? (
                <img className="avatar-mood-badge" src={moodIcons[person.mood]} alt={`${person.name} mood`} />
              ) : null}
            </span>
            <small>{person.name}</small>
          </div>
        ))}
      </div>
      {size === "detailed" ? <p className="summary-copy">2 onboarding profiles need completion this week.</p> : null}
      <div className="widget-actions">
        <Link className="btn-outline" to="/people">
          View All
        </Link>
      </div>
    </>
  );
}

function TeamWidgetBody({ size }: { size: WidgetSize }): JSX.Element {
  const [teamMembers, setTeamMembers] = useState<TeamUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const token = getAppSessionToken();

    if (!token) {
      setTeamMembers([]);
      setIsLoading(false);
      return () => {
        isMounted = false;
      };
    }

    loadTeamUsers()
      .then((users) => {
        if (!isMounted) return;
        setTeamMembers(users);
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (size === "brief") {
    return (
      <div className="brief-block">
        <p className="summary-copy">
          <strong>{teamMembers.length}</strong> team members
        </p>
      </div>
    );
  }

  const [sortKey, setSortKey] = useState<TeamSortKey>("none");
  const [filterValue, setFilterValue] = useState<string>("all");

  const lineManagerOptions = Array.from(
    new Set(teamMembers.map((m) => m.lineManager).filter((value): value is string => Boolean(value)))
  ).sort();
  const zoneOptions = Array.from(new Set(teamMembers.map((m) => m.role).filter(Boolean))).sort();

  const sortedTeam = (() => {
    const base = size === "detailed" ? teamMembers : teamMembers.slice(0, 6);
    let list = [...base];

    if (sortKey === "lineManager" && filterValue !== "all") {
      list = list.filter((m) => m.lineManager === filterValue);
    }

    if (sortKey === "role" && filterValue !== "all") {
      list = list.filter((m) => m.role === filterValue);
    }

    switch (sortKey) {
      case "lineManager":
        return list.sort((a, b) => a.lineManager.localeCompare(b.lineManager) || a.name.localeCompare(b.name));
      case "role":
        return list.sort((a, b) => a.role.localeCompare(b.role) || a.name.localeCompare(b.name));
      default:
        return list;
    }
  })();

  return (
    <>
      <div className="widget-row">
        <label className="widget-select" aria-label="Arrange team">
          <span>Arrange</span>
          <select
            value={sortKey}
            onChange={(event) => {
              const next = event.target.value as TeamSortKey;
              setSortKey(next);
              setFilterValue("all");
            }}
          >
            <option value="none">Show all</option>
            <option value="lineManager">Line manager</option>
            <option value="role">Role</option>
          </select>
        </label>

        {sortKey === "lineManager" ? (
          <label className="widget-select" aria-label="Filter by line manager">
            <span>Line manager</span>
            <select value={filterValue} onChange={(event) => setFilterValue(event.target.value)}>
              <option value="all">All</option>
              {lineManagerOptions.map((manager) => (
                <option key={manager} value={manager}>
                  {manager}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {sortKey === "role" ? (
          <label className="widget-select" aria-label="Filter by role">
            <span>Role</span>
            <select value={filterValue} onChange={(event) => setFilterValue(event.target.value)}>
              <option value="all">All</option>
              {zoneOptions.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      {isLoading ? <p className="summary-copy">Loading team data…</p> : null}
      {!isLoading && sortedTeam.length === 0 ? <p className="summary-copy">No team members found for this company.</p> : null}

      <div className="avatar-grid compact">
        {sortedTeam.map((member) => (
          <div key={member.id} className="avatar-chip">
            <span>{getInitials(member.name)}</span>
            <small>{member.name}</small>
          </div>
        ))}
      </div>
      {size === "detailed" ? <p className="summary-copy">Next rota handoff in 42 minutes.</p> : null}
      <div className="widget-actions">
        <Link className="btn-outline" to="/team">
          View All
        </Link>
      </div>
    </>
  );
}

export function renderWidgetBody(id: WidgetId, size: WidgetSize): JSX.Element | null {
  switch (id) {
    case "announcement": {
      if (size === "brief") {
        return (
          <div className="notice-inline">
            <div>
              <p className="muted">10:45 AM</p>
              <strong>Compliance prep opens next week.</strong>
            </div>
          </div>
        );
      }

      if (size === "detailed") {
        return (
          <div className="notice-inline">
            <div>
              <p className="muted">2026-02-16 10:45 AM</p>
              <strong>Quarterly compliance prep window opens next Wednesday.</strong>
              <p className="summary-copy">Owners assigned: Housing, Clinical, Operations. Draft pack due in 3 days.</p>
            </div>
            <button className="btn-link">Read more</button>
          </div>
        );
      }

      return (
        <div className="notice-inline">
          <div>
            <p className="muted">2026-02-16 10:45 AM</p>
            <strong>Quarterly compliance prep window opens next Wednesday.</strong>
          </div>
          <button className="btn-link">Read more</button>
        </div>
      );
    }

    case "people": {
      return <PeopleWidgetBody size={size} />;
    }

    case "incidents": {
      if (size === "brief") {
        return (
          <div className="brief-block">
            <p className="summary-copy">
              <strong>14</strong> need triage
            </p>
          </div>
        );
      }

      return (
        <>
          <ul className="metric-list">
            <li>
              <span className="metric-dot metric-red" />
              <strong>14</strong> Needs triage
            </li>
            <li>
              <span className="metric-dot metric-blue" />
              <strong>27</strong> Open cases
            </li>
            <li>
              <span className="metric-dot metric-amber" />
              <strong>6</strong> Awaiting action
            </li>
          </ul>
          <p className="summary-copy">
            <strong>73 incidents</strong> in the last 30 days
          </p>
          {size === "detailed" ? (
            <p className="summary-copy">Trend: 8% reduction week-on-week.</p>
          ) : null}
        </>
      );
    }

    case "alerts": {
      if (size === "brief") {
        const top = alerts[0];
        return (
          <div className="brief-block">
            <p className="summary-copy">
              <strong>{top.title}</strong>
            </p>
            <p className="muted">{top.time}</p>
          </div>
        );
      }

      const list = size === "detailed" ? alerts : alerts.slice(0, 2);

      return (
        <>
          <ul className="alert-list">
            {list.map((item) => (
              <li key={`${item.title}-${item.time}`}>
                <div>
                  <strong>{item.title}</strong>
                  <small>
                    {item.time} - {item.person}
                  </small>
                </div>
              </li>
            ))}
          </ul>
          <a className="inline-link" href="#">
            4 follow-ups
          </a>
          {size === "detailed" ? <p className="summary-copy">Escalations in the last 24h: 1</p> : null}
        </>
      );
    }

    case "team": {
      return <TeamWidgetBody size={size} />;
    }

    case "todos": {
      if (size === "brief") {
        return (
          <div className="brief-block">
            <p className="summary-copy">
              <strong>64</strong> tasks today
            </p>
          </div>
        );
      }

      return (
        <>
          <p className="summary-copy">
            <strong>64</strong> to-do's scheduled for today
          </p>
          <ul className="metric-list split">
            <li>
              <span className="metric-dot metric-red" />
              <strong>9</strong> Overdue
            </li>
            <li>
              <span className="metric-dot metric-gray" />
              <strong>38</strong> Pending
            </li>
            <li>
              <span className="metric-dot metric-blue" />
              <strong>4</strong> Skipped
            </li>
            <li>
              <span className="metric-dot metric-green" />
              <strong>13</strong> Completed
            </li>
          </ul>
          {size === "detailed" ? <p className="summary-copy">Completion target for today: 75%.</p> : null}
        </>
      );
    }

    case "support": {
      const completion = 86;

      if (size === "brief") {
        return (
          <div className="brief-block">
            <p className="summary-copy">
              <strong>{completion}%</strong> completed
            </p>
          </div>
        );
      }

      return (
        <>
          <ul className="metric-list">
            <li>
              <span className="metric-dot metric-red" />
              <strong>5</strong> due today
            </li>
            <li>
              <span className="metric-dot metric-amber" />
              <strong>29</strong> due this week
            </li>
            <li>
              <span className="metric-dot metric-red" />
              <strong>11</strong> overdue
            </li>
          </ul>
          <div className="completion-row">
            <div
              className="progress-ring"
              style={{ background: `conic-gradient(var(--color-ok) ${completion * 3.6}deg, var(--surface-soft) 0deg)` }}
            >
              <span>{completion}%</span>
            </div>
            <p>{completion}% of support plans completed</p>
          </div>
          {size === "detailed" ? <p className="summary-copy">14 plans scheduled for quality review this month.</p> : null}
        </>
      );
    }

    case "supportFeedback": {
      const responses = supportFeedbackEntries.length;
      const averageRating = (supportFeedbackEntries.reduce((total, item) => total + item.rating, 0) / responses).toFixed(1);
      const lowRatings = supportFeedbackEntries.filter((item) => item.rating <= 2).length;
      const neutralRatings = supportFeedbackEntries.filter((item) => item.rating === 3).length;

      if (size === "brief") {
        return (
          <div className="brief-block">
            <p className="summary-copy">
              <strong>{averageRating}/5</strong> average rating
            </p>
            <p className="muted">{responses} recent responses</p>
          </div>
        );
      }

      const list = size === "detailed" ? supportFeedbackEntries : supportFeedbackEntries.slice(0, 2);

      return (
        <>
          <p className="summary-copy">
            <strong>{averageRating}/5</strong> average rating from <strong>{responses}</strong> recent responses
          </p>
          <ul className="alert-list">
            {list.map((item) => (
              <li key={`${item.serviceUser}-${item.comment.slice(0, 16)}`}>
                <strong>
                  {item.rating}/5 - {item.serviceUser}
                </strong>
                <small>{item.comment}</small>
              </li>
            ))}
          </ul>
          {size === "detailed" ? (
            <>
              <ul className="metric-list split">
                <li>
                  <span className="metric-dot metric-blue" />
                  <strong>{responses}</strong> this week
                </li>
                <li>
                  <span className="metric-dot metric-green" />
                  <strong>{averageRating}/5</strong> average
                </li>
                <li>
                  <span className="metric-dot metric-amber" />
                  <strong>{neutralRatings}</strong> neutral ratings
                </li>
                <li>
                  <span className="metric-dot metric-red" />
                  <strong>{lowRatings}</strong> low ratings
                </li>
              </ul>
              <p className="summary-copy">Sentiment trend: stable this week with positive feedback on staff communication.</p>
            </>
          ) : null}
        </>
      );
    }

    case "rota": {
      if (size === "brief") {
        return (
          <div className="brief-block">
            <p className="summary-copy">
              <strong>2</strong> shift gaps to fill
            </p>
            <p className="muted">Next handoff 14:45</p>
          </div>
        );
      }

      const list = size === "detailed" ? rotaItems : rotaItems.slice(0, 3);

      return (
        <>
          <ul className="alert-list">
            {list.map((item) => (
              <li key={`${item.shift}-${item.time}`}>
                <strong>{item.shift}</strong>
                <small>
                  {item.time} - {item.detail}
                </small>
              </li>
            ))}
          </ul>
          {size === "detailed" ? <p className="summary-copy">Agency backfill requested for 1 night post.</p> : null}
        </>
      );
    }

    case "calendar": {
      if (size === "brief") {
        const next = calendarItems[0];
        return (
          <div className="brief-block">
            <p className="summary-copy">
              <strong>{next.time}</strong> {next.title}
            </p>
          </div>
        );
      }

      const list = size === "detailed" ? calendarItems : calendarItems.slice(0, 3);

      return (
        <>
          <ul className="alert-list">
            {list.map((item) => (
              <li key={`${item.title}-${item.time}`}>
                <strong>{item.title}</strong>
                <small>
                  {item.time} - {item.location}
                </small>
              </li>
            ))}
          </ul>
          {size === "detailed" ? <p className="summary-copy">2 prep packs are due before 12:00.</p> : null}
        </>
      );
    }

    case "emar": {
      const completion = 92;

      if (size === "brief") {
        return (
          <div className="brief-block">
            <p className="summary-copy">
              <strong>6</strong> e-Mar tasks due now
            </p>
          </div>
        );
      }

      return (
        <>
          <ul className="metric-list split">
            <li>
              <span className="metric-dot metric-green" />
              <strong>48</strong> Confirmed
            </li>
            <li>
              <span className="metric-dot metric-amber" />
              <strong>12</strong> Pending
            </li>
            <li>
              <span className="metric-dot metric-red" />
              <strong>3</strong> Late
            </li>
            <li>
              <span className="metric-dot metric-blue" />
              <strong>1</strong> Escalated
            </li>
          </ul>
          {size === "detailed" ? (
            <>
              <ul className="alert-list">
                {emarItems.map((item) => (
                  <li key={`${item.area}-${item.status}`}>
                    <strong>
                      {item.area} - {item.status}
                    </strong>
                    <small>{item.note}</small>
                  </li>
                ))}
              </ul>
              <div className="completion-row">
                <div
                  className="progress-ring"
                  style={{
                    background: `conic-gradient(var(--color-ok) ${completion * 3.6}deg, var(--surface-soft) 0deg)`
                  }}
                >
                  <span>{completion}%</span>
                </div>
                <p>{completion}% on-time e-Mar completion</p>
              </div>
            </>
          ) : null}
        </>
      );
    }

    default:
      return null;
  }
}
