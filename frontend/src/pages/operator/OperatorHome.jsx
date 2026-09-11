import { useAuth } from "../../context/AuthContext.jsx";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/api";
import { useToast } from "../../context/ToastContext.jsx";
import { useQueueEvents } from "../../context/SocketContext.jsx";
import QueueTable from "../../components/QueueTable.jsx";

import {
  IconCheckCircle,
  IconClock,
  IconHome,
  IconWallet,
  IconUsers,
  IconRefresh,
} from "../../components/icons.jsx";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function OperatorHome() {
  const toast = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [all, setAll] = useState([]);
  const [active, setActive] = useState([]);
  const [centre, setCentre] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load(silent = false) {
    if (!silent) setLoading(true);

    try {
      const [
        allData,
        activeData,
        centreData,
        notificationData,
        auditData,
      ] = await Promise.all([
        api.getAllBookings(),
        api.getActiveBookings(),
        api.getCentres(),
        api.getMyNotifications(),
        api.getMyAudit(),
      ]);

      setAll(allData.bookings || []);
      setActive(activeData.bookings || []);
      setCentre(centreData.centres?.[0] || null);
      setNotifications(notificationData.notifications || []);
      setActivity(auditData.logs || []);
    } catch (err) {
      toast(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useQueueEvents(
    ["booking:created", "booking:updated"],
    () => load(true)
  );

  async function handleCall(id) {
    try {
      await api.callToken(id);
      toast("Token called");
      load(true);
    } catch (err) {
      toast(err.message);
    }
  }

  function handleProcess(id) {
    navigate("/app/process", {
      state: {
        bookingId: id,
      },
    });

    api.startService(id).catch((err) => {
      toast(err.message);
    });
  }

  async function refresh() {
    setRefreshing(true);
    await load(true);
  }

  const today = todayISO();

  const todayBookings = useMemo(() => {
    return all.filter((b) => b.date === today);
  }, [all]);

  const waiting = active.filter(
    (b) => b.status === "BOOKED"
  ).length;

  const called = active.filter(
    (b) => b.status === "CALLED"
  ).length;

  const inService = active.filter(
    (b) => b.status === "IN_SERVICE"
  ).length;

  const completedToday = todayBookings.filter(
    (b) => b.status === "COMPLETED"
  ).length;

  const paid = all.filter(
    (b) => b.payment === "PAID"
  ).length;

  const current =
    active.find((b) => b.status === "IN_SERVICE") ||
    active.find((b) => b.status === "CALLED");

  const unread = notifications.filter(
    (n) => !n.read
  ).length;

  if (loading) {
    return (
      <div
        style={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 12,
          color: "#667085",
        }}
      >
        <div className="loader-ring" />
        Loading operator workspace…
      </div>
    );
  }

  return (
    <div
      className="dashboard-page operator-dashboard"
      style={{
        paddingBottom: 40,
      }}
    >

      {/* =====================================================
          WELCOME HERO
      ====================================================== */}

      <section
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 20,
          padding: "28px 30px",
          marginBottom: 20,
          borderRadius: 22,
          background:
            "linear-gradient(135deg, #f0fdf4 0%, #ffffff 58%, #fffbeb 100%)",
          border: "1px solid #dcfce7",
          boxShadow: "0 8px 30px rgba(15, 23, 42, 0.05)",
        }}
      >

        <div>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 11px",
              borderRadius: 999,
              background: "#dcfce7",
              color: "#166534",
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.08em",
              marginBottom: 10,
            }}
          >
            <span>●</span>
            OPERATOR WORKSPACE
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: "clamp(26px, 3vw, 36px)",
              lineHeight: 1.15,
              color: "#14211a",
              fontWeight: 800,
            }}
          >
            Good day, {user?.name || "Operator"} 👋
          </h1>

          <p
            style={{
              margin: "9px 0 0",
              color: "#667085",
              fontSize: 14,
              maxWidth: 620,
            }}
          >
            Manage your mandi queue, farmer applications
            and procurement from one place.
          </p>

        </div>


        <button
          className="btn alt"
          onClick={refresh}
          disabled={refreshing}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            minWidth: 110,
            justifyContent: "center",
            borderRadius: 12,
          }}
        >

          <IconRefresh
            style={{
              width: 16,
              height: 16,
            }}
          />

          {refreshing ? "Refreshing…" : "Refresh"}

        </button>

      </section>


      {/* =====================================================
          CENTRE CARD
      ====================================================== */}

      <section
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 20,
          padding: "20px 24px",
          marginBottom: 22,
          borderRadius: 18,
          background: "#ffffff",
          border: "1px solid #e6e9ed",
          boxShadow: "0 5px 20px rgba(15, 23, 42, 0.04)",
        }}
      >

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 15,
          }}
        >

          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 15,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#ecfdf3",
              color: "#16803c",
              flexShrink: 0,
            }}
          >
            <IconHome />
          </div>


          <div>

            <div
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: "#8a95a5",
                letterSpacing: "0.1em",
                marginBottom: 4,
              }}
            >
              ASSIGNED PROCUREMENT CENTRE
            </div>

            <div
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: "#17211b",
              }}
            >
              {centre?.name || "No centre assigned"}
            </div>

            <div
              style={{
                fontSize: 13,
                color: "#737d8c",
                marginTop: 3,
              }}
            >
              {centre?.district ||
                "Ask an admin to assign a procurement centre."}
            </div>

          </div>

        </div>


        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "9px 13px",
            borderRadius: 999,
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            color: "#15803d",
            fontSize: 12,
            fontWeight: 700,
            whiteSpace: "nowrap",
          }}
        >
          <span>🔒</span>
          Centre locked
        </div>

      </section>


      {/* =====================================================
          STAT CARDS
      ====================================================== */}

      <section
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(210px, 1fr))",
          gap: 15,
          marginBottom: 22,
        }}
      >

        {/* TOTAL FARMERS */}

        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e6e9ed",
            borderRadius: 18,
            padding: 20,
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 5px 18px rgba(15,23,42,0.035)",
          }}
        >

          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#eff6ff",
              color: "#2563eb",
              marginBottom: 15,
            }}
          >
            <IconUsers />
          </div>

          <div
            style={{
              color: "#7a8493",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Total Farmers
          </div>

          <div
            style={{
              fontSize: 32,
              fontWeight: 850,
              color: "#17211b",
              marginTop: 4,
            }}
          >
            {all.length}
          </div>

          <div
            style={{
              marginTop: 5,
              color: "#8a95a5",
              fontSize: 12,
            }}
          >
            All applications
          </div>

        </div>


        {/* WAITING */}

        <div
          style={{
            background: "#ffffff",
            border: "1px solid #f1e4bd",
            borderRadius: 18,
            padding: 20,
            boxShadow: "0 5px 18px rgba(15,23,42,0.035)",
          }}
        >

          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#fff8df",
              color: "#b7791f",
              marginBottom: 15,
            }}
          >
            <IconClock />
          </div>

          <div
            style={{
              color: "#7a8493",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Waiting Now
          </div>

          <div
            style={{
              fontSize: 32,
              fontWeight: 850,
              color: "#17211b",
              marginTop: 4,
            }}
          >
            {waiting}
          </div>

          <div
            style={{
              marginTop: 5,
              color: "#8a95a5",
              fontSize: 12,
            }}
          >
            {called} called • {inService} in service
          </div>

        </div>


        {/* COMPLETED */}

        <div
          style={{
            background: "#ffffff",
            border: "1px solid #d9f0e1",
            borderRadius: 18,
            padding: 20,
            boxShadow: "0 5px 18px rgba(15,23,42,0.035)",
          }}
        >

          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#ecfdf3",
              color: "#16a34a",
              marginBottom: 15,
            }}
          >
            <IconCheckCircle />
          </div>

          <div
            style={{
              color: "#7a8493",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Completed Today
          </div>

          <div
            style={{
              fontSize: 32,
              fontWeight: 850,
              color: "#17211b",
              marginTop: 4,
            }}
          >
            {completedToday}
          </div>

          <div
            style={{
              marginTop: 5,
              color: "#8a95a5",
              fontSize: 12,
            }}
          >
            {todayBookings.length} applications today
          </div>

        </div>


        {/* PAID */}

        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: 18,
            padding: 20,
            boxShadow: "0 5px 18px rgba(15,23,42,0.035)",
          }}
        >

          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#f5f3ff",
              color: "#7c3aed",
              marginBottom: 15,
            }}
          >
            <IconWallet />
          </div>

          <div
            style={{
              color: "#7a8493",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Paid
          </div>

          <div
            style={{
              fontSize: 32,
              fontWeight: 850,
              color: "#17211b",
              marginTop: 4,
            }}
          >
            {paid}
          </div>

          <div
            style={{
              marginTop: 5,
              color: "#8a95a5",
              fontSize: 12,
            }}
          >
            Completed payments
          </div>

        </div>

      </section>


      {/* =====================================================
          QUEUE STATUS OVERVIEW
      ====================================================== */}

      <section
        style={{
          background: "#ffffff",
          border: "1px solid #e6e9ed",
          borderRadius: 18,
          padding: "18px 22px",
          marginBottom: 22,
          boxShadow: "0 5px 18px rgba(15,23,42,0.035)",
        }}
      >

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 15,
          }}
        >

          <div>

            <div
              style={{
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: "0.1em",
                color: "#8a95a5",
              }}
            >
              QUEUE OVERVIEW
            </div>

            <h2
              style={{
                margin: "4px 0 0",
                fontSize: 19,
                color: "#17211b",
              }}
            >
              Today's desk status
            </h2>

          </div>

          <span
            style={{
              padding: "6px 10px",
              borderRadius: 999,
              background:
                active.length > 0
                  ? "#ecfdf3"
                  : "#f5f5f5",
              color:
                active.length > 0
                  ? "#15803d"
                  : "#667085",
              fontSize: 11,
              fontWeight: 800,
            }}
          >
            {active.length > 0
              ? "● LIVE"
              : "● IDLE"}
          </span>

        </div>


        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(3, 1fr)",
            gap: 12,
          }}
        >

          <div
            style={{
              padding: 15,
              borderRadius: 14,
              background: "#fffbeb",
              border: "1px solid #fef3c7",
            }}
          >
            <div
              style={{
                fontSize: 12,
                color: "#92400e",
                fontWeight: 700,
              }}
            >
              Waiting
            </div>

            <div
              style={{
                fontSize: 25,
                fontWeight: 800,
                color: "#78350f",
                marginTop: 4,
              }}
            >
              {waiting}
            </div>
          </div>


          <div
            style={{
              padding: 15,
              borderRadius: 14,
              background: "#eff6ff",
              border: "1px solid #dbeafe",
            }}
          >
            <div
              style={{
                fontSize: 12,
                color: "#1d4ed8",
                fontWeight: 700,
              }}
            >
              Called
            </div>

            <div
              style={{
                fontSize: 25,
                fontWeight: 800,
                color: "#1e3a8a",
                marginTop: 4,
              }}
            >
              {called}
            </div>
          </div>


          <div
            style={{
              padding: 15,
              borderRadius: 14,
              background: "#ecfdf3",
              border: "1px solid #d1fae5",
            }}
          >
            <div
              style={{
                fontSize: 12,
                color: "#15803d",
                fontWeight: 700,
              }}
            >
              In Service
            </div>

            <div
              style={{
                fontSize: 25,
                fontWeight: 800,
                color: "#166534",
                marginTop: 4,
              }}
            >
              {inService}
            </div>
          </div>

        </div>

      </section>


      {/* =====================================================
          CURRENT TOKEN + NOTIFICATIONS
      ====================================================== */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "minmax(0, 1.15fr) minmax(300px, 0.85fr)",
          gap: 18,
          marginBottom: 22,
        }}
      >

        {/* CURRENT TOKEN */}

        <section
          style={{
            background:
              "linear-gradient(135deg, #143d27 0%, #1d5a38 100%)",
            borderRadius: 20,
            padding: 25,
            color: "#ffffff",
            minHeight: 245,
            boxShadow:
              "0 12px 30px rgba(20,61,39,0.18)",
            position: "relative",
            overflow: "hidden",
          }}
        >

          <div
            style={{
              position: "absolute",
              width: 180,
              height: 180,
              borderRadius: "50%",
              background:
                "rgba(255,255,255,0.06)",
              right: -70,
              top: -70,
            }}
          />

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >

            <div>

              <div
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: "0.12em",
                  opacity: 0.7,
                }}
              >
                LIVE DESK
              </div>

              <h2
                style={{
                  margin: "5px 0 0",
                  fontSize: 21,
                }}
              >
                Current Token
              </h2>

            </div>


            <span
              style={{
                padding: "6px 10px",
                borderRadius: 999,
                background:
                  "rgba(255,255,255,0.12)",
                fontSize: 11,
                fontWeight: 800,
              }}
            >
              ● LIVE
            </span>

          </div>


          {current ? (

            <div
              style={{
                marginTop: 22,
                display: "flex",
                alignItems: "center",
                gap: 20,
              }}
            >

              <div
                style={{
                  width: 90,
                  height: 90,
                  borderRadius: 20,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background:
                    "rgba(255,255,255,0.12)",
                  border:
                    "1px solid rgba(255,255,255,0.18)",
                  fontSize: 25,
                  fontWeight: 900,
                }}
              >
                {current.token}
              </div>


              <div>

                <div
                  style={{
                    fontSize: 19,
                    fontWeight: 800,
                  }}
                >
                  {current.farmerName}
                </div>

                <div
                  style={{
                    marginTop: 5,
                    fontSize: 13,
                    opacity: 0.75,
                  }}
                >
                  {current.crop}
                </div>

                <div
                  style={{
                    marginTop: 5,
                    fontSize: 12,
                    opacity: 0.65,
                  }}
                >
                  Queue position #{current.position}
                </div>

              </div>

            </div>

          ) : (

            <div
              style={{
                marginTop: 32,
                padding: 20,
                borderRadius: 14,
                background:
                  "rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.75)",
              }}
            >
              No farmer is currently being served.
            </div>

          )}


          <div
            style={{
              display: "flex",
              gap: 10,
              marginTop: 23,
              position: "relative",
            }}
          >

            <button
              className="btn"
              onClick={() =>
                navigate("/app/queue")
              }
              style={{
                borderRadius: 11,
              }}
            >
              Open Live Queue
            </button>

            <button
              className="btn alt"
              onClick={() =>
                navigate("/app/scan")
              }
              style={{
                borderRadius: 11,
              }}
            >
              Scan Check-in
            </button>

          </div>

        </section>


        {/* NOTIFICATIONS */}

        <section
          style={{
            background: "#ffffff",
            border: "1px solid #e6e9ed",
            borderRadius: 20,
            padding: 22,
            boxShadow:
              "0 5px 18px rgba(15,23,42,0.035)",
          }}
        >

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 15,
            }}
          >

            <div>

              <div
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: "0.1em",
                  color: "#8a95a5",
                }}
              >
                UPDATES
              </div>

              <h2
                style={{
                  margin: "4px 0 0",
                  fontSize: 20,
                  color: "#17211b",
                }}
              >
                Notifications
              </h2>

            </div>


            {unread > 0 && (

              <span
                style={{
                  padding: "6px 10px",
                  borderRadius: 999,
                  background: "#fff7ed",
                  color: "#c2410c",
                  fontSize: 11,
                  fontWeight: 800,
                }}
              >
                {unread} new
              </span>

            )}

          </div>


          {notifications.length ? (

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 9,
              }}
            >

              {notifications
                .slice(0, 4)
                .map((n) => (

                  <div
                    key={n._id}
                    style={{
                      display: "flex",
                      gap: 10,
                      padding: "11px 12px",
                      borderRadius: 12,
                      background: n.read
                        ? "#f8faf9"
                        : "#f0fdf4",
                      border: n.read
                        ? "1px solid #edf0ee"
                        : "1px solid #dcfce7",
                    }}
                  >

                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: n.read
                          ? "#a8b1bd"
                          : "#22c55e",
                        marginTop: 6,
                        flexShrink: 0,
                      }}
                    />

                    <div
                      style={{
                        minWidth: 0,
                      }}
                    >

                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: "#344054",
                        }}
                      >
                        {n.text}
                      </div>

                      <div
                        style={{
                          fontSize: 10,
                          color: "#98a2b3",
                          marginTop: 4,
                        }}
                      >
                        {new Date(
                          n.createdAt
                        ).toLocaleString()}
                      </div>

                    </div>

                  </div>

                ))}

            </div>

          ) : (

            <div
              style={{
                padding: "35px 10px",
                textAlign: "center",
                color: "#98a2b3",
                fontSize: 13,
              }}
            >
              No new notifications.
            </div>

          )}

        </section>

      </div>


      {/* =====================================================
          LIVE QUEUE
      ====================================================== */}

      <section
        style={{
          background: "#ffffff",
          border: "1px solid #e6e9ed",
          borderRadius: 20,
          padding: 23,
          marginBottom: 22,
          boxShadow:
            "0 5px 18px rgba(15,23,42,0.035)",
        }}
      >

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 15,
            marginBottom: 18,
          }}
        >

          <div>

            <div
              style={{
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: "0.1em",
                color: "#8a95a5",
              }}
            >
              QUEUE MANAGEMENT
            </div>

            <h2
              style={{
                margin: "4px 0 3px",
                fontSize: 21,
                color: "#17211b",
              }}
            >
              Live Farmer Queue
            </h2>

            <p
              style={{
                margin: 0,
                color: "#8a95a5",
                fontSize: 12,
              }}
            >
              Farmers booked at{" "}
              <strong>
                {centre?.name || "your centre"}
              </strong>{" "}
              are shown here.
            </p>

          </div>


          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >

            <span
              style={{
                padding: "8px 12px",
                borderRadius: 10,
                background: "#f8faf9",
                border: "1px solid #e7ebe8",
                fontSize: 12,
                fontWeight: 700,
                color: "#475467",
              }}
            >
              {active.length} active
            </span>

            <button
              className="btn"
              onClick={() =>
                api.callNext()
                  .then((d) => {
                    toast(
                      `${d.booking.token} called`
                    );
                    load(true);
                  })
                  .catch((e) =>
                    toast(e.message)
                  )
              }
            >
              Call Next
            </button>

          </div>

        </div>


        {centre ? (

          <QueueTable
            bookings={active.slice(0, 8)}
            onCall={handleCall}
            onProcess={handleProcess}
          />

        ) : (

          <div
            style={{
              padding: 40,
              textAlign: "center",
              borderRadius: 14,
              background: "#f8faf9",
              color: "#667085",
              fontSize: 13,
            }}
          >
            An admin must assign a centre
            before you can manage the queue.
          </div>

        )}

      </section>


      {/* =====================================================
          RECENT ACTIVITY
      ====================================================== */}

      <section
        style={{
          background: "#ffffff",
          border: "1px solid #e6e9ed",
          borderRadius: 20,
          padding: 23,
          boxShadow:
            "0 5px 18px rgba(15,23,42,0.035)",
        }}
      >

        <div
          style={{
            marginBottom: 17,
          }}
        >

          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: "0.1em",
              color: "#8a95a5",
            }}
          >
            ACTIVITY
          </div>

          <h2
            style={{
              margin: "4px 0 0",
              fontSize: 20,
              color: "#17211b",
            }}
          >
            Recent Operator Activity
          </h2>

        </div>


        {activity.length ? (

          <div
            style={{
              display: "flex",
              flexDirection: "column",
            }}
          >

            {activity
              .slice(0, 5)
              .map((log, index) => (

                <div
                  key={log._id}
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "70px 1fr auto",
                    gap: 14,
                    alignItems: "center",
                    padding: "13px 5px",
                    borderBottom:
                      index ===
                      Math.min(
                        activity.length,
                        5
                      ) - 1
                        ? "none"
                        : "1px solid #f0f2f1",
                  }}
                >

                  <span
                    style={{
                      fontSize: 11,
                      color: "#98a2b3",
                      fontWeight: 600,
                    }}
                  >
                    {new Date(
                      log.createdAt
                    ).toLocaleTimeString(
                      [],
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </span>


                  <span
                    style={{
                      fontSize: 13,
                      color: "#344054",
                      fontWeight: 600,
                    }}
                  >
                    {log.action}
                  </span>


                  <span
                    style={{
                      fontSize: 10,
                      color: "#98a2b3",
                    }}
                  >
                    {new Date(
                      log.createdAt
                    ).toLocaleDateString()}
                  </span>

                </div>

              ))}

          </div>

        ) : (

          <div
            style={{
              padding: 30,
              textAlign: "center",
              color: "#98a2b3",
              fontSize: 13,
            }}
          >
            Your recent actions will appear here.
          </div>

        )}

      </section>

    </div>
  );
}