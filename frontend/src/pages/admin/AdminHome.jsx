import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/api";
import { useToast } from "../../context/ToastContext.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";
import {
  IconBuilding,
  IconUsers,
} from "../../components/icons.jsx";

export default function AdminHome() {
  const toast = useToast();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [centres, setCentres] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getCentres(),
      api.getAllBookings(),
    ])
      .then(([centreData, bookingData]) => {
        setCentres(centreData.centres || []);
        setBookings(bookingData.bookings || []);
      })
      .catch((err) => {
        toast(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [toast]);

  const farmers = useMemo(() => {
    const unique = new Set();

    bookings.forEach((booking) => {
      unique.add(
        String(
          booking.farmer?._id ||
            booking.farmer ||
            booking.mobile ||
            booking.farmerName ||
            booking._id
        )
      );
    });

    return unique;
  }, [bookings]);

  const openCentres = useMemo(() => {
    return centres.filter(
      (centre) => centre.status === "OPEN"
    ).length;
  }, [centres]);

  const totalCapacity = useMemo(() => {
    return centres.reduce(
      (sum, centre) =>
        sum + Number(centre.capacity || 0),
      0
    );
  }, [centres]);

  const totalBooked = useMemo(() => {
    return centres.reduce(
      (sum, centre) =>
        sum + Number(centre.booked || 0),
      0
    );
  }, [centres]);

  const utilization = useMemo(() => {
    if (!totalCapacity) return 0;

    return Math.min(
      100,
      Math.round(
        (totalBooked / totalCapacity) * 100
      )
    );
  }, [totalCapacity, totalBooked]);

  const centreStatusLabel = (status) => {
    return status === "OPEN"
      ? t("open")
      : t("closed");
  };

  const goToCentres = () => {
    navigate("/app/centres");
  };

  const goToBookings = () => {
    navigate("/app/history");
  };

  if (loading) {
    return (
      <div className="empty">
        <div className="loader-ring" />
        {t("loadingAdminDashboard")}
      </div>
    );
  }

  return (
    <div className="dashboard-page admin-dashboard operator-style-admin dashboard-polished">
      <style>{`
        /* =========================
           DASHBOARD POLISH
        ========================= */

        .dashboard-polished .dashboard-welcome-premium,
        .dashboard-polished .dashboard-stat-premium,
        .dashboard-polished .dashboard-overview-premium,
        .dashboard-polished .dashboard-table-premium,
        .dashboard-polished .dashboard-quick-action-premium {
          transition:
            transform .25s ease,
            box-shadow .25s ease,
            border-color .25s ease,
            background-color .25s ease;
        }

        /* HERO */

        .dashboard-polished .dashboard-welcome-premium:hover {
          transform: translateY(-3px);
          border-color: #d6e0e7;
          box-shadow:
            0 18px 38px rgba(30, 45, 60, .10);
        }

        /* KPI CARDS */

        .dashboard-polished .dashboard-stat-premium {
          position: relative;
          overflow: hidden;
          cursor: pointer;
        }

        .dashboard-polished .dashboard-stat-premium::after {
          content: "";
          position: absolute;
          left: 0;
          bottom: 0;
          width: 0;
          height: 3px;
          background: #176b4d;
          border-radius: 999px;
          transition: width .3s ease;
        }

        .dashboard-polished .dashboard-stat-premium:hover {
          transform: translateY(-6px);
          border-color: #d2dce4;
          box-shadow:
            0 16px 34px rgba(30, 45, 60, .11);
        }

        .dashboard-polished
        .dashboard-stat-premium:hover::after {
          width: 100%;
        }

        .dashboard-polished
        .dashboard-stat-premium
        .admin-stat-icon {
          transition:
            transform .25s ease,
            background .25s ease,
            color .25s ease;
        }

        .dashboard-polished
        .dashboard-stat-premium:hover
        .admin-stat-icon {
          transform: scale(1.07) rotate(-2deg);
        }

        /* BOOKING ICON */

        .dashboard-polished .dashboard-symbol-icon {
          display: grid;
          place-items: center;
          font-size: 22px;
          font-weight: 700;
        }

        .dashboard-polished .dashboard-ticket-icon {
          color: #b65d88;
          background: #fff1f7;
        }

        /* OPEN CENTRE ICON */

        .dashboard-polished .dashboard-open-icon {
          display: grid;
          place-items: center;
          background: #eaf8f1;
        }

        .dashboard-polished
        .dashboard-open-icon span {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #31b979;
          box-shadow:
            0 0 0 5px rgba(49, 185, 121, .12);
        }

        /* OVERVIEW CARDS */

        .dashboard-polished
        .dashboard-overview-premium:hover {
          transform: translateY(-4px);
          border-color: #d3dde5;
          box-shadow:
            0 15px 32px rgba(30, 45, 60, .09);
        }

        /* CENTRE TABLE */

        .dashboard-polished
        .dashboard-table-premium:hover {
          border-color: #d6dfe6;
          box-shadow:
            0 14px 30px rgba(30, 45, 60, .07);
        }

        .dashboard-polished
        .dashboard-centre-row {
          transition:
            background-color .2s ease;
        }

        .dashboard-polished
        .dashboard-centre-row:hover {
          background: #f7fafc;
        }

        .dashboard-polished
        .dashboard-centre-row
        td:first-child strong {
          transition: color .2s ease;
        }

        .dashboard-polished
        .dashboard-centre-row:hover
        td:first-child strong {
          color: #176b4d;
        }

        /* QUICK ACTIONS */

        .dashboard-polished
        .dashboard-quick-action-premium:hover {
          transform: translateY(-4px);
          border-color: #d1dce4;
          background: #ffffff;
          box-shadow:
            0 13px 28px rgba(30, 45, 60, .09);
        }

        .dashboard-polished
        .dashboard-action-icon {
          width: 42px;
          height: 42px;
          flex: 0 0 42px;
          display: grid;
          place-items: center;
          border-radius: 12px;
          background: #f0f5f3;
          color: #176b4d;
          font-size: 20px;
          font-weight: 700;
          transition:
            transform .25s ease,
            background .25s ease;
        }

        .dashboard-polished
        .dashboard-quick-action-premium:hover
        .dashboard-action-icon {
          transform: scale(1.08);
          background: #e7f4ee;
        }

        .dashboard-polished
        .admin-card-arrow {
          transition:
            transform .2s ease,
            color .2s ease;
        }

        .dashboard-polished
        .dashboard-stat-premium:hover
        .admin-card-arrow,
        .dashboard-polished
        .dashboard-quick-action-premium:hover b {
          transform: translateX(4px);
        }

        /* REDUCED MOTION */

        @media (prefers-reduced-motion: reduce) {
          .dashboard-polished
          .dashboard-welcome-premium,
          .dashboard-polished
          .dashboard-stat-premium,
          .dashboard-polished
          .dashboard-overview-premium,
          .dashboard-polished
          .dashboard-table-premium,
          .dashboard-polished
          .dashboard-quick-action-premium,
          .dashboard-polished
          .dashboard-action-icon,
          .dashboard-polished
          .admin-stat-icon,
          .dashboard-polished
          .admin-card-arrow {
            transition: none;
          }

          .dashboard-polished
          .dashboard-welcome-premium:hover,
          .dashboard-polished
          .dashboard-stat-premium:hover,
          .dashboard-polished
          .dashboard-overview-premium:hover,
          .dashboard-polished
          .dashboard-quick-action-premium:hover {
            transform: none;
          }
        }
      `}</style>

      <div style={{ paddingBottom: 40 }}>

        {/* =========================
            WELCOME SECTION
        ========================= */}

        <section className="admin-welcome dashboard-welcome-premium">
          <div>
            <div className="hero-kicker">
              ADMIN CONTROL CENTRE
            </div>

            <h1>
              {t("adminDashboard")}
            </h1>

            <p>
              {t("manageBookings")}
            </p>
          </div>

          <div className="admin-welcome-mark">
            <IconBuilding />
          </div>
        </section>

        {/* =========================
            STAT CARDS
        ========================= */}

        <section className="admin-stat-grid admin-stat-grid-wide">

          {/* CENTRES */}

          <div
            className="admin-stat-card neutral admin-clickable-card dashboard-stat-premium"
            onClick={goToCentres}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (
                e.key === "Enter" ||
                e.key === " "
              ) {
                goToCentres();
              }
            }}
          >
            <div className="admin-stat-icon">
              <IconBuilding />
            </div>

            <span>
              {t("centres")}
            </span>

            <strong>
              {centres.length}
            </strong>

            <small>
              {t("registeredCentres")}
            </small>

            <div className="admin-card-arrow">
              →
            </div>
          </div>

          {/* FARMERS */}

          <div
            className="admin-stat-card neutral admin-clickable-card dashboard-stat-premium"
            onClick={goToBookings}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (
                e.key === "Enter" ||
                e.key === " "
              ) {
                goToBookings();
              }
            }}
          >
            <div className="admin-stat-icon">
              <IconUsers />
            </div>

            <span>
              {t("totalFarmers")}
            </span>

            <strong>
              {farmers.size}
            </strong>

            <small>
              Farmers with bookings
            </small>

            <div className="admin-card-arrow">
              →
            </div>
          </div>

          {/* TOTAL BOOKINGS */}

          <div
            className="admin-stat-card neutral admin-clickable-card dashboard-stat-premium"
            onClick={goToBookings}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (
                e.key === "Enter" ||
                e.key === " "
              ) {
                goToBookings();
              }
            }}
          >
            <div
              className="
                admin-stat-icon
                dashboard-symbol-icon
                dashboard-ticket-icon
              "
              aria-hidden="true"
            >
              ▣
            </div>

            <span>
              Total Bookings
            </span>

            <strong>
              {bookings.length}
            </strong>

            <small>
              All procurement bookings
            </small>

            <div className="admin-card-arrow">
              →
            </div>
          </div>

          {/* OPEN CENTRES */}

          <div
            className="admin-stat-card neutral admin-clickable-card dashboard-stat-premium"
            onClick={goToCentres}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (
                e.key === "Enter" ||
                e.key === " "
              ) {
                goToCentres();
              }
            }}
          >
            <div
              className="
                admin-stat-icon
                dashboard-symbol-icon
                dashboard-open-icon
              "
              aria-hidden="true"
            >
              <span />
            </div>

            <span>
              Open Centres
            </span>

            <strong>
              {openCentres}
            </strong>

            <small>
              Currently operational
            </small>

            <div className="admin-card-arrow">
              →
            </div>
          </div>

        </section>

        {/* =========================
            CAPACITY + STATUS
        ========================= */}

        <section className="admin-overview-grid">

          {/* CAPACITY */}

          <div className="admin-overview-card dashboard-overview-premium">

            <div className="admin-section-head">
              <div>
                <span className="operator-label">
                  PROCUREMENT
                </span>

                <h2>
                  Procurement Capacity
                </h2>
              </div>
            </div>

            <div className="admin-capacity-content">

              <div className="admin-capacity-number">
                <strong>
                  {utilization}%
                </strong>

                <span>
                  Capacity Used
                </span>
              </div>

              <div className="admin-progress">
                <div
                  className="admin-progress-fill"
                  style={{
                    width: `${utilization}%`,
                  }}
                />
              </div>

              <div className="admin-capacity-info">

                <div>
                  <span>
                    Total Capacity
                  </span>

                  <strong>
                    {totalCapacity}
                  </strong>
                </div>

                <div>
                  <span>
                    Booked
                  </span>

                  <strong>
                    {totalBooked}
                  </strong>
                </div>

                <div>
                  <span>
                    Available
                  </span>

                  <strong>
                    {Math.max(
                      0,
                      totalCapacity - totalBooked
                    )}
                  </strong>
                </div>

              </div>

            </div>
          </div>

          {/* CENTRE STATUS */}

          <div className="admin-overview-card dashboard-overview-premium">

            <div className="admin-section-head">
              <div>
                <span className="operator-label">
                  SYSTEM STATUS
                </span>

                <h2>
                  Centre Operations
                </h2>
              </div>
            </div>

            <div className="admin-status-summary">

              <div className="admin-status-item">
                <span className="admin-status-dot green-dot" />

                <div>
                  <strong>
                    {openCentres}
                  </strong>

                  <small>
                    Open Centres
                  </small>
                </div>
              </div>

              <div className="admin-status-item">
                <span className="admin-status-dot red-dot" />

                <div>
                  <strong>
                    {centres.length - openCentres}
                  </strong>

                  <small>
                    Closed Centres
                  </small>
                </div>
              </div>

            </div>
          </div>

        </section>

        {/* =========================
            CENTRE TABLE
        ========================= */}

        <section className="admin-farmer-section admin-centre-overview dashboard-table-premium">

          <div className="admin-section-head">

            <div>
              <span className="operator-label">
                CONTROL CENTRE
              </span>

              <h2>
                Centre Operations
              </h2>
            </div>

            <button
              className="admin-view-all-btn"
              onClick={goToCentres}
            >
              View All →
            </button>

          </div>

          {centres.length === 0 ? (

            <div className="empty">
              {t("noCentersAvailable")}
            </div>

          ) : (

            <div className="tablebox">

              <table className="table">

                <thead>
                  <tr>
                    <th>
                      {t("center")}
                    </th>

                    <th>
                      {t("district")}
                    </th>

                    <th>
                      {t("capacity")}
                    </th>

                    <th>
                      Utilization
                    </th>

                    <th>
                      {t("status")}
                    </th>

                    <th>
                      {t("booked")}
                    </th>
                  </tr>
                </thead>

                <tbody>

                  {centres.map((centre) => {

                    const capacity =
                      Number(
                        centre.capacity || 0
                      );

                    const booked =
                      Number(
                        centre.booked || 0
                      );

                    const percentage =
                      capacity > 0
                        ? Math.min(
                            100,
                            Math.round(
                              (booked / capacity) * 100
                            )
                          )
                        : 0;

                    return (
                      <tr
                        key={centre._id}
                        className="dashboard-centre-row"
                      >

                        <td>
                          <strong>
                            {centre.name}
                          </strong>
                        </td>

                        <td>
                          {centre.district || "-"}
                        </td>

                        <td>
                          {capacity}
                        </td>

                        <td>

                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              minWidth: "120px",
                            }}
                          >

                            <div
                              style={{
                                flex: 1,
                                height: "7px",
                                background: "#e5e7eb",
                                borderRadius: "10px",
                                overflow: "hidden",
                              }}
                            >

                              <div
                                style={{
                                  width:
                                    `${percentage}%`,
                                  height: "100%",
                                  background:
                                    percentage >= 90
                                      ? "#ef4444"
                                      : percentage >= 70
                                      ? "#f59e0b"
                                      : "#22c55e",
                                  borderRadius:
                                    "10px",
                                }}
                              />

                            </div>

                            <span>
                              {percentage}%
                            </span>

                          </div>

                        </td>

                        <td>

                          <span
                            className={`status ${
                              centre.status === "OPEN"
                                ? "green"
                                : "red"
                            }`}
                          >
                            {centreStatusLabel(
                              centre.status
                            )}
                          </span>

                        </td>

                        <td>
                          {booked}
                        </td>

                      </tr>
                    );
                  })}

                </tbody>

              </table>

            </div>

          )}

        </section>

        {/* =========================
            QUICK ACTIONS
        ========================= */}

        <section className="admin-quick-actions">

          <button
            className="admin-quick-action dashboard-quick-action-premium"
            onClick={goToCentres}
          >

            <span
              className="dashboard-action-icon"
              aria-hidden="true"
            >
              ▦
            </span>

            <div>
              <strong>
                Manage Centres
              </strong>

              <small>
                Add or update procurement centres
              </small>
            </div>

            <b>
              →
            </b>

          </button>

          <button
            className="admin-quick-action dashboard-quick-action-premium"
            onClick={goToBookings}
          >

            <span
              className="dashboard-action-icon"
              aria-hidden="true"
            >
              ☷
            </span>

            <div>
              <strong>
                View All Bookings
              </strong>

              <small>
                Monitor farmer procurement bookings
              </small>
            </div>

            <b>
              →
            </b>

          </button>

        </section>

      </div>
    </div>
  );
}