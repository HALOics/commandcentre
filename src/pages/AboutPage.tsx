const VERSION = "v0.1.0";

const features = [
  "Mock local database with resettable seeds for staff, service users, and rota.",
  "Team page now reads live from the shared mock store.",
  "Settings-driven widget layouts and premium login polish."
];

const team = [
  { name: "Ethan Caines", title: "Software Engineer" },
  { name: "Stefan Porter", title: "Software Engineer" },
  { name: "Banji Adeogun", title: "Security Engineer" }
];

export default function AboutPage() {
  return (
    <section className="module-page">
      <header className="module-hero">
        <div>
          <p className="eyebrow">About</p>
          <h1>HALO Command Centre</h1>
          <p>Version info, latest changes, and the people behind this build.</p>
        </div>
        <div className="preset-actions">
          <div className="chip">Version {VERSION}</div>
        </div>
      </header>

      <div className="module-metric-grid">
        <article className="module-metric-card">
          <p>Version</p>
          <strong>{VERSION}</strong>
          <span>Pre-release</span>
        </article>
        <article className="module-metric-card">
          <p>Latest</p>
          <strong>Features</strong>
          <span>See highlights below</span>
        </article>
        <article className="module-metric-card">
          <p>Team</p>
          <strong>{team.length}</strong>
          <span>Core contributors</span>
        </article>
      </div>

      <div className="data-grid">
        <article className="module-panel">
          <h2>Latest features</h2>
          <ul className="about-list">
            {features.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article className="module-panel">
          <h2>Team</h2>
          <ul className="about-team">
            {team.map((member) => (
              <li key={member.name}>
                <div className="team-avatar small">{member.name.split(" ").map((n) => n[0]).join("")}</div>
                <div>
                  <strong>{member.name}</strong>
                  <p>{member.title}</p>
                </div>
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}
