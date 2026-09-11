import { useEffect, useState } from "react";
import { api } from "../api/api";
import { IconArrowRight } from "./icons.jsx";

function crowdColor(level) {
  if (level === "High") return "var(--red, #d64545)";
  if (level === "Medium") return "var(--amber, #c98a1e)";
  return "var(--brand, #1f6e46)";
}

export default function NearbyCentres() {
  const [status, setStatus] = useState("locating"); // locating | ready | denied | error
  const [centres, setCentres] = useState([]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setStatus("error");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const data = await api.getNearbyCentres(latitude, longitude);
          setCentres(data.centres || []);
          setStatus("ready");
        } catch (err) {
          setStatus("error");
        }
      },
      () => setStatus("denied"),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  if (status === "locating") {
    return (
      <div className="card">
        <div className="empty"><div className="loader-ring" />Finding centres near you…</div>
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div className="card">
        <p className="muted">
          Location access denied. Allow location in your browser to see nearby, less-crowded centres.
        </p>
      </div>
    );
  }

  if (status === "error" || !centres.length) {
    return null; // fail silently, don't block the rest of the dashboard
  }

  return (
    <>
      <div className="section">Suggested Centres Near You</div>
      <div className="cards3">
        {centres.slice(0, 6).map((c) => (
          <div className="card" key={c._id}>
            <div className="between">
              <b>{c.name}</b>
              <span style={{ color: crowdColor(c.crowdLevel), fontWeight: 600, fontSize: 13 }}>
                {c.crowdLevel} crowd
              </span>
            </div>
            <p className="muted">{c.district || "District not set"}</p>
            <p>{c.distanceKm !== null ? `${c.distanceKm} km away` : "Distance not available"}</p>
            <div className="progress">
              <span style={{ width: `${c.crowdPct}%`, background: crowdColor(c.crowdLevel) }}></span>
            </div>
            <p className="muted">{c.booked}/{c.capacity} booked ({c.crowdPct}%)</p>
          </div>
        ))}
      </div>
    </>
  );
}