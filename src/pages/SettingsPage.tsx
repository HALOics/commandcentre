import { useEffect, useMemo, useState } from "react";
import { useMsal } from "@azure/msal-react";
import { approvePendingDevice, loadPendingDevices, rejectPendingDevice } from "../auth/appSession";
import {
  AccessibilityPreferences,
  TextScaleOption,
  applyAccessibilityPreferences,
  readAccessibilityPreferences,
  textScaleOptions,
  writeAccessibilityPreferences
} from "../accessibility/preferences";
import { loadTeamRoles, saveTeamRoles } from "../data/dbClient";
import {
  DashboardPreferences,
  WidgetId,
  WidgetSize,
  defaultWidgetOrder,
  defaultWidgetSizes,
  getDashboardStorageKey,
  getWidgetSizeClass,
  isWidgetLocked,
  moveWidgetToPosition,
  sanitizeHiddenWidgets,
  sanitizeWidgetOrder,
  sanitizeWidgetSizes,
  widgetMeta
} from "../widgets/dashboardConfig";
import { renderWidgetBody } from "../widgets/widgetContent";

function DragHandleIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="5" cy="4" r="1.2" />
      <circle cx="11" cy="4" r="1.2" />
      <circle cx="5" cy="8" r="1.2" />
      <circle cx="11" cy="8" r="1.2" />
      <circle cx="5" cy="12" r="1.2" />
      <circle cx="11" cy="12" r="1.2" />
    </svg>
  );
}

export default function SettingsPage() {
  const { accounts, instance } = useMsal();
  const [order, setOrder] = useState<WidgetId[]>(defaultWidgetOrder);
  const [hidden, setHidden] = useState<WidgetId[]>([]);
  const [sizes, setSizes] = useState<Record<WidgetId, WidgetSize>>(defaultWidgetSizes);
  const [widgetsOpen, setWidgetsOpen] = useState(false);
  const [accessibilityOpen, setAccessibilityOpen] = useState(false);
  const [rolesOpen, setRolesOpen] = useState(false);
  const [accessibilityPreferences, setAccessibilityPreferences] = useState<AccessibilityPreferences>(
    () => readAccessibilityPreferences()
  );
  const [draggedWidget, setDraggedWidget] = useState<WidgetId | null>(null);
  const [dropTarget, setDropTarget] = useState<WidgetId | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [newRole, setNewRole] = useState("");
  const [devicesOpen, setDevicesOpen] = useState(false);
  const [deviceError, setDeviceError] = useState("");
  const [pendingDevices, setPendingDevices] = useState<
    Array<{
      deviceId: string;
      userId: number;
      username: string;
      displayName: string;
      companyName: string;
      deviceLabel: string;
      status: string;
      requestedAt: string;
    }>
  >([]);
  const [isLoadingDevices, setIsLoadingDevices] = useState(false);

  const account = instance.getActiveAccount() ?? accounts[0];
  const accountKey = account?.homeAccountId || account?.username || "local";
  const storageKey = getDashboardStorageKey(accountKey);

  const visibleOrder = useMemo(() => order.filter((id) => !hidden.includes(id)), [hidden, order]);
  const detailedCount = useMemo(
    () => Object.values(sizes).filter((size) => size === "detailed").length,
    [sizes]
  );
  const briefCount = useMemo(() => Object.values(sizes).filter((size) => size === "brief").length, [sizes]);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (!saved) {
      return;
    }

    try {
      const parsed = JSON.parse(saved) as DashboardPreferences;
      if (Array.isArray(parsed.order)) {
        setOrder(sanitizeWidgetOrder(parsed.order));
      }
      if (Array.isArray(parsed.hidden)) {
        setHidden(sanitizeHiddenWidgets(parsed.hidden));
      }
      setSizes(sanitizeWidgetSizes(parsed.sizes));
    } catch (error) {
      console.error("Unable to parse widget preferences", error);
    }
  }, [storageKey]);

  useEffect(() => {
    const preferences: DashboardPreferences = { order, hidden, sizes };
    localStorage.setItem(storageKey, JSON.stringify(preferences));
  }, [hidden, order, sizes, storageKey]);

  useEffect(() => {
    applyAccessibilityPreferences(accessibilityPreferences);
    writeAccessibilityPreferences(accessibilityPreferences);
  }, [accessibilityPreferences]);

  useEffect(() => {
    loadTeamRoles().then((list) => setRoles(list));
  }, []);

  function addRole() {
    const role = newRole.trim();
    if (!role) return;
    const next = Array.from(new Set([...roles, role]));
    setRoles(next);
    saveTeamRoles(next);
    setNewRole("");
  }

  function removeRole(role: string) {
    const next = roles.filter((r) => r !== role);
    setRoles(next);
    saveTeamRoles(next);
  }

  function toggleWidget(id: WidgetId): void {
    if (isWidgetLocked(id)) {
      return;
    }

    setHidden((current) =>
      current.includes(id) ? current.filter((hiddenId) => hiddenId !== id) : [...current, id]
    );
  }

  function updateWidgetSize(id: WidgetId, size: WidgetSize): void {
    setSizes((current) => ({ ...current, [id]: size }));
  }

  function resetLayout(): void {
    setOrder(defaultWidgetOrder);
    setHidden([]);
    setSizes(defaultWidgetSizes);
  }

  function updateColorblindMode(enabled: boolean): void {
    setAccessibilityPreferences((current) => ({ ...current, colorblindMode: enabled }));
  }

  function updateTextScale(nextScale: TextScaleOption): void {
    setAccessibilityPreferences((current) => ({ ...current, textScale: nextScale }));
  }

  async function refreshPendingDevices() {
    try {
      setIsLoadingDevices(true);
      setDeviceError("");
      const rows = await loadPendingDevices();
      setPendingDevices(rows);
    } catch (error) {
      setDeviceError(error instanceof Error ? error.message : "Unable to load pending devices.");
    } finally {
      setIsLoadingDevices(false);
    }
  }

  async function handleApproveDevice(deviceId: string) {
    try {
      await approvePendingDevice(deviceId);
      await refreshPendingDevices();
    } catch (error) {
      setDeviceError(error instanceof Error ? error.message : "Unable to approve device.");
    }
  }

  async function handleRejectDevice(deviceId: string) {
    try {
      await rejectPendingDevice(deviceId);
      await refreshPendingDevices();
    } catch (error) {
      setDeviceError(error instanceof Error ? error.message : "Unable to reject device.");
    }
  }

  return (
    <section className="settings-page">
      <div className="settings-header-card">
        <div>
          <p className="eyebrow">Control centre</p>
          <h1>Settings</h1>
          <p>Shape dashboard behavior, visibility, and layout standards for your HALO workspace.</p>
        </div>
        <div className="settings-header-meta" aria-label="Layout summary">
          <article className="settings-meta-chip">
            <span>Visible</span>
            <strong>{visibleOrder.length}</strong>
          </article>
          <article className="settings-meta-chip">
            <span>Brief</span>
            <strong>{briefCount}</strong>
          </article>
          <article className="settings-meta-chip">
            <span>Detailed</span>
            <strong>{detailedCount}</strong>
          </article>
        </div>
      </div>

      <article className="settings-panel">
        <button
          className={`settings-section-btn ${widgetsOpen ? "active" : ""}`}
          onClick={() => setWidgetsOpen((current) => !current)}
          aria-expanded={widgetsOpen}
        >
          Home Widgets
          <span>{widgetsOpen ? "Collapse" : "Open"}</span>
        </button>

        {!widgetsOpen ? (
          <p className="settings-collapsed-copy">
            Click Home Widgets to edit layout and load a live example dashboard preview.
          </p>
        ) : null}

        {widgetsOpen ? (
          <>
            <p className="settings-panel-copy">
              Drag preview cards into place. Size modes: Brief (compact), Standard, Detailed (expanded). Updates is
              always required.
            </p>

            <div className="settings-widgets-layout">
              <div className="drawer-list">
                {order.map((id) => {
                  const locked = isWidgetLocked(id);
                  return (
                    <div key={id} className={`drawer-row ${locked ? "locked" : ""}`}>
                      <div className="settings-row-main">
                        <label>
                          <input
                            type="checkbox"
                            checked={!hidden.includes(id)}
                            onChange={() => toggleWidget(id)}
                            disabled={locked}
                          />
                          <span>{widgetMeta[id].title}</span>
                        </label>
                        {locked ? <span className="settings-lock-pill">Required</span> : null}
                      </div>

                      <div className="settings-row-controls">
                        <label className="settings-size-field">
                          <span>Size</span>
                          <select
                            className="input-field settings-size-select"
                            value={sizes[id]}
                            onChange={(event) => updateWidgetSize(id, event.target.value as WidgetSize)}
                          >
                            <option value="brief">Brief</option>
                            <option value="standard">Standard</option>
                            <option value="detailed">Detailed</option>
                          </select>
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>

              <section className="settings-preview" aria-label="Example dashboard preview">
                <h3>Example Dashboard Preview</h3>
                <div className="widget-grid widget-preview-grid">
                  {visibleOrder.map((id) => {
                    const locked = isWidgetLocked(id);
                    return (
                      <article
                        key={id}
                        className={`widget-card settings-preview-card ${getWidgetSizeClass(sizes[id])} ${
                          dropTarget === id ? "drag-over" : ""
                        } ${locked ? "locked" : ""}`}
                        draggable={!locked}
                        onDragStart={() => {
                          if (!locked) {
                            setDraggedWidget(id);
                          }
                        }}
                        onDragOver={(event) => {
                          if (!draggedWidget || draggedWidget === id) {
                            return;
                          }

                          event.preventDefault();
                          setDropTarget(id);
                        }}
                        onDragLeave={() => {
                          if (dropTarget === id) {
                            setDropTarget(null);
                          }
                        }}
                        onDrop={(event) => {
                          event.preventDefault();
                          if (!draggedWidget || draggedWidget === id) {
                            return;
                          }

                          setOrder((current) => moveWidgetToPosition(current, draggedWidget, id));
                          setDraggedWidget(null);
                          setDropTarget(null);
                        }}
                        onDragEnd={() => {
                          setDraggedWidget(null);
                          setDropTarget(null);
                        }}
                      >
                        <header>
                          <h2>{widgetMeta[id].title}</h2>
                          <div className="settings-preview-header-tools">
                            {!locked ? (
                              <span className="settings-drag-handle" title="Drag to reorder" aria-label="Drag to reorder">
                                <DragHandleIcon />
                              </span>
                            ) : null}
                            {locked ? <span className="settings-lock-pill">Required</span> : null}
                          </div>
                        </header>
                        {renderWidgetBody(id, sizes[id])}
                      </article>
                    );
                  })}
                </div>
              </section>
            </div>

            <div className="settings-actions">
              <button className="btn-outline" onClick={resetLayout}>
                Reset to default
              </button>
            </div>
          </>
        ) : null}
      </article>

      <article className="settings-panel">
        <button
          className={`settings-section-btn ${devicesOpen ? "active" : ""}`}
          onClick={() => {
            setDevicesOpen((current) => !current);
            if (!devicesOpen) {
              void refreshPendingDevices();
            }
          }}
          aria-expanded={devicesOpen}
        >
          Device Approvals
          <span>{devicesOpen ? "Collapse" : "Open"}</span>
        </button>

        {!devicesOpen ? (
          <p className="settings-collapsed-copy">Approve or reject sign-in requests from new devices.</p>
        ) : null}

        {devicesOpen ? (
          <>
            <p className="settings-panel-copy">Only admin users can approve pending devices.</p>
            {deviceError ? <div className="alert-error">{deviceError}</div> : null}
            {isLoadingDevices ? <p className="settings-panel-copy">Loading pending devices...</p> : null}
            {!isLoadingDevices && pendingDevices.length === 0 ? (
              <p className="settings-panel-copy">No pending device approvals.</p>
            ) : null}
            {!isLoadingDevices && pendingDevices.length > 0 ? (
              <div className="roles-pills">
                {pendingDevices.map((device) => (
                  <span key={device.deviceId} className="role-pill">
                    {device.displayName || device.username} - {device.deviceLabel}
                    <button type="button" aria-label="Approve device" onClick={() => void handleApproveDevice(device.deviceId)}>
                      Approve
                    </button>
                    <button type="button" aria-label="Reject device" onClick={() => void handleRejectDevice(device.deviceId)}>
                      Reject
                    </button>
                  </span>
                ))}
              </div>
            ) : null}
          </>
        ) : null}
      </article>

      <article className="settings-panel">
        <button
          className={`settings-section-btn ${rolesOpen ? "active" : ""}`}
          onClick={() => setRolesOpen((current) => !current)}
          aria-expanded={rolesOpen}
        >
          Job Roles
          <span>{rolesOpen ? "Collapse" : "Open"}</span>
        </button>

        {!rolesOpen ? (
          <p className="settings-collapsed-copy">Manage the list of roles available when editing a team member.</p>
        ) : null}

        {rolesOpen ? (
          <>
            <p className="settings-panel-copy">Add, remove, or rename job roles used across Team profiles.</p>
            <div className="roles-editor">
              <div className="roles-add-row">
                <input
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  placeholder="Add a new role"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addRole();
                    }
                  }}
                />
                <button className="btn-primary" type="button" onClick={addRole}>
                  Add
                </button>
              </div>
              <div className="roles-pills">
                {roles.map((role) => (
                  <span key={role} className="role-pill">
                    {role}
                    <button type="button" aria-label={`Remove ${role}`} onClick={() => removeRole(role)}>
                      ×
                    </button>
                  </span>
                ))}
                {roles.length === 0 ? <p className="settings-panel-copy">No roles yet.</p> : null}
              </div>
            </div>
          </>
        ) : null}
      </article>

      <article className="settings-panel">
        <button
          className={`settings-section-btn ${accessibilityOpen ? "active" : ""}`}
          onClick={() => setAccessibilityOpen((current) => !current)}
          aria-expanded={accessibilityOpen}
        >
          Accessibility
          <span>{accessibilityOpen ? "Collapse" : "Open"}</span>
        </button>

        {!accessibilityOpen ? (
          <p className="settings-collapsed-copy">Manage colourblind mode and global text scaling preferences.</p>
        ) : null}

        {accessibilityOpen ? (
          <>
            <p className="settings-panel-copy">Adjust visual accessibility options for this HALO workspace.</p>

            <div className="settings-accessibility-grid">
              <label className="settings-accessibility-row" htmlFor="colorblind-mode-toggle">
                <div className="settings-accessibility-copy">
                  <strong>Colourblind Mode</strong>
                  <p>Uses colour-safe alert and status tones across widgets, cards, and indicators.</p>
                </div>
                <input
                  id="colorblind-mode-toggle"
                  type="checkbox"
                  checked={accessibilityPreferences.colorblindMode}
                  onChange={(event) => updateColorblindMode(event.target.checked)}
                />
              </label>

              <div className="settings-accessibility-row settings-accessibility-text-row">
                <div className="settings-accessibility-copy">
                  <strong>Text Size</strong>
                  <p>Scale global text for easier reading while preserving the premium layout.</p>
                </div>
                <label className="settings-size-field settings-text-size-field" htmlFor="text-size-scale-select">
                  <span>Scale</span>
                  <select
                    id="text-size-scale-select"
                    className="input-field settings-size-select settings-text-size-select"
                    value={accessibilityPreferences.textScale}
                    onChange={(event) => updateTextScale(event.target.value as TextScaleOption)}
                  >
                    {textScaleOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label} ({option.note})
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          </>
        ) : null}
      </article>
    </section>
  );
}
