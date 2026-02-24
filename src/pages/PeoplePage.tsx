import { useEffect, useMemo, useRef, useState, type RefObject, type ChangeEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import moodBestIcon from "../assets/moods/mood_best.png";
import moodGoodIcon from "../assets/moods/mood_good.png";
import moodNeutralIcon from "../assets/moods/mood_neutral.png";
import moodLowIcon from "../assets/moods/mood_low.png";
import moodLowestIcon from "../assets/moods/mood_lowest.png";
import { createServiceUser, loadServiceUsers, loadTeamUsers, updateServiceUser } from "../data/dbClient";
import {
  type MoodLevel,
  type ServiceUser,
  type TeamUser,
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

type AddressParts = {
  line1: string;
  street: string;
  city: string;
  county: string;
  postcode: string;
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

const definedBuildingZones = ["Maple House", "Harbor Court", "Cedar Lodge", "Orchard View", "Orbit Place"];
const zoneSelectOptions = ["Community", ...definedBuildingZones];
const supportTierOptions = ["Enhanced", "Standard", "Light"] as const;

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
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }
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

function parseAddressParts(address: string | undefined): AddressParts {
  const chunks = (address || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  return {
    line1: chunks[0] || "",
    street: chunks[1] || "",
    city: chunks[2] || "",
    county: chunks[3] || "",
    postcode: chunks[4] || ""
  };
}

function formatAddressParts(parts: AddressParts): string {
  return [parts.line1, parts.street, parts.city, parts.county, parts.postcode]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(", ");
}

function supportTierFromRiskLevel(riskLevel: string): "Enhanced" | "Standard" | "Light" {
  const normalized = riskLevel.trim().toLowerCase();
  if (normalized === "high") return "Enhanced";
  if (normalized === "medium") return "Standard";
  return "Light";
}

function riskLevelFromSupportTier(tier: "Enhanced" | "Standard" | "Light"): "High" | "Medium" | "Low" {
  if (tier === "Enhanced") return "High";
  if (tier === "Standard") return "Medium";
  return "Low";
}

function buildProfileData(serviceUser: ServiceUser, serviceUsers: ServiceUser[]): ServiceUserProfileData {
  const index = Math.max(0, serviceUsers.findIndex((entry) => entry.id === serviceUser.id));
  const firstName = serviceUser.firstName || serviceUser.name.split(" ")[0] || "";
  const lastName = serviceUser.lastName || serviceUser.name.split(" ").slice(1).join(" ");
  const dateOfBirth = serviceUser.dateOfBirth || seedAt(dateOfBirthSeeds, index);
  const age = getAge(dateOfBirth);
  const gender = serviceUser.gender || seedAt(genderSeeds, index);
  const maritalStatus = serviceUser.maritalStatus || "";
  const birthplace = serviceUser.birthplace || "";
  const bloodType = serviceUser.bloodType || seedAt(bloodTypeSeeds, index);
  const fundingSource = serviceUser.fundingSource || seedAt(fundingSourceSeeds, index);
  const familyContact = seedAt(familyContactSeeds, index);
  const clinicalLead = seedAt(clinicalLeadSeeds, index);
  const homeAddress = serviceUser.address || seedAt(addressSeeds, index);
  const aboutMe = seedAt(aboutMeSeeds, index);
  const futurePlans = seedAt(futurePlanSeeds, index);

  const nhsNumber =
    serviceUser.nhsNumber ||
    `${410 + index} ${String(230 + index * 7).padStart(3, "0")} ${String(1200 + index * 13).slice(-4)}`;
  const nationalInsurance =
    serviceUser.nationalInsurance || `JC${String(490000 + index * 149).slice(-6)}${String.fromCharCode(65 + (index % 26))}`;
  const profileScore = `${88 + (index % 8)}%`;

  const allergiesSummary =
    serviceUser.allergies ||
    (serviceUser.flags.includes("Allergy") ? "Known allergy support in place" : "No known allergies");
  const dnacpr = serviceUser.dnacpr || (serviceUser.status === "hospitalised" ? "Clinical review pending" : "Attempt CPR");
  const dolsStatus = serviceUser.dolsStatus || (serviceUser.status === "discharged" ? "No active DoLS" : "Authorised");
  const medicalHistory =
    serviceUser.medicalHistory ||
    (serviceUser.flags.includes("Medication watch")
      ? "Medication watch active with daily review"
      : "No high-risk history recorded");
  const admissionDate = serviceUser.admissionDate
    ? formatLongDate(serviceUser.admissionDate)
    : formatLongDate(`2025-${String(1 + (index % 9)).padStart(2, "0")}-0${(index % 8) + 1}`);
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
    { label: "Medical history", value: medicalHistory },
    { label: "Admission date", value: admissionDate },
    { label: "National Insurance", value: nationalInsurance },
    { label: "NHS number", value: nhsNumber },
    { label: "Funding source", value: fundingSource },
    { label: "Preferred drink", value: serviceUser.preferredDrink || (index % 2 === 0 ? "Tea" : "Sparkling water") },
    { label: "PRN meds", value: serviceUser.prnMeds || (index % 3 === 0 ? "As required, monitored" : "None recorded") }
  ];

  const contactInfo: ProfileField[] = [
    { label: "Primary phone", value: serviceUser.phone || serviceUser.mobilePhone || "Not recorded" },
    {
      label: "Preferred contact",
      value:
        serviceUser.preferredContactMethod ||
        (serviceUser.mobilePhone ? "Text" : serviceUser.phone ? "Call" : serviceUser.email ? "Text" : "Not recorded")
    },
    { label: "Email", value: serviceUser.email || "Not recorded" },
    { label: "Address", value: homeAddress || "Not recorded" },
    { label: "Emergency contact", value: serviceUser.emergencyContactName || "Not recorded" },
    { label: "Emergency phone", value: serviceUser.emergencyContactPhone || "Not recorded" }
  ];

  const nationality = serviceUser.nationality || "";
  const languages = (serviceUser.languagesSpoken || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  const ethnicity = serviceUser.ethnicity || "";
  const religion = serviceUser.religion || "";
  const carerGenderPreference = serviceUser.carerGenderPreference || "";
  const carerNote = serviceUser.carerNote || "";

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
    preferredName: serviceUser.preferredName || firstName,
    firstName,
    lastName,
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

  const [serviceUsers, setServiceUsers] = useState<ServiceUser[]>([]);
  const [teamUsers, setTeamUsers] = useState<TeamUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
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
  const [personalSaveError, setPersonalSaveError] = useState("");
  const [isSavingPersonal, setIsSavingPersonal] = useState(false);
  const [siteEditOpen, setSiteEditOpen] = useState(false);
  const [siteSaveError, setSiteSaveError] = useState("");
  const [isSavingSite, setIsSavingSite] = useState(false);
  const [contactEditOpen, setContactEditOpen] = useState(false);
  const [contactSaveError, setContactSaveError] = useState("");
  const [isSavingContact, setIsSavingContact] = useState(false);
  const [careEditOpen, setCareEditOpen] = useState(false);
  const [careSaveError, setCareSaveError] = useState("");
  const [isSavingCare, setIsSavingCare] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createForm, setCreateForm] = useState({
    firstName: "",
    lastName: "",
    clientType: "Community",
    riskLevel: "Low",
    activeStatus: true
  });
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
  const [contactForm, setContactForm] = useState({
    email: "",
    phone: "",
    mobilePhone: "",
    line1: "",
    street: "",
    city: "",
    county: "",
    postcode: "",
    preferredContactMethod: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelation: ""
  });
  const [siteForm, setSiteForm] = useState({
    zone: "Community",
    unit: "",
    keyWorker: "",
    supportTier: "Light" as "Enhanced" | "Standard" | "Light",
    activeStatus: true
  });
  const [careForm, setCareForm] = useState({
    dnacpr: "",
    dolsStatus: "",
    allergies: "",
    bloodType: "",
    medicalHistory: "",
    admissionDate: "",
    nationalInsurance: "",
    nhsNumber: "",
    fundingSource: "",
    preferredDrink: "",
    prnMeds: ""
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

    Promise.all([loadServiceUsers(), loadTeamUsers()])
      .then(([users, staff]) => {
        if (isCancelled) return;
        setServiceUsers(users);
        setTeamUsers(staff.filter((person) => person.status === "active"));
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoadingUsers(false);
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
      setPersonalSaveError("");
      setSiteSaveError("");
      setContactSaveError("");
      setCareSaveError("");
      const parsedSiteAddress = parseAddressParts(selectedServiceUser?.address || "");
      const currentZone = selectedServiceUser?.zone || "Community";
      const isDefinedBuilding = definedBuildingZones.includes(currentZone);
      const defaultSiteUnit = isDefinedBuilding ? parsedSiteAddress.line1 : selectedServiceUser?.address || "";
      setSiteForm({
        zone: currentZone,
        unit: defaultSiteUnit,
        keyWorker: selectedServiceUser?.keyWorker || "",
        supportTier: supportTierFromRiskLevel(selectedServiceUser?.riskLevel || ""),
        activeStatus: selectedServiceUser?.status === "active"
      });
      const parsedAddress = parseAddressParts(selectedServiceUser?.address || "");
      setContactForm({
        email: selectedServiceUser?.email || "",
        phone: selectedServiceUser?.phone || "",
        mobilePhone: selectedServiceUser?.mobilePhone || "",
        line1: parsedAddress.line1,
        street: parsedAddress.street,
        city: parsedAddress.city,
        county: parsedAddress.county,
        postcode: parsedAddress.postcode,
        preferredContactMethod: selectedServiceUser?.preferredContactMethod || "",
        emergencyContactName: selectedServiceUser?.emergencyContactName || "",
        emergencyContactPhone: selectedServiceUser?.emergencyContactPhone || "",
        emergencyContactRelation: selectedServiceUser?.emergencyContactRelation || ""
      });
      setPersonalForm({
        preferredName: profileData.preferredName,
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        gender: profileData.gender,
        dateOfBirth: profileData.dateOfBirth,
        maritalStatus: profileData.maritalStatus,
        birthplace: profileData.birthplace,
        nationality: profileData.nationality,
        languages: profileData.languages.join(", "),
        ethnicity: profileData.ethnicity,
        religion: profileData.religion,
        carerGenderPreference: profileData.carerGenderPreference,
        carerNote: profileData.carerNote
      });
      setCareForm({
        dnacpr: selectedServiceUser?.dnacpr || profileData.dnacpr || "",
        dolsStatus: selectedServiceUser?.dolsStatus || profileData.dolsStatus || "",
        allergies: selectedServiceUser?.allergies || profileData.allergiesSummary || "",
        bloodType: selectedServiceUser?.bloodType || "",
        medicalHistory: selectedServiceUser?.medicalHistory || "",
        admissionDate: selectedServiceUser?.admissionDate || "",
        nationalInsurance: selectedServiceUser?.nationalInsurance || "",
        nhsNumber: selectedServiceUser?.nhsNumber || "",
        fundingSource: selectedServiceUser?.fundingSource || "",
        preferredDrink: selectedServiceUser?.preferredDrink || "",
        prnMeds: selectedServiceUser?.prnMeds || ""
      });
    }
  }, [profileData, selectedServiceUser, serviceUserId]);

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

  async function savePersonalInfo(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!selectedServiceUser) return;
    setPersonalSaveError("");

    try {
      setIsSavingPersonal(true);
      await updateServiceUser(selectedServiceUser.id, {
        preferredName: personalForm.preferredName,
        firstName: personalForm.firstName,
        lastName: personalForm.lastName,
        dateOfBirth: personalForm.dateOfBirth,
        gender: personalForm.gender,
        maritalStatus: personalForm.maritalStatus,
        birthplace: personalForm.birthplace,
        nationality: personalForm.nationality,
        languagesSpoken: personalForm.languages,
        ethnicity: personalForm.ethnicity,
        religion: personalForm.religion,
        carerGenderPreference: personalForm.carerGenderPreference,
        carerNote: personalForm.carerNote,
        email: selectedServiceUser.email || "",
        phone: selectedServiceUser.phone || "",
        mobilePhone: selectedServiceUser.mobilePhone || "",
        address: selectedServiceUser.address || "",
        nhsNumber: selectedServiceUser.nhsNumber || "",
        gpDetails: selectedServiceUser.gpDetails || "",
        riskLevel: selectedServiceUser.riskLevel || "",
        fundingSource: selectedServiceUser.fundingSource || ""
      });
      const users = await loadServiceUsers();
      setServiceUsers(users);
      setPersonalEditOpen(false);
    } catch (error) {
      setPersonalSaveError(error instanceof Error ? error.message : "Unable to save changes.");
    } finally {
      setIsSavingPersonal(false);
    }
  }

  async function saveSiteInfo(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!selectedServiceUser) return;
    setSiteSaveError("");

    try {
      setIsSavingSite(true);
      const existingAddressParts = parseAddressParts(selectedServiceUser.address || "");
      const isDefinedBuilding = definedBuildingZones.includes(siteForm.zone);
      const nextAddress = isDefinedBuilding
        ? formatAddressParts({ ...existingAddressParts, line1: siteForm.unit })
        : siteForm.unit.trim();

      await updateServiceUser(selectedServiceUser.id, {
        clientType: siteForm.zone,
        keyWorker: siteForm.keyWorker,
        activeStatus: siteForm.activeStatus,
        dischargeDate: siteForm.activeStatus ? "" : selectedServiceUser.dischargeDate || "",
        riskLevel: riskLevelFromSupportTier(siteForm.supportTier),
        firstName: selectedServiceUser.firstName || profileData?.firstName || "",
        lastName: selectedServiceUser.lastName || profileData?.lastName || "",
        dateOfBirth: selectedServiceUser.dateOfBirth || profileData?.dateOfBirth || "",
        gender: selectedServiceUser.gender || profileData?.gender || "",
        maritalStatus: selectedServiceUser.maritalStatus || profileData?.maritalStatus || "",
        birthplace: selectedServiceUser.birthplace || profileData?.birthplace || "",
        nationality: selectedServiceUser.nationality || profileData?.nationality || "",
        languagesSpoken: selectedServiceUser.languagesSpoken || profileData?.languages.join(", ") || "",
        ethnicity: selectedServiceUser.ethnicity || profileData?.ethnicity || "",
        religion: selectedServiceUser.religion || profileData?.religion || "",
        carerGenderPreference: selectedServiceUser.carerGenderPreference || profileData?.carerGenderPreference || "",
        carerNote: selectedServiceUser.carerNote || profileData?.carerNote || "",
        email: selectedServiceUser.email || "",
        phone: selectedServiceUser.phone || "",
        mobilePhone: selectedServiceUser.mobilePhone || "",
        address: nextAddress,
        preferredContactMethod: selectedServiceUser.preferredContactMethod || "",
        emergencyContactName: selectedServiceUser.emergencyContactName || "",
        emergencyContactPhone: selectedServiceUser.emergencyContactPhone || "",
        emergencyContactRelation: selectedServiceUser.emergencyContactRelation || "",
        nhsNumber: selectedServiceUser.nhsNumber || "",
        gpDetails: selectedServiceUser.gpDetails || "",
        fundingSource: selectedServiceUser.fundingSource || ""
      });

      const users = await loadServiceUsers();
      setServiceUsers(users);
      setSiteEditOpen(false);
    } catch (error) {
      setSiteSaveError(error instanceof Error ? error.message : "Unable to save site information.");
    } finally {
      setIsSavingSite(false);
    }
  }

  async function saveContactInfo(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!selectedServiceUser) return;
    setContactSaveError("");

    try {
      setIsSavingContact(true);
      await updateServiceUser(selectedServiceUser.id, {
        firstName: selectedServiceUser.firstName || profileData?.firstName || "",
        lastName: selectedServiceUser.lastName || profileData?.lastName || "",
        dateOfBirth: selectedServiceUser.dateOfBirth || profileData?.dateOfBirth || "",
        gender: selectedServiceUser.gender || profileData?.gender || "",
        maritalStatus: selectedServiceUser.maritalStatus || profileData?.maritalStatus || "",
        birthplace: selectedServiceUser.birthplace || profileData?.birthplace || "",
        nationality: selectedServiceUser.nationality || profileData?.nationality || "",
        languagesSpoken: selectedServiceUser.languagesSpoken || profileData?.languages.join(", ") || "",
        ethnicity: selectedServiceUser.ethnicity || profileData?.ethnicity || "",
        religion: selectedServiceUser.religion || profileData?.religion || "",
        carerGenderPreference: selectedServiceUser.carerGenderPreference || profileData?.carerGenderPreference || "",
        carerNote: selectedServiceUser.carerNote || profileData?.carerNote || "",
        email: contactForm.email,
        phone: contactForm.phone,
        mobilePhone: contactForm.mobilePhone,
        address: formatAddressParts(contactForm),
        preferredContactMethod: contactForm.preferredContactMethod,
        emergencyContactName: contactForm.emergencyContactName,
        emergencyContactPhone: contactForm.emergencyContactPhone,
        emergencyContactRelation: contactForm.emergencyContactRelation,
        nhsNumber: selectedServiceUser.nhsNumber || "",
        gpDetails: selectedServiceUser.gpDetails || "",
        riskLevel: selectedServiceUser.riskLevel || "",
        fundingSource: selectedServiceUser.fundingSource || ""
      });
      const users = await loadServiceUsers();
      setServiceUsers(users);
      setContactEditOpen(false);
    } catch (error) {
      setContactSaveError(error instanceof Error ? error.message : "Unable to save contact details.");
    } finally {
      setIsSavingContact(false);
    }
  }

  async function saveCareInfo(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!selectedServiceUser) return;
    setCareSaveError("");

    try {
      setIsSavingCare(true);
      await updateServiceUser(selectedServiceUser.id, {
        dnacpr: careForm.dnacpr,
        dolsStatus: careForm.dolsStatus,
        allergies: careForm.allergies,
        bloodType: careForm.bloodType,
        medicalHistory: careForm.medicalHistory,
        admissionDate: careForm.admissionDate,
        nationalInsurance: careForm.nationalInsurance,
        nhsNumber: careForm.nhsNumber,
        fundingSource: careForm.fundingSource,
        preferredDrink: careForm.preferredDrink,
        prnMeds: careForm.prnMeds,
        firstName: selectedServiceUser.firstName || profileData?.firstName || "",
        lastName: selectedServiceUser.lastName || profileData?.lastName || "",
        dateOfBirth: selectedServiceUser.dateOfBirth || profileData?.dateOfBirth || "",
        gender: selectedServiceUser.gender || profileData?.gender || "",
        maritalStatus: selectedServiceUser.maritalStatus || profileData?.maritalStatus || "",
        birthplace: selectedServiceUser.birthplace || profileData?.birthplace || "",
        nationality: selectedServiceUser.nationality || profileData?.nationality || "",
        languagesSpoken: selectedServiceUser.languagesSpoken || profileData?.languages.join(", ") || "",
        ethnicity: selectedServiceUser.ethnicity || profileData?.ethnicity || "",
        religion: selectedServiceUser.religion || profileData?.religion || "",
        carerGenderPreference: selectedServiceUser.carerGenderPreference || profileData?.carerGenderPreference || "",
        carerNote: selectedServiceUser.carerNote || profileData?.carerNote || "",
        email: selectedServiceUser.email || "",
        phone: selectedServiceUser.phone || "",
        mobilePhone: selectedServiceUser.mobilePhone || "",
        address: selectedServiceUser.address || "",
        preferredContactMethod: selectedServiceUser.preferredContactMethod || "",
        emergencyContactName: selectedServiceUser.emergencyContactName || "",
        emergencyContactPhone: selectedServiceUser.emergencyContactPhone || "",
        emergencyContactRelation: selectedServiceUser.emergencyContactRelation || "",
        gpDetails: selectedServiceUser.gpDetails || "",
        riskLevel: selectedServiceUser.riskLevel || ""
      });
      const users = await loadServiceUsers();
      setServiceUsers(users);
      setCareEditOpen(false);
    } catch (error) {
      setCareSaveError(error instanceof Error ? error.message : "Unable to save care information.");
    } finally {
      setIsSavingCare(false);
    }
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

  async function handleCreateServiceUser(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setCreateError("");
    if (!createForm.firstName.trim() || !createForm.lastName.trim()) {
      setCreateError("First name and last name are required.");
      return;
    }

    try {
      setIsCreatingUser(true);
      const created = await createServiceUser({
        firstName: createForm.firstName,
        lastName: createForm.lastName,
        clientType: createForm.clientType,
        riskLevel: createForm.riskLevel,
        activeStatus: createForm.activeStatus
      });
      const users = await loadServiceUsers();
      setServiceUsers(users);
      setShowCreateForm(false);
      setCreateForm({
        firstName: "",
        lastName: "",
        clientType: "Community",
        riskLevel: "Low",
        activeStatus: true
      });
      navigate(`/people/${created.id}`);
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : "Unable to create service user.");
    } finally {
      setIsCreatingUser(false);
    }
  }

  if (serviceUserId && !selectedServiceUser && !isLoadingUsers) {
    return (
      <section className="people-profile-page">
        <article className="people-empty-state">
          <h2>Service user not found</h2>
          <p>This profile is unavailable or no longer exists in the current dataset.</p>
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
                  {personalSaveError ? <div className="alert-error">{personalSaveError}</div> : null}
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
                    <button type="submit" className="btn-solid" disabled={isSavingPersonal}>
                      {isSavingPersonal ? "Saving..." : "Save"}
                    </button>
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() => setPersonalEditOpen(false)}
                      disabled={isSavingPersonal}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                renderTableRows(
                  [
                    { label: "Preferred name", value: profileData.preferredName || "Not recorded" },
                    { label: "First name", value: profileData.firstName || "Not recorded" },
                    { label: "Last name", value: profileData.lastName || "Not recorded" },
                    { label: "Gender", value: profileData.gender || "Not recorded" },
                    {
                      label: "Date of birth",
                      value: profileData.dateOfBirth ? formatLongDate(profileData.dateOfBirth) : "Not recorded"
                    },
                    { label: "Marital status", value: profileData.maritalStatus || "Not recorded" },
                    { label: "Birthplace", value: profileData.birthplace || "Not recorded" },
                    { label: "Nationality", value: profileData.nationality || "Not recorded" },
                    {
                      label: "Languages spoken",
                      value: profileData.languages.filter(Boolean).join(", ") || "Not recorded"
                    },
                    { label: "Ethnicity", value: profileData.ethnicity || "Not recorded" },
                    { label: "Religion", value: profileData.religion || "Not recorded" },
                    {
                      label: "Carer gender preference",
                      value: profileData.carerGenderPreference || "Not recorded"
                    },
                    { label: "Carer note", value: profileData.carerNote || "Not recorded" }
                  ]
                )
              )}
            </article>

            <article ref={panelRefs.general} className={`people-profile-card ${panelIs("general") ? "focus" : ""}`}>
              <header>
                <h2>Site related information</h2>
                <button type="button" className="profile-edit-btn" onClick={() => setSiteEditOpen((v) => !v)}>
                  <EditIcon />
                  {siteEditOpen ? "Close" : "Edit"}
                </button>
              </header>
              {siteEditOpen ? (
                <form className="people-contact-form" onSubmit={saveSiteInfo}>
                  {siteSaveError ? <div className="alert-error">{siteSaveError}</div> : null}
                  <div className="people-contact-form-grid">
                    <label>
                      <span>Zone</span>
                      <select
                        value={siteForm.zone}
                        onChange={(event) => {
                          const nextZone = event.target.value;
                          const parsedAddress = parseAddressParts(selectedServiceUser?.address || "");
                          const isDefinedBuilding = definedBuildingZones.includes(nextZone);
                          setSiteForm((current) => ({
                            ...current,
                            zone: nextZone,
                            unit: isDefinedBuilding ? parsedAddress.line1 : selectedServiceUser?.address || current.unit
                          }));
                        }}
                      >
                        {Array.from(new Set([...zoneSelectOptions, selectedServiceUser.zone])).map((zone) => (
                          <option key={zone} value={zone}>
                            {zone}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      <span>{definedBuildingZones.includes(siteForm.zone) ? "House number / Unit" : "Community address"}</span>
                      <input
                        type="text"
                        value={siteForm.unit}
                        onChange={(event) => setSiteForm((current) => ({ ...current, unit: event.target.value }))}
                      />
                    </label>
                    <label>
                      <span>Key worker</span>
                      <select
                        value={siteForm.keyWorker}
                        onChange={(event) => setSiteForm((current) => ({ ...current, keyWorker: event.target.value }))}
                      >
                        <option value="">Unassigned</option>
                        {teamUsers.map((member) => (
                          <option key={member.id} value={member.name}>
                            {member.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      <span>Support tier</span>
                      <select
                        value={siteForm.supportTier}
                        onChange={(event) =>
                          setSiteForm((current) => ({
                            ...current,
                            supportTier: event.target.value as (typeof supportTierOptions)[number]
                          }))
                        }
                      >
                        {supportTierOptions.map((tier) => (
                          <option key={tier} value={tier}>
                            {tier}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      <span>Status</span>
                      <select
                        value={siteForm.activeStatus ? "active" : "inactive"}
                        onChange={(event) =>
                          setSiteForm((current) => ({ ...current, activeStatus: event.target.value === "active" }))
                        }
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </label>
                  </div>
                  <div className="people-contact-form-actions">
                    <button type="submit" className="btn-solid" disabled={isSavingSite}>
                      {isSavingSite ? "Saving..." : "Save"}
                    </button>
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() => setSiteEditOpen(false)}
                      disabled={isSavingSite}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                renderTableRows(profileData.siteInfo)
              )}
            </article>

            <article
              ref={panelRefs.general}
              className={`people-profile-card ${panelIs(["general", "charts"]) ? "focus" : ""}`}
            >
              <header>
                <h2>Contact details</h2>
                <button type="button" className="profile-edit-btn" onClick={() => setContactEditOpen((v) => !v)}>
                  <EditIcon />
                  {contactEditOpen ? "Close" : "Edit"}
                </button>
              </header>
              {contactEditOpen ? (
                <form className="people-contact-form" onSubmit={saveContactInfo}>
                  {contactSaveError ? <div className="alert-error">{contactSaveError}</div> : null}
                  <div className="people-contact-form-grid">
                    <label>
                      <span>Primary phone</span>
                      <input
                        type="text"
                        value={contactForm.phone}
                        onChange={(e) => setContactForm((form) => ({ ...form, phone: e.target.value }))}
                      />
                    </label>
                    <label>
                      <span>Mobile phone</span>
                      <input
                        type="text"
                        value={contactForm.mobilePhone}
                        onChange={(e) => setContactForm((form) => ({ ...form, mobilePhone: e.target.value }))}
                      />
                    </label>
                    <label>
                      <span>Email</span>
                      <input
                        type="email"
                        value={contactForm.email}
                        onChange={(e) => setContactForm((form) => ({ ...form, email: e.target.value }))}
                      />
                    </label>
                    <label>
                      <span>Number / Name</span>
                      <input
                        type="text"
                        value={contactForm.line1}
                        onChange={(e) => setContactForm((form) => ({ ...form, line1: e.target.value }))}
                      />
                    </label>
                    <label>
                      <span>Street</span>
                      <input
                        type="text"
                        value={contactForm.street}
                        onChange={(e) => setContactForm((form) => ({ ...form, street: e.target.value }))}
                      />
                    </label>
                    <label>
                      <span>City</span>
                      <input
                        type="text"
                        value={contactForm.city}
                        onChange={(e) => setContactForm((form) => ({ ...form, city: e.target.value }))}
                      />
                    </label>
                    <label>
                      <span>County</span>
                      <input
                        type="text"
                        value={contactForm.county}
                        onChange={(e) => setContactForm((form) => ({ ...form, county: e.target.value }))}
                      />
                    </label>
                    <label>
                      <span>Postcode</span>
                      <input
                        type="text"
                        value={contactForm.postcode}
                        onChange={(e) => setContactForm((form) => ({ ...form, postcode: e.target.value }))}
                      />
                    </label>
                    <label>
                      <span>Preferred contact</span>
                      <select
                        value={contactForm.preferredContactMethod}
                        onChange={(e) => setContactForm((form) => ({ ...form, preferredContactMethod: e.target.value }))}
                      >
                        <option value="">Not recorded</option>
                        <option value="Text">Text</option>
                        <option value="Call">Call</option>
                        <option value="WhatsApp">WhatsApp</option>
                      </select>
                    </label>
                    <label>
                      <span>Emergency contact</span>
                      <input
                        type="text"
                        value={contactForm.emergencyContactName}
                        onChange={(e) => setContactForm((form) => ({ ...form, emergencyContactName: e.target.value }))}
                      />
                    </label>
                    <label>
                      <span>Emergency phone</span>
                      <input
                        type="text"
                        value={contactForm.emergencyContactPhone}
                        onChange={(e) => setContactForm((form) => ({ ...form, emergencyContactPhone: e.target.value }))}
                      />
                    </label>
                    <label>
                      <span>Emergency relation</span>
                      <input
                        type="text"
                        value={contactForm.emergencyContactRelation}
                        onChange={(e) => setContactForm((form) => ({ ...form, emergencyContactRelation: e.target.value }))}
                        placeholder="Family, friend, advocate..."
                      />
                    </label>
                  </div>
                  <div className="people-contact-form-actions">
                    <button type="submit" className="btn-solid" disabled={isSavingContact}>
                      {isSavingContact ? "Saving..." : "Save"}
                    </button>
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() => setContactEditOpen(false)}
                      disabled={isSavingContact}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                renderTableRows(profileData.contactInfo)
              )}
            </article>

            <article
              ref={panelRefs.needs}
              className={`people-profile-card span-2 ${panelIs("needs") ? "focus" : ""}`}
            >
              <header>
                <h2>Care related information</h2>
                <button type="button" className="profile-edit-btn" onClick={() => setCareEditOpen((v) => !v)}>
                  <EditIcon />
                  {careEditOpen ? "Close" : "Edit"}
                </button>
              </header>
              {careSaveError ? <p className="people-form-error">{careSaveError}</p> : null}
              {careEditOpen ? (
                <form className="people-contact-form" onSubmit={saveCareInfo}>
                  <div className="people-contact-form-grid">
                    <label>
                      <span>DNACPR</span>
                      <input
                        type="text"
                        value={careForm.dnacpr}
                        onChange={(e) => setCareForm((form) => ({ ...form, dnacpr: e.target.value }))}
                      />
                    </label>
                    <label>
                      <span>DoLS status</span>
                      <input
                        type="text"
                        value={careForm.dolsStatus}
                        onChange={(e) => setCareForm((form) => ({ ...form, dolsStatus: e.target.value }))}
                      />
                    </label>
                    <label>
                      <span>Allergies</span>
                      <input
                        type="text"
                        value={careForm.allergies}
                        onChange={(e) => setCareForm((form) => ({ ...form, allergies: e.target.value }))}
                      />
                    </label>
                    <label>
                      <span>Blood type</span>
                      <input
                        type="text"
                        value={careForm.bloodType}
                        onChange={(e) => setCareForm((form) => ({ ...form, bloodType: e.target.value }))}
                      />
                    </label>
                    <label>
                      <span>Medical history</span>
                      <input
                        type="text"
                        value={careForm.medicalHistory}
                        onChange={(e) => setCareForm((form) => ({ ...form, medicalHistory: e.target.value }))}
                      />
                    </label>
                    <label>
                      <span>Admission date</span>
                      <input
                        type="date"
                        value={careForm.admissionDate}
                        onChange={(e) => setCareForm((form) => ({ ...form, admissionDate: e.target.value }))}
                      />
                    </label>
                    <label>
                      <span>National Insurance</span>
                      <input
                        type="text"
                        value={careForm.nationalInsurance}
                        onChange={(e) => setCareForm((form) => ({ ...form, nationalInsurance: e.target.value }))}
                      />
                    </label>
                    <label>
                      <span>NHS number</span>
                      <input
                        type="text"
                        value={careForm.nhsNumber}
                        onChange={(e) => setCareForm((form) => ({ ...form, nhsNumber: e.target.value }))}
                      />
                    </label>
                    <label>
                      <span>Funding source</span>
                      <input
                        type="text"
                        value={careForm.fundingSource}
                        onChange={(e) => setCareForm((form) => ({ ...form, fundingSource: e.target.value }))}
                      />
                    </label>
                    <label>
                      <span>Preferred drink</span>
                      <input
                        type="text"
                        value={careForm.preferredDrink}
                        onChange={(e) => setCareForm((form) => ({ ...form, preferredDrink: e.target.value }))}
                      />
                    </label>
                    <label>
                      <span>PRN meds</span>
                      <input
                        type="text"
                        value={careForm.prnMeds}
                        onChange={(e) => setCareForm((form) => ({ ...form, prnMeds: e.target.value }))}
                      />
                    </label>
                  </div>
                  <div className="people-contact-form-actions">
                    <button type="submit" className="btn-solid" disabled={isSavingCare}>
                      {isSavingCare ? "Saving..." : "Save"}
                    </button>
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() => setCareEditOpen(false)}
                      disabled={isSavingCare}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                renderTableRows(profileData.careInfo)
              )}
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
          <button type="button" className="btn-solid" onClick={() => setShowCreateForm((current) => !current)}>
            {showCreateForm ? "Close create" : "Create service user"}
          </button>
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

      {showCreateForm ? (
        <article className="people-create-card">
          <div className="people-create-head">
            <div>
              <p className="eyebrow">Onboarding</p>
              <h2>Create service user</h2>
              <p>Add a new client profile to your company roster.</p>
            </div>
          </div>
          {createError ? <div className="alert-error">{createError}</div> : null}
          <form className="people-create-form" onSubmit={handleCreateServiceUser}>
            <div className="people-create-grid">
              <label>
                <span>First name</span>
                <input
                  type="text"
                  value={createForm.firstName}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, firstName: event.target.value }))}
                  required
                />
              </label>
              <label>
                <span>Last name</span>
                <input
                  type="text"
                  value={createForm.lastName}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, lastName: event.target.value }))}
                  required
                />
              </label>
              <label>
                <span>Client type</span>
                <select
                  value={createForm.clientType}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, clientType: event.target.value }))}
                >
                  <option value="Community">Community</option>
                  <option value="Residential">Residential</option>
                </select>
              </label>
              <label>
                <span>Risk level</span>
                <select
                  value={createForm.riskLevel}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, riskLevel: event.target.value }))}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </label>
              <label>
                <span>Active status</span>
                <select
                  value={createForm.activeStatus ? "true" : "false"}
                  onChange={(event) =>
                    setCreateForm((prev) => ({ ...prev, activeStatus: event.target.value === "true" }))
                  }
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </label>
            </div>
            <div className="people-create-actions">
              <button type="submit" className="btn-solid" disabled={isCreatingUser}>
                {isCreatingUser ? "Creating..." : "Create user"}
              </button>
              <button type="button" className="btn-ghost" onClick={() => setShowCreateForm(false)} disabled={isCreatingUser}>
                Cancel
              </button>
            </div>
          </form>
        </article>
      ) : null}

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

          {isLoadingUsers ? (
            <article className="people-empty-state">
              <h2>Loading users...</h2>
            </article>
          ) : filteredUsers.length === 0 ? (
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
