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
  eyebrow: "Operations workspace",
  summary: "This area is scaffolded with premium mock content and ready for backend data integration.",
  metrics: [
    { label: "Live cards", value: "12", context: "widgets provisioned" },
    { label: "Pending actions", value: "7", context: "awaiting review" },
    { label: "Data feeds", value: "3", context: "connected mocks" }
  ],
  streamTitle: "Live stream",
  streamItems: [
    "Feed connector heartbeat remains healthy.",
    "No integration blockers reported in this module.",
    "Mock payload cadence set to 2-minute intervals."
  ],
  queueTitle: "Priority queue",
  queueItems: [
    { title: "Validate mock to API contracts", detail: "Target this sprint", tone: "watch" },
    { title: "Map permissions and role guards", detail: "Owner: Platform team", tone: "action" },
    { title: "Define final KPI dictionary", detail: "Owner: Operations", tone: "ok" }
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
  Clinical: {
    eyebrow: "Clinical oversight",
    summary: "Clinical caseload, risk indicators, and outcome trends prepared for multidisciplinary review.",
    metrics: [
      { label: "Open cases", value: "37", context: "active pathways" },
      { label: "Reviews due", value: "14", context: "next 72 hours" },
      { label: "Escalations", value: "2", context: "today" }
    ],
    streamTitle: "Clinical stream",
    streamItems: [
      "Medication protocol updates pushed to staging.",
      "Case-review board locked for Wednesday 10:00.",
      "Risk flags remain below threshold."
    ],
    queueTitle: "Clinical priorities",
    queueItems: [
      { title: "Review high-risk pathway", detail: "2 records need sign-off", tone: "action" },
      { title: "Validate care-plan updates", detail: "5 records in draft", tone: "watch" },
      { title: "Governance pack prepared", detail: "Ready for circulation", tone: "ok" }
    ]
  },
  eMar: {
    eyebrow: "Medication operations",
    summary: "Medication administration monitoring, confirmation flow, and exception handling in real time.",
    metrics: [
      { label: "Rounds today", value: "19", context: "scheduled cycles" },
      { label: "Confirmed", value: "92%", context: "on-time completion" },
      { label: "Exceptions", value: "3", context: "needs review" }
    ],
    streamTitle: "eMar stream",
    streamItems: [
      "Morning round confirmation feed is healthy.",
      "Late administration alerts synced to incident queue.",
      "Barcode verification checks passed."
    ],
    queueTitle: "eMar priorities",
    queueItems: [
      { title: "Resolve late confirmation", detail: "Unit Maple-4", tone: "action" },
      { title: "Review missed window reasons", detail: "2 entries pending", tone: "watch" },
      { title: "Audit export prepared", detail: "Ready for download", tone: "ok" }
    ]
  },
  "Occupational Therapy": {
    eyebrow: "OT coordination",
    summary: "Session planning, intervention outcomes, and equipment workflows consolidated in one view.",
    metrics: [
      { label: "Sessions", value: "42", context: "booked this week" },
      { label: "Assessments", value: "8", context: "awaiting notes" },
      { label: "Equipment", value: "5", context: "delivery tracking" }
    ],
    streamTitle: "OT stream",
    streamItems: [
      "Adaptive equipment stock levels synced.",
      "Session outcomes posted in mock timeline.",
      "Family handover templates refreshed."
    ],
    queueTitle: "OT priorities",
    queueItems: [
      { title: "Complete mobility assessment", detail: "Due by 15:00", tone: "watch" },
      { title: "Approve equipment order", detail: "1 item pending funding", tone: "action" },
      { title: "Session completion rate stable", detail: "96% this week", tone: "ok" }
    ]
  },
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
  Logs: {
    eyebrow: "Event observability",
    summary: "Operational events and timeline traces organized for quick triage and auditing.",
    metrics: [
      { label: "Events", value: "1.4k", context: "last 24 hours" },
      { label: "Warnings", value: "16", context: "triage queue" },
      { label: "Retention", value: "30d", context: "active policy" }
    ],
    streamTitle: "Log stream",
    streamItems: [
      "Ingestion latency remains below 2 seconds.",
      "No critical outages reported in mock feed.",
      "Export endpoint benchmark completed."
    ],
    queueTitle: "Log priorities",
    queueItems: [
      { title: "Investigate warning burst", detail: "Occurred at 08:17", tone: "watch" },
      { title: "Harden alert threshold", detail: "Prevent false positives", tone: "action" },
      { title: "Archive cycle completed", detail: "No failed jobs", tone: "ok" }
    ]
  },
  "To-Do's": {
    eyebrow: "Task orchestration",
    summary: "Track assignment flow, completion velocity, and overdue risk across operational teams.",
    metrics: [
      { label: "Tasks today", value: "104", context: "scheduled workload" },
      { label: "Completed", value: "67", context: "current shift" },
      { label: "Overdue", value: "8", context: "needs intervention" }
    ],
    streamTitle: "Task stream",
    streamItems: [
      "Task generation from templates is healthy.",
      "Shift handover tasks auto-assigned.",
      "Completion trend improved by 6% vs yesterday."
    ],
    queueTitle: "Task priorities",
    queueItems: [
      { title: "Clear overdue queue", detail: "8 tasks unresolved", tone: "action" },
      { title: "Review skipped tasks", detail: "4 items flagged", tone: "watch" },
      { title: "Target met for morning cycle", detail: "82% completion", tone: "ok" }
    ]
  },
  Rota: {
    eyebrow: "Staffing and shifts",
    summary: "Rota build quality, coverage confidence, and handover continuity in one planning board.",
    metrics: [
      { label: "Shifts", value: "36", context: "next 48 hours" },
      { label: "Coverage", value: "95%", context: "filled positions" },
      { label: "Open gaps", value: "2", context: "awaiting assignment" }
    ],
    streamTitle: "Rota stream",
    streamItems: [
      "Auto-fill assistant applied preferred patterns.",
      "No compliance conflicts in latest validation.",
      "Weekend draft rota awaiting final approval."
    ],
    queueTitle: "Rota priorities",
    queueItems: [
      { title: "Fill night shift gap", detail: "Unit Cedar-2", tone: "action" },
      { title: "Approve weekend rota", detail: "Manager sign-off pending", tone: "watch" },
      { title: "Mandatory breaks validated", detail: "All clear", tone: "ok" }
    ]
  },
  Reports: {
    eyebrow: "Insights and reporting",
    summary: "High-confidence reporting with clear operational, quality, and compliance indicators.",
    metrics: [
      { label: "Report packs", value: "18", context: "available templates" },
      { label: "Scheduled", value: "6", context: "automated exports" },
      { label: "Data freshness", value: "99%", context: "last refresh" }
    ],
    streamTitle: "Report stream",
    streamItems: [
      "Executive dashboard pack refreshed.",
      "Monthly regulator report draft generated.",
      "Custom KPI query cache warmed."
    ],
    queueTitle: "Report priorities",
    queueItems: [
      { title: "Finalize monthly pack", detail: "Due tomorrow 09:00", tone: "watch" },
      { title: "Resolve data mismatch", detail: "Clinical vs rota variance", tone: "action" },
      { title: "Distribution list confirmed", detail: "All recipients valid", tone: "ok" }
    ]
  }
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
