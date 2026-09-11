import { useEffect, useMemo, useState } from "react";
import { api } from "../../api/api";
import { useToast } from "../../context/ToastContext.jsx";
import { IconAudit } from "../../components/icons.jsx";

export default function AuditLog() {
  const toast = useToast();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getAudit()
      .then((data) => setLogs(data.logs || []))
      .catch((err) => toast(err.message))
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const users = new Set(
      logs.map((log) => log.userName).filter(Boolean)
    );

    const today = new Date().toDateString();

    const todayActions = logs.filter(
      (log) =>
        log.createdAt &&
        new Date(log.createdAt).toDateString() === today
    ).length;

    return {
      total: logs.length,
      users: users.size,
      today: todayActions,
    };
  }, [logs]);

  if (loading) {
    return (
      <>
        <style>{`
          .audit-loading {
            min-height: 360px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 12px;
            color: #737d86;
          }

          .audit-loading strong {
            display: block;
            color: #25303a;
            font-size: 14px;
          }

          .audit-loading span {
            display: block;
            margin-top: 4px;
            font-size: 12px;
          }
        `}</style>

        <div className="audit-loading">
          <div className="loader-ring" />

          <div>
            <strong>Loading audit log</strong>
            <span>Fetching system activity...</span>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`
        .audit-page {
          width: 100%;
          min-width: 0;
        }

        /* =========================
           HERO
        ========================= */

        .audit-hero {
          position: relative;
          overflow: hidden;

          padding: 34px 38px;
          margin-bottom: 22px;

          border-radius: 22px;
          border: 1px solid #e1e6ea;

          background:
            radial-gradient(
              circle at 88% 12%,
              rgba(39, 92, 156, 0.08),
              transparent 28%
            ),
            linear-gradient(
              135deg,
              #f5f7f9 0%,
              #eef1f4 55%,
              #e9edf1 100%
            );

          box-shadow: 0 12px 30px rgba(30, 45, 60, 0.06);

          transition:
            transform 0.25s ease,
            box-shadow 0.25s ease;
        }

        .audit-hero:hover {
          transform: translateY(-2px);
          box-shadow: 0 16px 34px rgba(30, 45, 60, 0.08);
        }

        .audit-hero::after {
          content: "";

          position: absolute;

          width: 240px;
          height: 240px;

          right: -80px;
          bottom: -120px;

          border-radius: 50%;

          border: 35px solid rgba(39, 92, 156, 0.055);
        }

        .audit-hero-content {
          position: relative;
          z-index: 1;
        }

        .audit-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;

          margin-bottom: 10px;

          color: #275c9c;

          font-size: 11px;
          font-weight: 800;

          letter-spacing: 1.5px;
          text-transform: uppercase;
        }

        .audit-eyebrow::before {
          content: "";

          width: 7px;
          height: 7px;

          border-radius: 50%;

          background: #275c9c;

          box-shadow:
            0 0 0 5px rgba(39, 92, 156, 0.09);
        }

        .audit-hero h1 {
          display: flex;
          align-items: center;
          gap: 13px;

          margin: 0;

          color: #17212b;

          font-size: clamp(28px, 3vw, 38px);
          line-height: 1.1;

          letter-spacing: -0.8px;
        }

        .audit-hero h1 svg {
          width: 32px;
          height: 32px;
          color: #275c9c;
        }

        .audit-hero p {
          max-width: 650px;

          margin: 13px 0 0;

          color: #68737d;

          font-size: 14px;
          line-height: 1.7;
        }

        /* =========================
           STAT CARDS
        ========================= */

        .audit-stats {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));

          gap: 16px;

          margin-bottom: 22px;
        }

        .audit-stat {
          position: relative;
          overflow: hidden;

          min-width: 0;

          padding: 20px 21px;

          border: 1px solid #e3e7ea;
          border-radius: 18px;

          background: #ffffff;

          box-shadow:
            0 7px 22px rgba(30, 45, 60, 0.055);

          cursor: default;

          transition:
            transform 0.25s ease,
            box-shadow 0.25s ease,
            border-color 0.25s ease;
        }

        .audit-stat::after {
          content: "";

          position: absolute;

          width: 90px;
          height: 90px;

          right: -35px;
          bottom: -45px;

          border-radius: 50%;

          background: rgba(39, 92, 156, 0.035);

          transition:
            transform 0.3s ease,
            background 0.3s ease;
        }

        .audit-stat:hover {
          transform: translateY(-6px);

          border-color: #cbd4dc;

          box-shadow:
            0 16px 34px rgba(30, 45, 60, 0.12);
        }

        .audit-stat:hover::after {
          transform: scale(1.35);
          background: rgba(39, 92, 156, 0.055);
        }

        .audit-stat-top {
          position: relative;
          z-index: 1;

          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 12px;

          margin-bottom: 13px;
        }

        .audit-stat-label {
          color: #737d86;

          font-size: 12px;
          font-weight: 700;
        }

        .audit-stat-icon {
          position: relative;
          z-index: 2;

          display: grid;
          place-items: center;

          width: 38px;
          height: 38px;

          border-radius: 11px;

          background: #f1f3f5;
          color: #4d5963;

          font-size: 13px;
          font-weight: 800;

          transition:
            transform 0.25s ease,
            background 0.25s ease,
            color 0.25s ease;
        }

        .audit-stat:hover .audit-stat-icon {
          transform: scale(1.08) rotate(-2deg);

          background: #e7ebef;
          color: #275c9c;
        }

        .audit-stat-value {
          position: relative;
          z-index: 1;

          color: #17212b;

          font-size: 29px;
          line-height: 1.1;

          font-weight: 800;

          letter-spacing: -0.7px;

          transition: color 0.25s ease;
        }

        .audit-stat:hover .audit-stat-value {
          color: #275c9c;
        }

        .audit-stat-meta {
          position: relative;
          z-index: 1;

          margin-top: 7px;

          color: #8a949c;

          font-size: 11px;
        }

        /* =========================
           MAIN ACTIVITY CARD
        ========================= */

        .audit-card {
          overflow: hidden;

          border: 1px solid #e3e7ea;
          border-radius: 19px;

          background: #ffffff;

          box-shadow:
            0 7px 22px rgba(30, 45, 60, 0.045);

          transition:
            transform 0.25s ease,
            box-shadow 0.25s ease,
            border-color 0.25s ease;
        }

        .audit-card:hover {
          transform: translateY(-3px);

          border-color: #d2d9df;

          box-shadow:
            0 15px 34px rgba(30, 45, 60, 0.09);
        }

        .audit-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 15px;

          padding: 20px 22px;

          border-bottom: 1px solid #edf0f2;
        }

        .audit-card-heading {
          display: flex;
          align-items: center;

          gap: 12px;
        }

        .audit-card-icon {
          display: grid;
          place-items: center;

          width: 40px;
          height: 40px;

          border-radius: 11px;

          background: #f1f3f5;
          color: #4d5963;

          transition:
            transform 0.25s ease,
            background 0.25s ease;
        }

        .audit-card:hover .audit-card-icon {
          transform: scale(1.05);

          background: #e9edf1;
          color: #275c9c;
        }

        .audit-card-icon svg {
          width: 19px;
          height: 19px;
        }

        .audit-card-title {
          margin: 0;

          color: #1c2730;

          font-size: 15px;
          font-weight: 800;
        }

        .audit-card-subtitle {
          margin: 4px 0 0;

          color: #89939b;

          font-size: 11px;
        }

        .audit-live {
          display: inline-flex;
          align-items: center;
          gap: 7px;

          padding: 7px 11px;

          border-radius: 999px;

          background: #f1f3f5;
          color: #59646d;

          font-size: 10px;
          font-weight: 800;

          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .audit-live::before {
          content: "";

          width: 6px;
          height: 6px;

          border-radius: 50%;

          background: #64748b;

          box-shadow:
            0 0 0 4px rgba(100, 116, 139, 0.08);
        }

        /* =========================
           ACTIVITY LIST
        ========================= */

        .audit-list {
          padding: 5px 22px 9px;
        }

        .audit-row {
          position: relative;

          display: grid;

          grid-template-columns:
            minmax(0, 1fr)
            auto;

          align-items: center;

          gap: 20px;

          padding: 16px 12px;

          margin: 0 -12px;

          border-bottom: 1px solid #edf0f2;

          border-radius: 12px;

          transition:
            background 0.22s ease,
            transform 0.22s ease,
            box-shadow 0.22s ease;
        }

        .audit-row:last-child {
          border-bottom: none;
        }

        .audit-row::before {
          content: "";

          position: absolute;

          left: 0;
          top: 50%;

          width: 3px;
          height: 0;

          border-radius: 4px;

          background: #275c9c;

          transform: translateY(-50%);

          transition: height 0.22s ease;
        }

        .audit-row:hover {
          background: #f7f9fa;

          transform: translateX(3px);

          box-shadow:
            0 5px 16px rgba(30, 45, 60, 0.045);
        }

        .audit-row:hover::before {
          height: 52%;
        }

        .audit-main {
          display: flex;
          align-items: center;

          gap: 13px;

          min-width: 0;
        }

        /* =========================
           AVATAR
        ========================= */

        .audit-avatar {
          display: grid;
          place-items: center;

          flex-shrink: 0;

          width: 42px;
          height: 42px;

          border-radius: 12px;

          background: #f1f3f5;
          color: #4d5963;

          font-size: 13px;
          font-weight: 800;

          transition:
            transform 0.25s ease,
            background 0.25s ease,
            color 0.25s ease;
        }

        .audit-row:hover .audit-avatar {
          transform: scale(1.08);

          background: #e8edf2;
          color: #275c9c;
        }

        .audit-info {
          min-width: 0;
        }

        .audit-action {
          margin: 0;

          color: #25303a;

          font-size: 13px;
          font-weight: 800;

          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;

          transition: color 0.2s ease;
        }

        .audit-row:hover .audit-action {
          color: #275c9c;
        }

        .audit-user {
          margin-top: 4px;

          color: #8a949c;

          font-size: 11px;
        }

        .audit-user strong {
          color: #65717a;
          font-weight: 700;
        }

        /* =========================
           DATE
        ========================= */

        .audit-date {
          display: flex;
          flex-direction: column;
          align-items: flex-end;

          gap: 4px;

          color: #65717a;

          font-size: 11px;

          white-space: nowrap;
        }

        .audit-date-label {
          color: #a0a8ae;

          font-size: 10px;

          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* =========================
           EMPTY STATE
        ========================= */

        .audit-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;

          min-height: 280px;

          padding: 45px 20px;

          text-align: center;
        }

        .audit-empty-icon {
          display: grid;
          place-items: center;

          width: 62px;
          height: 62px;

          margin-bottom: 15px;

          border-radius: 17px;

          background: #f1f3f5;
          color: #59646d;
        }

        .audit-empty-icon svg {
          width: 28px;
          height: 28px;
        }

        .audit-empty h3 {
          margin: 0;

          color: #25303a;

          font-size: 15px;
        }

        .audit-empty p {
          max-width: 390px;

          margin: 7px 0 0;

          color: #89939b;

          font-size: 12px;
          line-height: 1.6;
        }

        /* =========================
           FOOTER
        ========================= */

        .audit-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 15px;

          padding: 15px 4px 3px;

          color: #89939b;

          font-size: 11px;
        }

        .audit-footer strong {
          color: #59646d;
        }

        /* =========================
           RESPONSIVE
        ========================= */

        @media (max-width: 800px) {
          .audit-stats {
            grid-template-columns: 1fr;
          }

          .audit-hero {
            padding: 28px 25px;
            border-radius: 18px;
          }
        }

        @media (max-width: 560px) {
          .audit-hero {
            padding: 24px 20px;
          }

          .audit-hero h1 {
            font-size: 27px;
          }

          .audit-card-header {
            padding: 17px;
          }

          .audit-list {
            padding-left: 17px;
            padding-right: 17px;
          }

          .audit-row {
            grid-template-columns: 1fr;

            gap: 10px;
          }

          .audit-date {
            align-items: flex-start;

            padding-left: 55px;
          }

          .audit-footer {
            flex-direction: column;
            align-items: flex-start;
          }

          .audit-live {
            display: none;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .audit-hero,
          .audit-stat,
          .audit-card,
          .audit-row,
          .audit-stat-icon,
          .audit-card-icon,
          .audit-avatar {
            transition: none;
          }
        }
      `}</style>

      <div className="audit-page">

        {/* HERO */}

        <section className="audit-hero">
          <div className="audit-hero-content">

            <div className="audit-eyebrow">
              System activity
            </div>

            <h1>
              <IconAudit />
              Audit Log
            </h1>

            <p>
              Track important actions performed across the procurement
              management system for transparency and accountability.
            </p>

          </div>
        </section>

        {/* STATS */}

        <section className="audit-stats">

          <div className="audit-stat">
            <div className="audit-stat-top">

              <span className="audit-stat-label">
                Total Actions
              </span>

              <span className="audit-stat-icon">
                #
              </span>

            </div>

            <div className="audit-stat-value">
              {stats.total.toLocaleString("en-IN")}
            </div>

            <div className="audit-stat-meta">
              Recorded system activities
            </div>
          </div>


          <div className="audit-stat">
            <div className="audit-stat-top">

              <span className="audit-stat-label">
                Active Users
              </span>

              <span className="audit-stat-icon">
                U
              </span>

            </div>

            <div className="audit-stat-value">
              {stats.users.toLocaleString("en-IN")}
            </div>

            <div className="audit-stat-meta">
              Users who performed actions
            </div>
          </div>


          <div className="audit-stat">
            <div className="audit-stat-top">

              <span className="audit-stat-label">
                Today's Activity
              </span>

              <span className="audit-stat-icon">
                T
              </span>

            </div>

            <div className="audit-stat-value">
              {stats.today.toLocaleString("en-IN")}
            </div>

            <div className="audit-stat-meta">
              Actions recorded today
            </div>
          </div>

        </section>

        {/* ACTIVITY HISTORY */}

        <section className="audit-card">

          <div className="audit-card-header">

            <div className="audit-card-heading">

              <div className="audit-card-icon">
                <IconAudit />
              </div>

              <div>
                <h3 className="audit-card-title">
                  Activity History
                </h3>

                <p className="audit-card-subtitle">
                  Recent actions performed in the system
                </p>
              </div>

            </div>

            <span className="audit-live">
              Activity log
            </span>

          </div>


          {logs.length === 0 ? (

            <div className="audit-empty">

              <div className="audit-empty-icon">
                <IconAudit />
              </div>

              <h3>
                No actions recorded
              </h3>

              <p>
                System activity will appear here once users
                start performing actions.
              </p>

            </div>

          ) : (

            <div className="audit-list">

              {logs.map((a) => {

                const userName = a.userName || "System";

                const initials = userName
                  .split(" ")
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((word) => word[0])
                  .join("")
                  .toUpperCase();

                const date = a.createdAt
                  ? new Date(a.createdAt)
                  : null;

                return (
                  <div
                    key={a._id}
                    className="audit-row"
                  >

                    <div className="audit-main">

                      <div className="audit-avatar">
                        {initials || "S"}
                      </div>

                      <div className="audit-info">

                        <p className="audit-action">
                          {a.action || "System action"}
                        </p>

                        <div className="audit-user">
                          Performed by{" "}
                          <strong>
                            {userName}
                          </strong>
                        </div>

                      </div>

                    </div>


                    <div className="audit-date">

                      <span className="audit-date-label">
                        Timestamp
                      </span>

                      <span>
                        {date
                          ? date.toLocaleString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "-"}
                      </span>

                    </div>

                  </div>
                );
              })}

            </div>

          )}

        </section>

        {/* FOOTER */}

        <div className="audit-footer">

          <span>
            <strong>Audit overview</strong>
            {" "}· System activity monitoring
          </span>

          <span>
            {stats.total.toLocaleString("en-IN")} total records
          </span>

        </div>

      </div>
    </>
  );
}