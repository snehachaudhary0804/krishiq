import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import {
  IconHome,
  IconTicket,
  IconClock,
  IconHistory,
  IconBank,
  IconScan,
  IconScale,
  IconBuilding,
  IconWheat,
  IconReceipt,
  IconChart,
  IconAudit,
  IconLogout,
  IconLeaf,
  IconGlobe,
  IconUser,
} from "./icons.jsx";

const NAV_ITEMS = {
  farmer: [
    ["home", "dashboard", IconHome],
    ["book", "bookToken", IconTicket],
    ["queue", "myToken", IconClock],
    ["history", "myHistory", IconHistory],
    ["bank", "bankDetails", IconBank],
    ["profile", "profile", IconUser],
  ],

  operator: [
    ["home", "dashboard", IconHome],
    ["queue", "liveQueue", IconClock],
    ["scan", "scanCheckIn", IconScan],
    ["process", "procurement", IconScale],
    ["history", "bookings", IconHistory],
    ["profile", "profile", IconUser],
  ],

  admin: [
    ["home", "dashboard", IconHome],
    ["centres", "centres", IconBuilding],
    ["crops", "cropsMsp", IconWheat],
    ["history", "allBookings", IconHistory],
    ["payouts", "payouts", IconReceipt],
    ["analytics", "analytics", IconChart],
    ["audit", "auditLog", IconAudit],
    ["profile", "profile", IconUser],
  ],
};

export default function Layout() {
  const { user, logout } = useAuth();
  const { t, lang, toggleLang } = useLanguage();
  const navigate = useNavigate();

  const items = NAV_ITEMS[user?.role] || [];

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <>
      {/* ================= HEADER ================= */}
      <header className="top">
        <div className="brand">
          <span className="brand-mark">
            <IconLeaf style={{ width: 17, height: 17 }} />
          </span>

          <div>
            <div>{t("appName")}</div>
            <div className="brand-sub">
              Procurement Queue System
            </div>
          </div>
        </div>

        <div className="row">
          {/* Language */}
          <button
            className="lang-toggle"
            onClick={toggleLang}
            type="button"
          >
            <IconGlobe style={{ width: 13, height: 13 }} />
            {lang === "en" ? "हिन्दी" : "English"}
          </button>

          {/* Logged-in user name */}
          <span
            className="pill"
            title={user?.role || ""}
          >
            {user?.name || t(user?.role) || "User"}
          </span>

          {/* Logout */}
          <button
            className="btn alt"
            onClick={handleLogout}
            type="button"
          >
            <IconLogout style={{ width: 15, height: 15 }} />
            {t("logout")}
          </button>
        </div>
      </header>

      {/* ================= MAIN LAYOUT ================= */}
      <div className="layout">

        {/* ================= SIDEBAR ================= */}
        <aside>
          <div className="sidebar-heading">
            <span className="sidebar-kicker">
              Workspace
            </span>

            <strong>
              {t(user?.role)} portal
            </strong>

            {user?.role === "operator" && (
              <span className="sidebar-centre-chip">
                Centre access restricted
              </span>
            )}
          </div>

          {/* Navigation */}
          <div className="nav">
            {items.map(([path, key, Icon]) => (
              <NavLink
                key={path}
                to={`/app/${path}`}
                className={({ isActive }) =>
                  isActive ? "on" : ""
                }
              >
                <Icon className="nav-icon" />
                <span>{t(key)}</span>
              </NavLink>
            ))}
          </div>

          {/* Admin information */}
          {user?.role === "admin" && (
            <div
              className="notice"
              style={{
                marginTop: 20,
                fontSize: 12,
              }}
            >
              First create a Centre and Crop/MSP.
              Then farmers can book a token.
            </div>
          )}

          {/* ================= SIDEBAR USER ================= */}
          <NavLink
            className="sidebar-user"
            to="/app/profile"
          >
            <div className="sidebar-avatar">
              {user?.name?.charAt(0)?.toUpperCase() || "K"}
            </div>

            <div>
              <strong>
                {user?.name || "KrishiQueue user"}
              </strong>

              <span>
                {t(user?.role)}
              </span>
            </div>

            <IconUser className="sidebar-user-icon" />
          </NavLink>
        </aside>

        {/* ================= PAGE CONTENT ================= */}
        <main className="main">
          <Outlet />
        </main>
      </div>
    </>
  );
}