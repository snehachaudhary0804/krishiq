import { useEffect, useState } from "react";
import { api } from "../../api/api";
import { useToast } from "../../context/ToastContext.jsx";
import { money, statusClass } from "../../utils/format";
import { downloadReceipt } from "../../utils/receipt";
import { IconHistory, IconReceipt } from "../../components/icons.jsx";

export default function MyHistory() {
  const toast = useToast();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getMyBookings()
      .then((data) => setHistory(data.history))
      .catch((err) => toast(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="empty"><div className="loader-ring" />Loading history...</div>;

  return (
    <div className="card">
      <h2 style={{ display: "flex", alignItems: "center", gap: 9 }}><IconHistory style={{ width: 19, height: 19, color: "var(--brand)" }} /> My History</h2>
      {history.length === 0 ? (
        <div className="empty">No booking history yet. Once you book a token, it will appear here.</div>
      ) : (
        history.map((b) => (
          <div key={b._id} className="between" style={{ padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
            <div>
              <div className="between">
                <div><b>{b.token}</b> - {b.crop} - {b.date} - {b.slot}</div>
                <span className={`status ${statusClass(b.status)}`}>{b.status}</span>
              </div>
              <p className="muted">
                {b.centre?.name || "Centre deleted"} - {b.quantity} kg expected
                {b.weight ? ` - Weight ${b.weight} kg` : ""}
                {b.amount ? ` - ${money(b.amount)}` : ""}
              </p>
            </div>
            {(b.status === "COMPLETED" || b.payment === "PAID") && (
              <button className="btn blue" onClick={() => downloadReceipt(b)}>
                <IconReceipt style={{ width: 14, height: 14 }} />
                Receipt
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
}
