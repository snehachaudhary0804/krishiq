import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/api";
import { useToast } from "../../context/ToastContext.jsx";
import VoiceAssistant from "../../components/VoiceAssistant.jsx";
import { todayISO } from "../../utils/format";
import { IconBuilding, IconWheat, IconCheckCircle, IconRefresh } from "../../components/icons.jsx";

const DRAFT_KEY = "krishi_booking_draft";
const OUTBOX_KEY = "krishi_offline_outbox";

export default function BookToken() {
  const toast = useToast();
  const navigate = useNavigate();

  const [centres, setCentres] = useState([]);
  const [existing, setExisting] = useState(null);
  const [current, setCurrent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // Network & Offline Outbox State
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingOfflineBooking, setPendingOfflineBooking] = useState(null);
  const syncingRef = useRef(false);

  const [centreId, setCentreId] = useState("");
  const [date, setDate] = useState(todayISO());
  const [qty, setQty] = useState(500);
  const [slots, setSlots] = useState([]);
  const [slot, setSlot] = useState("");

  const crops = [
    { name: "Barley (जौ)", icon: "🌾", msp: "₹21.5/q" },
    { name: "Gram (चना)", icon: "🫘", msp: "₹58.75/q" },
    { name: "Lentil/Masur (मसूर)", icon: "🥘", msp: "₹70/q" },
    { name: "Moong (मूंग)", icon: "🥣", msp: "₹87.8/q" },
    { name: "Mustard (सरसों)", icon: "🌼", msp: "₹62/q" },
    { name: "Paddy/Rice (धान)", icon: "🍚", msp: "₹24.41/q" },
    { name: "Sesamum (तिल)", icon: "🫘", msp: "₹103.46/q" },
    { name: "Wheat (गेहूं)", icon: "🌾", msp: "₹25.85/q" }
  ];

  const [crop, setCrop] = useState(crops[0].name);
  const [showOnlyNearby, setShowOnlyNearby] = useState(true);

  const farmerLocation = { lat: 27.6833, lng: 78.3833 };

  function calculateDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  }

  // 1. Check Outbox & Restore Form Draft
  useEffect(() => {
    const savedOutbox = localStorage.getItem(OUTBOX_KEY);
    if (savedOutbox) {
      try {
        setPendingOfflineBooking(JSON.parse(savedOutbox));
      } catch (e) {
        localStorage.removeItem(OUTBOX_KEY);
      }
    }

    const savedDraft = localStorage.getItem(DRAFT_KEY);
    if (savedDraft) {
      try {
        const d = JSON.parse(savedDraft);
        if (d.centreId) setCentreId(d.centreId);
        if (d.crop) setCrop(d.crop);
        if (d.date) setDate(d.date);
        if (d.qty) setQty(d.qty);
        if (d.slot) setSlot(d.slot);
      } catch (e) {}
    }
  }, []);

  // 2. Persist Form Draft on Input Changes
  useEffect(() => {
    if (!loading) {
      const draft = { centreId, crop, date, qty, slot };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    }
  }, [centreId, crop, date, qty, slot, loading]);

  // 3. Auto-sync Outbox when Network is Restored
  const processOfflineOutbox = useCallback(async () => {
    const rawOutbox = localStorage.getItem(OUTBOX_KEY);
    if (!rawOutbox || syncingRef.current) return;

    syncingRef.current = true;
    toast("इंटरनेट पुनः कनेक्ट हुआ! ऑफ़लाइन टोकन भेजा जा रहा है...");

    try {
      const bookingData = JSON.parse(rawOutbox);
      const res = await api.createBooking(bookingData);

      localStorage.removeItem(OUTBOX_KEY);
      localStorage.removeItem(DRAFT_KEY);
      setPendingOfflineBooking(null);

      toast(`टोकन ${res?.booking?.token || ""} सफलतापूर्वक बुक हो गया!`);
      navigate("/app/queue");
    } catch (err) {
      toast("सिंक विफल रहा, पुनः प्रयास किया जाएगा");
    } finally {
      syncingRef.current = false;
    }
  }, [toast, navigate]);

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
      processOfflineOutbox();
    }
    function handleOffline() {
      setIsOnline(false);
      toast("नेटवर्क डिस्कनेक्ट हो गया: ऑफ़लाइन मोड सक्रिय");
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if (navigator.onLine && localStorage.getItem(OUTBOX_KEY)) {
      processOfflineOutbox();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [processOfflineOutbox, toast]);

  async function loadBase() {
    try {
      const [c, mine, cur] = await Promise.all([
        api.getCentres(),
        api.getMyBookings(),
        api.getCurrentToken(),
      ]);

      const enhancedCentres = (c.centres || []).map((cent) => {
        let dist = null;
        if (cent.lat && cent.lng) {
          dist = calculateDistance(farmerLocation.lat, farmerLocation.lng, cent.lat, cent.lng);
        }

        if (dist === null) {
          const nameLower = (cent.name || "").toLowerCase();
          const distLower = (cent.district || "").toLowerCase();
          const addressLower = (cent.address || "").toLowerCase();

          if (nameLower.includes("sikandra") || addressLower.includes("sikandra")) {
            dist = 4;
          } else if (distLower.includes("hathras") || nameLower.includes("hathras")) {
            dist = 22;
          } else if (distLower.includes("aligarh") || nameLower.includes("aligarh")) {
            dist = 40;
          } else if (distLower.includes("etah") || nameLower.includes("etah")) {
            dist = 36;
          } else if (distLower.includes("kasganj") || nameLower.includes("kasganj")) {
            dist = 30;
          } else {
            dist = 70;
          }
        }

        return {
          ...cent,
          distance: dist,
        };
      });

      enhancedCentres.sort((a, b) => a.distance - b.distance);

      localStorage.setItem("krishi_cache_centres", JSON.stringify(enhancedCentres));

      setCentres(enhancedCentres);
      setExisting(mine.active);
      setCurrent(cur.current);
      if (enhancedCentres.length && !centreId) setCentreId(enhancedCentres[0]._id);
    } catch (err) {
      const cached = localStorage.getItem("krishi_cache_centres");
      if (cached) {
        setCentres(JSON.parse(cached));
      }
      toast("ऑफ़लाइन मोड: कैश्ड डेटा लोड हुआ");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBase();
  }, []);

  useEffect(() => {
    if (!centreId || !date) return;
    if (navigator.onLine) {
      api
        .getSlots(centreId, date)
        .then((data) => {
          setSlots(data.slots || []);
          // Sirf tab auto-pick karein agar pehle se koi slot chuna hua na ho
          setSlot((prev) => {
            if (prev) return prev;
            const firstAvailable = (data.slots || []).find((s) => s.left > 0);
            return firstAvailable ? firstAvailable.time : "";
          });
        })
        .catch((err) => toast(err.message));
    } else {
      const defaultSlots = [
        { time: "09:00 - 10:00", left: 15 },
        { time: "10:00 - 11:00", left: 20 },
        { time: "11:00 - 12:00", left: 18 },
        { time: "12:00 - 01:00", left: 25 },
        { time: "02:00 - 03:00", left: 15 },
        { time: "03:00 - 04:00", left: 15 },
        { time: "04:00 - 05:00", left: 15 },
      ];
      setSlots(defaultSlots);
      setSlot((prev) => prev || "10:00 - 11:00");
    }
  }, [centreId, date]);

  async function confirmBooking() {
    if (!slot) return toast("Select an available slot");
    if (!qty || qty <= 0) return toast("Enter expected quantity");

    const selectedCentre = centres.find((c) => c._id === centreId);
    const bookingPayload = {
      centreId,
      crop,
      date,
      slot,
      quantity: Number(qty),
      centreName: selectedCentre?.name || "Procurement Centre"
    };

    if (!navigator.onLine) {
      localStorage.setItem(OUTBOX_KEY, JSON.stringify(bookingPayload));
      setPendingOfflineBooking(bookingPayload);
      toast("नेटवर्क नहीं है! टोकन सुरक्षित सेव हो गया है, नेट आते ही बुक हो जाएगा।");
      return;
    }

    setBusy(true);
    try {
      await api.createBooking(bookingPayload);
      localStorage.removeItem(DRAFT_KEY);
      localStorage.removeItem(OUTBOX_KEY);
      toast("Token booked successfully");
      navigate("/app/queue");
    } catch (err) {
      if (!navigator.onLine || err.message?.includes("fetch") || err.message?.includes("Network")) {
        localStorage.setItem(OUTBOX_KEY, JSON.stringify(bookingPayload));
        setPendingOfflineBooking(bookingPayload);
        toast("नेटवर्क टूटा: टोकन को ऑफ़लाइन आउटबॉक्स में सुरक्षित कर लिया गया है।");
      } else {
        toast(err.message);
      }
    } finally {
      setBusy(false);
    }
  }

  function cancelOfflineBooking() {
    localStorage.removeItem(OUTBOX_KEY);
    setPendingOfflineBooking(null);
    toast("ऑफ़लाइन टोकन रद्द कर दिया गया");
  }

  const nearbyFiltered = centres.filter((centre) => centre.distance <= 35);
  const displayCentres = showOnlyNearby
    ? nearbyFiltered.length >= 2
      ? nearbyFiltered
      : centres.slice(0, Math.min(2, centres.length))
    : [...centres].sort((a, b) => a.distance - b.distance);

  if (loading) {
    return (
      <div className="empty">
        <div className="loader-ring" />
        Loading booking form...
      </div>
    );
  }

  if (centres.length === 0) {
    return (
      <div style={{ maxWidth: "850px", margin: "0 auto", paddingBottom: "40px" }}>
        <div className="hero">
          <h1>Book Procurement Token</h1>
          <p>Token booking is ready, but the centre setup is incomplete.</p>
        </div>
        <div className="card">
          <div className="notice warn">Admin must first create at least one procurement centre.</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "850px", margin: "0 auto", paddingBottom: "40px" }}>
      {/* ⚠️ Offline Status Alert */}
      {!isOnline && (
        <div
          style={{
            background: "#92400e",
            color: "#fff",
            padding: "10px 16px",
            borderRadius: "10px",
            marginBottom: "16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "13px",
            fontWeight: 600,
          }}
        >
          <span>📡 ऑफ़लाइन मोड (No Internet): टोकन डेटा सुरक्षित रहेगा और इंटरनेट आते ही स्वतः बुक होगा।</span>
          <span style={{ background: "rgba(255,255,255,0.2)", padding: "2px 8px", borderRadius: "4px", fontSize: "11px" }}>
            Auto-Sync Ready
          </span>
        </div>
      )}

      {/* ⏳ Pending Outbox Notification */}
      {pendingOfflineBooking && (
        <div
          style={{
            background: "#fef3c7",
            border: "1px dashed #d97706",
            borderRadius: "10px",
            padding: "14px 18px",
            marginBottom: "16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <div>
            <div style={{ fontWeight: 700, color: "#92400e", fontSize: "14px" }}>
              ⏳ ऑफ़लाइन टोकन कतार में सुरक्षित है
            </div>
            <div style={{ fontSize: "12px", color: "#b45309", marginTop: "2px" }}>
              {pendingOfflineBooking.crop} • {pendingOfflineBooking.centreName} • {pendingOfflineBooking.quantity} kg • {pendingOfflineBooking.slot}
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              onClick={cancelOfflineBooking}
              style={{ background: "#fff", border: "1px solid #d97706", color: "#b45309", padding: "5px 10px", borderRadius: "6px", fontSize: "12px", cursor: "pointer", fontWeight: 600 }}
            >
              रद्द करें
            </button>
            <button
              type="button"
              onClick={processOfflineOutbox}
              style={{ background: "#d97706", border: "none", color: "#fff", padding: "5px 12px", borderRadius: "6px", fontSize: "12px", cursor: "pointer", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}
            >
              <IconRefresh style={{ width: 12, height: 12 }} /> सिंक करें
            </button>
          </div>
        </div>
      )}

      <div className="hero">
        <div className="hero-kicker">Find your procurement centre</div>
        <h1>Book Procurement Token</h1>
        <p>Select your centre, crop, date and available time slot seamlessly.</p>
        <div className="hero-cta">
          <span className="status green">Live slot availability</span>
          <span className="muted">Sorted by distance from Sikandra Rao, UP.</span>
        </div>
      </div>

      <div className="steps-strip" style={{ marginBottom: "20px" }}>
        <span className="step-pip on"><span className="n">1</span> Select Centre & Crop</span>
        <IconCheckCircle className="chevron" style={{ width: 14, height: 14 }} />
        <span className={`step-pip ${crop && centreId ? "on" : ""}`}><span className="n">2</span> Choose Slot & Date</span>
        <IconCheckCircle className="chevron" style={{ width: 14, height: 14 }} />
        <span className={`step-pip ${slot ? "on" : ""}`}><span className="n">3</span> Confirm Booking</span>
      </div>

      <div className="card" style={{ padding: "24px" }}>
        {/* 🎙️ ROBUST VOICE AUTO-FILL HANDLER */}
        <VoiceAssistant
          onBookingAutoFill={(data) => {
            const raw = (data.rawTranscript || "").toLowerCase();

            // 1. CENTRE MATCHING (Fuzzy check against names & districts)
            if (centres.length > 0) {
              const centreKeywords = [
                { match: ["सिकंदरा", "sikandra", "sikandrarao"], key: "sikandra" },
                { match: ["हाथरस", "hathras"], key: "hathras" },
                { match: ["अलीगढ़", "aligarh"], key: "aligarh" },
                { match: ["एटा", "etah"], key: "etah" },
                { match: ["कासगंज", "kasganj"], key: "kasganj" },
                { match: ["गाजियाबाद", "ghaziabad"], key: "ghaziabad" },
                { match: ["हापुड़", "हापुड", "hapur"], key: "hapur" },
                { match: ["रामपुर", "rampur"], key: "rampur" },
                { match: ["हसनपुर", "hasanpur"], key: "hasanpur" },
              ];

              let detectedKey = null;
              if (data.centre) {
                const dc = data.centre.toLowerCase();
                for (const item of centreKeywords) {
                  if (item.match.some((m) => dc.includes(m))) {
                    detectedKey = item.key;
                    break;
                  }
                }
              }
              if (!detectedKey) {
                for (const item of centreKeywords) {
                  if (item.match.some((m) => raw.includes(m))) {
                    detectedKey = item.key;
                    break;
                  }
                }
              }

              let matchedCentre = null;
              if (detectedKey) {
                matchedCentre = centres.find((c) => {
                  const cName = (c.name || "").toLowerCase();
                  const cDist = (c.district || "").toLowerCase();
                  return cName.includes(detectedKey) || cDist.includes(detectedKey);
                });
              } else if (data.centre) {
                matchedCentre = centres.find((c) =>
                  (c.name || "").toLowerCase().includes(data.centre.toLowerCase())
                );
              }

              if (matchedCentre) {
                setCentreId(matchedCentre._id);
                // Agar nearby toggle off karne ki zaroorat ho toh check karein
                if (matchedCentre.distance > 35 && showOnlyNearby) {
                  setShowOnlyNearby(false);
                }
                toast(`केंद्र: ${matchedCentre.name}`);
              }
            }

            // 2. CROP MATCHING (Matches all 8 crops)
            if (crops.length > 0) {
              let targetCropKeyword = null;
              const spokenCrop = (data.crop || "").toLowerCase();

              if (raw.includes("सरसों") || raw.includes("sarso") || spokenCrop.includes("mustard") || spokenCrop.includes("सरसों")) {
                targetCropKeyword = "सरसों";
              } else if (raw.includes("चना") || raw.includes("chana") || spokenCrop.includes("gram") || spokenCrop.includes("चना")) {
                targetCropKeyword = "चना";
              } else if (raw.includes("मसूर") || raw.includes("masur") || spokenCrop.includes("masur") || spokenCrop.includes("मसूर")) {
                targetCropKeyword = "मसूर";
              } else if (raw.includes("मूंग") || raw.includes("moong") || spokenCrop.includes("moong") || spokenCrop.includes("मूंग")) {
                targetCropKeyword = "मूंग";
              } else if (raw.includes("जौ") || raw.includes("jau") || spokenCrop.includes("barley") || spokenCrop.includes("जौ")) {
                targetCropKeyword = "जौ";
              } else if (raw.includes("तिल") || raw.includes("til") || spokenCrop.includes("sesamum") || spokenCrop.includes("तिल")) {
                targetCropKeyword = "तिल";
              } else if (raw.includes("चावल") || raw.includes("धान") || raw.includes("dhan") || spokenCrop.includes("paddy") || spokenCrop.includes("rice")) {
                targetCropKeyword = "धान";
              } else if (raw.includes("गेहूं") || raw.includes("gehu") || raw.includes("wheat") || spokenCrop.includes("wheat")) {
                targetCropKeyword = "गेहूं";
              }

              if (targetCropKeyword) {
                const found = crops.find((c) => c.name.includes(targetCropKeyword));
                if (found) {
                  setCrop(found.name);
                  toast(`फसल: ${found.name}`);
                }
              }
            }

            // 3. DATE & QUANTITY
            if (data.date) setDate(data.date);
            if (data.quantityKg) setQty(Number(data.quantityKg));

            // 4. TIME (SLOT) SELECTION
            if (data.slot) {
              setSlot(data.slot);
              toast(`समय: ${data.slot}`);
              // Agar slots abhi backend se reload ho rahe hain toh ensure karein ki state bana rahe
              setTimeout(() => {
                setSlot(data.slot);
              }, 600);
            }
          }}
        />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "20px", marginBottom: "12px" }}>
          <h3 style={{ display: "flex", alignItems: "center", gap: 8, margin: 0 }}>
            <IconBuilding style={{ width: 18, height: 18, color: "var(--brand)" }} /> Select Procurement Centre
          </h3>
          <button
            type="button"
            onClick={() => setShowOnlyNearby(!showOnlyNearby)}
            style={{
              background: showOnlyNearby ? "#e8f5e9" : "#fff3e0",
              border: `1px solid ${showOnlyNearby ? "#2e7d32" : "#e65100"}`,
              color: showOnlyNearby ? "#2e7d32" : "#e65100",
              padding: "6px 14px",
              borderRadius: "6px",
              fontSize: "12px",
              cursor: "pointer",
              fontWeight: 700
            }}
          >
            {showOnlyNearby ? "📍 Showing Nearby Only (<=35km) [Switch to All]" : "🌐 Showing All Centres (Closest First) [Switch to Nearby]"}
          </button>
        </div>

        {/* Centre Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "12px", marginBottom: "25px" }}>
          {displayCentres.map((centre) => {
            const leftSeats = centre.capacity - (centre.booked || 0);
            const ratio = leftSeats / (centre.capacity || 1);
            const statusColor = ratio > 0.4 ? "#2e7d32" : ratio > 0.15 ? "#ed6c02" : "#d32f2f";
            const statusText = ratio > 0.4 ? "Low Rush (Green)" : ratio > 0.15 ? "Moderate (Orange)" : "Almost Full (Red)";
            const isSelected = centreId === centre._id;

            return (
              <div
                key={centre._id}
                onClick={() => setCentreId(centre._id)}
                style={{
                  padding: "14px",
                  borderRadius: "10px",
                  border: isSelected ? "2px solid var(--brand)" : "1px solid #e0e0e0",
                  background: isSelected ? "var(--brand-light, #f0f7f4)" : "#fff",
                  cursor: "pointer",
                  boxShadow: isSelected ? "0 4px 12px rgba(0,0,0,0.06)" : "none",
                  transition: "all 0.2s"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ fontWeight: "bold", fontSize: "15px", color: "#222" }}>{centre.name}</div>
                  <span style={{ fontSize: "11px", background: centre.distance <= 35 ? "#e8f5e9" : "#fff3e0", color: centre.distance <= 35 ? "#2e7d32" : "#e65100", padding: "3px 8px", borderRadius: "6px", fontWeight: "bold", border: `1px solid ${centre.distance <= 35 ? "#c8e6c9" : "#ffe0b2"}`, whiteSpace: "nowrap" }}>
                    📍 {centre.distance} km away
                  </span>
                </div>
                <div style={{ fontSize: "12px", color: "#666", margin: "4px 0 8px 0" }}>{centre.district || "Uttar Pradesh"}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "12px" }}>
                  <span style={{ width: 9, height: 9, borderRadius: "50%", background: statusColor }} />
                  <span style={{ fontWeight: 600, color: "#444" }}>{leftSeats} seats left ({statusText})</span>
                </div>
              </div>
            );
          })}
        </div>

        <h3 style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "12px" }}>
          <IconWheat style={{ width: 18, height: 18, color: "var(--brand)" }} /> Choose Your Crop
        </h3>

        {/* Crop Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "12px", marginBottom: "25px" }}>
          {crops.map((c) => {
            const isSelected = crop === c.name;

            return (
              <div
                key={c.name}
                onClick={() => setCrop(c.name)}
                style={{
                  padding: "14px 10px",
                  textAlign: "center",
                  borderRadius: "10px",
                  border: isSelected ? "2px solid var(--brand)" : "1px solid #e0e0e0",
                  background: isSelected ? "var(--brand-light, #f0f7f4)" : "#fafafa",
                  cursor: "pointer",
                  boxShadow: isSelected ? "0 4px 12px rgba(0,0,0,0.06)" : "none",
                  transition: "all 0.2s"
                }}
              >
                <div style={{ fontSize: "30px", marginBottom: "6px" }}>{c.icon}</div>
                <div style={{ fontWeight: "bold", fontSize: "13px", color: "#333" }}>{c.name}</div>
                <div style={{ fontSize: "11px", color: "#666", marginTop: "4px" }}>MSP: {c.msp}</div>
              </div>
            );
          })}
        </div>

        <div className="form2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "20px" }}>
          <div className="field">
            <label style={{ fontWeight: 600, fontSize: "13px", marginBottom: "6px", display: "block" }}>Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ddd" }} />
          </div>
          <div className="field">
            <label style={{ fontWeight: 600, fontSize: "13px", marginBottom: "6px", display: "block" }}>Expected Quantity (kg)</label>
            <input type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ddd" }} />
          </div>
        </div>

        <div className="field" style={{ marginBottom: "25px" }}>
          <label style={{ fontWeight: 600, fontSize: "13px", marginBottom: "8px", display: "block" }}>Available Slot & Crowd Indicator</label>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {slots.map((s) => (
              <label
                key={s.time}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "14px 18px", border: "1px solid #ddd", borderRadius: "10px",
                  background: slot === s.time ? "var(--brand-light, #f0f7f4)" : "#fff",
                  cursor: s.left === 0 ? "not-allowed" : "pointer", opacity: s.left === 0 ? 0.6 : 1,
                  boxShadow: "0 2px 6px rgba(0,0,0,0.02)", transition: "all 0.2s"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <input
                    type="radio"
                    name="slot"
                    value={s.time}
                    checked={slot === s.time}
                    disabled={s.left === 0}
                    onChange={() => setSlot(s.time)}
                    style={{ width: "16px", height: "16px", cursor: "pointer" }}
                  />
                  <b style={{ fontSize: "15px", color: "#222" }}>{s.time}</b>
                </div>
                <span style={{ fontSize: "13px", fontWeight: 600, color: s.left > 20 ? "#2e7d32" : s.left > 0 ? "#ed6c02" : "#d32f2f" }}>
                  {s.left === 0 ? "FULL" : `${s.left} seats left`}
                </span>
              </label>
            ))}
          </div>
        </div>

        <button
          className="btn"
          style={{ width: "100%", padding: "14px", fontSize: "15px", fontWeight: "bold", justifyContent: "center" }}
          disabled={busy}
          onClick={confirmBooking}
        >
          <IconWheat style={{ width: 16, height: 16 }} />
          {busy ? "Booking Token..." : isOnline ? "Confirm & Generate Token" : "Save Token Offline (Auto-Sync)"}
        </button>
      </div>
    </div>
  );
}