import { useNavigate } from "react-router-dom";
import { statusClass } from "../utils/format";
import { IconArrowRight } from "./icons.jsx";

export default function BookingSummary({ booking, currentToken, showLink = true }) {
  const navigate = useNavigate();
  const centreName = booking.centre?.name || "Centre deleted";

  return (
    <div>
      <div className="between">
        <div>
          <b>{booking.token}</b> • {booking.crop} • {booking.date} • {booking.slot}
        </div>
        <span className={`status ${statusClass(booking.status)}`}>{booking.status}</span>
      </div>
      <p className="muted">{centreName} • {booking.quantity} kg expected</p>
      <div className="notice">
        Now serving: <b>{currentToken || "Not started"}</b> &nbsp;|&nbsp; You are <b>#{booking.position}</b> in queue.
      </div>
      {showLink && (
        <button className="btn alt" onClick={() => navigate("/app/queue")}>
          Open Live Token
          <IconArrowRight style={{ width: 14, height: 14 }} />
        </button>
      )}
    </div>
  );
}
