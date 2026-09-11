import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/api";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import BookingSummary from "../../components/BookingSummary.jsx";
import { money } from "../../utils/format";
import { IconTicket, IconUsers, IconScale, IconWallet, IconArrowRight } from "../../components/icons.jsx";

export default function FarmerHome() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [active, setActive] = useState(null);
  const [current, setCurrent] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const [mine, cur] = await Promise.all([api.getMyBookings(), api.getCurrentToken()]);
      setActive(mine.active);
      setCurrent(cur.current);
    } catch (err) {
      toast(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  if (loading) {
    return <div className="empty"><div className="loader-ring" />Loading dashboard…</div>;
  }

  return (
    <div className="dashboard-page farmer-dashboard">
      <div className="hero farmer-hero">
        <div className="hero-kicker">Farmer workspace</div>
        <div className="between">
          <div className="hero-copy">
            <h1>Namaste, {user?.name || "Farmer"} 👋</h1>
            <p className="muted">
              {active
                ? "Your token is booked — track your live queue position below."
                : "Book a procurement token and track your turn without waiting unnecessarily."}
            </p>
          </div>
          <button className="btn" onClick={() => navigate("/app/book")}>
            <IconTicket style={{ width: 16, height: 16 }} />
            {active ? "View / Manage Token" : "Book Your Queue"}
            <IconArrowRight style={{ width: 15, height: 15 }} />
          </button>
        </div>
      </div>

      <div className="cards">
        <div className="card">
          <div className="card-icon"><IconTicket style={{ width: 19, height: 19 }} /></div>
          <div className="muted">My Token</div>
          <div className="num">{active ? active.token : "—"}</div>
          <span className={`status ${active ? "green" : ""}`}>{active ? active.status : "No active booking"}</span>
        </div>
        <div className="card">
          <div className="card-icon gold"><IconUsers style={{ width: 19, height: 19 }} /></div>
          <div className="muted">Your Position</div>
          <div className="num">{active ? active.position : "—"}</div>
          <div className="muted">{active ? `${active.position * 7} min estimated` : "—"}</div>
        </div>
        <div className="card">
          <div className="card-icon blue"><IconScale style={{ width: 19, height: 19 }} /></div>
          <div className="muted">Expected Quantity</div>
          <div className="num">{active?.weight ? active.weight + " kg" : "—"}</div>
          <div className="muted">{active?.quality || "Not processed"}</div>
        </div>
        <div className="card">
          <div className="card-icon" style={{ background: "var(--amber-light)", color: "var(--amber)" }}>
            <IconWallet style={{ width: 19, height: 19 }} />
          </div>
          <div className="muted">Payment Status</div>
          <div className="num">{active?.payment === "PAID" ? "Paid" : "—"}</div>
          <div className="muted">{active?.amount ? money(active.amount) : "Pending"}</div>
        </div>
      </div>

      <div className="section" style={{ marginTop: "20px", fontWeight: "bold" }}>Current Booking Status</div>
      <div className="card">
        {active ? (
          <BookingSummary booking={active} currentToken={current} />
        ) : (
          <div className="empty" style={{ textAlign: "center", padding: "20px" }}>
            You have no active token right now.<br /><br />
            <button className="btn" onClick={() => navigate("/app/book")}>Book Your First Token</button>
          </div>
        )}
      </div>
    </div>
  );
}