import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { loadRotaShifts, loadServiceUsers, loadTeamUsers } from '../data/dbClient';
import {
  buildMockRotaShifts,
  mockServiceUsers,
  mockTeamUsers,
  type RotaShift as MockRotaShift,
  type ServiceUser,
  type TeamUser
} from '../mock/store';

export type EmployeeAvailability = 'Available' | 'Sick' | 'Unavailable';
export type EmployeeNoteType = Exclude<EmployeeAvailability, 'Available'> | 'ExtraShift';

export type EmployeeNote = {
  NoteID: number;
  CreatedAt: string;
  Type: EmployeeNoteType;
  Text: string;
};

export type Employee = {
  EmployeeID: number;
  FirstName: string;
  LastName: string;
  JobTitle?: string;
  Email?: string;
  LocationID?: number;
  Availability: EmployeeAvailability;
  Notes: EmployeeNote[];
  IsActive: boolean;
};

export type PWS = {
  PwsID: number;
  FirstName: string;
  LastName: string;
  LocationID: number;
  ContractedHours: number;
  IsActive: boolean;
};

export type Location = {
  LocationID: number;
  LocationName: string;
  Address?: string;
  ContactNumber?: string;
  ColorCode?: string;
  IsActive: boolean;
};

export type Shift = {
  RotaID: number;
  EmployeeID?: number;
  LocationID: number;
  ShiftDate: string;
  StartTime: string;
  EndTime: string;
  ShiftType: 'Background' | 'PWS';
  ShiftStatus: 'Assigned' | 'Open';
  IsExtraShift?: boolean;
  PwsID?: number;
  Comments?: string;
  PwsComments?: string;
  ColorCode?: string;
};

export type MissedShift = {
  MissedShiftID: number;
  RotaID: number;
  EmployeeID: number;
  ShiftDate: string;
  StartTime: string;
  EndTime: string;
  LocationID: number;
  ShiftType: 'Background' | 'PWS';
  PwsID?: number;
  Reason: Exclude<EmployeeAvailability, 'Available'>;
  NoteText: string;
  CreatedAt: string;
};

type RotaDataContextValue = {
  employees: Employee[];
  pws: PWS[];
  locations: Location[];
  shifts: Shift[];
  missedShifts: MissedShift[];
  updateEmployee: (id: number, updates: Partial<Employee>) => void;
  markEmployeeUnavailable: (
    id: number,
    availability: Exclude<EmployeeAvailability, 'Available'>,
    noteText: string,
    shiftId: number
  ) => void;
  markShiftOpen: (id: number, reason?: string) => void;
  addShift: (shift: Shift) => void;
  updateShift: (id: number, updates: Partial<Shift>) => void;
  deleteShift: (id: number) => void;
  addLocation: (location: Location) => void;
  updateLocation: (id: number, updates: Partial<Location>) => void;
  deleteLocation: (id: number) => void;
};

const RotaDataContext = createContext<RotaDataContextValue | undefined>(undefined);

const seedLocations: Location[] = [
  {
    LocationID: 1,
    LocationName: 'North Team',
    Address: '12 Maple Street',
    ContactNumber: '0207 111 2233',
    ColorCode: '#3b82f6',
    IsActive: true
  },
  {
    LocationID: 2,
    LocationName: 'South Team',
    Address: '88 River Road',
    ContactNumber: '0207 222 3344',
    ColorCode: '#10b981',
    IsActive: true
  },
  {
    LocationID: 3,
    LocationName: 'Central Team',
    Address: '5 Church Lane',
    ContactNumber: '0207 333 4455',
    ColorCode: '#8b5cf6',
    IsActive: true
  }
];

const locationNameToId: Record<string, number> = {
  'North Team': 1,
  'South Team': 2,
  'Central Team': 3
};

const zoneToLocationId: Record<string, number> = {
  Maple: 1,
  Harbor: 2,
  Cedar: 3,
  Orchard: 1,
  Orbit: 2
};

const lineManagerToLocationId: Record<string, number> = {
  'S. Patel': 1,
  'L. Mercer': 2,
  'R. Collins': 3
};

function splitName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(' ').filter(Boolean);
  const firstName = parts[0] ?? 'Unknown';
  const lastName = parts.slice(1).join(' ') || 'User';
  return { firstName, lastName };
}

function roleToJobTitle(role: TeamUser['role']): string {
  switch (role) {
    case 'Senior Carer':
      return 'Senior Support Worker';
    case 'Safeguarding Officer':
      return 'Safeguarding Officer';
    case 'Admin':
      return 'Admin Coordinator';
    default:
      return 'Support Worker';
  }
}

function buildSeedEmployees(users: TeamUser[] = mockTeamUsers): Employee[] {
  return users.map((user, index) => {
    const names = splitName(user.name);

    return {
      EmployeeID: index + 1,
      FirstName: names.firstName,
      LastName: names.lastName,
      JobTitle: roleToJobTitle(user.role),
      Email: user.email,
      LocationID: lineManagerToLocationId[user.lineManager] ?? ((index % 3) + 1),
      Availability: user.status === 'inactive' ? 'Unavailable' : 'Available',
      Notes: [],
      IsActive: user.status === 'active'
    };
  });
}

function buildSeedPws(serviceUsers: ServiceUser[] = mockServiceUsers): PWS[] {
  return serviceUsers.slice(0, 3).map((user, index) => {
    const names = splitName(user.name);

    return {
      PwsID: index + 1,
      FirstName: names.firstName,
      LastName: names.lastName,
      LocationID: zoneToLocationId[user.zone] ?? ((index % 3) + 1),
      ContractedHours: 24 + (index * 4),
      IsActive: user.status !== 'discharged'
    };
  });
}

function buildSeedShifts(
  rotaShifts: MockRotaShift[] = buildMockRotaShifts(),
  users: TeamUser[] = mockTeamUsers,
  serviceUsers: ServiceUser[] = mockServiceUsers
): Shift[] {
  const employeeIdMap = new Map(users.map((user, index) => [user.id, index + 1]));
  const pwsIdMap = new Map(serviceUsers.map((serviceUser, index) => [serviceUser.id, index + 1]));

  return rotaShifts.map((shift, index) => {
    const isPws = shift.type === 'PWS';
    return {
      RotaID: index + 1,
      EmployeeID: shift.employeeId ? employeeIdMap.get(shift.employeeId) : undefined,
      LocationID: locationNameToId[shift.location] ?? 1,
      ShiftDate: shift.date,
      StartTime: shift.start,
      EndTime: shift.end,
      ShiftType: shift.type,
      ShiftStatus: shift.status,
      PwsID: shift.serviceUserId ? pwsIdMap.get(shift.serviceUserId) : undefined,
      Comments: isPws ? undefined : shift.comments,
      PwsComments: isPws ? shift.comments : undefined,
      ColorCode: shift.colorCode
    }
  });
}

function getNextId<T>(items: T[], read: (item: T) => number): number {
  if (items.length === 0) {
    return 1;
  }

  return Math.max(...items.map((item) => read(item))) + 1;
}

export function RotaDataProvider({ children }: { children: ReactNode }) {
  const [employees, setEmployees] = useState<Employee[]>(() => buildSeedEmployees());
  const [pws, setPws] = useState<PWS[]>(() => buildSeedPws());
  const [locations, setLocations] = useState<Location[]>(seedLocations);
  const [shifts, setShifts] = useState<Shift[]>(() => buildSeedShifts());
  const [missedShifts, setMissedShifts] = useState<MissedShift[]>([]);

  useEffect(() => {
    let isCancelled = false;

    Promise.all([loadTeamUsers(), loadServiceUsers(), loadRotaShifts()]).then(
      ([teamUsers, serviceUsers, rotaShifts]) => {
        if (isCancelled) {
          return;
        }

        setEmployees(buildSeedEmployees(teamUsers));
        setPws(buildSeedPws(serviceUsers));
        setShifts(buildSeedShifts(rotaShifts, teamUsers, serviceUsers));
      }
    );

    return () => {
      isCancelled = true;
    };
  }, []);

  const noteTimestamp = (): string => new Date().toISOString();

  const updateEmployee = (id: number, updates: Partial<Employee>) => {
    setEmployees((current) =>
      current.map((item) => (item.EmployeeID === id ? { ...item, ...updates } : item))
    );
  };

  const markEmployeeUnavailable = (
    id: number,
    availability: Exclude<EmployeeAvailability, 'Available'>,
    noteText: string,
    shiftId: number
  ) => {
    const trimmedNote = noteText.trim();
    const shiftToMiss = shifts.find((item) => item.RotaID === shiftId && item.EmployeeID === id);

    setEmployees((current) =>
      current.map((item) => {
        if (item.EmployeeID !== id) {
          return item;
        }

        return {
          ...item,
          Availability: availability,
          Notes: [
            ...item.Notes,
            {
              NoteID: getNextId(item.Notes, (note) => note.NoteID),
              CreatedAt: noteTimestamp(),
              Type: availability,
              Text: trimmedNote
            }
          ]
        };
      })
    );

    if (shiftToMiss) {
      setMissedShifts((current) => [
        ...current,
        {
          MissedShiftID: getNextId(current, (item) => item.MissedShiftID),
          RotaID: shiftToMiss.RotaID,
          EmployeeID: id,
          ShiftDate: shiftToMiss.ShiftDate,
          StartTime: shiftToMiss.StartTime,
          EndTime: shiftToMiss.EndTime,
          LocationID: shiftToMiss.LocationID,
          ShiftType: shiftToMiss.ShiftType,
          PwsID: shiftToMiss.PwsID,
          Reason: availability,
          NoteText: trimmedNote,
          CreatedAt: noteTimestamp()
        }
      ]);
    }

    setShifts((current) =>
      current.map((item) => {
        if (item.RotaID !== shiftId || item.EmployeeID !== id) {
          return item;
        }

        const reasonPrefix = availability === 'Sick' ? 'Employee marked sick' : 'Employee unavailable';
        const reason = `${reasonPrefix}: ${trimmedNote}`;

        return {
          ...item,
          EmployeeID: undefined,
          ShiftStatus: 'Open',
          IsExtraShift: false,
          ColorCode: '#ef4444',
          Comments: item.Comments ? `${item.Comments} | ${reason}` : reason
        };
      })
    );
  };

  const markShiftOpen = (id: number, reason?: string) => {
    setShifts((current) =>
      current.map((item) => {
        if (item.RotaID !== id) {
          return item;
        }

        const trimmedReason = reason?.trim();
        const shiftComment = trimmedReason
          ? item.Comments
            ? `${item.Comments} | Open: ${trimmedReason}`
            : `Open: ${trimmedReason}`
          : item.Comments;

        return {
          ...item,
          EmployeeID: undefined,
          ShiftStatus: 'Open',
          IsExtraShift: false,
          ColorCode: '#ef4444',
          Comments: shiftComment
        };
      })
    );
  };

  const addShift = (shift: Shift) => {
    const isOpen = shift.ShiftStatus === 'Open' || !shift.EmployeeID;
    setShifts((current) => [
      ...current,
      {
        ...shift,
        EmployeeID: isOpen ? undefined : shift.EmployeeID,
        ShiftStatus: isOpen ? 'Open' : 'Assigned',
        IsExtraShift: shift.IsExtraShift ?? false,
        RotaID: getNextId(current, (item) => item.RotaID),
        ColorCode: isOpen
          ? '#ef4444'
          : shift.ColorCode ?? (shift.ShiftType === 'PWS' ? '#8b5cf6' : '#3b82f6')
      }
    ]);
  };

  const updateShift = (id: number, updates: Partial<Shift>) => {
    setShifts((current) =>
      current.map((item) => {
        if (item.RotaID !== id) {
          return item;
        }

        const wasOpen = item.ShiftStatus === 'Open' || !item.EmployeeID;
        const next: Shift = { ...item, ...updates };

        if (next.ShiftStatus === 'Open' || !next.EmployeeID) {
          next.ShiftStatus = 'Open';
          next.EmployeeID = undefined;
          next.IsExtraShift = false;
          next.ColorCode = '#ef4444';
          return next;
        }

        next.ShiftStatus = 'Assigned';
        if (!next.ColorCode || next.ColorCode === '#ef4444') {
          next.ColorCode = next.ShiftType === 'PWS' ? '#8b5cf6' : '#3b82f6';
        }

        if (wasOpen && next.EmployeeID) {
          const locationName =
            locations.find((location) => location.LocationID === next.LocationID)?.LocationName || 'Unknown location';
          const dateLabel = new Date(next.ShiftDate).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          });

          const extraShiftText = `Extra shift assigned: ${dateLabel} ${next.StartTime.slice(0, 5)}-${next.EndTime.slice(0, 5)} at ${locationName}`;

          setEmployees((employeeCurrent) =>
            employeeCurrent.map((employee) => {
              if (employee.EmployeeID !== next.EmployeeID) {
                return employee;
              }

              return {
                ...employee,
                Notes: [
                  ...employee.Notes,
                  {
                    NoteID: getNextId(employee.Notes, (note) => note.NoteID),
                    CreatedAt: noteTimestamp(),
                    Type: 'ExtraShift',
                    Text: extraShiftText
                  }
                ]
              };
            })
          );

          next.IsExtraShift = true;
        }

        return next;
      })
    );
  };

  const deleteShift = (id: number) => {
    setShifts((current) => current.filter((item) => item.RotaID !== id));
  };

  const addLocation = (location: Location) => {
    setLocations((current) => [
      ...current,
      {
        ...location,
        LocationID: getNextId(current, (item) => item.LocationID)
      }
    ]);
  };

  const updateLocation = (id: number, updates: Partial<Location>) => {
    setLocations((current) =>
      current.map((item) => (item.LocationID === id ? { ...item, ...updates } : item))
    );
  };

  const deleteLocation = (id: number) => {
    setLocations((current) => current.filter((item) => item.LocationID !== id));
  };

  const value = useMemo<RotaDataContextValue>(
    () => ({
      employees,
      pws,
      locations,
      shifts,
      missedShifts,
      updateEmployee,
      markEmployeeUnavailable,
      markShiftOpen,
      addShift,
      updateShift,
      deleteShift,
      addLocation,
      updateLocation,
      deleteLocation
    }),
    [employees, pws, locations, shifts, missedShifts]
  );

  return <RotaDataContext.Provider value={value}>{children}</RotaDataContext.Provider>;
}

export function useRotaData(): RotaDataContextValue {
  const context = useContext(RotaDataContext);
  if (!context) {
    throw new Error('useRotaData must be used within a RotaDataProvider');
  }
  return context;
}
