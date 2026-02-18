import {
  buildMockRotaShifts,
  mockServiceUsers,
  mockTeamUsers,
  type RotaShift,
  type ServiceUser,
  type TeamUser
} from "../mock/store";

type ApiEnvelope<T> = {
  data?: T;
};

const DB_API_BASE = import.meta.env.VITE_DB_API_BASE ?? "/api/db";
const DATA_SOURCE_MODE = (import.meta.env.VITE_DATA_SOURCE ?? "auto") as "auto" | "db" | "mock";

function shouldUseMockData(): boolean {
  return DATA_SOURCE_MODE === "mock";
}

async function readApi<T>(path: string): Promise<T | null> {
  if (shouldUseMockData()) {
    return null;
  }

  try {
    const response = await fetch(`${DB_API_BASE}${path}`);

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as ApiEnvelope<T>;
    return payload.data ?? null;
  } catch {
    return null;
  }
}

function normalizeRotaShift(entry: RotaShift): RotaShift {
  return {
    ...entry,
    date: entry.date.includes("T") ? entry.date.split("T")[0] : entry.date
  };
}

export async function loadTeamUsers(): Promise<TeamUser[]> {
  const users = await readApi<TeamUser[]>("/users");
  return users && users.length > 0 ? users : mockTeamUsers;
}

export async function loadServiceUsers(): Promise<ServiceUser[]> {
  const users = await readApi<ServiceUser[]>("/service-users");
  return users && users.length > 0 ? users : mockServiceUsers;
}

export async function loadRotaShifts(): Promise<RotaShift[]> {
  const shifts = await readApi<RotaShift[]>("/rota-shifts");

  if (!shifts || shifts.length === 0) {
    return buildMockRotaShifts();
  }

  return shifts.map(normalizeRotaShift);
}
