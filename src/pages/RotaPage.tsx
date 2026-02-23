import { useMemo, useState, type DragEvent } from 'react';
import { useRotaData, type EmployeeAvailability, type Shift } from '../rota/RotaDataContext';
import './rotaLocations.css';

const ChevronLeftIcon = () => <svg style={{ width: '20px', height: '20px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>;
const ChevronRightIcon = () => <svg style={{ width: '20px', height: '20px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>;
const PlusIcon = () => <svg style={{ width: '16px', height: '16px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>;
const CopyIcon = () => <svg style={{ width: '16px', height: '16px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;
const ClipboardIcon = () => <svg style={{ width: '16px', height: '16px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>;
const CalendarIcon = () => <svg style={{ width: '16px', height: '16px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const GridIcon = () => <svg style={{ width: '16px', height: '16px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 12a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1v-7z" /></svg>;
const DayIcon = () => <svg style={{ width: '16px', height: '16px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 6h8M8 12h8M8 18h8M4 6h.01M4 12h.01M4 18h.01" /></svg>;
const CloseIcon = () => <svg style={{ width: '20px', height: '20px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
const SearchIcon = () => <svg style={{ width: '18px', height: '18px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;

type ViewMode = 'week' | 'month' | 'day';
type ShiftTypeFilter = 'All' | 'Background' | 'PWS' | 'Open';

function toDateOnly(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getDaysInMonth(date: Date): Date[] {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const startDate = getWeekStart(firstDay);
  const days: Date[] = [];
  const currentDate = new Date(startDate);

  for (let i = 0; i < 42; i += 1) {
    days.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return days;
}

function formatTime(time: string): string {
  return time.slice(0, 5);
}

export default function RotaPage(): JSX.Element {
  const {
    employees,
    pws,
    locations,
    shifts,
    missedShifts,
    addShift,
    updateShift,
    deleteShift,
    markShiftOpen,
    markEmployeeUnavailable
  } = useRotaData();

  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getWeekStart(new Date()));
  const [currentMonthStart, setCurrentMonthStart] = useState<Date>(getMonthStart(new Date()));
  const [currentDay, setCurrentDay] = useState<Date>(new Date());

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [draggedShift, setDraggedShift] = useState<Shift | null>(null);
  const [copiedWeek, setCopiedWeek] = useState<Shift[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterEmployee, setFilterEmployee] = useState<number>(0);
  const [filterPWS, setFilterPWS] = useState<number>(0);
  const [filterShiftType, setFilterShiftType] = useState<ShiftTypeFilter>('All');

  const [formData, setFormData] = useState({
    EmployeeID: 0,
    LocationID: 0,
    ShiftDate: toDateOnly(new Date()),
    StartTime: '09:00',
    EndTime: '17:00',
    ShiftType: 'Background' as 'Background' | 'PWS',
    ShiftStatus: 'Assigned' as 'Assigned' | 'Open',
    PwsID: 0,
    Comments: '',
    PwsComments: ''
  });

  const isOpenShift = (shift: Shift) => shift.ShiftStatus === 'Open' || !shift.EmployeeID;

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(currentWeekStart);
      day.setDate(currentWeekStart.getDate() + i);
      return day;
    });
  }, [currentWeekStart]);

  const monthDays = useMemo(() => getDaysInMonth(currentMonthStart), [currentMonthStart]);

  const getLocationName = (locationId: number) => {
    const location = locations.find((item) => item.LocationID === locationId);
    return location ? location.LocationName : 'Unknown';
  };

  const getEmployeeName = (employeeId?: number) => {
    if (!employeeId) return 'Open shift';
    const employee = employees.find((item) => item.EmployeeID === employeeId);
    return employee ? `${employee.FirstName} ${employee.LastName}` : 'Unknown';
  };

  const filteredShifts = useMemo(() => {
    let filtered = [...shifts];

    if (filterEmployee) {
      filtered = filtered.filter((shift) => shift.EmployeeID === filterEmployee && !isOpenShift(shift));
    }

    if (filterPWS) {
      filtered = filtered.filter((shift) => shift.PwsID === filterPWS);
    }

    if (filterShiftType === 'Open') {
      filtered = filtered.filter((shift) => isOpenShift(shift));
    } else if (filterShiftType !== 'All') {
      filtered = filtered.filter((shift) => shift.ShiftType === filterShiftType);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((shift) => {
        const employee = employees.find((item) => item.EmployeeID === shift.EmployeeID);
        const employeeName = employee ? `${employee.FirstName} ${employee.LastName}`.toLowerCase() : '';
        const pwsPerson = shift.PwsID ? pws.find((item) => item.PwsID === shift.PwsID) : undefined;
        const pwsName = pwsPerson ? `${pwsPerson.FirstName} ${pwsPerson.LastName}`.toLowerCase() : '';
        const locationName = getLocationName(shift.LocationID).toLowerCase();
        const openLabel = isOpenShift(shift) ? 'open shift' : '';

        return (
          employeeName.includes(term) ||
          pwsName.includes(term) ||
          locationName.includes(term) ||
          openLabel.includes(term)
        );
      });
    }

    return filtered;
  }, [shifts, employees, pws, filterEmployee, filterPWS, filterShiftType, searchTerm]);

  const getShiftsForEmployeeDay = (employeeId: number, day: Date) => {
    const dayStr = toDateOnly(day);
    return filteredShifts.filter(
      (shift) =>
        shift.EmployeeID === employeeId &&
        !isOpenShift(shift) &&
        shift.ShiftDate.split('T')[0] === dayStr
    );
  };

  const getOpenShiftsForDay = (day: Date) => {
    const dayStr = toDateOnly(day);
    return filteredShifts.filter((shift) => isOpenShift(shift) && shift.ShiftDate.split('T')[0] === dayStr);
  };

  const getShiftsForDay = (day: Date) => {
    const dayStr = toDateOnly(day);
    return filteredShifts.filter((shift) => shift.ShiftDate.split('T')[0] === dayStr);
  };

  const getShiftsForLocationDay = (locationId: number, day: Date) => {
    const dayStr = toDateOnly(day);
    return filteredShifts.filter(
      (shift) => shift.LocationID === locationId && shift.ShiftDate.split('T')[0] === dayStr
    );
  };

  const getMissedShiftsForEmployeeDay = (employeeId: number, day: Date) => {
    if (filterShiftType === 'Open') {
      return [];
    }

    const dayStr = toDateOnly(day);
    let filtered = missedShifts.filter(
      (entry) => entry.EmployeeID === employeeId && entry.ShiftDate.split('T')[0] === dayStr
    );

    if (filterPWS) {
      filtered = filtered.filter((entry) => entry.PwsID === filterPWS);
    }

    if (filterShiftType !== 'All') {
      filtered = filtered.filter((entry) => entry.ShiftType === filterShiftType);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((entry) => {
        const locationName = getLocationName(entry.LocationID).toLowerCase();
        return locationName.includes(term) || entry.NoteText.toLowerCase().includes(term);
      });
    }

    return filtered;
  };

  const getMissedShiftsForLocationDay = (locationId: number, day: Date) => {
    if (filterShiftType === 'Open') {
      return [];
    }

    const dayStr = toDateOnly(day);
    let filtered = missedShifts.filter(
      (entry) => entry.LocationID === locationId && entry.ShiftDate.split('T')[0] === dayStr
    );

    if (filterEmployee) {
      filtered = filtered.filter((entry) => entry.EmployeeID === filterEmployee);
    }

    if (filterPWS) {
      filtered = filtered.filter((entry) => entry.PwsID === filterPWS);
    }

    if (filterShiftType !== 'All') {
      filtered = filtered.filter((entry) => entry.ShiftType === filterShiftType);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((entry) => {
        const employeeName = getEmployeeName(entry.EmployeeID).toLowerCase();
        const locationName = getLocationName(entry.LocationID).toLowerCase();
        return (
          employeeName.includes(term) ||
          locationName.includes(term) ||
          entry.Reason.toLowerCase().includes(term) ||
          entry.NoteText.toLowerCase().includes(term)
        );
      });
    }

    return filtered;
  };

  const getShiftsForWeek = () => {
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    return shifts.filter((shift) => {
      const shiftDate = new Date(shift.ShiftDate);
      return shiftDate >= currentWeekStart && shiftDate <= weekEnd;
    });
  };

  const getDisplayEmployees = () => {
    if (filterEmployee) {
      return employees.filter((employee) => employee.EmployeeID === filterEmployee && employee.IsActive);
    }
    return employees.filter((employee) => employee.IsActive);
  };

  const isToday = (day: Date) => day.toDateString() === new Date().toDateString();
  const isCurrentMonth = (day: Date) => day.getMonth() === currentMonthStart.getMonth();

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getAvatarColor = (index: number) => {
    const colors = [
      'linear-gradient(135deg, #e67e22, #d4681f)',
      'linear-gradient(135deg, #3b82f6, #2563eb)',
      'linear-gradient(135deg, #8b5cf6, #7c3aed)',
      'linear-gradient(135deg, #10b981, #059669)',
      'linear-gradient(135deg, #f59e0b, #d97706)',
      'linear-gradient(135deg, #ec4899, #db2777)'
    ];
    return colors[index % colors.length];
  };

  const previousWeek = () => {
    const next = new Date(currentWeekStart);
    next.setDate(next.getDate() - 7);
    setCurrentWeekStart(next);
  };

  const nextWeek = () => {
    const next = new Date(currentWeekStart);
    next.setDate(next.getDate() + 7);
    setCurrentWeekStart(next);
  };

  const previousMonth = () => {
    const next = new Date(currentMonthStart);
    next.setMonth(next.getMonth() - 1);
    setCurrentMonthStart(next);
  };

  const nextMonth = () => {
    const next = new Date(currentMonthStart);
    next.setMonth(next.getMonth() + 1);
    setCurrentMonthStart(next);
  };

  const previousDay = () => {
    const next = new Date(currentDay);
    next.setDate(next.getDate() - 1);
    setCurrentDay(next);
  };

  const nextDay = () => {
    const next = new Date(currentDay);
    next.setDate(next.getDate() + 1);
    setCurrentDay(next);
  };

  const goToToday = () => {
    const now = new Date();
    setCurrentWeekStart(getWeekStart(now));
    setCurrentMonthStart(getMonthStart(now));
    setCurrentDay(now);
  };

  const handleCopyWeek = () => {
    const weekShifts = getShiftsForWeek();
    setCopiedWeek(weekShifts);
    alert(`Copied ${weekShifts.length} shifts`);
  };

  const handlePasteWeek = () => {
    if (copiedWeek.length === 0) {
      alert('No copied shifts found');
      return;
    }

    const sortedCopiedWeek = [...copiedWeek].sort((a, b) => a.ShiftDate.localeCompare(b.ShiftDate));
    const sourceStart = new Date(sortedCopiedWeek[0].ShiftDate);
    const targetStart = new Date(currentWeekStart);
    const deltaDays = Math.floor((targetStart.getTime() - sourceStart.getTime()) / (1000 * 60 * 60 * 24));

    sortedCopiedWeek.forEach((shift) => {
      const originalDate = new Date(shift.ShiftDate);
      const nextDate = new Date(originalDate);
      nextDate.setDate(originalDate.getDate() + deltaDays);

      addShift({
        ...shift,
        RotaID: 0,
        ShiftDate: toDateOnly(nextDate)
      });
    });

    alert(`Pasted ${sortedCopiedWeek.length} shifts`);
  };

  const handleDragStart = (shift: Shift) => {
    setDraggedShift(shift);
  };

  const handleDragOver = (event: DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = (employeeId: number, day: Date) => {
    if (!draggedShift) return;

    updateShift(draggedShift.RotaID, {
      EmployeeID: employeeId || undefined,
      ShiftStatus: employeeId ? 'Assigned' : 'Open',
      ShiftDate: toDateOnly(day)
    });

    setDraggedShift(null);
  };

  const resetFormData = () => {
    setFormData({
      EmployeeID: 0,
      LocationID: 0,
      ShiftDate: toDateOnly(new Date()),
      StartTime: '09:00',
      EndTime: '17:00',
      ShiftType: 'Background',
      ShiftStatus: 'Assigned',
      PwsID: 0,
      Comments: '',
      PwsComments: ''
    });
  };

  const handleAddShift = () => {
    if (!formData.LocationID) {
      alert('Please select a location');
      return;
    }

    if (formData.ShiftStatus === 'Assigned' && !formData.EmployeeID) {
      alert('Please select an employee for assigned shifts');
      return;
    }

    if (formData.ShiftType === 'PWS' && !formData.PwsID) {
      alert('Please select a PWS');
      return;
    }

    addShift({
      RotaID: 0,
      EmployeeID: formData.ShiftStatus === 'Open' ? undefined : formData.EmployeeID,
      LocationID: formData.LocationID,
      ShiftDate: formData.ShiftDate,
      StartTime: formData.StartTime,
      EndTime: formData.EndTime,
      ShiftType: formData.ShiftType,
      ShiftStatus: formData.ShiftStatus,
      PwsID: formData.ShiftType === 'PWS' ? formData.PwsID : undefined,
      Comments: formData.Comments,
      PwsComments: formData.PwsComments,
      ColorCode: formData.ShiftStatus === 'Open' ? '#ef4444' : formData.ShiftType === 'PWS' ? '#8b5cf6' : '#3b82f6'
    });

    setShowAddModal(false);
    resetFormData();
  };

  const handleEditShift = () => {
    if (!selectedShift) return;

    updateShift(selectedShift.RotaID, {
      LocationID: selectedShift.LocationID,
      ShiftDate: selectedShift.ShiftDate,
      StartTime: selectedShift.StartTime,
      EndTime: selectedShift.EndTime,
      ShiftType: selectedShift.ShiftType,
      ShiftStatus: selectedShift.ShiftStatus,
      EmployeeID: selectedShift.ShiftStatus === 'Open' ? undefined : selectedShift.EmployeeID,
      PwsID: selectedShift.ShiftType === 'PWS' ? selectedShift.PwsID : undefined,
      Comments: selectedShift.Comments,
      PwsComments: selectedShift.PwsComments
    });

    setShowEditModal(false);
    setSelectedShift(null);
  };

  const handleDeleteShift = (shiftId: number) => {
    if (!window.confirm('Delete this shift?')) return;
    deleteShift(shiftId);
    if (showEditModal) {
      setShowEditModal(false);
      setSelectedShift(null);
    }
  };

  const openAddModal = (employeeId: number, date: Date, locationId?: number) => {
    setFormData((current) => ({
      ...current,
      EmployeeID: employeeId,
      ShiftStatus: employeeId ? 'Assigned' : 'Open',
      LocationID: locationId ?? current.LocationID,
      ShiftDate: toDateOnly(date)
    }));
    setShowAddModal(true);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterEmployee(0);
    setFilterPWS(0);
    setFilterShiftType('All');
  };

  const handleMarkShiftOpen = (shift: Shift) => {
    const reason = window.prompt('Optional reason for opening this shift:', '') ?? '';
    markShiftOpen(shift.RotaID, reason);
    if (showEditModal) {
      setShowEditModal(false);
      setSelectedShift(null);
    }
  };

  const handleMarkEmployeeUnavailable = (
    employeeId: number,
    shiftId: number,
    availability: Exclude<EmployeeAvailability, 'Available'>
  ) => {
    const note = window.prompt(`Add a note for this ${availability.toLowerCase()} status:`, '');
    if (note === null) return;
    if (!note.trim()) {
      alert('A note is required when marking sick/unavailable');
      return;
    }

    markEmployeeUnavailable(employeeId, availability, note, shiftId);
    alert('Employee note added and this shift moved to Open. Missed shift is now shown in grey.');

    if (showEditModal) {
      setShowEditModal(false);
      setSelectedShift(null);
    }
  };

  const getAvailabilityColor = (status: EmployeeAvailability) => {
    if (status === 'Sick') return '#ef4444';
    if (status === 'Unavailable') return '#f59e0b';
    return '#10b981';
  };

  const getHeaderDateLabel = () => {
    if (viewMode === 'week') {
      return currentWeekStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    }
    if (viewMode === 'month') {
      return currentMonthStart.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    }
    return currentDay.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const goPrevious = () => {
    if (viewMode === 'week') {
      previousWeek();
      return;
    }
    if (viewMode === 'month') {
      previousMonth();
      return;
    }
    previousDay();
  };

  const goNext = () => {
    if (viewMode === 'week') {
      nextWeek();
      return;
    }
    if (viewMode === 'month') {
      nextMonth();
      return;
    }
    nextDay();
  };

  const activeLocations = locations.filter((location) => location.IsActive);

  return (
    <section className="halo-rota-view">
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', padding: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 300px' }}>
          <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
            <SearchIcon />
          </div>
          <input type="text" placeholder="Search..." value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} className="input-field" style={{ paddingLeft: '40px' }} />
        </div>

        <select value={filterEmployee} onChange={(event) => setFilterEmployee(Number(event.target.value || 0))} className="input-field" style={{ minWidth: '150px' }}>
          <option value={0}>All Employees</option>
          {employees.filter((employee) => employee.IsActive).map((employee) => (
            <option key={employee.EmployeeID} value={employee.EmployeeID}>{employee.FirstName} {employee.LastName}</option>
          ))}
        </select>

        <select value={filterPWS} onChange={(event) => setFilterPWS(Number(event.target.value || 0))} className="input-field" style={{ minWidth: '150px' }}>
          <option value={0}>All PWS</option>
          {pws.filter((person) => person.IsActive).map((person) => (
            <option key={person.PwsID} value={person.PwsID}>{person.FirstName} {person.LastName}</option>
          ))}
        </select>

        <select value={filterShiftType} onChange={(event) => setFilterShiftType(event.target.value as ShiftTypeFilter)} className="input-field" style={{ minWidth: '150px' }}>
          <option value="All">All Types</option>
          <option value="Background">Background</option>
          <option value="PWS">PWS</option>
          <option value="Open">Open</option>
        </select>

        {(searchTerm || filterEmployee || filterPWS || filterShiftType !== 'All') && (
          <button onClick={clearFilters} className="btn-secondary">Clear</button>
        )}
      </div>

      <div className="schedule-header">
        <div className="schedule-controls">
          <button className="btn-secondary" onClick={goPrevious}><ChevronLeftIcon /></button>
          <div style={{ minWidth: '220px', textAlign: 'center' }}>
            <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>{getHeaderDateLabel()}</div>
          </div>
          <button className="btn-secondary" onClick={goNext}><ChevronRightIcon /></button>
          <button className="btn-secondary" onClick={goToToday}>Today</button>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button className="btn-secondary" onClick={handleCopyWeek}><CopyIcon /> Copy</button>
          <button className="btn-secondary" onClick={handlePasteWeek}><ClipboardIcon /> Paste</button>
          <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-elevated)', padding: '4px', borderRadius: '8px' }}>
            <button onClick={() => setViewMode('week')} style={{ padding: '8px 16px', background: viewMode === 'week' ? 'var(--accent-orange)' : 'transparent', border: 'none', borderRadius: '6px', color: viewMode === 'week' ? 'white' : 'var(--text-secondary)', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}><CalendarIcon /> Week</button>
            <button onClick={() => setViewMode('month')} style={{ padding: '8px 16px', background: viewMode === 'month' ? 'var(--accent-orange)' : 'transparent', border: 'none', borderRadius: '6px', color: viewMode === 'month' ? 'white' : 'var(--text-secondary)', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}><GridIcon /> Month</button>
            <button onClick={() => setViewMode('day')} style={{ padding: '8px 16px', background: viewMode === 'day' ? 'var(--accent-orange)' : 'transparent', border: 'none', borderRadius: '6px', color: viewMode === 'day' ? 'white' : 'var(--text-secondary)', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}><DayIcon /> Day</button>
          </div>
          <button className="btn-primary" onClick={() => setShowAddModal(true)}><PlusIcon /> Add Shift</button>
        </div>
      </div>

      {viewMode === 'week' && (
        <div className="week-grid">
          <div className="week-header">
            <div style={{ padding: '16px 20px', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>Staff Member</div>
            {weekDays.map((day) => (
              <div key={toDateOnly(day)} className={`week-day-header ${isToday(day) ? 'today' : ''}`}>
                <div style={{ fontSize: '11px', fontWeight: '600', color: isToday(day) ? 'var(--accent-orange)' : 'var(--text-muted)', marginBottom: '4px' }}>{day.toLocaleDateString('en-GB', { weekday: 'short' }).toUpperCase()}</div>
                <div style={{ fontSize: '20px', fontWeight: '700', color: isToday(day) ? 'var(--accent-orange)' : 'var(--text-primary)' }}>{day.getDate()}</div>
              </div>
            ))}
          </div>

          {getDisplayEmployees().map((employee, empIndex) => (
            <div key={employee.EmployeeID} className="employee-row">
              <div className="employee-cell">
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: getAvatarColor(empIndex), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700', color: 'white', flexShrink: 0 }}>{getInitials(employee.FirstName, employee.LastName)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{employee.FirstName} {employee.LastName}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{employee.JobTitle}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                    <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 700, color: 'white', background: getAvailabilityColor(employee.Availability) }}>{employee.Availability}</span>
                    {employee.Notes.length > 0 && (<span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Note: {employee.Notes[employee.Notes.length - 1].Text}</span>)}
                  </div>
                </div>
              </div>

              {weekDays.map((day) => {
                const dayShifts = getShiftsForEmployeeDay(employee.EmployeeID, day);
                const missedDayShifts = getMissedShiftsForEmployeeDay(employee.EmployeeID, day);
                const hasVisibleEntries = dayShifts.length > 0 || missedDayShifts.length > 0;

                return (
                  <div key={`${employee.EmployeeID}-${toDateOnly(day)}`} className={`shift-cell ${isToday(day) ? 'today' : ''}`} onClick={() => { if (!hasVisibleEntries) openAddModal(employee.EmployeeID, day); }} onDragOver={handleDragOver} onDrop={() => handleDrop(employee.EmployeeID, day)}>
                    {hasVisibleEntries ? (
                      <>
                        {dayShifts.map((shift) => {
                          const pwsPerson = shift.PwsID ? pws.find((item) => item.PwsID === shift.PwsID) : undefined;
                          const pwsName = pwsPerson ? `${pwsPerson.FirstName} ${pwsPerson.LastName}` : null;

                          return (
                            <div key={shift.RotaID} className="shift-card" draggable onDragStart={() => handleDragStart(shift)} onClick={(event) => { event.stopPropagation(); setSelectedShift({ ...shift, ShiftStatus: isOpenShift(shift) ? 'Open' : 'Assigned' }); setShowEditModal(true); }} style={{ background: shift.ColorCode || '#3b82f6', color: 'white', cursor: 'pointer' }}>
                              <div style={{ fontSize: '11px', fontWeight: '700', marginBottom: '2px' }}>{shift.ShiftType === 'PWS' ? 'PWS Shift' : 'Background'}</div>
                              {shift.IsExtraShift && (
                                <div style={{ fontSize: '9px', fontWeight: '700', marginBottom: '2px', color: '#fde68a' }}>
                                  EXTRA SHIFT
                                </div>
                              )}
                              <div style={{ fontSize: '10px', opacity: 0.9 }}>{formatTime(shift.StartTime)} - {formatTime(shift.EndTime)}</div>
                              <div style={{ fontSize: '9px', opacity: 0.8, marginTop: '2px' }}>{getLocationName(shift.LocationID)}</div>
                              {pwsName && <div style={{ fontSize: '9px', opacity: 0.9, marginTop: '2px', fontWeight: '600' }}>→ {pwsName}</div>}
                            </div>
                          );
                        })}

                        {missedDayShifts.map((missedEntry) => (
                          <div key={`missed-${missedEntry.MissedShiftID}`} className="shift-card shift-card-missed" title={missedEntry.NoteText} style={{ cursor: 'not-allowed' }}>
                            <div style={{ fontSize: '11px', fontWeight: '700', marginBottom: '2px' }}>MISSED ({missedEntry.Reason})</div>
                            <div style={{ fontSize: '10px', opacity: 0.95 }}>{formatTime(missedEntry.StartTime)} - {formatTime(missedEntry.EndTime)}</div>
                            <div style={{ fontSize: '9px', opacity: 0.85, marginTop: '2px' }}>{getLocationName(missedEntry.LocationID)}</div>
                            <div style={{ fontSize: '9px', opacity: 0.95, marginTop: '3px' }}>{missedEntry.NoteText}</div>
                          </div>
                        ))}

                        <button onClick={(event) => { event.stopPropagation(); openAddModal(employee.EmployeeID, day); }} style={{ padding: '6px', background: 'transparent', border: '1px dashed var(--border-light)', borderRadius: '4px', color: 'var(--text-muted)', fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '4px' }}><PlusIcon /></button>
                      </>
                    ) : (
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '24px', opacity: 0.3 }}><PlusIcon /></div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}

          {weekDays.some((day) => getOpenShiftsForDay(day).length > 0) && (
            <div className="employee-row">
              <div className="employee-cell" style={{ background: 'var(--bg-elevated)' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700', color: 'white', flexShrink: 0 }}>OP</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>Open Shifts</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Drag to an employee row to assign</div>
                </div>
              </div>

              {weekDays.map((day) => {
                const openShifts = getOpenShiftsForDay(day);
                return (
                  <div key={`open-${toDateOnly(day)}`} className={`shift-cell ${isToday(day) ? 'today' : ''}`} onClick={() => { if (openShifts.length === 0) openAddModal(0, day); }} onDragOver={handleDragOver} onDrop={() => handleDrop(0, day)}>
                    {openShifts.length > 0 ? (
                      <>
                        {openShifts.map((shift) => {
                          const pwsPerson = shift.PwsID ? pws.find((item) => item.PwsID === shift.PwsID) : undefined;
                          const pwsName = pwsPerson ? `${pwsPerson.FirstName} ${pwsPerson.LastName}` : null;

                          return (
                            <div key={shift.RotaID} className="shift-card" draggable onDragStart={() => handleDragStart(shift)} onClick={(event) => { event.stopPropagation(); setSelectedShift({ ...shift, ShiftStatus: 'Open' }); setShowEditModal(true); }} style={{ background: '#ef4444', color: 'white', cursor: 'pointer' }}>
                              <div style={{ fontSize: '11px', fontWeight: '700', marginBottom: '2px' }}>OPEN</div>
                              <div style={{ fontSize: '10px', opacity: 0.9 }}>{formatTime(shift.StartTime)} - {formatTime(shift.EndTime)}</div>
                              <div style={{ fontSize: '9px', opacity: 0.8, marginTop: '2px' }}>{getLocationName(shift.LocationID)}</div>
                              {pwsName && <div style={{ fontSize: '9px', opacity: 0.9, marginTop: '2px', fontWeight: '600' }}>→ {pwsName}</div>}
                            </div>
                          );
                        })}
                        <button onClick={(event) => { event.stopPropagation(); openAddModal(0, day); }} style={{ padding: '6px', background: 'transparent', border: '1px dashed var(--border-light)', borderRadius: '4px', color: 'var(--text-muted)', fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '4px' }}><PlusIcon /></button>
                      </>
                    ) : (
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '24px', opacity: 0.3 }}><PlusIcon /></div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {viewMode === 'day' && (
        <div className="day-zone-grid">
          {activeLocations.map((location) => {
            const zoneShifts = [...getShiftsForLocationDay(location.LocationID, currentDay)].sort((a, b) => a.StartTime.localeCompare(b.StartTime));
            const missedZoneShifts = [...getMissedShiftsForLocationDay(location.LocationID, currentDay)].sort((a, b) => a.StartTime.localeCompare(b.StartTime));
            const hasEntries = zoneShifts.length > 0 || missedZoneShifts.length > 0;

            return (
              <div key={location.LocationID} className="day-zone-card" style={{ borderTop: `4px solid ${location.ColorCode || 'var(--accent-orange)'}` }}>
                <div className="day-zone-header">
                  <div>
                    <div className="day-zone-title">{location.LocationName}</div>
                    <div className="day-zone-meta">{zoneShifts.length} shift{zoneShifts.length === 1 ? '' : 's'}{missedZoneShifts.length > 0 ? ` • ${missedZoneShifts.length} missed` : ''}</div>
                  </div>
                  <button className="btn-secondary" onClick={() => openAddModal(0, currentDay, location.LocationID)}><PlusIcon /> Add</button>
                </div>

                {hasEntries ? (
                  <div className="day-zone-list">
                    {zoneShifts.map((shift) => {
                      const open = isOpenShift(shift);
                      const pwsPerson = shift.PwsID ? pws.find((item) => item.PwsID === shift.PwsID) : undefined;
                      const pwsName = pwsPerson ? `${pwsPerson.FirstName} ${pwsPerson.LastName}` : null;

                      return (
                        <div key={shift.RotaID} className="shift-card" onClick={() => { setSelectedShift({ ...shift, ShiftStatus: open ? 'Open' : 'Assigned' }); setShowEditModal(true); }} style={{ background: open ? '#ef4444' : shift.ColorCode || '#3b82f6', color: 'white', cursor: 'pointer' }}>
                          <div style={{ fontSize: '12px', fontWeight: '700', marginBottom: '2px' }}>{open ? 'OPEN SHIFT' : getEmployeeName(shift.EmployeeID)}</div>
                          <div style={{ fontSize: '11px', opacity: 0.92 }}>{formatTime(shift.StartTime)} - {formatTime(shift.EndTime)}</div>
                          <div style={{ fontSize: '10px', opacity: 0.86, marginTop: '2px' }}>{shift.ShiftType === 'PWS' ? 'PWS' : 'Background'}{pwsName ? ` → ${pwsName}` : ''}</div>
                          {shift.IsExtraShift && (
                            <div style={{ fontSize: '10px', fontWeight: '700', marginTop: '3px', color: '#fde68a' }}>
                              EXTRA SHIFT
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {missedZoneShifts.map((missedEntry) => (
                      <div key={`day-missed-${missedEntry.MissedShiftID}`} className="shift-card shift-card-missed" title={missedEntry.NoteText} style={{ cursor: 'not-allowed' }}>
                        <div style={{ fontSize: '11px', fontWeight: '700', marginBottom: '2px' }}>{getEmployeeName(missedEntry.EmployeeID)} (MISSED {missedEntry.Reason})</div>
                        <div style={{ fontSize: '10px', opacity: 0.95 }}>{formatTime(missedEntry.StartTime)} - {formatTime(missedEntry.EndTime)}</div>
                        <div style={{ fontSize: '9px', opacity: 0.95, marginTop: '3px' }}>{missedEntry.NoteText}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="day-zone-empty">No shifts for this zone on {currentDay.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}.</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {viewMode === 'month' && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '8px', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)' }}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((dayName) => (
              <div key={dayName} style={{ padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>{dayName}</div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', background: 'var(--border-subtle)' }}>
            {monthDays.map((day) => {
              const dayShifts = getShiftsForDay(day);
              const isCurrentMonthDay = isCurrentMonth(day);
              const isTodayDay = isToday(day);

              return (
                <div key={toDateOnly(day)} style={{ minHeight: '120px', background: isTodayDay ? 'rgba(230, 126, 34, 0.05)' : 'var(--bg-card)', padding: '8px', opacity: isCurrentMonthDay ? 1 : 0.4, cursor: 'pointer' }} onClick={() => openAddModal(0, day)}>
                  <div style={{ fontSize: '14px', fontWeight: isTodayDay ? '700' : '600', color: isTodayDay ? 'var(--accent-orange)' : 'var(--text-primary)', marginBottom: '4px' }}>{day.getDate()}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {dayShifts.slice(0, 3).map((shift) => {
                      const pwsPerson = shift.PwsID ? pws.find((item) => item.PwsID === shift.PwsID) : undefined;
                      const pwsName = pwsPerson ? pwsPerson.FirstName : null;
                      const employeeLabel = isOpenShift(shift) ? 'OPEN' : getEmployeeName(shift.EmployeeID).split(' ')[0];
                      const extraLabel = shift.IsExtraShift ? ' [EXTRA]' : '';

                      return (
                        <div key={shift.RotaID} onClick={(event) => { event.stopPropagation(); setSelectedShift({ ...shift, ShiftStatus: isOpenShift(shift) ? 'Open' : 'Assigned' }); setShowEditModal(true); }} style={{ padding: '4px 6px', background: shift.ColorCode || '#3b82f6', borderRadius: '3px', fontSize: '9px', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer' }}>
                          {formatTime(shift.StartTime)} {employeeLabel}{extraLabel}{pwsName ? ` → ${pwsName}` : ''}
                        </div>
                      );
                    })}
                    {dayShifts.length > 3 && <div style={{ fontSize: '9px', color: 'var(--text-muted)', padding: '2px' }}>+{dayShifts.length - 3} more</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Add Shift</h2>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><CloseIcon /></button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group"><label className="form-label">Status *</label><select className="input-field" value={formData.ShiftStatus} onChange={(event) => setFormData({ ...formData, ShiftStatus: event.target.value as 'Assigned' | 'Open', EmployeeID: event.target.value === 'Open' ? 0 : formData.EmployeeID })}><option value="Assigned">Assigned</option><option value="Open">Open</option></select></div>
                <div className="form-group"><label className="form-label">Employee {formData.ShiftStatus === 'Assigned' ? '*' : ''}</label><select className="input-field" value={formData.EmployeeID || ''} onChange={(event) => setFormData({ ...formData, EmployeeID: Number(event.target.value || 0) })} disabled={formData.ShiftStatus === 'Open'}><option value="">Select</option>{employees.filter((employee) => employee.IsActive).map((employee) => (<option key={employee.EmployeeID} value={employee.EmployeeID}>{employee.FirstName} {employee.LastName}</option>))}</select></div>
                <div className="form-group"><label className="form-label">Location *</label><select className="input-field" value={formData.LocationID || ''} onChange={(event) => setFormData({ ...formData, LocationID: Number(event.target.value || 0) })}><option value="">Select</option>{locations.filter((location) => location.IsActive).map((location) => (<option key={location.LocationID} value={location.LocationID}>{location.LocationName}</option>))}</select></div>
                <div className="form-group"><label className="form-label">Date *</label><input type="date" className="input-field" value={formData.ShiftDate} onChange={(event) => setFormData({ ...formData, ShiftDate: event.target.value })} /></div>
                <div className="form-group"><label className="form-label">Type *</label><select className="input-field" value={formData.ShiftType} onChange={(event) => setFormData({ ...formData, ShiftType: event.target.value as 'Background' | 'PWS' })}><option value="Background">Background</option><option value="PWS">PWS</option></select></div>
                {formData.ShiftType === 'PWS' && (<div className="form-group" style={{ gridColumn: '1 / -1' }}><label className="form-label">PWS *</label><select className="input-field" value={formData.PwsID || ''} onChange={(event) => setFormData({ ...formData, PwsID: Number(event.target.value || 0) })}><option value="">Select</option>{pws.filter((person) => person.IsActive).map((person) => (<option key={person.PwsID} value={person.PwsID}>{person.FirstName} {person.LastName}</option>))}</select></div>)}
                <div className="form-group"><label className="form-label">Start *</label><input type="time" className="input-field" value={formData.StartTime} onChange={(event) => setFormData({ ...formData, StartTime: event.target.value })} /></div>
                <div className="form-group"><label className="form-label">End *</label><input type="time" className="input-field" value={formData.EndTime} onChange={(event) => setFormData({ ...formData, EndTime: event.target.value })} /></div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}><label className="form-label">Staff Notes</label><textarea className="input-field" value={formData.Comments} onChange={(event) => setFormData({ ...formData, Comments: event.target.value })} rows={2} /></div>
                {formData.ShiftType === 'PWS' && (<div className="form-group" style={{ gridColumn: '1 / -1' }}><label className="form-label">PWS Notes</label><textarea className="input-field" value={formData.PwsComments} onChange={(event) => setFormData({ ...formData, PwsComments: event.target.value })} rows={2} /></div>)}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleAddShift}>Add</button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && selectedShift && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Edit Shift</h2>
              <button onClick={() => setShowEditModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><CloseIcon /></button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group"><label className="form-label">Status *</label><select className="input-field" value={selectedShift.ShiftStatus} onChange={(event) => setSelectedShift({ ...selectedShift, ShiftStatus: event.target.value as 'Assigned' | 'Open', EmployeeID: event.target.value === 'Open' ? undefined : selectedShift.EmployeeID })}><option value="Assigned">Assigned</option><option value="Open">Open</option></select></div>
                <div className="form-group"><label className="form-label">Employee {selectedShift.ShiftStatus === 'Assigned' ? '*' : ''}</label><select className="input-field" value={selectedShift.EmployeeID || ''} onChange={(event) => setSelectedShift({ ...selectedShift, EmployeeID: Number(event.target.value || 0) || undefined })} disabled={selectedShift.ShiftStatus === 'Open'}><option value="">Select</option>{employees.filter((employee) => employee.IsActive).map((employee) => (<option key={employee.EmployeeID} value={employee.EmployeeID}>{employee.FirstName} {employee.LastName}</option>))}</select></div>
                <div className="form-group"><label className="form-label">Location *</label><select className="input-field" value={selectedShift.LocationID} onChange={(event) => setSelectedShift({ ...selectedShift, LocationID: Number(event.target.value || 0) })}>{locations.filter((location) => location.IsActive).map((location) => (<option key={location.LocationID} value={location.LocationID}>{location.LocationName}</option>))}</select></div>
                <div className="form-group"><label className="form-label">Date *</label><input type="date" className="input-field" value={selectedShift.ShiftDate.split('T')[0]} onChange={(event) => setSelectedShift({ ...selectedShift, ShiftDate: event.target.value })} /></div>
                <div className="form-group"><label className="form-label">Type *</label><select className="input-field" value={selectedShift.ShiftType} onChange={(event) => setSelectedShift({ ...selectedShift, ShiftType: event.target.value as 'Background' | 'PWS' })}><option value="Background">Background</option><option value="PWS">PWS</option></select></div>
                {selectedShift.ShiftType === 'PWS' && (<div className="form-group"><label className="form-label">PWS *</label><select className="input-field" value={selectedShift.PwsID || ''} onChange={(event) => setSelectedShift({ ...selectedShift, PwsID: Number(event.target.value || 0) || undefined })}><option value="">Select</option>{pws.filter((person) => person.IsActive).map((person) => (<option key={person.PwsID} value={person.PwsID}>{person.FirstName} {person.LastName}</option>))}</select></div>)}
                <div className="form-group"><label className="form-label">Start *</label><input type="time" className="input-field" value={formatTime(selectedShift.StartTime)} onChange={(event) => setSelectedShift({ ...selectedShift, StartTime: event.target.value })} /></div>
                <div className="form-group"><label className="form-label">End *</label><input type="time" className="input-field" value={formatTime(selectedShift.EndTime)} onChange={(event) => setSelectedShift({ ...selectedShift, EndTime: event.target.value })} /></div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}><label className="form-label">Staff Notes</label><textarea className="input-field" value={selectedShift.Comments || ''} onChange={(event) => setSelectedShift({ ...selectedShift, Comments: event.target.value })} rows={2} /></div>
                {selectedShift.ShiftType === 'PWS' && (<div className="form-group" style={{ gridColumn: '1 / -1' }}><label className="form-label">PWS Notes</label><textarea className="input-field" value={selectedShift.PwsComments || ''} onChange={(event) => setSelectedShift({ ...selectedShift, PwsComments: event.target.value })} rows={2} /></div>)}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => handleDeleteShift(selectedShift.RotaID)} style={{ marginRight: 'auto', color: '#ef4444', borderColor: '#ef4444' }}>Delete</button>
              {!isOpenShift(selectedShift) && (<button className="btn-secondary" onClick={() => handleMarkShiftOpen(selectedShift)} style={{ color: '#f59e0b', borderColor: '#f59e0b' }}>Mark Shift Open</button>)}
              {!!selectedShift.EmployeeID && !isOpenShift(selectedShift) && (<button className="btn-secondary" onClick={() => handleMarkEmployeeUnavailable(selectedShift.EmployeeID!, selectedShift.RotaID, 'Sick')} style={{ color: '#ef4444', borderColor: '#ef4444' }}>Sick + Open</button>)}
              {!!selectedShift.EmployeeID && !isOpenShift(selectedShift) && (<button className="btn-secondary" onClick={() => handleMarkEmployeeUnavailable(selectedShift.EmployeeID!, selectedShift.RotaID, 'Unavailable')} style={{ color: '#f59e0b', borderColor: '#f59e0b' }}>Unavailable + Open</button>)}
              <button className="btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleEditShift}>Save</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
