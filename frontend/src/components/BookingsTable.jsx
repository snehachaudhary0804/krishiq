import { money, statusClass } from "../utils/format";
import { IconHistory } from "./icons.jsx";

export default function BookingsTable({ bookings, labels = {}, onUpdatePayment, updatingId }) {
  const text = {
    token: "Token", farmer: "Farmer", centre: "Centre", crop: "Crop", date: "Date", slot: "Slot", status: "Status", weight: "Weight", amount: "Amount", payment: "Payment", paymentAction: "Payment Action", statusLabels: {}, empty: "No bookings yet. Create one from Farmer -> Book Token.",
    ...labels,
  };

  if (!bookings.length) return <div className="empty"><IconHistory style={{ width: 30, height: 30, color: "var(--muted)", marginBottom: 8, display: "block", marginInline: "auto" }} /><div>{text.empty}</div></div>;

  const showActions = typeof onUpdatePayment === "function";

  return <div className="tablebox"><table className="table"><thead><tr><th>{text.token}</th><th>{text.farmer}</th><th>{text.centre}</th><th>{text.crop}</th><th>{text.date}</th><th>{text.slot}</th><th>{text.status}</th><th>{text.weight}</th><th>{text.amount}</th><th>{text.payment}</th>{showActions && <th>{text.paymentAction}</th>}</tr></thead><tbody>
    {bookings.map((booking) => {
      const isUpdating = updatingId === booking._id;
      return <tr key={booking._id}><td><b>{booking.token}</b></td><td>{booking.farmerName}</td><td>{booking.centre?.name || "-"}</td><td>{booking.crop}</td><td>{booking.date}</td><td>{booking.slot}</td><td><span className={`status ${statusClass(booking.status)}`}>{text.statusLabels[booking.status] || booking.status}</span></td><td>{booking.weight || "-"}</td><td>{booking.amount ? money(booking.amount) : "-"}</td><td>{booking.payment ? <span className={`status ${statusClass(booking.payment)}`}>{text.statusLabels[booking.payment] || booking.payment}</span> : "-"}</td>
        {showActions && <td>
          {booking.payment === "PAYMENT_PENDING" && <div style={{ display: "flex", gap: 6 }}>
            <button className="btn small" disabled={isUpdating} onClick={() => onUpdatePayment(booking._id, "PROCESSING")}>Mark Processing</button>
            <button className="btn small blue" disabled={isUpdating} onClick={() => onUpdatePayment(booking._id, "PAID")}>Mark Paid</button>
          </div>}
          {booking.payment === "PROCESSING" && <button className="btn small blue" disabled={isUpdating} onClick={() => onUpdatePayment(booking._id, "PAID")}>Mark Paid</button>}
          {booking.payment === "PAID" && <span style={{ color: "#176b43", fontSize: 11, fontWeight: 700 }}>✓ Done</span>}
          {(!booking.payment || booking.payment === "NOT_APPLICABLE") && "-"}
        </td>}
      </tr>;
    })}
  </tbody></table></div>;
}

