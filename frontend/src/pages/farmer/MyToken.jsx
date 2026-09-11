import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { api } from "../../api/api";
import { useToast } from "../../context/ToastContext.jsx";
import { useQueueEvents, useSocket } from "../../context/SocketContext.jsx";
import { downloadReceipt } from "../../utils/receipt";
import { IconCheckCircle, IconCircle, IconRefresh, IconReceipt } from "../../components/icons.jsx";


function buildSteps(booking) {
  const steps = [
    { key: "BOOKED", label: "Booked" },
    { key: "CALLED", label: "Called" },
    { key: "IN_SERVICE", label: "At Desk" },
    { key: "COMPLETED", label: "Weighed" },
    { key: "PAID", label: "Paid" },
  ];
  const order = ["BOOKED", "CALLED", "IN_SERVICE", "COMPLETED"];
  let reachedIndex = order.indexOf(booking.status);
  if (reachedIndex === -1) reachedIndex = 0;
  const paid = booking.payment === "PAID";

  return steps.map((s) => {
    if (s.key === "PAID") {
      return { ...s, done: paid, active: reachedIndex === 3 && !paid };
    }
    const stepIndex = order.indexOf(s.key);
    return {
      ...s,
      done: stepIndex < reachedIndex || (stepIndex === 3 && stepIndex === reachedIndex),
      active: stepIndex === reachedIndex && stepIndex !== 3,
    };
  });
}

export default function MyToken() {
  const toast = useToast();
  const navigate = useNavigate();
  const socket = useSocket();

  const [booking, setBooking] = useState(null);
  const [current, setCurrent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [turnAlert, setTurnAlert] = useState(null);
  const hasTriggeredRef = useRef(false);
  const audioIntervalRef = useRef(null);

  // Soft Chime Tone
  function playAlertBeep() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === "suspended") ctx.resume();

      const runBeep = (freq, start, dur) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        gain.gain.setValueAtTime(0.3, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + dur);
      };

      runBeep(523.25, 0, 0.35); // C5
      runBeep(659.25, 0.2, 0.35); // E5
      runBeep(783.99, 0.4, 0.5);  // G5
    } catch (e) {
      console.warn("Chime error:", e);
    }
  }

  // Clear Female Voice Announcement
  function speakClearFemaleVoice(tokenStr, gateStr, deskStr) {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();

    const phoneticSpeech = `Kripya dhyan dein! Token number ${tokenStr}. Kripya gate number ${gateStr}, ke desk number ${deskStr} par turant pahuchein.`;

    const utterance = new SpeechSynthesisUtterance(phoneticSpeech);
    utterance.rate = 0.86;
    utterance.pitch = 1.35; // Pure sweet female pitch

    const allVoices = window.speechSynthesis.getVoices();
    const femaleVoice =
      allVoices.find((v) => {
        const n = v.name.toLowerCase();
        return (
          (n.includes("female") ||
            n.includes("zira") ||
            n.includes("swara") ||
            n.includes("kalpana") ||
            n.includes("heera") ||
            n.includes("neerja") ||
            n.includes("samantha")) &&
          !n.includes("ravi") &&
          !n.includes("david") &&
          !n.includes("male")
        );
      }) ||
      allVoices.find((v) => !v.name.toLowerCase().includes("ravi") && !v.name.toLowerCase().includes("david"));

    if (femaleVoice) {
      utterance.voice = femaleVoice;
    }

    window.speechSynthesis.speak(utterance);
  }

  const triggerPopupAndVoice = useCallback((tokenVal, gateVal = "2", deskVal = "1") => {
    setTurnAlert({
      token: tokenVal,
      gate: gateVal,
      desk: deskVal,
      message: `Token number ${tokenVal}। Kripya gate number ${gateVal} ke desk number ${deskVal} par turant pahuchein.`,
    });

    playAlertBeep();
    setTimeout(() => speakClearFemaleVoice(tokenVal, gateVal, deskVal), 400);

    if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
    audioIntervalRef.current = setInterval(playAlertBeep, 6000);
  }, []);

  // Silent Live Fetcher (Does NOT show loader, updates position seamlessly)
  const silentSync = useCallback(async () => {
    try {
      const [mine, cur] = await Promise.all([api.getMyBookings(), api.getCurrentToken()]);
      const activeBooking = mine.active;
      
      setBooking(activeBooking);
      setCurrent(cur.current);

      // Agar status CALLED hua aur popup trigger nahi hua toh live kholo bina reload ke
      if (activeBooking && activeBooking.status === "CALLED" && !hasTriggeredRef.current) {
        hasTriggeredRef.current = true;
        triggerPopupAndVoice(activeBooking.token, "2", "1");
      }
    } catch (e) {
      // Background sync silent fail
    }
  }, [triggerPopupAndVoice]);

  // Initial Load
  useEffect(() => {
    silentSync().finally(() => setLoading(false));
  }, [silentSync]);

  // 1. Silent Live Heartbeat (Every 3 seconds auto-checks queue position & turn status)
  useEffect(() => {
    const interval = setInterval(() => {
      silentSync();
    }, 3000); // 3-second live sync

    return () => clearInterval(interval);
  }, [silentSync]);

  // 2. Real-time Socket Event Listener (Instant reaction without waiting for 3s)
  useEffect(() => {
    if (!socket) return;

    const onTurnAlert = (data) => {
      console.log("⚡ Instant socket call event arrived:", data);
      if (booking && data.token && booking.token && data.token !== booking.token) {
        return;
      }
      hasTriggeredRef.current = true;
      triggerPopupAndVoice(data.token || booking?.token || "T-0040", data.gate || "2", data.desk || "1");
      silentSync();
    };

    socket.on("farmer:turn-alert", onTurnAlert);

    return () => {
      socket.off("farmer:turn-alert", onTurnAlert);
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
    };
  }, [socket, booking, silentSync, triggerPopupAndVoice]);

  // 3. Socket broadcast triggers instant position update
  useQueueEvents(["booking:updated", "booking:created"], () => {
    silentSync();
  });

  function handleDismissAlert() {
    if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setTurnAlert(null);
    silentSync();
  }

  async function manualRefresh() {
    if (!booking) return;
    setRefreshing(true);
    try {
      await silentSync();
      toast("Queue refreshed");
    } catch (err) {
      toast(err.message);
    } finally {
      setRefreshing(false);
    }
  }

  if (loading) {
    return (
      <div className="empty">
        <div className="loader-ring" />
        Loading your token...
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="card empty">
        <h2>No active token</h2>
        <p className="muted" style={{ margin: "8px 0 16px" }}>
          You don't have an active queue right now.
        </p>
        <button className="btn" onClick={() => navigate("/app/book")}>
          Book Token
        </button>
      </div>
    );
  }

  const centreName = booking.centre?.name || "";
  const qrValue = `KRISHIQUEUE:${booking.token}`;
  const isStopped = booking.status === "REJECTED" || booking.status === "CANCELLED";
  const steps = buildSteps(booking);

  return (
    <>
      {/* 🚨 FULL-SCREEN LIVE FLASHING ALERT MODAL */}
      {turnAlert && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(185, 28, 28, 0.95)",
            zIndex: 9999999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            animation: "pulseWarning 1s infinite",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: 24,
              padding: "36px 28px",
              maxWidth: 480,
              width: "100%",
              textAlign: "center",
              boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
              border: "4px solid #dc2626",
            }}
          >
            <div style={{ fontSize: 56, marginBottom: 10 }}>📢</div>

            <h1 style={{ color: "#b91c1c", fontSize: 28, margin: "0 0 10px", fontWeight: 900 }}>
              आपकी बारी आ गई है!
            </h1>

            <div
              style={{
                display: "inline-block",
                background: "#fee2e2",
                border: "2px dashed #dc2626",
                borderRadius: 12,
                padding: "8px 16px",
                fontSize: 18,
                fontWeight: 800,
                color: "#991b1b",
                margin: "10px 0 16px",
              }}
            >
              टोकन: {turnAlert.token} • गेट {turnAlert.gate || "2"} (डेस्क {turnAlert.desk || "1"})
            </div>

            <p style={{ fontSize: 18, fontWeight: 700, color: "#1f2937", lineHeight: 1.6, margin: "0 0 24px" }}>
              {turnAlert.message}
            </p>

            <button
              onClick={handleDismissAlert}
              style={{
                width: "100%",
                background: "#15803d",
                color: "#ffffff",
                border: "none",
                borderRadius: 14,
                padding: "16px 20px",
                fontSize: 18,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              ✓ ठीक है, मैं गेट पर जा रहा हूँ
            </button>
          </div>

          <style>{`
            @keyframes pulseWarning {
              0% { background: rgba(185, 28, 28, 0.95); }
              50% { background: rgba(217, 119, 6, 0.95); }
              100% { background: rgba(185, 28, 28, 0.95); }
            }
          `}</style>
        </div>
      )}

      {/* HEADER */}
      <div className="hero">
        <div className="hero-kicker">Real-time queue tracking</div>
        <h1>My Live Token</h1>
        <p className="muted">
          {centreName} • {booking.date} • {booking.slot}
        </p>
      </div>

      {!isStopped && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="timeline">
            {steps.map((s) => (
              <div key={s.key} className={`timeline-step ${s.done ? "done" : ""} ${s.active ? "active" : ""}`}>
                <span className="bar" />
                <span className="dot">
                  {s.done || s.active ? (
                    <IconCheckCircle style={{ width: 15, height: 15 }} />
                  ) : (
                    <IconCircle style={{ width: 13, height: 13 }} />
                  )}
                </span>
                <span className="label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="cards2">
        <div className="tokenbox queue-spotlight">
          <div className="muted" style={{ color: "#d9eee0" }}>
            DIGITAL TOKEN
          </div>
          <div className="queue-number">{booking.token}</div>
          <p>
            {booking.crop} • {booking.quantity} kg expected
          </p>
          <div className="qr-box" style={{ marginTop: 14 }}>
            <QRCodeSVG value={qrValue} size={130} fgColor="#0e7a4c" />
          </div>
          <p style={{ marginTop: 10, fontSize: 12, opacity: 0.85 }}>
            Show this QR code to the operator for instant check-in
          </p>
        </div>

        <div className="card">
          <div className="metric-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Live queue intelligence</span>
            <span style={{ fontSize: 10, color: "#16804b", fontWeight: 800 }}>● LIVE SYNC ON</span>
          </div>
          <h3 style={{ marginTop: 5 }}>Your turn, at a glance</h3>
          <div className="cards2" style={{ marginTop: 10 }}>
            <div>
              <div className="muted">Now Serving</div>
              <div className="num">{current || "-"}</div>
            </div>
            <div>
              <div className="muted">My Position</div>
              <div className="num" style={{ transition: "all 0.4s ease" }}>
                {booking.position}
              </div>
            </div>
          </div>

          <div className={`notice ${isStopped ? "error" : ""}`}>
            {booking.status === "CALLED"
              ? "Your turn is now. Proceed to the desk."
              : isStopped
              ? `This booking is ${booking.status.toLowerCase()}.`
              : `${Math.max(0, booking.position - 1)} farmer(s) ahead. Estimated wait ${Math.max(5, booking.position * 7)} min.`}
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            <button className="btn alt" disabled={refreshing} onClick={manualRefresh}>
              <IconRefresh style={{ width: 15, height: 15 }} />
              {refreshing ? "Refreshing..." : "Refresh Queue"}
            </button>
          </div>
        </div>
      </div>

      <div className="section">Status</div>
      <div className="card">
        <div className="between">
          <div>
            <b>{booking.status}</b> {"->"} {booking.weight ? `Weight ${booking.weight} kg` : "Weight pending"} {"->"}{" "}
            {booking.quality || "Quality pending"} {"->"} {booking.lot || "Lot pending"} {"->"}{" "}
            {booking.payment || "Payment pending"}
          </div>
          {(booking.status === "COMPLETED" || booking.payment === "PAID") && (
            <button className="btn blue" onClick={() => downloadReceipt(booking)}>
              <IconReceipt style={{ width: 15, height: 15 }} />
              Download Receipt
            </button>
          )}
        </div>
      </div>
      
    </>
  );
}