import { statusClass } from "../utils/format";
import { IconUsers, IconClock, IconScale } from "./icons.jsx";

export default function QueueTable({ bookings, onCall, onProcess }) {
 if (!bookings.length) return <div className="empty"><IconUsers style={{ width: 30, height: 30, color: "var(--muted)", marginBottom: 8, display: "block", marginInline: "auto" }} /><div>No active tokens. Farmers can book from the Farmer portal.</div></div>;
 return <div className="tablebox"><table className="table queue-table"><thead><tr><th>Token</th><th>Farmer</th><th>Crop</th><th>Slot</th><th>Position</th><th>Status</th><th>Action</th></tr></thead><tbody>
 {bookings.map((b) => <tr key={b._id} className={b.status === "CALLED" ? "queue-highlight" : ""}>
  <td><b className="token-chip">{b.token}</b></td>
  <td><b>{b.farmerName}</b><small className="table-sub">{b.mobile || "Farmer"}</small></td>
  <td>{b.crop}</td><td>{b.slot}</td><td><span className="position-badge">#{b.position}</span></td>
  <td><span className={`status ${statusClass(b.status)}`}>{b.status.replace("_", " ")}</span></td>
  <td><div className="row queue-actions">
    {b.status === "BOOKED" && <button className="btn alt small-btn" onClick={() => onCall(b._id)}><IconClock style={{ width: 13, height: 13 }} />Call</button>}
    {(b.status === "CALLED" || b.status === "IN_SERVICE") && <button className="btn small-btn" onClick={() => onProcess(b._id)}><IconScale style={{ width: 13, height: 13 }} />{b.status === "IN_SERVICE" ? "Continue" : "Process"}</button>}
  </div></td>
 </tr>)}
 </tbody></table></div>;
}
