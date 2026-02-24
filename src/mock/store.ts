import usersData from "./data/users.json";
import serviceUsersData from "./data/serviceUsers.json";
import rotaTemplatesData from "./data/rota.json";

export type TeamUserRole = string;
export type TeamUserStatus = "active" | "inactive";

export type TeamUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: TeamUserRole;
  status: TeamUserStatus;
  lineManager: string;
  isLineManager: boolean;
  avatarUrl?: string;
};

export type UserStatus = "active" | "inactive" | "hospitalised" | "discharged";
export type UserFlag = "Allergy" | "Review due" | "Behaviour support" | "Medication watch";
export type SupportTier = "Enhanced" | "Standard" | "Light";
export type MoodLevel = "great" | "good" | "ok" | "low" | "critical";

export type ServiceUser = {
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
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: string;
  email?: string;
  phone?: string;
  mobilePhone?: string;
  address?: string;
  nhsNumber?: string;
  gpDetails?: string;
  riskLevel?: string;
  fundingSource?: string;
  preferredName?: string;
  maritalStatus?: string;
  birthplace?: string;
  nationality?: string;
  languagesSpoken?: string;
  ethnicity?: string;
  religion?: string;
  carerGenderPreference?: string;
  carerNote?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  preferredContactMethod?: string;
  activeStatus?: boolean;
  dischargeDate?: string;
};

export type RotaShiftType = "Background" | "PWS";
export type RotaShiftStatus = "Assigned" | "Open";

export type RotaShiftTemplate = {
  id: string;
  dayOffset: number;
  start: string;
  end: string;
  location: string;
  type: RotaShiftType;
  status: RotaShiftStatus;
  employeeId: string | null;
  serviceUserId: string | null;
  comments?: string;
  colorCode?: string;
};

export type RotaShift = Omit<RotaShiftTemplate, "dayOffset"> & {
  date: string;
};

const mockTeamUsersInternal = usersData as TeamUser[];
const mockServiceUsersInternal = serviceUsersData as ServiceUser[];
const mockRotaShiftTemplatesInternal = rotaTemplatesData as RotaShiftTemplate[];

export const mockTeamUsers: TeamUser[] = mockTeamUsersInternal;
export const mockServiceUsers: ServiceUser[] = mockServiceUsersInternal;
export const mockRotaShiftTemplates: RotaShiftTemplate[] = mockRotaShiftTemplatesInternal;

function dateOnly(value: Date): string {
  return value.toISOString().split("T")[0];
}

function mondayOfWeek(value: Date): Date {
  const next = new Date(value);
  const day = next.getDay();
  const diff = next.getDate() - day + (day === 0 ? -6 : 1);
  next.setDate(diff);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function buildMockRotaShifts(referenceDate: Date = new Date()): RotaShift[] {
  const weekStart = mondayOfWeek(referenceDate);

  return mockRotaShiftTemplates.map((entry) => {
    const shiftDate = new Date(weekStart);
    shiftDate.setDate(weekStart.getDate() + entry.dayOffset);

    return {
      id: entry.id,
      date: dateOnly(shiftDate),
      start: entry.start,
      end: entry.end,
      location: entry.location,
      type: entry.type,
      status: entry.status,
      employeeId: entry.employeeId,
      serviceUserId: entry.serviceUserId,
      comments: entry.comments,
      colorCode: entry.colorCode
    };
  });
}

export const mockRotaShifts: RotaShift[] = buildMockRotaShifts();
