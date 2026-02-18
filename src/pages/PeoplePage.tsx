import { useEffect, useMemo, useRef, useState, type RefObject, type ChangeEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import moodBestIcon from "../assets/moods/mood_best.png";
import moodGoodIcon from "../assets/moods/mood_good.png";
import moodNeutralIcon from "../assets/moods/mood_neutral.png";
import moodLowIcon from "../assets/moods/mood_low.png";
import moodLowestIcon from "../assets/moods/mood_lowest.png";
import { loadServiceUsers } from "../data/dbClient";
import {
  mockServiceUsers,
  type MoodLevel,
  type ServiceUser,
  type UserFlag,
  type UserStatus
} from "../mock/store";

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

type ProfileField = {
  label: string;
  value: string;
};

type ImportantContact = {
  name: string;
  role: string;
  phone: string;
  relation?: "Personal" | "Professional" | "Clinical";
};

type DocumentItem = {
  id: string;
  title: string;
  category: string;
  updated: string;
};

type ServiceUserProfileData = {
  preferredName: string;
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  maritalStatus: string;
  birthplace: string;
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
  nationality: string;
  languages: string[];
  ethnicity: string;
  religion: string;
  carerGenderPreference: string;
  carerNote: string;
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

const nationalitySeeds = [
  "British",
  "Irish",
  "Polish",
  "American",
  "Canadian",
  "Australian",
  "South African",
  "Indian",
  "Pakistani",
  "Nigerian",
  "Spanish",
  "Italian"
];

const ethnicitySeeds = [
  "White British",
  "Irish",
  "Polish",
  "Black African",
  "Black Caribbean",
  "Asian Indian",
  "Asian Pakistani",
  "Mixed",
  "Other European",
  "White British",
  "Black African",
  "Asian Bangladeshi"
];

const languageSeeds = [
  ["English"],
  ["English", "ASL"],
  ["English", "Polish"],
  ["English"],
  ["English", "French"],
  ["English"],
  ["English", "British Sign Language"],
  ["English", "Hindi"],
  ["English", "Urdu"],
  ["English", "Yoruba"],
  ["English", "Spanish"],
  ["English", "Italian"]
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

const documentCategories = [
  "Accident & Incident",
  "Care Plans",
  "Consent",
  "DNACPR",
  "Risk assessments",
  "Support Plans",
  "eMar",
  "Clinical",
  "Housing",
  "Medication",
  "Mental and Social State",
  "Initial Assessment",
  "Letters",
  "Hospital Discharge",
  "Useful Charts",
  "Other"
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

function buildProfileData(serviceUser: ServiceUser, serviceUsers: ServiceUser[]): ServiceUserProfileData {
  const index = Math.max(0, serviceUsers.findIndex((entry) => entry.id === serviceUser.id));
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

  const nationality = seedAt(nationalitySeeds, index);
  const languages = seedAt(languageSeeds, index);
  const ethnicity = seedAt(ethnicitySeeds, index);
  const religion = index % 3 === 0 ? "Christian" : index % 3 === 1 ? "None stated" : "Muslim";
  const carerGenderPreference = index % 2 === 0 ? "Female" : "Male";
  const carerNote = index % 2 === 0 ? "Prefers consistent morning team" : "No specific preference";

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
    preferredName: firstName,
    firstName,
    lastName: serviceUser.name.split(" ").slice(1).join(" ") || firstName,
    gender,
    dateOfBirth,
    maritalStatus,
    birthplace,
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
    nationality,
    languages,
    ethnicity,
    religion,
    carerGenderPreference,
    carerNote,
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

  const [serviceUsers, setServiceUsers] = useState<ServiceUser[]>(mockServiceUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilters, setStatusFilters] = useState<UserStatus[]>(["active"]);
  const [zoneFilters, setZoneFilters] = useState<string[]>([]);
  const [flagFilters, setFlagFilters] = useState<UserFlag[]>([]);
  const [activeProfilePanel, setActiveProfilePanel] = useState<ProfilePanelId>("general");
  const [importantContacts, setImportantContacts] = useState<ImportantContact[]>([]);
  const [showContactForm, setShowContactForm] = useState(false);
  const [newContact, setNewContact] = useState<ImportantContact>({
    name: "",
    role: "",
    phone: "",
    relation: "Personal"
  });
  const [profilePhotos, setProfilePhotos] = useState<Record<string, string>>({});
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [showDocForm, setShowDocForm] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState("");
  const [newDocCategory, setNewDocCategory] = useState(documentCategories[0]);
  const [personalEditOpen, setPersonalEditOpen] = useState(false);
  const [personalOverrides, setPersonalOverrides] = useState<Partial<ServiceUserProfileData>>({});
  const [personalForm, setPersonalForm] = useState({
    preferredName: "",
    firstName: "",
    lastName: "",
    gender: "",
    dateOfBirth: "",
    maritalStatus: "",
    birthplace: "",
    nationality: "",
    languages: "",
    ethnicity: "",
    religion: "",
    carerGenderPreference: "",
    carerNote: ""
  });

  const panelRefs: Record<ProfilePanelId, RefObject<HTMLElement>> = {
    general: useRef<HTMLElement>(null),
    needs: useRef<HTMLElement>(null),
    important: useRef<HTMLElement>(null),
    about: useRef<HTMLElement>(null),
    future: useRef<HTMLElement>(null),
    logs: useRef<HTMLElement>(null),
    charts: useRef<HTMLElement>(null),
    documents: useRef<HTMLElement>(null),
    carePlanning: useRef<HTMLElement>(null),
    medication: useRef<HTMLElement>(null),
    consent: useRef<HTMLElement>(null)
  };

  useEffect(() => {
    let isCancelled = false;

    loadServiceUsers().then((users) => {
      if (!isCancelled) {
        setServiceUsers(users);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    setActiveProfilePanel("general");
  }, [serviceUserId]);

  const selectedServiceUser = useMemo(
    () => (serviceUserId ? serviceUsers.find((entry) => entry.id === serviceUserId) ?? null : null),
    [serviceUserId, serviceUsers]
  );

  const selectedUserIndex = useMemo(
    () => (selectedServiceUser ? Math.max(0, serviceUsers.findIndex((entry) => entry.id === selectedServiceUser.id)) : 0),
    [selectedServiceUser, serviceUsers]
  );

  const profileData = useMemo(
    () => (selectedServiceUser ? buildProfileData(selectedServiceUser, serviceUsers) : null),
    [selectedServiceUser, serviceUsers]
  );

  useEffect(() => {
    if (profileData) {
      setImportantContacts(profileData.importantPeople);
      setShowContactForm(false);
      setNewContact({ name: "", role: "", phone: "", relation: "Personal" });
      setDocuments(
        profileData.documents.map((title, idx) => ({
          id: `${serviceUserId || "doc"}-${idx}`,
          title,
          category: idx % 2 === 0 ? "Care Plans" : "General",
          updated: "This week"
        }))
      );
      setShowDocForm(false);
      setNewDocTitle("");
      setNewDocCategory(documentCategories[0]);
      setPersonalOverrides({});
      setPersonalForm({
        preferredName: profileData.preferredName,
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        gender: profileData.gender,
        dateOfBirth: formatLongDate(profileData.dateOfBirth),
        maritalStatus: profileData.maritalStatus,
        birthplace: profileData.birthplace,
        nationality: profileData.nationality,
        languages: profileData.languages.join(", "),
        ethnicity: profileData.ethnicity,
        religion: profileData.religion,
        carerGenderPreference: profileData.carerGenderPreference,
        carerNote: profileData.carerNote
      });
    }
  }, [profileData, serviceUserId]);

  const zoneOptions = useMemo(
    () => Array.from(new Set(serviceUsers.map((serviceUser) => serviceUser.zone))).sort(),
    [serviceUsers]
  );

  const statusCounts = useMemo(
    () =>
      serviceUsers.reduce<Record<UserStatus, number>>(
        (countMap, serviceUser) => {
          countMap[serviceUser.status] += 1;
          return countMap;
        },
        { active: 0, inactive: 0, hospitalised: 0, discharged: 0 }
      ),
    [serviceUsers]
  );

  const filteredUsers = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return serviceUsers.filter((serviceUser) => {
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
  }, [flagFilters, searchQuery, serviceUsers, statusFilters, zoneFilters]);

  const activeCount = statusCounts.active;
  const flaggedCount = useMemo(
    () => serviceUsers.filter((serviceUser) => serviceUser.flags.length > 0).length,
    [serviceUsers]
  );
  const zoneCoverageCount = zoneOptions.length;

  function toggleStatusFilter(status: UserStatus): void {
    setStatusFilters((current) =>
      current.includes(status) ? current.filter((entry) => entry !== status) : [...current, status]
    );
  }

  function addDocument(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!newDocTitle.trim()) return;
    setDocuments((current) => [
      {
        id: `new-${Date.now()}`,
        title: newDocTitle.trim(),
        category: newDocCategory,
        updated: "Just now"
      },
      ...current
    ]);
    setNewDocTitle("");
    setNewDocCategory(documentCategories[0]);
    setShowDocForm(false);
  }

  function savePersonalInfo(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const cleanLanguages = personalForm.languages
      .split(",")
      .map((w) => w.trim())
      .filter(Boolean);

    const overrides: Partial<ServiceUserProfileData> = {
      preferredName: personalForm.preferredName.trim(),
      firstName: personalForm.firstName.trim(),
      lastName: personalForm.lastName.trim(),
      gender: personalForm.gender.trim(),
      dateOfBirth: personalForm.dateOfBirth.trim(),
      maritalStatus: personalForm.maritalStatus.trim(),
      birthplace: personalForm.birthplace.trim(),
      nationality: personalForm.nationality.trim(),
      languages: cleanLanguages,
      ethnicity: personalForm.ethnicity.trim(),
      religion: personalForm.religion.trim(),
      carerGenderPreference: personalForm.carerGenderPreference.trim(),
      carerNote: personalForm.carerNote.trim()
    };

    setPersonalOverrides(overrides);
    setPersonalEditOpen(false);
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

  function addImportantContact(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!newContact.name.trim()) {
      return;
    }
    setImportantContacts((current) => [
      { ...newContact, name: newContact.name.trim(), role: newContact.role.trim(), phone: newContact.phone.trim() },
      ...current
    ]);
    setNewContact({ name: "", role: "", phone: "", relation: "Personal" });
    setShowContactForm(false);
  }

  function handlePhotoUpload(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];
    if (!file || !selectedServiceUser) return;
    const reader = new FileReader();
    reader.onload = () => {
      setProfilePhotos((prev) => ({ ...prev, [selectedServiceUser.id]: String(reader.result) }));
    };
    reader.readAsDataURL(file);
    // reset the input so the same file can be chosen again if needed
    event.target.value = "";
  }

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
    const profilePhoto = profilePhotos[selectedServiceUser.id];

    return (
      <section className="people-profile-page">
        <header className="people-profile-topbar">
          <button type="button" className="btn-outline people-profile-nav-btn" onClick={() => navigate("/people")}>
            <BackIcon />
            People list
          </button>
        </header>

        <article className="people-profile-hero">
            <div className="people-profile-hero-main">
            <div className="people-profile-avatar-shell">
              <div
                className={`people-profile-avatar ${profilePhoto ? "has-photo" : `palette-${selectedUserIndex % 6}`}`}
              >
                {profilePhoto ? (
                  <img src={profilePhoto} alt={`${selectedServiceUser.name} profile`} />
                ) : (
                  getInitials(selectedServiceUser.name)
                )}
              </div>
              <button
                type="button"
                className="people-profile-avatar-edit"
                aria-label="Change profile photo"
                onClick={() => photoInputRef.current?.click()}
              >
                <EditIcon />
              </button>
              <input
                ref={photoInputRef}
                className="people-avatar-input"
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
              />
            </div>
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
            <button type="button" className="people-profile-menu-item passport-link">
              <PassportIcon />
              Hospital Passport
            </button>
            {profileMenuGroups.map((group) => (
              <section key={group.heading} className="people-profile-menu-group">
                <h3>{group.heading}</h3>
                <div className="people-profile-menu-items">
                  {group.items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`people-profile-menu-item ${activeProfilePanel === item.id ? "active" : ""}`}
                      onClick={() => {
                        setActiveProfilePanel(item.id);
                        const target = panelRefs[item.id].current;
                        if (target) {
                          requestAnimationFrame(() =>
                            target.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" })
                          );
                        }
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </aside>

          <div className="people-profile-content-grid">
            <article
              ref={panelRefs.general}
              className={`people-profile-card span-2 ${panelIs("general") ? "focus" : ""}`}
            >
              <header>
                <h2>Personal information</h2>
                <button type="button" className="profile-edit-btn" onClick={() => setPersonalEditOpen((v) => !v)}>
                  <EditIcon />
                  {personalEditOpen ? "Close" : "Edit"}
                </button>
              </header>

              {personalEditOpen ? (
                <form className="people-personal-form" onSubmit={savePersonalInfo}>
                  <div className="people-personal-grid">
                    <label>
                      <span>Preferred name</span>
                      <input
                        type="text"
                        value={personalForm.preferredName}
                        onChange={(e) => setPersonalForm((f) => ({ ...f, preferredName: e.target.value }))}
                      />
                    </label>
                    <label>
                      <span>First name</span>
                      <input
                        type="text"
                        value={personalForm.firstName}
                        onChange={(e) => setPersonalForm((f) => ({ ...f, firstName: e.target.value }))}
                      />
                    </label>
                    <label>
                      <span>Last name</span>
                      <input
                        type="text"
                        value={personalForm.lastName}
                        onChange={(e) => setPersonalForm((f) => ({ ...f, lastName: e.target.value }))}
                      />
                    </label>
                    <label>
                      <span>Gender</span>
                      <input
                        type="text"
                        value={personalForm.gender}
                        onChange={(e) => setPersonalForm((f) => ({ ...f, gender: e.target.value }))}
                      />
                    </label>
                    <label>
                      <span>Date of birth</span>
                      <input
                        type="text"
                        value={personalForm.dateOfBirth}
                        onChange={(e) => setPersonalForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
                        placeholder="e.g. 16 May 1989"
                      />
                    </label>
                    <label>
                      <span>Marital status</span>
                      <input
                        type="text"
                        value={personalForm.maritalStatus}
                        onChange={(e) => setPersonalForm((f) => ({ ...f, maritalStatus: e.target.value }))}
                      />
                    </label>
                    <label>
                      <span>Birthplace</span>
                      <input
                        type="text"
                        value={personalForm.birthplace}
                        onChange={(e) => setPersonalForm((f) => ({ ...f, birthplace: e.target.value }))}
                      />
                    </label>
                    <label>
                      <span>Nationality</span>
                      <input
                        type="text"
                        value={personalForm.nationality}
                        onChange={(e) => setPersonalForm((f) => ({ ...f, nationality: e.target.value }))}
                      />
                    </label>
                    <label>
                      <span>Languages spoken</span>
                      <input
                        type="text"
                        value={personalForm.languages}
                        onChange={(e) => setPersonalForm((f) => ({ ...f, languages: e.target.value }))}
                        placeholder="Comma separated"
                      />
                    </label>
                    <label>
                      <span>Ethnicity</span>
                      <input
                        type="text"
                        value={personalForm.ethnicity}
                        onChange={(e) => setPersonalForm((f) => ({ ...f, ethnicity: e.target.value }))}
                      />
                    </label>
                    <label>
                      <span>Religion</span>
                      <input
                        type="text"
                        value={personalForm.religion}
                        onChange={(e) => setPersonalForm((f) => ({ ...f, religion: e.target.value }))}
                      />
                    </label>
                    <label>
                      <span>Carer gender preference</span>
                      <input
                        type="text"
                        value={personalForm.carerGenderPreference}
                        onChange={(e) => setPersonalForm((f) => ({ ...f, carerGenderPreference: e.target.value }))}
                      />
                    </label>
                    <label className="personal-note-field">
                      <span>Carer note</span>
                      <textarea
                        value={personalForm.carerNote}
                        onChange={(e) => setPersonalForm((f) => ({ ...f, carerNote: e.target.value }))}
                        rows={3}
                      />
                    </label>
                  </div>
                  <div className="people-personal-actions">
                    <button type="submit" className="btn-solid">
                      Save
                    </button>
                    <button type="button" className="btn-ghost" onClick={() => setPersonalEditOpen(false)}>
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                renderTableRows(
                  [
                    { label: "Preferred name", value: personalOverrides.preferredName ?? profileData.preferredName },
                    { label: "First name", value: personalOverrides.firstName ?? profileData.firstName },
                    { label: "Last name", value: personalOverrides.lastName ?? profileData.lastName },
                    { label: "Gender", value: personalOverrides.gender ?? profileData.gender },
                    {
                      label: "Date of birth",
                      value:
                        (personalOverrides.dateOfBirth || profileData.dateOfBirth) &&
                        `${personalOverrides.dateOfBirth || formatLongDate(profileData.dateOfBirth)}`
                    },
                    { label: "Marital status", value: personalOverrides.maritalStatus ?? profileData.maritalStatus },
                    { label: "Birthplace", value: personalOverrides.birthplace ?? profileData.birthplace },
                    { label: "Nationality", value: personalOverrides.nationality ?? profileData.nationality },
                    {
                      label: "Languages spoken",
                      value: (personalOverrides.languages || profileData.languages).filter(Boolean).join(", ")
                    },
                    { label: "Ethnicity", value: personalOverrides.ethnicity ?? profileData.ethnicity },
                    { label: "Religion", value: personalOverrides.religion ?? profileData.religion },
                    {
                      label: "Carer gender preference",
                      value: personalOverrides.carerGenderPreference ?? profileData.carerGenderPreference
                    },
                    { label: "Carer note", value: personalOverrides.carerNote ?? profileData.carerNote }
                  ].filter((row) => row.value && row.value.trim().length > 0)
                )
              )}
            </article>

            <article ref={panelRefs.general} className={`people-profile-card ${panelIs("general") ? "focus" : ""}`}>
              <header>
                <h2>Site related information</h2>
                <button type="button" className="profile-edit-btn">
                  <EditIcon />
                  Edit
                </button>
              </header>
              {renderTableRows(profileData.siteInfo)}
            </article>

            <article
              ref={panelRefs.general}
              className={`people-profile-card ${panelIs(["general", "charts"]) ? "focus" : ""}`}
            >
              <header>
                <h2>Contact details</h2>
                <button type="button" className="profile-edit-btn">
                  <EditIcon />
                  Edit
                </button>
              </header>
              {renderTableRows(profileData.contactInfo)}
            </article>

            <article
              ref={panelRefs.needs}
              className={`people-profile-card span-2 ${panelIs("needs") ? "focus" : ""}`}
            >
              <header>
                <h2>Care related information</h2>
                <button type="button" className="profile-edit-btn">
                  <EditIcon />
                  Edit
                </button>
              </header>
              {renderTableRows(profileData.careInfo)}
            </article>

            <article ref={panelRefs.important} className={`people-profile-card ${panelIs("important") ? "focus" : ""}`}>
              <header>
                <h2>Important people</h2>
                <div className="people-important-actions">
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => setShowContactForm((open) => !open)}
                    aria-expanded={showContactForm}
                  >
                    {showContactForm ? "Close" : "Add contact"}
                  </button>
                </div>
              </header>

              {showContactForm ? (
                <form className="people-contact-form" onSubmit={addImportantContact}>
                  <div className="people-contact-form-grid">
                    <label>
                      <span>Name</span>
                      <input
                        type="text"
                        value={newContact.name}
                        onChange={(event) => setNewContact((c) => ({ ...c, name: event.target.value }))}
                        required
                      />
                    </label>
                    <label>
                      <span>Role</span>
                      <input
                        type="text"
                        value={newContact.role}
                        onChange={(event) => setNewContact((c) => ({ ...c, role: event.target.value }))}
                        placeholder="Family, OT, GP..."
                      />
                    </label>
                    <label>
                      <span>Phone</span>
                      <input
                        type="text"
                        value={newContact.phone}
                        onChange={(event) => setNewContact((c) => ({ ...c, phone: event.target.value }))}
                        placeholder="+44 ..."
                      />
                    </label>
                    <label>
                      <span>Relationship</span>
                      <select
                        value={newContact.relation}
                        onChange={(event) =>
                          setNewContact((c) => ({ ...c, relation: event.target.value as ImportantContact["relation"] }))
                        }
                      >
                        <option value="Personal">Personal</option>
                        <option value="Professional">Professional</option>
                        <option value="Clinical">Clinical</option>
                      </select>
                    </label>
                  </div>
                  <div className="people-contact-form-actions">
                    <button type="submit" className="btn-solid">
                      Save contact
                    </button>
                    <button type="button" className="btn-ghost" onClick={() => setShowContactForm(false)}>
                      Cancel
                    </button>
                  </div>
                </form>
              ) : null}

              <ul className="people-profile-contact-list">
                {importantContacts.map((contact) => (
                  <li key={`${contact.name}-${contact.role}-${contact.phone}`}>
                    <div className="people-contact-pill">
                      <span className="contact-relation">{contact.relation || "Personal"}</span>
                    </div>
                    <strong>{contact.name}</strong>
                    <span>{contact.role || "—"}</span>
                    <small>{contact.phone || "No phone added"}</small>
                  </li>
                ))}
              </ul>
            </article>

            <article ref={panelRefs.about} className={`people-profile-card ${panelIs("about") ? "focus" : ""}`}>
              <header>
                <h2>About me</h2>
                <button type="button" className="profile-edit-btn">
                  <EditIcon />
                  Edit
                </button>
              </header>
              <p className="people-profile-note">{profileData.aboutMe}</p>
            </article>

            <article ref={panelRefs.future} className={`people-profile-card ${panelIs("future") ? "focus" : ""}`}>
              <header>
                <h2>Future plans</h2>
                <button type="button" className="profile-edit-btn">
                  <EditIcon />
                  Edit
                </button>
              </header>
              <p className="people-profile-note">{profileData.futurePlans}</p>
            </article>

            <article ref={panelRefs.logs} className={`people-profile-card ${panelIs("logs") ? "focus" : ""}`}>
              <header>
                <h2>Daily logs</h2>
              </header>
              {renderBulletList(profileData.dailyLogs)}
            </article>

            <article ref={panelRefs.charts} className={`people-profile-card ${panelIs("charts") ? "focus" : ""}`}>
              <header>
                <h2>Charts</h2>
              </header>
              {renderBulletList(profileData.charts)}
            </article>

            <article ref={panelRefs.documents} className={`people-profile-card ${panelIs("documents") ? "focus" : ""}`}>
              <header className="people-docs-header">
                <div>
                  <h2>Documents</h2>
                  <p className="summary-copy">View existing files or upload new supporting documents.</p>
                </div>
                <div className="people-docs-actions">
                  <button type="button" className="btn-outline" onClick={() => setShowDocForm(false)}>
                    View documents
                  </button>
                  <button type="button" className="btn-solid" onClick={() => setShowDocForm(true)}>
                    Upload new
                  </button>
                </div>
              </header>

              {showDocForm ? (
                <form className="people-doc-form" onSubmit={addDocument}>
                  <div className="people-doc-form-grid">
                    <label>
                      <span>Document title</span>
                      <input
                        type="text"
                        value={newDocTitle}
                        onChange={(event) => setNewDocTitle(event.target.value)}
                        placeholder="Enter a title"
                        required
                      />
                    </label>
                    <label>
                      <span>Category</span>
                      <select value={newDocCategory} onChange={(event) => setNewDocCategory(event.target.value)}>
                        {documentCategories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="upload-placeholder">
                      <span>File</span>
                      <div className="upload-faux-field">Select file (mock)</div>
                    </label>
                  </div>
                  <div className="people-doc-form-actions">
                    <button type="submit" className="btn-solid">
                      Save document
                    </button>
                    <button type="button" className="btn-ghost" onClick={() => setShowDocForm(false)}>
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <ul className="people-doc-list">
                  {documents.map((doc) => (
                    <li key={doc.id}>
                      <div>
                        <strong>{doc.title}</strong>
                        <small>{doc.category}</small>
                      </div>
                      <span className="muted">{doc.updated}</span>
                    </li>
                  ))}
                </ul>
              )}
            </article>

            <article
              ref={panelRefs.carePlanning}
              className={`people-profile-card ${panelIs("carePlanning") ? "focus" : ""}`}
            >
              <header>
                <h2>Care planning</h2>
              </header>
              {renderBulletList(profileData.carePlanning)}
            </article>

            <article
              ref={panelRefs.medication}
              className={`people-profile-card ${panelIs("medication") ? "focus" : ""}`}
            >
              <header>
                <h2>Medication</h2>
              </header>
              {renderBulletList(profileData.medication)}
            </article>

            <article ref={panelRefs.consent} className={`people-profile-card ${panelIs("consent") ? "focus" : ""}`}>
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
