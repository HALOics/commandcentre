import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import moodBestIcon from "../assets/moods/mood_best.png";
import moodGoodIcon from "../assets/moods/mood_good.png";
import moodNeutralIcon from "../assets/moods/mood_neutral.png";
import moodLowIcon from "../assets/moods/mood_low.png";
import moodLowestIcon from "../assets/moods/mood_lowest.png";

type UserStatus = "active" | "inactive" | "hospitalised" | "discharged";
type UserFlag = "Allergy" | "Review due" | "Behaviour support" | "Medication watch";
type SupportTier = "Enhanced" | "Standard" | "Light";
type MoodLevel = "great" | "good" | "ok" | "low" | "critical";
type ProfilePanelId =
  | "general"
  | "needs"
  | "important"
  | "about"
  | "future"
  | "logs"
  | "charts"
  | "documents"
  | "carePlanning"
  | "medication"
  | "consent";

type ServiceUser = {
  id: string;
  name: string;
  status: UserStatus;
  zone: string;
  unit: string;
  keyWorker: string;
  supportTier: SupportTier;
  lastCheckIn: string;
  mood: MoodLevel;
  moodUpdated: string;
  flags: UserFlag[];
};

type ProfileField = {
  label: string;
  value: string;
};

type ImportantContact = {
  name: string;
  role: string;
  phone: string;
};

type ServiceUserProfileData = {
  identityLine: string;
  allergiesSummary: string;
  dnacpr: string;
  dolsStatus: string;
  careTeam: string;
  hospitalPassportUpdated: string;
  profileScore: string;
  wellbeingTrend: string;
  complianceState: string;
  personalInfo: ProfileField[];
  careInfo: ProfileField[];
  siteInfo: ProfileField[];
  contactInfo: ProfileField[];
  importantPeople: ImportantContact[];
  aboutMe: string;
  futurePlans: string;
  personalNotes: string;
  dailyLogs: string[];
  charts: string[];
  documents: string[];
  carePlanning: string[];
  medication: string[];
  consent: string[];
};

const mockServiceUsers: ServiceUser[] = [
  {
    id: "su-001",
    name: "Arden Finch",
    status: "active",
    zone: "Maple",
    unit: "Maple-4",
    keyWorker: "T. Quinn",
    supportTier: "Enhanced",
    lastCheckIn: "08:14",
    mood: "great",
    moodUpdated: "09:08",
    flags: ["Allergy", "Medication watch"]
  },
  {
    id: "su-002",
    name: "Blaire Mason",
    status: "active",
    zone: "Harbor",
    unit: "Harbor-2",
    keyWorker: "R. Lang",
    supportTier: "Standard",
    lastCheckIn: "07:52",
    mood: "good",
    moodUpdated: "08:37",
    flags: []
  },
  {
    id: "su-003",
    name: "Cairo Wells",
    status: "hospitalised",
    zone: "Cedar",
    unit: "Cedar-1",
    keyWorker: "N. Ellis",
    supportTier: "Enhanced",
    lastCheckIn: "Yesterday",
    mood: "low",
    moodUpdated: "Yesterday 18:20",
    flags: ["Review due"]
  },
  {
    id: "su-004",
    name: "Delaney Price",
    status: "active",
    zone: "Orchard",
    unit: "Orchard-7",
    keyWorker: "A. Reed",
    supportTier: "Light",
    lastCheckIn: "09:06",
    mood: "ok",
    moodUpdated: "09:14",
    flags: ["Behaviour support"]
  },
  {
    id: "su-005",
    name: "Elliot Shore",
    status: "active",
    zone: "Maple",
    unit: "Maple-1",
    keyWorker: "S. Ives",
    supportTier: "Standard",
    lastCheckIn: "08:48",
    mood: "good",
    moodUpdated: "08:55",
    flags: []
  },
  {
    id: "su-006",
    name: "Frankie Vale",
    status: "inactive",
    zone: "Orbit",
    unit: "Orbit-3",
    keyWorker: "J. Hale",
    supportTier: "Light",
    lastCheckIn: "2 days ago",
    mood: "ok",
    moodUpdated: "2 days ago",
    flags: []
  },
  {
    id: "su-007",
    name: "Gray Monroe",
    status: "active",
    zone: "Harbor",
    unit: "Harbor-5",
    keyWorker: "P. North",
    supportTier: "Enhanced",
    lastCheckIn: "08:31",
    mood: "great",
    moodUpdated: "08:44",
    flags: ["Allergy"]
  },
  {
    id: "su-008",
    name: "Harper Sloan",
    status: "discharged",
    zone: "Cedar",
    unit: "Cedar-4",
    keyWorker: "M. Pike",
    supportTier: "Standard",
    lastCheckIn: "Last week",
    mood: "critical",
    moodUpdated: "6 days ago",
    flags: []
  },
  {
    id: "su-009",
    name: "Indigo Hart",
    status: "active",
    zone: "Orbit",
    unit: "Orbit-1",
    keyWorker: "C. Bloom",
    supportTier: "Enhanced",
    lastCheckIn: "09:22",
    mood: "low",
    moodUpdated: "09:27",
    flags: ["Review due", "Medication watch"]
  },
  {
    id: "su-010",
    name: "Jules Carter",
    status: "active",
    zone: "Orchard",
    unit: "Orchard-2",
    keyWorker: "D. Flynn",
    supportTier: "Light",
    lastCheckIn: "08:02",
    mood: "good",
    moodUpdated: "08:11",
    flags: []
  },
  {
    id: "su-011",
    name: "Kieran West",
    status: "active",
    zone: "Maple",
    unit: "Maple-6",
    keyWorker: "V. Mercer",
    supportTier: "Standard",
    lastCheckIn: "07:41",
    mood: "ok",
    moodUpdated: "08:05",
    flags: ["Behaviour support"]
  },
  {
    id: "su-012",
    name: "Lennox Briggs",
    status: "inactive",
    zone: "Harbor",
    unit: "Harbor-1",
    keyWorker: "F. Nolan",
    supportTier: "Standard",
    lastCheckIn: "3 days ago",
    mood: "low",
    moodUpdated: "3 days ago",
    flags: ["Review due"]
  }
];

const statusOptions: Array<{ id: UserStatus; label: string }> = [
  { id: "active", label: "Active" },
  { id: "inactive", label: "Inactive" },
  { id: "hospitalised", label: "Hospitalised" },
  { id: "discharged", label: "Discharged" }
];

const statusLabels: Record<UserStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  hospitalised: "Hospitalised",
  discharged: "Discharged"
};

const flagOptions: UserFlag[] = ["Allergy", "Review due", "Behaviour support", "Medication watch"];

const moodLabelMap: Record<MoodLevel, string> = {
  great: "Great",
  good: "Good",
  ok: "Okay",
  low: "Low",
  critical: "Critical"
};

const moodIconMap: Record<MoodLevel, string> = {
  great: moodBestIcon,
  good: moodGoodIcon,
  ok: moodNeutralIcon,
  low: moodLowIcon,
  critical: moodLowestIcon
};

const profileMenuGroups: Array<{ heading: string; items: Array<{ id: ProfilePanelId; label: string }> }> = [
  {
    heading: "Profile",
    items: [
      { id: "general", label: "General Information" },
      { id: "needs", label: "Needs" },
      { id: "important", label: "Important People" },
      { id: "about", label: "About Me" },
      { id: "future", label: "Future Plans" }
    ]
  },
  {
    heading: "Care & Records",
    items: [
      { id: "logs", label: "Daily Logs" },
      { id: "charts", label: "Charts" },
      { id: "documents", label: "Documents" },
      { id: "carePlanning", label: "Care Planning" },
      { id: "medication", label: "Medication" },
      { id: "consent", label: "Consent" }
    ]
  }
];

const dateOfBirthSeeds = [
  "1989-05-16",
  "1991-11-03",
  "1984-02-28",
  "1995-07-09",
  "1990-01-24",
  "1987-09-17",
  "1993-06-02",
  "1982-12-14",
  "1998-03-19",
  "1994-10-05",
  "1988-08-30",
  "1992-04-11"
];

const genderSeeds = [
  "Female",
  "Male",
  "Male",
  "Female",
  "Male",
  "Female",
  "Male",
  "Female",
  "Female",
  "Male",
  "Male",
  "Female"
];

const maritalStatusSeeds = [
  "Single",
  "Married",
  "Single",
  "Partnered",
  "Single",
  "Married",
  "Partnered",
  "Single",
  "Single",
  "Married",
  "Single",
  "Partnered"
];

const birthplaceSeeds = [
  "Portsmouth",
  "Southampton",
  "Brighton",
  "Leeds",
  "Bristol",
  "Cardiff",
  "Reading",
  "Nottingham",
  "Birmingham",
  "York",
  "Plymouth",
  "Oxford"
];

const bloodTypeSeeds = ["A+", "O+", "B+", "AB+", "O-", "A-", "B-", "A+", "O+", "AB-", "B+", "A+"];

const fundingSourceSeeds = [
  "Local authority package",
  "Integrated care fund",
  "Joint funding",
  "Self-funded top-up"
];

const familyContactSeeds = [
  "Morgan Finch",
  "Drew Mason",
  "Taylor Wells",
  "Sky Price",
  "Ari Shore",
  "Noah Vale",
  "Casey Monroe",
  "Riley Sloan",
  "Jordan Hart",
  "Parker Carter",
  "Alex West",
  "Robin Briggs"
];

const clinicalLeadSeeds = [
  "Dr. Ames",
  "Dr. Patel",
  "Dr. Linton",
  "Dr. Hughes",
  "Dr. Clarke",
  "Dr. Francis",
  "Dr. Moore",
  "Dr. Evans",
  "Dr. Shah",
  "Dr. Green",
  "Dr. Brown",
  "Dr. Cole"
];

const addressSeeds = [
  "Maple House, Enterprise Road, Horndean",
  "Harbor Court, Kingsway, Portsmouth",
  "Cedar Lodge, Station Road, Waterlooville",
  "Orchard View, Ridgeway, Petersfield",
  "Orbit Place, Southdown, Havant"
];

const aboutMeSeeds = [
  "Prefers clear routines and visual schedules. Responds well to calm one-to-one engagement at handover.",
  "Enjoys short outdoor walks and music sessions. Benefits from prompts before transitions between activities.",
  "Values predictable support and quiet spaces during peak periods. Best communication style is step-by-step.",
  "Responds positively to familiar staff and structured daily plans. Prefers concise updates and reassurance."
];

const futurePlanSeeds = [
  "Increase independent morning routine completion with reduced prompt frequency over the next 8 weeks.",
  "Build community participation confidence through two supported activities per week and monthly review.",
  "Reduce escalation triggers by refining sensory support strategies and updating de-escalation guidance.",
  "Improve hydration and medication adherence consistency through timed reminders and weekly tracking."
];

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

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M15 6l-6 6 6 6M9 12h10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PassportIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M7 3h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2zm0 4h10M9 13h6M9 17h4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 20h4l10-10-4-4L4 16v4zm9-13l4 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MoodIcon({ level }: { level: MoodLevel }) {
  return <img className="people-mood-icon" src={moodIconMap[level]} alt="" aria-hidden="true" />;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getFlagTone(flag: UserFlag): "alert" | "info" | "watch" | "ok" {
  if (flag === "Allergy") {
    return "alert";
  }

  if (flag === "Review due") {
    return "watch";
  }

  if (flag === "Medication watch") {
    return "info";
  }

  return "ok";
}

function getMoodLabel(level: MoodLevel): string {
  return moodLabelMap[level];
}

function seedAt<T>(values: T[], index: number): T {
  return values[index % values.length];
}

function getAge(isoDate: string): number {
  const now = new Date();
  const birthDate = new Date(`${isoDate}T00:00:00`);
  let age = now.getFullYear() - birthDate.getFullYear();
  const monthDiff = now.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
    age -= 1;
  }

  return age;
}

function formatLongDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

function makePhone(index: number, seed: number): string {
  const lastDigits = String(1000 + index * 9 + seed).padStart(4, "0");
  return `+44 20 7000 ${lastDigits}`;
}

function buildProfileData(serviceUser: ServiceUser): ServiceUserProfileData {
  const index = Math.max(0, mockServiceUsers.findIndex((entry) => entry.id === serviceUser.id));
  const dateOfBirth = seedAt(dateOfBirthSeeds, index);
  const age = getAge(dateOfBirth);
  const gender = seedAt(genderSeeds, index);
  const maritalStatus = seedAt(maritalStatusSeeds, index);
  const birthplace = seedAt(birthplaceSeeds, index);
  const bloodType = seedAt(bloodTypeSeeds, index);
  const fundingSource = seedAt(fundingSourceSeeds, index);
  const familyContact = seedAt(familyContactSeeds, index);
  const clinicalLead = seedAt(clinicalLeadSeeds, index);
  const homeAddress = seedAt(addressSeeds, index);
  const aboutMe = seedAt(aboutMeSeeds, index);
  const futurePlans = seedAt(futurePlanSeeds, index);
  const firstName = serviceUser.name.split(" ")[0];

  const nhsNumber = `${410 + index} ${String(230 + index * 7).padStart(3, "0")} ${String(1200 + index * 13).slice(-4)}`;
  const nationalInsurance = `JC${String(490000 + index * 149).slice(-6)}${String.fromCharCode(65 + (index % 26))}`;
  const profileScore = `${88 + (index % 8)}%`;

  const allergiesSummary = serviceUser.flags.includes("Allergy") ? "Known allergy support in place" : "No known allergies";
  const dnacpr = serviceUser.status === "hospitalised" ? "Clinical review pending" : "Attempt CPR";
  const dolsStatus = serviceUser.status === "discharged" ? "No active DoLS" : "Authorised";
  const careTeam = `${serviceUser.zone} Care Team`;

  const personalInfo: ProfileField[] = [
    { label: "Name", value: serviceUser.name },
    { label: "Preferred name", value: firstName },
    { label: "Gender", value: gender },
    { label: "Date of birth", value: `${formatLongDate(dateOfBirth)} (${age})` },
    { label: "Marital status", value: maritalStatus },
    { label: "Birthplace", value: birthplace }
  ];

  const siteInfo: ProfileField[] = [
    { label: "Zone", value: serviceUser.zone },
    { label: "Unit", value: serviceUser.unit },
    { label: "Care team", value: careTeam },
    { label: "Key worker", value: serviceUser.keyWorker },
    { label: "Support tier", value: serviceUser.supportTier },
    { label: "Status", value: statusLabels[serviceUser.status] }
  ];

  const careInfo: ProfileField[] = [
    { label: "DNACPR", value: dnacpr },
    { label: "DoLS status", value: dolsStatus },
    { label: "Allergies", value: allergiesSummary },
    { label: "Blood type", value: bloodType },
    {
      label: "Medical history",
      value: serviceUser.flags.includes("Medication watch")
        ? "Medication watch active with daily review"
        : "No high-risk history recorded"
    },
    { label: "Admission date", value: formatLongDate(`2025-${String(1 + (index % 9)).padStart(2, "0")}-0${(index % 8) + 1}`) },
    { label: "National Insurance", value: nationalInsurance },
    { label: "NHS number", value: nhsNumber },
    { label: "Funding source", value: fundingSource },
    { label: "Preferred drink", value: index % 2 === 0 ? "Tea" : "Sparkling water" },
    { label: "PRN meds", value: index % 3 === 0 ? "As required, monitored" : "None recorded" }
  ];

  const contactInfo: ProfileField[] = [
    { label: "Primary phone", value: makePhone(index, 13) },
    { label: "Preferred contact", value: "Mobile first" },
    { label: "Email", value: `${firstName.toLowerCase()}.${serviceUser.id}@service.halo.mock` },
    { label: "Address", value: homeAddress },
    { label: "Emergency contact", value: familyContact },
    { label: "Emergency phone", value: makePhone(index, 37) }
  ];

  const importantPeople: ImportantContact[] = [
    { name: serviceUser.keyWorker, role: "Key worker", phone: makePhone(index, 21) },
    { name: familyContact, role: "Family contact", phone: makePhone(index, 37) },
    { name: clinicalLead, role: "Clinical lead", phone: makePhone(index, 51) }
  ];

  const dailyLogs = [
    "Morning wellbeing check completed and routine followed on time.",
    "Handover note updated with hydration and activity observations.",
    "Evening support summary filed and shared with the next shift."
  ];

  const charts = [
    "Wellbeing score trend: stable over the last 14 days.",
    "Sleep consistency improving over the last 7 nights.",
    "Escalation frequency reduced compared with previous month."
  ];

  const documents = [
    "Support plan v3.2 - updated this month",
    "Risk management profile - reviewed this week",
    "Communication passport - current"
  ];

  const carePlanning = [
    "Weekly goals are aligned with current OT recommendations.",
    "Review meeting booked for next Thursday at 10:00.",
    "Family update included in next care planning cycle."
  ];

  const medication = [
    "Medication administration on-time rate above 95% this week.",
    "No unresolved eMAR exceptions linked to this profile.",
    "Medication review scheduled within current cycle."
  ];

  const consent = [
    "Consent preferences reviewed with service user this month.",
    "Data sharing permissions documented and up to date.",
    "Escalation consent pathway confirmed with care team."
  ];

  return {
    identityLine: `${formatLongDate(dateOfBirth)} (${age}) · ${gender}`,
    allergiesSummary,
    dnacpr,
    dolsStatus,
    careTeam,
    hospitalPassportUpdated: `${(index % 21) + 1} Jan 2026`,
    profileScore,
    wellbeingTrend: index % 2 === 0 ? "Improving" : "Stable",
    complianceState: index % 3 === 0 ? "On track" : "Reviewed",
    personalInfo,
    careInfo,
    siteInfo,
    contactInfo,
    importantPeople,
    aboutMe,
    futurePlans,
    personalNotes:
      serviceUser.flags.length > 0
        ? `Active support flags: ${serviceUser.flags.join(", ")}. Continue using calm language and structured prompts.`
        : "No elevated flags. Continue current support plan and scheduled check-ins.",
    dailyLogs,
    charts,
    documents,
    carePlanning,
    medication,
    consent
  };
}

function renderTableRows(rows: ProfileField[]): JSX.Element {
  return (
    <div className="people-profile-table">
      {rows.map((row) => (
        <div key={row.label} className="people-profile-table-row">
          <span>{row.label}</span>
          <strong>{row.value}</strong>
        </div>
      ))}
    </div>
  );
}

function renderBulletList(items: string[]): JSX.Element {
  return (
    <ul className="people-profile-bullet-list">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export default function PeoplePage() {
  const navigate = useNavigate();
  const { serviceUserId } = useParams<{ serviceUserId?: string }>();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilters, setStatusFilters] = useState<UserStatus[]>(["active"]);
  const [zoneFilters, setZoneFilters] = useState<string[]>([]);
  const [flagFilters, setFlagFilters] = useState<UserFlag[]>([]);
  const [activeProfilePanel, setActiveProfilePanel] = useState<ProfilePanelId>("general");

  useEffect(() => {
    setActiveProfilePanel("general");
  }, [serviceUserId]);

  const selectedServiceUser = useMemo(
    () => (serviceUserId ? mockServiceUsers.find((entry) => entry.id === serviceUserId) ?? null : null),
    [serviceUserId]
  );

  const selectedUserIndex = useMemo(
    () => (selectedServiceUser ? Math.max(0, mockServiceUsers.findIndex((entry) => entry.id === selectedServiceUser.id)) : 0),
    [selectedServiceUser]
  );

  const profileData = useMemo(
    () => (selectedServiceUser ? buildProfileData(selectedServiceUser) : null),
    [selectedServiceUser]
  );

  const zoneOptions = useMemo(
    () => Array.from(new Set(mockServiceUsers.map((serviceUser) => serviceUser.zone))).sort(),
    []
  );

  const statusCounts = useMemo(
    () =>
      mockServiceUsers.reduce<Record<UserStatus, number>>(
        (countMap, serviceUser) => {
          countMap[serviceUser.status] += 1;
          return countMap;
        },
        { active: 0, inactive: 0, hospitalised: 0, discharged: 0 }
      ),
    []
  );

  const filteredUsers = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return mockServiceUsers.filter((serviceUser) => {
      const matchesSearch =
        normalizedQuery.length === 0 ||
        serviceUser.name.toLowerCase().includes(normalizedQuery) ||
        serviceUser.zone.toLowerCase().includes(normalizedQuery) ||
        serviceUser.unit.toLowerCase().includes(normalizedQuery) ||
        serviceUser.keyWorker.toLowerCase().includes(normalizedQuery);

      const matchesStatus = statusFilters.length === 0 || statusFilters.includes(serviceUser.status);
      const matchesZone = zoneFilters.length === 0 || zoneFilters.includes(serviceUser.zone);
      const matchesFlags = flagFilters.length === 0 || flagFilters.every((flag) => serviceUser.flags.includes(flag));

      return matchesSearch && matchesStatus && matchesZone && matchesFlags;
    });
  }, [flagFilters, searchQuery, statusFilters, zoneFilters]);

  const activeCount = statusCounts.active;
  const flaggedCount = useMemo(
    () => mockServiceUsers.filter((serviceUser) => serviceUser.flags.length > 0).length,
    []
  );
  const zoneCoverageCount = zoneOptions.length;

  function toggleStatusFilter(status: UserStatus): void {
    setStatusFilters((current) =>
      current.includes(status) ? current.filter((entry) => entry !== status) : [...current, status]
    );
  }

  function toggleZoneFilter(zone: string): void {
    setZoneFilters((current) => (current.includes(zone) ? current.filter((entry) => entry !== zone) : [...current, zone]));
  }

  function toggleFlagFilter(flag: UserFlag): void {
    setFlagFilters((current) => (current.includes(flag) ? current.filter((entry) => entry !== flag) : [...current, flag]));
  }

  function clearFilters(): void {
    setStatusFilters([]);
    setZoneFilters([]);
    setFlagFilters([]);
  }

  const hasAnyFilter =
    statusFilters.length > 0 || zoneFilters.length > 0 || flagFilters.length > 0 || searchQuery.trim().length > 0;

  if (serviceUserId && !selectedServiceUser) {
    return (
      <section className="people-profile-page">
        <article className="people-empty-state">
          <h2>Service user not found</h2>
          <p>This profile is unavailable or no longer exists in the current mock dataset.</p>
          <button type="button" className="btn-outline" onClick={() => navigate("/people")}>
            Back to People list
          </button>
        </article>
      </section>
    );
  }

  if (selectedServiceUser && profileData) {
    const panelIs = (panel: ProfilePanelId | ProfilePanelId[]): boolean => {
      const panelList = Array.isArray(panel) ? panel : [panel];
      return panelList.includes(activeProfilePanel);
    };

    return (
      <section className="people-profile-page">
        <header className="people-profile-topbar">
          <button type="button" className="btn-outline people-profile-nav-btn" onClick={() => navigate("/people")}>
            <BackIcon />
            People list
          </button>

          <button type="button" className="btn-outline people-profile-passport-btn">
            <PassportIcon />
            Hospital Passport
          </button>
        </header>

        <article className="people-profile-hero">
          <div className="people-profile-hero-main">
            <div className={`people-profile-avatar palette-${selectedUserIndex % 6}`}>{getInitials(selectedServiceUser.name)}</div>
            <div className="people-profile-title-wrap">
              <p className="eyebrow">HALO Service Profile</p>
              <h1>{selectedServiceUser.name}</h1>
              <p>{profileData.identityLine}</p>
              <div className="people-profile-tag-row">
                <span className={`people-status-pill ${selectedServiceUser.status}`}>{statusLabels[selectedServiceUser.status]}</span>
                <span className="people-tier-pill">{selectedServiceUser.supportTier} support</span>
                <span className="profile-hero-tag">{profileData.allergiesSummary}</span>
              </div>
            </div>
          </div>

          <div className="people-profile-hero-side">
            {selectedServiceUser.status === "active" ? (
              <div className="people-mood-meta">
                <MoodIcon level={selectedServiceUser.mood} />
                <div>
                  <strong>{getMoodLabel(selectedServiceUser.mood)}</strong>
                  <small>Mood log {selectedServiceUser.moodUpdated}</small>
                </div>
              </div>
            ) : (
              <p className="summary-copy">Mood log not active for this profile status.</p>
            )}

            <article className="people-profile-chip">
              <span>Key worker</span>
              <strong>{selectedServiceUser.keyWorker}</strong>
            </article>

            <article className="people-profile-chip">
              <span>Zone and unit</span>
              <strong>
                {selectedServiceUser.zone} · {selectedServiceUser.unit}
              </strong>
            </article>

            <article className="people-profile-chip">
              <span>Passport updated</span>
              <strong>{profileData.hospitalPassportUpdated}</strong>
            </article>
          </div>

          <div className="people-profile-metrics">
            <article>
              <span>Profile score</span>
              <strong>{profileData.profileScore}</strong>
            </article>
            <article>
              <span>DNACPR</span>
              <strong>{profileData.dnacpr}</strong>
            </article>
            <article>
              <span>DoLS</span>
              <strong>{profileData.dolsStatus}</strong>
            </article>
            <article>
              <span>Wellbeing trend</span>
              <strong>{profileData.wellbeingTrend}</strong>
            </article>
            <article>
              <span>Compliance</span>
              <strong>{profileData.complianceState}</strong>
            </article>
          </div>
        </article>

        <div className="people-profile-shell">
          <aside className="people-profile-menu-card">
            {profileMenuGroups.map((group) => (
              <section key={group.heading} className="people-profile-menu-group">
                <h3>{group.heading}</h3>
                <div className="people-profile-menu-items">
                  {group.items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`people-profile-menu-item ${activeProfilePanel === item.id ? "active" : ""}`}
                      onClick={() => setActiveProfilePanel(item.id)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </aside>

          <div className="people-profile-content-grid">
            <article className={`people-profile-card span-2 ${panelIs("general") ? "focus" : ""}`}>
              <header>
                <h2>Personal information</h2>
                <button type="button" className="profile-edit-btn">
                  <EditIcon />
                  Edit
                </button>
              </header>
              {renderTableRows(profileData.personalInfo)}
            </article>

            <article className={`people-profile-card ${panelIs("general") ? "focus" : ""}`}>
              <header>
                <h2>Site related information</h2>
                <button type="button" className="profile-edit-btn">
                  <EditIcon />
                  Edit
                </button>
              </header>
              {renderTableRows(profileData.siteInfo)}
            </article>

            <article className={`people-profile-card ${panelIs(["general", "charts"]) ? "focus" : ""}`}>
              <header>
                <h2>Contact details</h2>
                <button type="button" className="profile-edit-btn">
                  <EditIcon />
                  Edit
                </button>
              </header>
              {renderTableRows(profileData.contactInfo)}
            </article>

            <article className={`people-profile-card span-2 ${panelIs("needs") ? "focus" : ""}`}>
              <header>
                <h2>Care related information</h2>
                <button type="button" className="profile-edit-btn">
                  <EditIcon />
                  Edit
                </button>
              </header>
              {renderTableRows(profileData.careInfo)}
            </article>

            <article className={`people-profile-card ${panelIs("important") ? "focus" : ""}`}>
              <header>
                <h2>Important people</h2>
                <button type="button" className="profile-edit-btn">
                  <EditIcon />
                  Edit
                </button>
              </header>
              <ul className="people-profile-contact-list">
                {profileData.importantPeople.map((contact) => (
                  <li key={`${contact.name}-${contact.role}`}>
                    <strong>{contact.name}</strong>
                    <span>{contact.role}</span>
                    <small>{contact.phone}</small>
                  </li>
                ))}
              </ul>
            </article>

            <article className={`people-profile-card ${panelIs("about") ? "focus" : ""}`}>
              <header>
                <h2>About me</h2>
                <button type="button" className="profile-edit-btn">
                  <EditIcon />
                  Edit
                </button>
              </header>
              <p className="people-profile-note">{profileData.aboutMe}</p>
            </article>

            <article className={`people-profile-card ${panelIs("future") ? "focus" : ""}`}>
              <header>
                <h2>Future plans</h2>
                <button type="button" className="profile-edit-btn">
                  <EditIcon />
                  Edit
                </button>
              </header>
              <p className="people-profile-note">{profileData.futurePlans}</p>
            </article>

            <article className={`people-profile-card ${panelIs("logs") ? "focus" : ""}`}>
              <header>
                <h2>Daily logs</h2>
              </header>
              {renderBulletList(profileData.dailyLogs)}
            </article>

            <article className={`people-profile-card ${panelIs("charts") ? "focus" : ""}`}>
              <header>
                <h2>Charts</h2>
              </header>
              {renderBulletList(profileData.charts)}
            </article>

            <article className={`people-profile-card ${panelIs("documents") ? "focus" : ""}`}>
              <header>
                <h2>Documents</h2>
              </header>
              {renderBulletList(profileData.documents)}
            </article>

            <article className={`people-profile-card ${panelIs("carePlanning") ? "focus" : ""}`}>
              <header>
                <h2>Care planning</h2>
              </header>
              {renderBulletList(profileData.carePlanning)}
            </article>

            <article className={`people-profile-card ${panelIs("medication") ? "focus" : ""}`}>
              <header>
                <h2>Medication</h2>
              </header>
              {renderBulletList(profileData.medication)}
            </article>

            <article className={`people-profile-card ${panelIs("consent") ? "focus" : ""}`}>
              <header>
                <h2>Consent</h2>
              </header>
              {renderBulletList(profileData.consent)}
            </article>

            <article className="people-profile-card span-2">
              <header>
                <h2>Personal notes</h2>
              </header>
              <p className="people-profile-note">{profileData.personalNotes}</p>
            </article>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="people-page">
      <header className="people-header-card">
        <div>
          <p className="eyebrow">Service user intelligence</p>
          <h1>People</h1>
          <p>Live profile command view with status, zone context, support tiers, and safeguarding signal flags.</p>
        </div>

        <div className="people-header-tools">
          <label className="people-search" aria-label="Search service users">
            <SearchIcon />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by name, zone, unit, or key worker..."
            />
          </label>
          <button type="button" className="btn-outline" onClick={clearFilters} disabled={!hasAnyFilter}>
            Reset filters
          </button>
        </div>
      </header>

      <div className="people-metrics">
        <article className="people-metric-card">
          <span>Active profiles</span>
          <strong>{activeCount}</strong>
          <p>Currently receiving support</p>
        </article>
        <article className="people-metric-card">
          <span>Flagged records</span>
          <strong>{flaggedCount}</strong>
          <p>Require awareness checks</p>
        </article>
        <article className="people-metric-card">
          <span>Zone coverage</span>
          <strong>{zoneCoverageCount}</strong>
          <p>Operational areas mapped</p>
        </article>
      </div>

      <div className="people-shell">
        <aside className="people-filters">
          <div className="people-filters-head">
            <h2>Refine list</h2>
            <button type="button" className="people-clear-btn" onClick={clearFilters} disabled={!hasAnyFilter}>
              Clear all
            </button>
          </div>

          <section className="people-filter-section">
            <h3>Status</h3>
            <div className="people-filter-checks">
              {statusOptions.map((option) => (
                <label key={option.id}>
                  <input
                    type="checkbox"
                    checked={statusFilters.includes(option.id)}
                    onChange={() => toggleStatusFilter(option.id)}
                  />
                  <span>{option.label}</span>
                  <strong>{statusCounts[option.id]}</strong>
                </label>
              ))}
            </div>
          </section>

          <section className="people-filter-section">
            <h3>Zones</h3>
            <div className="people-filter-chip-grid">
              {zoneOptions.map((zone) => {
                const selected = zoneFilters.includes(zone);
                return (
                  <button
                    key={zone}
                    type="button"
                    className={`people-chip-btn ${selected ? "active" : ""}`}
                    onClick={() => toggleZoneFilter(zone)}
                  >
                    {zone}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="people-filter-section">
            <h3>Signal flags</h3>
            <div className="people-filter-chip-grid">
              {flagOptions.map((flag) => {
                const selected = flagFilters.includes(flag);
                return (
                  <button
                    key={flag}
                    type="button"
                    className={`people-chip-btn ${selected ? "active" : ""}`}
                    onClick={() => toggleFlagFilter(flag)}
                  >
                    {flag}
                  </button>
                );
              })}
            </div>
          </section>
        </aside>

        <div className="people-results">
          <div className="people-results-head">
            <p>
              <strong>{filteredUsers.length}</strong> service users matched
            </p>
            <span>{statusFilters.length + zoneFilters.length + flagFilters.length} active filters</span>
          </div>

          {filteredUsers.length === 0 ? (
            <article className="people-empty-state">
              <h2>No service users found</h2>
              <p>Try removing one or more filters, or broaden your search terms.</p>
            </article>
          ) : (
            <ul className="people-card-list">
              {filteredUsers.map((serviceUser, index) => (
                <li key={serviceUser.id}>
                  <button
                    type="button"
                    className="people-card people-card-button"
                    onClick={() => navigate(`/people/${serviceUser.id}`)}
                    aria-label={`Open profile for ${serviceUser.name}`}
                  >
                    <div className="people-card-main">
                      <div className={`people-avatar palette-${index % 6}`}>{getInitials(serviceUser.name)}</div>
                      <div className="people-card-copy">
                        <h3>{serviceUser.name}</h3>
                        <p>
                          {serviceUser.unit} · {serviceUser.zone} · Key worker {serviceUser.keyWorker}
                        </p>
                        <div className="people-flag-row">
                          {serviceUser.flags.length === 0 ? (
                            <span className="people-flag neutral">No active flags</span>
                          ) : (
                            serviceUser.flags.map((flag) => (
                              <span key={flag} className={`people-flag ${getFlagTone(flag)}`}>
                                {flag}
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="people-card-meta">
                      <span className={`people-status-pill ${serviceUser.status}`}>{statusLabels[serviceUser.status]}</span>
                      <small>Last check-in {serviceUser.lastCheckIn}</small>
                      {serviceUser.status === "active" ? (
                        <div className="people-mood-meta">
                          <MoodIcon level={serviceUser.mood} />
                          <div>
                            <strong>{getMoodLabel(serviceUser.mood)}</strong>
                            <small>Mood log {serviceUser.moodUpdated}</small>
                          </div>
                        </div>
                      ) : null}
                      <span className="people-tier-pill">{serviceUser.supportTier} support</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
