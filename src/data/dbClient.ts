import {
  buildMockRotaShifts,
  mockServiceUsers,
  mockTeamUsers,
  type RotaShift,
  type ServiceUser,
  type TeamUser,
  type TeamUserRole,
  type TeamUserStatus
} from "../mock/store";
import { getAppSessionToken } from "../auth/appSession";

type ApiEnvelope<T> = {
  data?: T;
  error?: string;
  skippedInUse?: Array<{ name: string; count: number }>;
};

const DB_API_BASE = import.meta.env.VITE_DB_API_BASE ?? "/api/db";
const DATA_SOURCE_MODE = (import.meta.env.VITE_DATA_SOURCE ?? "auto") as "auto" | "db" | "mock";
const TEAM_STORE_KEY = "halo-team-overrides";
const TEAM_ROLES_KEY = "halo-team-roles";
const TEAM_AVATARS_KEY = "halo-team-avatars";

function shouldUseMockData(): boolean {
  return DATA_SOURCE_MODE === "mock";
}

function readTeamOverrides(): TeamUser[] {
  try {
    const raw = localStorage.getItem(TEAM_STORE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as TeamUser[]) : [];
  } catch {
    return [];
  }
}

function writeTeamOverrides(overrides: TeamUser[]) {
  localStorage.setItem(TEAM_STORE_KEY, JSON.stringify(overrides));
}

function readTeamRoles(): string[] {
  try {
    const raw = localStorage.getItem(TEAM_ROLES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

function writeTeamRoles(roles: string[]) {
  localStorage.setItem(TEAM_ROLES_KEY, JSON.stringify(roles));
}

function readTeamAvatars(): Record<string, string> {
  try {
    const raw = localStorage.getItem(TEAM_AVATARS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function writeTeamAvatars(avatars: Record<string, string>): void {
  localStorage.setItem(TEAM_AVATARS_KEY, JSON.stringify(avatars));
}

function mergeAvatar(user: TeamUser, avatars: Record<string, string>): TeamUser {
  const avatarUrl = avatars[user.id] || user.avatarUrl;
  return avatarUrl ? { ...user, avatarUrl } : user;
}

function uniqueSorted(values: string[]): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => value.trim())
        .filter(Boolean)
    )
  ).sort((left, right) => left.localeCompare(right));
}

async function readApi<T>(path: string): Promise<T | null> {
  if (shouldUseMockData()) {
    return null;
  }

  try {
    const token = getAppSessionToken();
    const response = await fetch(`${DB_API_BASE}${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as ApiEnvelope<T>;
    return payload.data ?? null;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Request failed");
  }
}

async function writeApi<T>(
  path: string,
  method: "PUT" | "POST" | "DELETE",
  body?: unknown
): Promise<ApiEnvelope<T> | null> {
  if (shouldUseMockData()) {
    return null;
  }

  try {
    const token = getAppSessionToken();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const init: RequestInit = {
      method,
      headers
    };

    if (body !== undefined) {
      init.body = JSON.stringify(body);
    }

    const response = await fetch(`${DB_API_BASE}${path}`, init);

    const payload = (await response.json()) as ApiEnvelope<T>;
    if (!response.ok) {
      throw new Error(payload.error || `Request failed (${response.status})`);
    }

    return payload;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Request failed");
  }
}

function normalizeRotaShift(entry: RotaShift): RotaShift {
  return {
    ...entry,
    date: entry.date.includes("T") ? entry.date.split("T")[0] : entry.date
  };
}

export async function loadTeamUsers(): Promise<TeamUser[]> {
  const token = getAppSessionToken();
  if (token) {
    const companyUsers = await readApi<TeamUser[]>("/company-users");
    const baseRaw = companyUsers ?? [];
    const base = baseRaw.map((u) => ({
      ...u,
      isLineManager: Boolean(u.isLineManager)
    }));
    const overrides = readTeamOverrides();
    const baseIds = new Set(base.map((u) => u.id));
    const matchingOverrides = overrides.filter((o) => baseIds.has(o.id));
    if (matchingOverrides.length !== overrides.length) {
      writeTeamOverrides(matchingOverrides);
    }

    const merged = base.map((u) => {
      const override = matchingOverrides.find((o) => o.id === u.id);
      return override ? { ...u, ...override } : u;
    });
    return merged;
  }

  const [users, lineManagersApi] = await Promise.all([
    readApi<TeamUser[]>("/users"),
    readApi<string[]>("/line-managers")
  ]);
  const baseRaw = users && users.length > 0 ? users : mockTeamUsers;
  const base = baseRaw.map((u) => ({
    ...u,
    isLineManager: Boolean(u.isLineManager)
  }));

  const overrides = readTeamOverrides();
  const merged = base.map((u) => {
    const override = overrides.find((o) => o.id === u.id);
    return override ? { ...u, ...override } : u;
  });

  const existingNames = new Set(merged.map((u) => u.name));
  const lineManagers = Array.from(
    new Set([
      ...base.map((u) => u.lineManager).filter(Boolean),
      ...merged.filter((u) => u.isLineManager).map((u) => u.name),
      ...(lineManagersApi || [])
    ])
  );
  const missingManagers = lineManagers
    .filter((name) => !existingNames.has(name))
    .map((name, idx) => ({
      id: `lm-${idx}-${name.replace(/\s+/g, "-").toLowerCase()}`,
      name,
      role: "Line Manager",
      status: "active",
      lineManager: name,
      email: `${name.toLowerCase().replace(/[^a-z]/g, ".")}@halo.mock`,
      phone: `+44 20 7000 12${(idx + 1).toString().padStart(2, "0")}`,
      isLineManager: true
    })) as TeamUser[];

  const overridesWithoutBase = overrides
    .filter((o) => !merged.find((b) => b.id === o.id))
    .map((o) => ({
      ...o,
      isLineManager: Boolean(o.isLineManager)
    })) as TeamUser[];

  const avatars = readTeamAvatars();
  return [...merged, ...overridesWithoutBase, ...missingManagers].map((user) => mergeAvatar(user, avatars));
}

export async function findTeamUser(id: string): Promise<TeamUser | null> {
  const all = await loadTeamUsers();
  return all.find((u) => u.id === id) ?? null;
}

export async function createTeamUser(input: Partial<TeamUser>): Promise<TeamUser> {
  const id = input.id ?? `tm-${Date.now()}`;
  const payload: TeamUser = {
    id,
    name: input.name || "New Team Member",
    role: (input.role as TeamUserRole) || "Carer",
    status: (input.status as TeamUserStatus) || "active",
    lineManager: input.lineManager || "",
    email: input.email || "",
    phone: input.phone || "",
    avatarUrl: input.avatarUrl,
    isLineManager: Boolean(input.isLineManager)
  };

  const token = getAppSessionToken();
  const apiPath = token ? "/company-users" : "/users";
  const apiSaved = await writeApi<TeamUser>(apiPath, "POST", payload);

  if (token && !apiSaved?.data) {
    throw new Error("Unable to create user in company database.");
  }

  const saved = apiSaved?.data ?? payload;
  if (!token && saved.avatarUrl) {
    const avatars = readTeamAvatars();
    avatars[saved.id] = saved.avatarUrl;
    writeTeamAvatars(avatars);
  }
  if (!token) {
    const overrides = readTeamOverrides();
    const without = overrides.filter((o) => o.id !== saved.id);
    writeTeamOverrides([...without, saved]);
  }

  return saved;
}

export async function updateTeamUser(updated: TeamUser): Promise<TeamUser> {
  const normalized: TeamUser = {
    ...updated,
    isLineManager: Boolean(updated.isLineManager)
  };
  const token = getAppSessionToken();
  const apiPath = token
    ? `/company-users/${encodeURIComponent(normalized.id)}`
    : `/users/${encodeURIComponent(normalized.id)}`;
  const result = await writeApi<TeamUser>(apiPath, "PUT", normalized);

  if (token && !result?.data) {
    throw new Error("Unable to save user changes in company database.");
  }

  if (!token) {
    const overrides = readTeamOverrides();
    const nextOverrides = (() => {
      const existingIndex = overrides.findIndex((o) => o.id === normalized.id);
      if (existingIndex >= 0) {
        const copy = [...overrides];
        copy[existingIndex] = normalized;
        return copy;
      }
      return [...overrides, normalized];
    })();

    writeTeamOverrides(nextOverrides);
  }
  const saved = result?.data ?? normalized;
  if (!token && saved.avatarUrl) {
    const avatars = readTeamAvatars();
    avatars[saved.id] = saved.avatarUrl;
    writeTeamAvatars(avatars);
  }
  return saved;
}

export async function deleteTeamUser(id: string): Promise<boolean> {
  const normalizedId = id.trim();
  if (!normalizedId) {
    return false;
  }

  const result = await writeApi<null>(`/users/${encodeURIComponent(normalizedId)}`, "DELETE");

  const nextOverrides = readTeamOverrides().filter((entry) => entry.id !== normalizedId);
  writeTeamOverrides(nextOverrides);

  return result !== null;
}

export async function inviteTeamUser(id: string): Promise<void> {
  const token = getAppSessionToken();
  if (!token) {
    throw new Error("You must be signed in to send invites.");
  }

  const normalizedId = id.trim();
  if (!normalizedId) {
    throw new Error("Invalid user id.");
  }

  await writeApi<{ email: string }>(`/company-users/${encodeURIComponent(normalizedId)}/invite`, "POST");
}

export async function loadServiceUsers(): Promise<ServiceUser[]> {
  const token = getAppSessionToken();
  const users = await readApi<ServiceUser[]>("/service-users");
  if (token) {
    return users ?? [];
  }
  return users && users.length > 0 ? users : mockServiceUsers;
}

export async function createServiceUser(input: {
  firstName: string;
  lastName: string;
  clientType?: string;
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
  activeStatus?: boolean;
  dischargeDate?: string;
}): Promise<ServiceUser> {
  const token = getAppSessionToken();
  if (!token) {
    throw new Error("You must be signed in to create service users.");
  }

  const payload = {
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    clientType: (input.clientType || "Community").trim(),
    dateOfBirth: (input.dateOfBirth || "").trim(),
    gender: (input.gender || "").trim(),
    email: (input.email || "").trim(),
    phone: (input.phone || "").trim(),
    mobilePhone: (input.mobilePhone || "").trim(),
    address: (input.address || "").trim(),
    nhsNumber: (input.nhsNumber || "").trim(),
    gpDetails: (input.gpDetails || "").trim(),
    riskLevel: (input.riskLevel || "Low").trim(),
    fundingSource: (input.fundingSource || "").trim(),
    activeStatus: input.activeStatus ?? true,
    dischargeDate: (input.dischargeDate || "").trim()
  };

  if (!payload.firstName || !payload.lastName) {
    throw new Error("First name and last name are required.");
  }

  const result = await writeApi<ServiceUser>("/service-users", "POST", payload);
  if (!result?.data) {
    throw new Error("Unable to create service user.");
  }
  return result.data;
}

export async function updateServiceUser(
  id: string,
  input: {
    clientType?: string;
    activeStatus?: boolean;
    dischargeDate?: string;
    keyWorker?: string;
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
  }
): Promise<ServiceUser> {
  const token = getAppSessionToken();
  if (!token) {
    throw new Error("You must be signed in to update service users.");
  }

  const payload = {
    clientType: input.clientType?.trim(),
    activeStatus: input.activeStatus,
    dischargeDate: input.dischargeDate?.trim(),
    keyWorker: input.keyWorker?.trim(),
    firstName: input.firstName?.trim(),
    lastName: input.lastName?.trim(),
    dateOfBirth: input.dateOfBirth?.trim(),
    gender: input.gender?.trim(),
    email: input.email?.trim(),
    phone: input.phone?.trim(),
    mobilePhone: input.mobilePhone?.trim(),
    address: input.address?.trim(),
    nhsNumber: input.nhsNumber?.trim(),
    gpDetails: input.gpDetails?.trim(),
    riskLevel: input.riskLevel?.trim(),
    fundingSource: input.fundingSource?.trim(),
    preferredName: input.preferredName?.trim(),
    maritalStatus: input.maritalStatus?.trim(),
    birthplace: input.birthplace?.trim(),
    nationality: input.nationality?.trim(),
    languagesSpoken: input.languagesSpoken?.trim(),
    ethnicity: input.ethnicity?.trim(),
    religion: input.religion?.trim(),
    carerGenderPreference: input.carerGenderPreference?.trim(),
    carerNote: input.carerNote?.trim(),
    emergencyContactName: input.emergencyContactName?.trim(),
    emergencyContactPhone: input.emergencyContactPhone?.trim(),
    emergencyContactRelation: input.emergencyContactRelation?.trim(),
    preferredContactMethod: input.preferredContactMethod?.trim()
  };

  const result = await writeApi<ServiceUser>(`/service-users/${encodeURIComponent(id)}`, "PUT", payload);
  if (!result?.data) {
    throw new Error("Unable to update service user.");
  }
  return result.data;
}

export async function loadRotaShifts(): Promise<RotaShift[]> {
  const shifts = await readApi<RotaShift[]>("/rota-shifts");

  if (!shifts || shifts.length === 0) {
    return buildMockRotaShifts();
  }

  return shifts.map(normalizeRotaShift);
}

export async function loadTeamRoles(): Promise<string[]> {
  const apiRoles = await readApi<string[]>("/roles");
  if (apiRoles && apiRoles.length > 0) {
    writeTeamRoles(uniqueSorted(apiRoles));
    return uniqueSorted(apiRoles);
  }

  const overrides = readTeamRoles();
  if (overrides.length > 0) return overrides;

  const baseRoles = uniqueSorted((await loadTeamUsers()).map((u) => u.role));
  return baseRoles;
}

export async function saveTeamRoles(roles: string[]): Promise<void> {
  const unique = uniqueSorted(roles);
  const result = await writeApi<string[]>("/roles", "POST", { roles: unique });
  writeTeamRoles(result?.data ? uniqueSorted(result.data) : unique);
}

export async function loadLineManagers(): Promise<string[]> {
  const apiLineManagers = await readApi<string[]>("/line-managers");
  if (apiLineManagers && apiLineManagers.length > 0) {
    return uniqueSorted(apiLineManagers);
  }

  const users = await loadTeamUsers();
  return uniqueSorted([
    ...users.map((user) => user.lineManager),
    ...users.filter((user) => user.isLineManager).map((user) => user.name)
  ]);
}

export async function createTeamRole(name: string): Promise<string | null> {
  const normalized = name.trim();
  if (!normalized) {
    return null;
  }

  const result = await writeApi<string>("/roles", "POST", { name: normalized });
  return result?.data ?? null;
}

export async function updateTeamRole(currentName: string, nextName: string): Promise<string | null> {
  const from = currentName.trim();
  const to = nextName.trim();

  if (!from || !to) {
    return null;
  }

  const result = await writeApi<string>(`/roles/${encodeURIComponent(from)}`, "PUT", { name: to });
  return result?.data ?? null;
}

export async function deleteTeamRole(name: string): Promise<boolean> {
  const normalized = name.trim();
  if (!normalized) {
    return false;
  }

  const result = await writeApi<null>(`/roles/${encodeURIComponent(normalized)}`, "DELETE");
  return result !== null;
}
