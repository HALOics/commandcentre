import { useEffect, useMemo, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useMsal } from "@azure/msal-react";
import { navigation } from "../navigation";
import { setDevAuthenticated } from "../auth/devAuth";
import {
  MESSENGER_UNREAD_EVENT,
  MESSENGER_UNREAD_KEY,
  readMessengerUnreadCount
} from "../messenger/unreadState";
import haloLogo from "../assets/halo-logo.svg";
import clientLogo from "../assets/client-logo.png";

type Theme = "light" | "dark";

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M15 18H9M18 16V11a6 6 0 10-12 0v5l-2 2h16l-2-2zm-5 4a2 2 0 01-2-2h4a2 2 0 01-2 2z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 4V2m0 20v-2m8-8h2M2 12h2m12.364 5.657l1.414 1.414M4.222 5.05l1.414 1.414m12.728 0l-1.414 1.414M5.636 17.657l-1.414 1.414M12 17a5 5 0 100-10 5 5 0 000 10z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M20 13.5A8.5 8.5 0 1110.5 4 7 7 0 0020 13.5z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Layout() {
  const location = useLocation();
  const { accounts, instance } = useMsal();
  const [theme, setTheme] = useState<Theme>("light");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [messengerUnreadCount, setMessengerUnreadCount] = useState<number>(() => readMessengerUnreadCount());

  const account = useMemo(() => instance.getActiveAccount() ?? accounts[0], [accounts, instance]);
  const displayName = account?.name || account?.username || "HALO Operator";
  const role = "Admin";
  const company = account?.username?.split("@")[1] || "halo.local";

  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    const savedTheme = (localStorage.getItem("halo_theme") as Theme | null) || "light";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  useEffect(() => {
    setOpenDropdown(null);
  }, [location.pathname]);

  useEffect(() => {
    const syncUnreadCount = () => {
      setMessengerUnreadCount(readMessengerUnreadCount());
    };

    const handleUnreadEvent = () => {
      syncUnreadCount();
    };

    const handleStorageEvent = (event: StorageEvent) => {
      if (event.key === null || event.key === MESSENGER_UNREAD_KEY) {
        syncUnreadCount();
      }
    };

    window.addEventListener(MESSENGER_UNREAD_EVENT, handleUnreadEvent);
    window.addEventListener("storage", handleStorageEvent);

    return () => {
      window.removeEventListener(MESSENGER_UNREAD_EVENT, handleUnreadEvent);
      window.removeEventListener("storage", handleStorageEvent);
    };
  }, []);

  function toggleTheme() {
    const nextTheme: Theme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("halo_theme", nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
  }

  async function logout() {
    setDevAuthenticated(false);

    if (!account) {
      window.location.assign("/login");
      return;
    }

    try {
      await instance.logoutPopup({
        account,
        mainWindowRedirectUri: window.location.origin
      });
    } catch (error) {
      console.error("Logout failed", error);
      window.location.assign("/login");
    }
  }

  return (
    <div className="app-shell">
      <header className="top-nav">
        <div className="top-nav-left">
          <Link to="/" className="brand-link brand-link-logos" aria-label="HALO and client branding">
            <img className="nav-brand-logo nav-brand-halo" src={haloLogo} alt="HALO logo" />
            <span className="nav-brand-divider" aria-hidden="true" />
            <img className="nav-brand-logo nav-brand-client" src={clientLogo} alt="Client logo" />
          </Link>

          <nav className="nav-links" aria-label="Primary">
            {navigation.map((item) => {
              const childActive = (item.children ?? []).some((child) => location.pathname === child.href);
              const isActive = location.pathname === item.href || childActive;
              const hasMessengerUnread = item.href === "/messenger" && messengerUnreadCount > 0;

              if (item.children?.length) {
                const isOpen = openDropdown === item.href;
                return (
                  <div
                    key={item.href}
                    className={`nav-item nav-dropdown ${isActive ? "active" : ""} ${isOpen ? "open" : ""} ${
                      hasMessengerUnread ? "has-unread" : ""
                    }`}
                    onMouseEnter={() => setOpenDropdown(item.href)}
                    onMouseLeave={() => setOpenDropdown((current) => (current === item.href ? null : current))}
                    onFocusCapture={() => setOpenDropdown(item.href)}
                    onBlurCapture={(event) => {
                      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                        setOpenDropdown(null);
                      }
                    }}
                  >
                    <Link
                      to={item.href}
                      className={`nav-link ${isActive ? "active" : ""} ${hasMessengerUnread ? "has-unread" : ""}`}
                      onClick={() => setOpenDropdown(null)}
                    >
                      {item.name}
                    </Link>

                    <div className="nav-dropdown-menu" role="menu" aria-label={`${item.name} menu`}>
                      {item.children.map((child) => {
                        const childIsActive = location.pathname === child.href;
                        return (
                          <Link
                            key={child.href}
                            to={child.href}
                            role="menuitem"
                            className={`nav-dropdown-link ${childIsActive ? "active" : ""}`}
                            onClick={() => setOpenDropdown(null)}
                          >
                            {child.name}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              }

              return (
                <div key={item.href} className="nav-item">
                  <Link
                    to={item.href}
                    className={`nav-link ${isActive ? "active" : ""} ${hasMessengerUnread ? "has-unread" : ""}`}
                    onClick={() => setOpenDropdown(null)}
                  >
                    {item.name}
                  </Link>
                </div>
              );
            })}
          </nav>
        </div>

        <div className="top-nav-right">
          <button className="icon-btn" aria-label="Notifications">
            <BellIcon />
          </button>

          <button className="icon-btn" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </button>

          <button className="user-profile-btn" onClick={logout} title="Sign out">
            <div className="user-avatar">{initials}</div>
            <div className="user-copy">
              <strong>{displayName}</strong>
              <span>
                {role} at {company}
              </span>
            </div>
          </button>
        </div>
      </header>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
