import { useEffect, useMemo, useState } from "react";
import { api } from "../../api/api";
import { useToast } from "../../context/ToastContext.jsx";
import {
  IconHistory,
  IconUsers,
  IconRefresh,
} from "../../components/icons.jsx";
import { money } from "../../utils/format";

const STATUS_OPTIONS = [
  { value: "ALL", label: "All" },
  { value: "BOOKED", label: "Booked" },
  { value: "CALLED", label: "Called" },
  { value: "IN_SERVICE", label: "In Service" },
  { value: "COMPLETED", label: "Completed" },
  { value: "REJECTED", label: "Rejected" },
];

const STATUS_META = {
  BOOKED: {
    label: "Booked",
    bg: "#eef6ff",
    color: "#2563eb",
    dot: "#3b82f6",
  },
  CALLED: {
    label: "Called",
    bg: "#fff7ed",
    color: "#c2410c",
    dot: "#f97316",
  },
  IN_SERVICE: {
    label: "In Service",
    bg: "#ecfdf5",
    color: "#047857",
    dot: "#10b981",
  },
  COMPLETED: {
    label: "Completed",
    bg: "#f0fdf4",
    color: "#15803d",
    dot: "#22c55e",
  },
  REJECTED: {
    label: "Rejected",
    bg: "#fef2f2",
    color: "#dc2626",
    dot: "#ef4444",
  },
};

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || {
    label: status || "Unknown",
    bg: "#f3f4f6",
    color: "#4b5563",
    dot: "#6b7280",
  };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        padding: "7px 11px",
        borderRadius: 999,
        background: meta.bg,
        color: meta.color,
        fontSize: 12,
        fontWeight: 800,
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: meta.dot,
        }}
      />
      {meta.label}
    </span>
  );
}

function FarmerAvatar({ name }) {
  const letter = name?.charAt(0)?.toUpperCase() || "F";

  return (
    <div
      style={{
        width: 42,
        height: 42,
        borderRadius: 13,
        background: "linear-gradient(135deg, #e7f4ea, #d5eadb)",
        color: "#176b3a",
        display: "grid",
        placeItems: "center",
        fontWeight: 900,
        fontSize: 16,
        flexShrink: 0,
      }}
    >
      {letter}
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div
      style={{
        padding: "13px 14px",
        border: "1px solid #e7ece8",
        borderRadius: 12,
        background: "#fafcfb",
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: "#7a857e",
          marginBottom: 5,
          textTransform: "uppercase",
          letterSpacing: ".04em",
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: 14,
          fontWeight: 800,
          color: "#1e2922",
          wordBreak: "break-word",
        }}
      >
        {value || "—"}
      </div>
    </div>
  );
}

export default function BookingRecords() {
  const toast = useToast();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [selected, setSelected] = useState(null);

  async function loadRecords(showRefresh = false) {
    if (showRefresh) {
      setRefreshing(true);
    }

    try {
      const data = await api.getAllBookings();
      setBookings(data.bookings || []);
    } catch (err) {
      toast(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadRecords();
  }, []);

  const stats = useMemo(() => {
    return {
      total: bookings.length,
      waiting: bookings.filter((b) => b.status === "BOOKED").length,
      inService: bookings.filter((b) => b.status === "IN_SERVICE").length,
      completed: bookings.filter((b) => b.status === "COMPLETED").length,
    };
  }, [bookings]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return bookings.filter((b) => {
      const matchesSearch =
        !q ||
        [
          b.token,
          b.farmerName,
          b.mobile,
          b.crop,
          b.date,
          b.slot,
        ].some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(q)
        );

      const matchesStatus =
        status === "ALL" || b.status === status;

      return matchesSearch && matchesStatus;
    });
  }, [bookings, query, status]);

  function clearFilters() {
    setQuery("");
    setStatus("ALL");
  }

  if (loading) {
    return (
      <div className="empty">
        <div className="loader-ring" />
        Loading farmer records…
      </div>
    );
  }

  return (
    <>
      {/* HERO */}
      <section
        style={{
          borderRadius: 22,
          padding: "28px 30px",
          marginBottom: 20,
          background:
            "linear-gradient(135deg, #0b3d27 0%, #145a38 55%, #1d7046 100%)",
          color: "#fff",
          boxShadow: "0 12px 30px rgba(11,61,39,.16)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 20,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 900,
                letterSpacing: ".12em",
                opacity: 0.72,
                marginBottom: 8,
              }}
            >
              CENTRE RECORDS
            </div>

            <h1
              style={{
                margin: 0,
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontSize: 30,
                lineHeight: 1.15,
              }}
            >
              <IconHistory
                style={{
                  width: 25,
                  height: 25,
                  opacity: 0.9,
                }}
              />
              Farmer Applications
            </h1>

            <p
              style={{
                margin: "9px 0 0",
                opacity: 0.78,
                fontSize: 14,
              }}
            >
              Search, filter and review farmer applications handled at your
              centre.
            </p>
          </div>

          <button
            className="btn"
            onClick={() => loadRecords(true)}
            disabled={refreshing}
            style={{
              background: "#fff",
              color: "#145a38",
              border: "none",
              minWidth: 110,
            }}
          >
            <IconRefresh
              style={{
                width: 15,
                height: 15,
                marginRight: 6,
              }}
            />
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </section>

      {/* STAT CARDS */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 14,
          marginBottom: 20,
        }}
      >
        <div
          className="card"
          onClick={() => {
            setStatus("ALL");
            setQuery("");
          }}
          style={{
            cursor: "pointer",
            padding: 20,
            border: "1px solid #e5ebe7",
            transition: "transform .2s ease",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#78837c",
              }}
            >
              Total Records
            </span>

            <IconUsers
              style={{
                width: 19,
                height: 19,
                color: "#287548",
              }}
            />
          </div>

          <div
            style={{
              fontSize: 30,
              fontWeight: 900,
              color: "#18231c",
              marginTop: 8,
            }}
          >
            {stats.total}
          </div>

          <div
            style={{
              fontSize: 12,
              color: "#8a938d",
              marginTop: 3,
            }}
          >
            All applications
          </div>
        </div>

        <div
          className="card"
          onClick={() => {
            setStatus("BOOKED");
            setQuery("");
          }}
          style={{
            cursor: "pointer",
            padding: 20,
            border: "1px solid #e5ebe7",
          }}
        >
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#78837c",
            }}
          >
            Waiting
          </span>

          <div
            style={{
              fontSize: 30,
              fontWeight: 900,
              color: "#2563eb",
              marginTop: 8,
            }}
          >
            {stats.waiting}
          </div>

          <div
            style={{
              fontSize: 12,
              color: "#8a938d",
              marginTop: 3,
            }}
          >
            Booked farmers
          </div>
        </div>

        <div
          className="card"
          onClick={() => {
            setStatus("IN_SERVICE");
            setQuery("");
          }}
          style={{
            cursor: "pointer",
            padding: 20,
            border: "1px solid #e5ebe7",
          }}
        >
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#78837c",
            }}
          >
            In Service
          </span>

          <div
            style={{
              fontSize: 30,
              fontWeight: 900,
              color: "#047857",
              marginTop: 8,
            }}
          >
            {stats.inService}
          </div>

          <div
            style={{
              fontSize: 12,
              color: "#8a938d",
              marginTop: 3,
            }}
          >
            At procurement desk
          </div>
        </div>

        <div
          className="card"
          onClick={() => {
            setStatus("COMPLETED");
            setQuery("");
          }}
          style={{
            cursor: "pointer",
            padding: 20,
            border: "1px solid #e5ebe7",
          }}
        >
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#78837c",
            }}
          >
            Completed
          </span>

          <div
            style={{
              fontSize: 30,
              fontWeight: 900,
              color: "#15803d",
              marginTop: 8,
            }}
          >
            {stats.completed}
          </div>

          <div
            style={{
              fontSize: 12,
              color: "#8a938d",
              marginTop: 3,
            }}
          >
            Finished applications
          </div>
        </div>
      </section>

      {/* FILTER AREA */}
      <section
        className="card"
        style={{
          padding: 18,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              flex: "1 1 320px",
              position: "relative",
            }}
          >
            <span
              style={{
                position: "absolute",
                left: 14,
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: 21,
                color: "#758079",
              }}
            >
              ⌕
            </span>

            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search farmer, token, mobile, crop, date or slot…"
              style={{
                width: "100%",
                height: 46,
                padding: "0 15px 0 42px",
                borderRadius: 12,
                border: "1px solid #dfe7e1",
                background: "#fbfcfb",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {(query || status !== "ALL") && (
            <button
              className="btn alt"
              onClick={clearFilters}
              style={{
                height: 44,
              }}
            >
              Clear filters
            </button>
          )}
        </div>

        {/* STATUS TABS */}
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            marginTop: 14,
          }}
        >
          {STATUS_OPTIONS.map((option) => {
            const activeTab = status === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setStatus(option.value)}
                style={{
                  border: activeTab
                    ? "1px solid #176b3a"
                    : "1px solid #e1e8e3",
                  background: activeTab ? "#176b3a" : "#fff",
                  color: activeTab ? "#fff" : "#66716a",
                  padding: "8px 14px",
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 10,
            marginTop: 14,
            paddingTop: 13,
            borderTop: "1px solid #edf1ee",
          }}
        >
          <span
            style={{
              fontSize: 12,
              color: "#7b857f",
            }}
          >
            Showing{" "}
            <strong style={{ color: "#1d2921" }}>
              {filtered.length}
            </strong>{" "}
            of{" "}
            <strong style={{ color: "#1d2921" }}>
              {bookings.length}
            </strong>{" "}
            records
          </span>

          {status !== "ALL" && (
            <span
              style={{
                fontSize: 12,
                color: "#176b3a",
                fontWeight: 800,
              }}
            >
              Filter:{" "}
              {STATUS_OPTIONS.find((x) => x.value === status)?.label}
            </span>
          )}
        </div>
      </section>

      {/* RECORDS TABLE */}
      <section
        className="card"
        style={{
          padding: 0,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "18px 20px",
            borderBottom: "1px solid #e8ede9",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: 18,
                color: "#1c2820",
              }}
            >
              Application Records
            </h2>

            <p
              style={{
                margin: "5px 0 0",
                fontSize: 12,
                color: "#7d8780",
              }}
            >
              Select a farmer to view complete application details.
            </p>
          </div>

          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              color: "#176b3a",
              background: "#eef7f0",
              padding: "7px 11px",
              borderRadius: 999,
            }}
          >
            {filtered.length} results
          </div>
        </div>

        {!filtered.length ? (
          <div
            style={{
              minHeight: 280,
              display: "grid",
              placeItems: "center",
              textAlign: "center",
              padding: 30,
            }}
          >
            <div>
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 18,
                  background: "#f1f5f2",
                  display: "grid",
                  placeItems: "center",
                  margin: "0 auto 12px",
                }}
              >
                <IconUsers
                  style={{
                    width: 28,
                    height: 28,
                    color: "#789080",
                  }}
                />
              </div>

              <h3
                style={{
                  margin: 0,
                  color: "#26332b",
                }}
              >
                No matching records
              </h3>

              <p
                style={{
                  margin: "7px 0 15px",
                  color: "#818b84",
                  fontSize: 13,
                }}
              >
                Try another search term or clear the filters.
              </p>

              <button
                className="btn alt"
                onClick={clearFilters}
              >
                Clear filters
              </button>
            </div>
          </div>
        ) : (
          <div
            style={{
              overflowX: "auto",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: 900,
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "#f8faf8",
                    borderBottom: "1px solid #e8ede9",
                  }}
                >
                  <th
                    style={{
                      textAlign: "left",
                      padding: "13px 18px",
                      fontSize: 11,
                      color: "#7b857e",
                      textTransform: "uppercase",
                      letterSpacing: ".06em",
                    }}
                  >
                    Farmer
                  </th>

                  <th
                    style={{
                      textAlign: "left",
                      padding: "13px 12px",
                      fontSize: 11,
                      color: "#7b857e",
                      textTransform: "uppercase",
                      letterSpacing: ".06em",
                    }}
                  >
                    Token
                  </th>

                  <th
                    style={{
                      textAlign: "left",
                      padding: "13px 12px",
                      fontSize: 11,
                      color: "#7b857e",
                      textTransform: "uppercase",
                      letterSpacing: ".06em",
                    }}
                  >
                    Crop
                  </th>

                  <th
                    style={{
                      textAlign: "left",
                      padding: "13px 12px",
                      fontSize: 11,
                      color: "#7b857e",
                      textTransform: "uppercase",
                      letterSpacing: ".06em",
                    }}
                  >
                    Schedule
                  </th>

                  <th
                    style={{
                      textAlign: "left",
                      padding: "13px 12px",
                      fontSize: 11,
                      color: "#7b857e",
                      textTransform: "uppercase",
                      letterSpacing: ".06em",
                    }}
                  >
                    Status
                  </th>

                  <th
                    style={{
                      textAlign: "right",
                      padding: "13px 12px",
                      fontSize: 11,
                      color: "#7b857e",
                      textTransform: "uppercase",
                      letterSpacing: ".06em",
                    }}
                  >
                    Amount
                  </th>

                  <th
                    style={{
                      textAlign: "right",
                      padding: "13px 18px",
                    }}
                  />
                </tr>
              </thead>

              <tbody>
                {filtered.map((booking) => (
                  <tr
                    key={booking._id}
                    style={{
                      borderBottom: "1px solid #edf1ee",
                    }}
                  >
                    <td
                      style={{
                        padding: "15px 18px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 11,
                        }}
                      >
                        <FarmerAvatar name={booking.farmerName} />

                        <div>
                          <div
                            style={{
                              fontWeight: 850,
                              color: "#1c2820",
                              fontSize: 14,
                            }}
                          >
                            {booking.farmerName || "Unknown farmer"}
                          </div>

                          <div
                            style={{
                              fontSize: 11,
                              color: "#89928c",
                              marginTop: 3,
                            }}
                          >
                            {booking.mobile || "No mobile number"}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td
                      style={{
                        padding: "15px 12px",
                      }}
                    >
                      <span
                        style={{
                          display: "inline-flex",
                          padding: "7px 10px",
                          borderRadius: 9,
                          background: "#f0f6f2",
                          color: "#176b3a",
                          fontWeight: 900,
                          fontSize: 12,
                        }}
                      >
                        {booking.token || "—"}
                      </span>
                    </td>

                    <td
                      style={{
                        padding: "15px 12px",
                        fontWeight: 700,
                        color: "#354139",
                        fontSize: 13,
                      }}
                    >
                      {booking.crop || "—"}
                    </td>

                    <td
                      style={{
                        padding: "15px 12px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 750,
                          color: "#354139",
                        }}
                      >
                        {booking.date || "—"}
                      </div>

                      <div
                        style={{
                          fontSize: 11,
                          color: "#89928c",
                          marginTop: 3,
                        }}
                      >
                        {booking.slot || "No slot"}
                      </div>
                    </td>

                    <td
                      style={{
                        padding: "15px 12px",
                      }}
                    >
                      <StatusBadge status={booking.status} />
                    </td>

                    <td
                      style={{
                        padding: "15px 12px",
                        textAlign: "right",
                        fontWeight: 900,
                        color: "#176b3a",
                        fontSize: 14,
                      }}
                    >
                      {booking.amount
                        ? money(booking.amount)
                        : "—"}
                    </td>

                    <td
                      style={{
                        padding: "15px 18px",
                        textAlign: "right",
                      }}
                    >
                      <button
                        className="btn alt small-btn"
                        onClick={() => setSelected(booking)}
                      >
                        View details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* RIGHT DETAIL DRAWER */}
      {selected && (
        <div
          onClick={() => setSelected(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(10,22,15,.42)",
            zIndex: 1000,
          }}
        >
          <aside
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              height: "100%",
              width: "min(470px, 94vw)",
              background: "#fff",
              boxShadow: "-18px 0 50px rgba(0,0,0,.18)",
              overflowY: "auto",
            }}
          >
            {/* DRAWER HEADER */}
            <div
              style={{
                padding: "24px 24px 20px",
                background:
                  "linear-gradient(135deg, #0b3d27, #176b3a)",
                color: "#fff",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 15,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 900,
                      letterSpacing: ".12em",
                      opacity: 0.7,
                      marginBottom: 7,
                    }}
                  >
                    APPLICATION DETAILS
                  </div>

                  <h2
                    style={{
                      margin: 0,
                      fontSize: 24,
                    }}
                  >
                    {selected.farmerName || "Farmer"}
                  </h2>

                  <div
                    style={{
                      marginTop: 7,
                      fontSize: 13,
                      opacity: 0.78,
                    }}
                  >
                    Token {selected.token || "—"}
                  </div>
                </div>

                <button
                  onClick={() => setSelected(null)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 11,
                    border: "1px solid rgba(255,255,255,.25)",
                    background: "rgba(255,255,255,.1)",
                    color: "#fff",
                    fontSize: 22,
                    cursor: "pointer",
                  }}
                >
                  ×
                </button>
              </div>

              <div
                style={{
                  marginTop: 18,
                }}
              >
                <StatusBadge status={selected.status} />
              </div>
            </div>

            {/* DRAWER BODY */}
            <div
              style={{
                padding: 22,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 900,
                  color: "#7c877f",
                  letterSpacing: ".08em",
                  marginBottom: 12,
                }}
              >
                FARMER INFORMATION
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                }}
              >
                <DetailItem
                  label="Farmer"
                  value={selected.farmerName}
                />

                <DetailItem
                  label="Mobile"
                  value={selected.mobile}
                />

                <DetailItem
                  label="Crop"
                  value={selected.crop}
                />

                <DetailItem
                  label="Token"
                  value={selected.token}
                />

                <DetailItem
                  label="Date"
                  value={selected.date}
                />

                <DetailItem
                  label="Slot"
                  value={selected.slot}
                />

                <DetailItem
                  label="Expected Quantity"
                  value={
                    selected.quantity
                      ? `${selected.quantity} kg`
                      : "—"
                  }
                />

                <DetailItem
                  label="Queue Position"
                  value={selected.position}
                />
              </div>

              {/* PROCUREMENT SECTION */}
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 900,
                  color: "#7c877f",
                  letterSpacing: ".08em",
                  marginTop: 24,
                  marginBottom: 12,
                }}
              >
                PROCUREMENT
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                }}
              >
                <DetailItem
                  label="Processed Weight"
                  value={
                    selected.weight
                      ? `${selected.weight} kg`
                      : "Not processed"
                  }
                />

                <DetailItem
                  label="Amount"
                  value={
                    selected.amount
                      ? money(selected.amount)
                      : "Not available"
                  }
                />
              </div>

              {/* WEIGHT COMPARISON */}
              {selected.quantity && selected.weight && (
                <div
                  style={{
                    marginTop: 14,
                    padding: 16,
                    borderRadius: 14,
                    background: "#f3f8f4",
                    border: "1px solid #dfece2",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 10,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 800,
                        color: "#526058",
                      }}
                    >
                      Expected vs processed
                    </span>

                    <strong
                      style={{
                        fontSize: 13,
                        color: "#176b3a",
                      }}
                    >
                      {Math.round(
                        Math.min(
                          100,
                          Math.max(
                            0,
                            (Number(selected.weight) /
                              Number(selected.quantity)) *
                              100
                          )
                        )
                      )}
                      %
                    </strong>
                  </div>

                  <div
                    style={{
                      height: 8,
                      borderRadius: 99,
                      background: "#dce7df",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(
                            0,
                            (Number(selected.weight) /
                              Number(selected.quantity)) *
                              100
                          )
                        )}%`,
                        height: "100%",
                        background: "#176b3a",
                        borderRadius: 99,
                      }}
                    />
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginTop: 8,
                      fontSize: 11,
                      color: "#748078",
                    }}
                  >
                    <span>
                      Expected: {selected.quantity} kg
                    </span>

                    <span>
                      Processed: {selected.weight} kg
                    </span>
                  </div>
                </div>
              )}

              {/* SECURITY NOTE */}
              <div
                style={{
                  marginTop: 20,
                  padding: 14,
                  borderRadius: 13,
                  background: "#f8faf8",
                  border: "1px solid #e7ece8",
                  fontSize: 12,
                  lineHeight: 1.55,
                  color: "#68736c",
                }}
              >
                <strong style={{ color: "#344038" }}>
                  🔒 Centre protected record
                </strong>

                <br />

                This application belongs to the operator's assigned
                procurement centre.
              </div>

              <button
                className="btn alt"
                onClick={() => setSelected(null)}
                style={{
                  width: "100%",
                  marginTop: 18,
                  height: 44,
                }}
              >
                Close details
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}