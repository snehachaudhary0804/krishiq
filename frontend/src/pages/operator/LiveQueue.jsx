import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/api";
import { useToast } from "../../context/ToastContext.jsx";
import { useQueueEvents, useSocket } from "../../context/SocketContext.jsx";
import { IconClock, IconUsers, IconRefresh } from "../../components/icons.jsx";

export default function LiveQueue() {
  const toast = useToast();
  const navigate = useNavigate();
  const socket = useSocket();

  const [active, setActive] = useState([]);
  const [centre, setCentre] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    try {
      const [queue, centres] = await Promise.all([
        api.getActiveBookings(),
        api.getCentres(),
      ]);

      setActive(queue.bookings || []);
      setCentre(centres.centres?.[0] || null);
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

  useQueueEvents(["booking:created", "booking:updated"], load);

  // Send sound & popup signal to farmer
  function broadcastTurnAlert(bookingObj) {
    if (socket && bookingObj) {
      console.log("📢 Emitting operator:call-farmer for", bookingObj.token);
      socket.emit("operator:call-farmer", {
        bookingId: bookingObj._id,
        token: bookingObj.token,
        farmerName: bookingObj.farmerName || "Kisaan",
        desk: "1",
        gate: "2",
      });
    }
  }

  async function callNext() {
    try {
      const data = await api.callNext();
      const b = data.booking;
      toast(`${b?.token || "Token"} called`);

      if (b) broadcastTurnAlert(b);
      load();
    } catch (err) {
      toast(err.message);
    }
  }

  async function handleCall(id) {
    try {
      const target = active.find((b) => b._id === id);
      const res = await api.callToken(id);
      const updatedBooking = res?.booking || target;

      toast(`Token ${updatedBooking?.token || ""} Called!`);

      if (updatedBooking) {
        broadcastTurnAlert(updatedBooking);
      }

      load();
    } catch (err) {
      toast(err.message);
    }
  }

  async function handleProcess(id) {
    try {
      await api.startService(id);
      navigate("/app/process", {
        state: { bookingId: id },
      });
    } catch (err) {
      toast(err.message);
    }
  }

  async function refresh() {
    setRefreshing(true);
    await load();
  }

  const waiting = useMemo(
    () => active.filter((b) => b.status === "BOOKED"),
    [active]
  );

  const called = useMemo(
    () => active.filter((b) => b.status === "CALLED"),
    [active]
  );

  const inService = useMemo(
    () => active.find((b) => b.status === "IN_SERVICE"),
    [active]
  );

  const next = waiting[0];

  if (loading) {
    return (
      <div className="empty">
        <div className="loader-ring" />
        Loading live queue…
      </div>
    );
  }

  return (
    <div className="live-queue-page">
      {/* HEADER */}
      <div
        className="card"
        style={{
          padding: "26px 30px",
          marginBottom: 18,
          background: "linear-gradient(135deg, #f7fbf8 0%, #ffffff 65%, #fffdf7 100%)",
        }}
      >
        <div className="between">
          <div>
            <div
              className="hero-kicker"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
              }}
            >
              <IconClock style={{ width: 15, height: 15 }} />
              LIVE OPERATIONS
            </div>

            <h1 style={{ margin: "7px 0 5px", fontSize: 30 }}>Live Queue</h1>
            <p className="muted" style={{ margin: 0 }}>
              Manage today's farmer tokens and service flow.
            </p>
          </div>

          <div className="row">
            <button
              className="btn alt"
              onClick={refresh}
              disabled={refreshing}
              style={{ display: "flex", alignItems: "center", gap: 7 }}
            >
              <IconRefresh style={{ width: 15, height: 15 }} />
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>

            <button className="btn" onClick={callNext} disabled={!next}>
              {next ? `Call ${next.token}` : "No Waiting Token"}
            </button>
          </div>
        </div>
      </div>

      {/* CENTRE + LIVE STATUS */}
      <div className="card" style={{ padding: "16px 20px", marginBottom: 18 }}>
        <div className="between">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: "#edf8f1",
                display: "grid",
                placeItems: "center",
                color: "var(--brand)",
              }}
            >
              <IconUsers style={{ width: 20, height: 20 }} />
            </div>

            <div>
              <small
                style={{
                  display: "block",
                  color: "#7a8b82",
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: ".08em",
                }}
              >
                ASSIGNED CENTRE
              </small>

              <strong style={{ fontSize: 15 }}>{centre?.name || "Your centre"}</strong>
            </div>
          </div>

          <span
            className="status green"
            style={{ display: "inline-flex", alignItems: "center", gap: 5 }}
          >
            <span>●</span> LIVE
          </span>
        </div>
      </div>

      {/* SIMPLE QUEUE STATS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 14,
          marginBottom: 18,
        }}
      >
        <div className="card" style={{ padding: 20 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: "#8a745c",
              letterSpacing: ".06em",
              textTransform: "uppercase",
            }}
          >
            Waiting
          </div>
          <div style={{ fontSize: 30, fontWeight: 800, marginTop: 5 }}>
            {waiting.length}
          </div>
          <div className="muted" style={{ fontSize: 12 }}>
            Farmers waiting
          </div>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: "#4267b2",
              letterSpacing: ".06em",
              textTransform: "uppercase",
            }}
          >
            Called
          </div>
          <div style={{ fontSize: 30, fontWeight: 800, marginTop: 5 }}>
            {called.length}
          </div>
          <div className="muted" style={{ fontSize: 12 }}>
            Ready for service
          </div>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: "var(--brand)",
              letterSpacing: ".06em",
              textTransform: "uppercase",
            }}
          >
            Currently Serving
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, marginTop: 7 }}>
            {inService?.token || "—"}
          </div>
          <div className="muted" style={{ fontSize: 12 }}>
            {inService?.farmerName || "No farmer in service"}
          </div>
        </div>
      </div>

      {/* IN SERVICE BANNER */}
      {inService && (
        <div
          className="card"
          style={{
            marginBottom: 18,
            padding: "18px 20px",
            border: "1px solid #cce5d5",
            background: "#f7fcf8",
          }}
        >
          <div className="between">
            <div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  color: "var(--brand)",
                  letterSpacing: ".08em",
                  marginBottom: 5,
                }}
              >
                IN SERVICE NOW
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <strong style={{ fontSize: 22, color: "var(--brand)" }}>
                  {inService.token}
                </strong>
                <div>
                  <strong>{inService.farmerName}</strong>
                  <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                    {inService.crop}
                  </div>
                </div>
              </div>
            </div>
            <button className="btn" onClick={() => handleProcess(inService._id)}>
              Open Procurement
            </button>
          </div>
        </div>
      )}

      {/* QUEUE TABLE */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "20px 22px", borderBottom: "1px solid #e7eee9" }}>
          <div className="between">
            <div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  color: "#8a978f",
                  letterSpacing: ".08em",
                  marginBottom: 5,
                }}
              >
                QUEUE MANAGEMENT
              </div>
              <h2 style={{ margin: 0 }}>Today's Farmer Queue</h2>
              <p className="muted" style={{ margin: "5px 0 0", fontSize: 12 }}>
                Farmers from {centre?.name || "your assigned centre"}.
              </p>
            </div>
            <span
              style={{
                padding: "7px 11px",
                borderRadius: 9,
                background: "#f4f7f5",
                border: "1px solid #e2e9e4",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {active.length} active
            </span>
          </div>
        </div>

        {!active.length ? (
          <div className="empty" style={{ padding: "55px 20px" }}>
            <IconUsers style={{ width: 34, height: 34, marginBottom: 10 }} />
            <strong>No active farmers</strong>
            <p className="muted" style={{ marginTop: 5 }}>
              New check-ins will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="tablebox">
            <table className="table">
              <thead>
                <tr>
                  <th>Token</th>
                  <th>Farmer</th>
                  <th>Crop</th>
                  <th>Slot</th>
                  <th>Position</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {active.map((booking) => (
                  <tr key={booking._id}>
                    <td>
                      <strong>{booking.token}</strong>
                    </td>
                    <td>
                      <strong>{booking.farmerName}</strong>
                      {booking.mobile && (
                        <small
                          style={{
                            display: "block",
                            color: "#8a968f",
                            marginTop: 2,
                          }}
                        >
                          {booking.mobile}
                        </small>
                      )}
                    </td>
                    <td>{booking.crop}</td>
                    <td>{booking.slot}</td>
                    <td>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          minWidth: 34,
                          padding: "4px 8px",
                          borderRadius: 8,
                          background: "#f3f7f4",
                          border: "1px solid #dce7df",
                          fontWeight: 700,
                          fontSize: 12,
                        }}
                      >
                        #{booking.position}
                      </span>
                    </td>
                    <td>
                      {booking.status === "BOOKED" && (
                        <span className="status yellow">● WAITING</span>
                      )}
                      {booking.status === "CALLED" && (
                        <span className="status blue">● CALLED</span>
                      )}
                      {booking.status === "IN_SERVICE" && (
                        <span className="status green">● IN SERVICE</span>
                      )}
                    </td>
                    <td>
                      {booking.status === "BOOKED" && (
                        <button
                          className="btn alt small-btn"
                          onClick={() => handleCall(booking._id)}
                        >
                          📢 Call
                        </button>
                      )}
                      {booking.status === "CALLED" && (
                        <button
                          className="btn small-btn"
                          onClick={() => handleProcess(booking._id)}
                        >
                          Start Service
                        </button>
                      )}
                      {booking.status === "IN_SERVICE" && (
                        <button
                          className="btn alt small-btn"
                          onClick={() => handleProcess(booking._id)}
                        >
                          Continue
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}