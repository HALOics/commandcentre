import { useState } from "react";

const packages = [
  {
    id: "full",
    name: "Full Suite",
    price: "More info soon",
    blurb: "Everything in HALO, all modules unlocked with concierge onboarding.",
    features: ["Features coming soon"]
  },
  {
    id: "rota",
    name: "Rota",
    price: "More info soon",
    blurb: "Scheduling, coverage insights, and shift comms in one view.",
    features: ["Features coming soon"]
  },
  {
    id: "care",
    name: "Care Plan",
    price: "More info soon",
    blurb: "Care plans, updates, and progress reviews with team accountability.",
    features: ["Features coming soon"]
  },
  {
    id: "message",
    name: "Message+",
    price: "More info soon",
    blurb: "Secure internal messaging with groups, broadcast, and receipts.",
    features: ["Features coming soon"]
  },
  {
    id: "clinical",
    name: "Clinical",
    price: "More info soon",
    blurb: "Clinical views, observations, and eMar signal routing in real time.",
    features: ["Features coming soon"]
  }
];

const buildYourOwnFeatures = [
  "Choose modules",
  "Add seats as needed",
  "Role-based access",
  "Tailored onboarding"
];

export default function SubscriptionsPage() {
  const [selected, setSelected] = useState<string>("full");

  return (
    <section className="subscriptions-page">
      <header className="subscriptions-hero">
        <div>
          <p className="eyebrow">Plans</p>
          <h1>Subscription</h1>
          <p>Pick the modules you need now, switch or extend later. All plans include Microsoft SSO and audit-ready logs.</p>
        </div>
        <div className="sub-cta">
          <span>Selected:</span>
          <strong>{packages.find((pkg) => pkg.id === selected)?.name || "Full Suite"}</strong>
        </div>
      </header>

      <div className="subscriptions-grid">
        {packages.map((pkg) => (
          <article
            key={pkg.id}
            className={`subscription-card ${selected === pkg.id ? "active" : ""}`}
            onClick={() => setSelected(pkg.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                setSelected(pkg.id);
              }
            }}
          >
            <div className="subscription-head">
              <p className="muted">{pkg.price}</p>
              <h2>{pkg.name}</h2>
              <p className="summary-copy">{pkg.blurb}</p>
            </div>
            <ul className="subscription-list">
              {pkg.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
            <button className="btn-solid">Choose {pkg.name}</button>
          </article>
        ))}

        <article
          className={`subscription-card build-card ${selected === "custom" ? "active" : ""}`}
          role="button"
          tabIndex={0}
          onClick={() => setSelected("custom")}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              setSelected("custom");
            }
          }}
        >
          <div className="subscription-head">
            <p className="muted">Custom</p>
            <h2>Build your own</h2>
            <p className="summary-copy">Pick only the modules you need and adjust as you grow.</p>
          </div>
          <ul className="subscription-list">
            {buildYourOwnFeatures.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
          <button className="btn-outline">Configure</button>
        </article>
      </div>
    </section>
  );
}
