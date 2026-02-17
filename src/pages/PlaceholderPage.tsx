type PlaceholderPageProps = {
  title: string;
};

type ModuleMetric = {
  label: string;
  value: string;
  context: string;
};

type ModuleItem = {
  title: string;
  detail: string;
  tone: "ok" | "watch" | "action";
};

type ModuleConfig = {
  eyebrow: string;
  summary: string;
  metrics: ModuleMetric[];
  streamTitle: string;
  streamItems: string[];
  queueTitle: string;
  queueItems: ModuleItem[];
};

const defaultModuleConfig: ModuleConfig = {
  eyebrow: "Coming soon",
  summary: "This module is on the build list. Content and data integrations will arrive shortly.",
  metrics: [
    { label: "Status", value: "In progress", context: "build underway" },
    { label: "ETA", value: "To be scheduled", context: "release window" },
    { label: "Version", value: "v0.1.0", context: "pre-release" }
  ],
  streamTitle: "Build updates",
  streamItems: [
    "Design finalisation in progress.",
    "Backend contracts being mapped.",
    "QA environment queued."
  ],
  queueTitle: "Next steps",
  queueItems: [
    { title: "Lock requirements", detail: "Confirm scope with stakeholders", tone: "action" },
    { title: "Wire data feeds", detail: "Map to production APIs", tone: "watch" },
    { title: "Pilot release", detail: "Schedule early access", tone: "ok" }
  ]
};

const moduleConfigByTitle: Record<string, ModuleConfig> = {
  People: {
    eyebrow: "Workforce intelligence",
    summary: "Staff and resident profiles, assignment load, and onboarding readiness in one workspace.",
    metrics: [
      { label: "Profiles", value: "248", context: "active records" },
      { label: "Onboarding", value: "9", context: "pending completion" },
      { label: "Availability", value: "91%", context: "this week" }
    ],
    streamTitle: "People stream",
    streamItems: [
      "2 profile updates landed in the last hour.",
      "Bulk import window opens at 18:00.",
      "Credential checks are running to schedule."
    ],
    queueTitle: "People priorities",
    queueItems: [
      { title: "Approve profile amendments", detail: "6 awaiting manager review", tone: "watch" },
      { title: "Complete ID verification", detail: "3 new joiners pending", tone: "action" },
      { title: "Roster sync completed", detail: "No conflicts detected", tone: "ok" }
    ]
  },
  Housing: {
    eyebrow: "Accommodation control",
    summary: "Track occupancy, maintenance signals, and environmental checks across housing locations.",
    metrics: [
      { label: "Units", value: "64", context: "mapped in system" },
      { label: "Occupied", value: "57", context: "current occupancy" },
      { label: "Inspections", value: "11", context: "due this week" }
    ],
    streamTitle: "Housing stream",
    streamItems: [
      "Night environment checks synced successfully.",
      "2 non-urgent maintenance items logged overnight.",
      "Window safety audits are 83% complete."
    ],
    queueTitle: "Housing priorities",
    queueItems: [
      { title: "Close maintenance item", detail: "Unit Harbor-3 plumbing", tone: "watch" },
      { title: "Escalate safety observation", detail: "Maple corridor lighting", tone: "action" },
      { title: "Occupancy report generated", detail: "Ready for export", tone: "ok" }
    ]
  },
  Clinical: defaultModuleConfig,
  eMar: defaultModuleConfig,
  "Occupational Therapy": defaultModuleConfig,
  "HR & Documents": {
    eyebrow: "Governance and compliance",
    summary: "Documents, audits, certifications, and workforce policy workflows in a single module.",
    metrics: [
      { label: "Policies", value: "76", context: "tracked versions" },
      { label: "Expiring certs", value: "4", context: "within 30 days" },
      { label: "Audit tasks", value: "13", context: "open items" }
    ],
    streamTitle: "HR stream",
    streamItems: [
      "Mandatory training digest published.",
      "Document retention checker completed scan.",
      "Recruitment funnel exports generated."
    ],
    queueTitle: "HR priorities",
    queueItems: [
      { title: "Renew compliance certificates", detail: "4 records need action", tone: "action" },
      { title: "Approve handbook revision", detail: "Pending legal review", tone: "watch" },
      { title: "Monthly audit deck generated", detail: "Ready for download", tone: "ok" }
    ]
  },
  Logs: defaultModuleConfig,
  "To-Do's": defaultModuleConfig,
  Rota: defaultModuleConfig,
  Reports: defaultModuleConfig
};

export default function PlaceholderPage({ title }: PlaceholderPageProps) {
  const config = moduleConfigByTitle[title] || defaultModuleConfig;

  return (
    <section className="module-page">
      <header className="module-hero">
        <div>
          <p className="eyebrow">{config.eyebrow}</p>
          <h1>{title}</h1>
          <p>{config.summary}</p>
        </div>
        <span className="module-mode-pill">Mock data mode</span>
      </header>

      <div className="module-metric-grid">
        {config.metrics.map((metric) => (
          <article key={metric.label} className="module-metric-card">
            <p>{metric.label}</p>
            <strong>{metric.value}</strong>
            <span>{metric.context}</span>
          </article>
        ))}
      </div>

      <div className="module-board-grid">
        <article className="module-panel">
          <h2>{config.streamTitle}</h2>
          <ul className="module-stream-list">
            {config.streamItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article className="module-panel">
          <h2>{config.queueTitle}</h2>
          <ul className="module-queue-list">
            {config.queueItems.map((item) => (
              <li key={item.title}>
                <span className={`module-tone-dot ${item.tone}`} aria-hidden="true" />
                <div>
                  <strong>{item.title}</strong>
                  <small>{item.detail}</small>
                </div>
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}
