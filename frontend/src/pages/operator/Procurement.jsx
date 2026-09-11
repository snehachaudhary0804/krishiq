import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/api";
import { useToast } from "../../context/ToastContext.jsx";
import { money } from "../../utils/format";
import { IconScale } from "../../components/icons.jsx";

export default function Procurement() {
  const toast = useToast();
  const navigate = useNavigate();

  const [crops, setCrops] = useState([]);
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [centre, setCentre] = useState(null);

  const [gross, setGross] = useState(520);
  const [tare, setTare] = useState(10);
  const [quality, setQuality] = useState("A");
  const [moisture, setMoisture] = useState(12);

  const [completed, setCompleted] = useState(null);

  async function load() {
    try {
      const [
        activeData,
        cropData,
        centreData,
      ] = await Promise.all([
        api.getActiveBookings(),
        api.getCrops(),
        api.getCentres(),
      ]);

      const target =
        activeData.bookings.find(
          (b) => b.status === "IN_SERVICE"
        ) ||
        activeData.bookings.find(
          (b) => b.status === "CALLED"
        );

      setBooking(target || null);
      setCrops(cropData.crops || []);
      setCentre(
        centreData.centres?.[0] || null
      );
    } catch (err) {
      toast(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const net =
    Number(gross || 0) -
    Number(tare || 0);

  const cropRate =
    crops.find(
      (c) => c.name === booking?.crop
    )?.msp || 0;

  const estimatedValue =
    net > 0
      ? Math.round(net * Number(cropRate))
      : 0;

  async function saveProc() {
    if (!booking) {
      toast("No farmer is ready for procurement.");
      return;
    }

    if (Number(gross) <= 0) {
      toast("Enter a valid gross weight.");
      return;
    }

    if (Number(tare) < 0) {
      toast("Tare weight cannot be negative.");
      return;
    }

    if (net <= 0) {
      toast("Net weight must be greater than zero.");
      return;
    }

    setBusy(true);

    try {
      const data = await api.processBooking(
        booking._id,
        {
          grossWeight: Number(gross),
          tareWeight: Number(tare),
          quality,
          moisture: Number(moisture),
        }
      );

      const finished = data.booking;

      setCompleted(finished);

      setBooking(null);

      toast(
        finished.status === "REJECTED"
          ? "Procurement rejected."
          : "Procurement completed successfully."
      );
    } catch (err) {
      toast(err.message);
    } finally {
      setBusy(false);
    }
  }

  function goToQueue() {
    setCompleted(null);
    navigate("/app/queue");
  }

  if (loading) {
    return (
      <div className="empty">
        <div className="loader-ring" />
        Loading procurement desk…
      </div>
    );
  }

  {/* =========================
      SUCCESS / COMPLETION SCREEN
  ========================== */}

  if (completed) {
    const isRejected =
      completed.status === "REJECTED";

    return (
      <div
        style={{
          maxWidth: 820,
          margin: "30px auto",
        }}
      >
        <section
          className="card"
          style={{
            padding: 34,
            textAlign: "center",
            borderRadius: 24,
          }}
        >
          <div
            style={{
              width: 76,
              height: 76,
              margin: "0 auto 18px",
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              background: isRejected
                ? "#fff1f1"
                : "#eaf8ef",
              color: isRejected
                ? "#dc2626"
                : "#16804b",
              fontSize: 36,
              fontWeight: 900,
            }}
          >
            {isRejected ? "!" : "✓"}
          </div>

          <div
            style={{
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: ".12em",
              color: isRejected
                ? "#dc2626"
                : "#16804b",
              marginBottom: 8,
            }}
          >
            {isRejected
              ? "PROCUREMENT REJECTED"
              : "PROCUREMENT COMPLETED"}
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: 30,
              color: "#1c2820",
            }}
          >
            {completed.farmerName}
          </h1>

          <p
            style={{
              margin: "8px 0 25px",
              color: "#7a857e",
            }}
          >
            Token {completed.token} •{" "}
            {completed.crop}
          </p>

          {!isRejected && (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(2, 1fr)",
                  gap: 12,
                  textAlign: "left",
                }}
              >
                <div
                  style={{
                    padding: 18,
                    borderRadius: 15,
                    background: "#f7faf8",
                    border:
                      "1px solid #e3ebe5",
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      color: "#7b857e",
                      fontWeight: 800,
                    }}
                  >
                    LOT ID
                  </span>

                  <strong
                    style={{
                      display: "block",
                      marginTop: 7,
                      fontSize: 19,
                      color: "#176b3a",
                    }}
                  >
                    {completed.lot || "—"}
                  </strong>
                </div>

                <div
                  style={{
                    padding: 18,
                    borderRadius: 15,
                    background: "#f7faf8",
                    border:
                      "1px solid #e3ebe5",
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      color: "#7b857e",
                      fontWeight: 800,
                    }}
                  >
                    NET WEIGHT
                  </span>

                  <strong
                    style={{
                      display: "block",
                      marginTop: 7,
                      fontSize: 19,
                      color: "#1c2820",
                    }}
                  >
                    {completed.weight || 0} kg
                  </strong>
                </div>

                <div
                  style={{
                    padding: 18,
                    borderRadius: 15,
                    background: "#f7faf8",
                    border:
                      "1px solid #e3ebe5",
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      color: "#7b857e",
                      fontWeight: 800,
                    }}
                  >
                    QUALITY
                  </span>

                  <strong
                    style={{
                      display: "block",
                      marginTop: 7,
                      fontSize: 19,
                      color: "#1c2820",
                    }}
                  >
                    {completed.quality ||
                      quality}
                  </strong>
                </div>

                <div
                  style={{
                    padding: 18,
                    borderRadius: 15,
                    background: "#f7faf8",
                    border:
                      "1px solid #e3ebe5",
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      color: "#7b857e",
                      fontWeight: 800,
                    }}
                  >
                    AMOUNT
                  </span>

                  <strong
                    style={{
                      display: "block",
                      marginTop: 7,
                      fontSize: 19,
                      color: "#176b3a",
                    }}
                  >
                    {completed.amount != null
                      ? money(completed.amount)
                      : "—"}
                  </strong>
                </div>
              </div>

              <div
                style={{
                  marginTop: 18,
                  padding: 16,
                  borderRadius: 14,
                  background: "#eef8f1",
                  border:
                    "1px solid #d4ead9",
                  textAlign: "left",
                  fontSize: 13,
                  color: "#4e6255",
                  lineHeight: 1.55,
                }}
              >
                <strong
                  style={{
                    color: "#176b3a",
                  }}
                >
                  ✓ Lot generated successfully
                </strong>

                <br />

                The procurement record has been
                saved and the farmer can now be
                moved out of the active queue.
              </div>
            </>
          )}

          {isRejected && (
            <div
              style={{
                padding: 18,
                borderRadius: 14,
                background: "#fff6f6",
                border:
                  "1px solid #f1d3d3",
                color: "#8b3a3a",
                textAlign: "left",
              }}
            >
              This procurement was marked as
              rejected. No procurement lot or
              payment amount was generated.
            </div>
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 10,
              marginTop: 24,
              flexWrap: "wrap",
            }}
          >
            <button
              className="btn"
              onClick={goToQueue}
            >
              Back to Live Queue
            </button>

            <button
              className="btn alt"
              onClick={() =>
                navigate("/app/bookings")
              }
            >
              View Bookings
            </button>
          </div>
        </section>
      </div>
    );
  }

  if (!booking) {
    return (
      <>
        <section
          className="hero"
          style={{
            marginBottom: 20,
          }}
        >
          <div className="hero-kicker">
            PROCUREMENT DESK
          </div>

          <h1
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <IconScale
              style={{
                width: 25,
                height: 25,
                color: "var(--brand)",
              }}
            />

            Procurement
          </h1>

          <p>
            Record weights, quality and generate
            the procurement lot.
          </p>
        </section>

        <div
          className="card empty"
          style={{
            minHeight: 260,
          }}
        >
          <div
            style={{
              fontSize: 38,
              marginBottom: 10,
            }}
          >
            ✓
          </div>

          <h3
            style={{
              margin: 0,
            }}
          >
            No farmer ready for procurement
          </h3>

          <p
            style={{
              margin: "7px 0 18px",
            }}
          >
            Call the next farmer from Live Queue
            and start service before opening the
            procurement desk.
          </p>

          <button
            className="btn"
            onClick={() =>
              navigate("/app/queue")
            }
          >
            Open Live Queue
          </button>
        </div>
      </>
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
            "linear-gradient(135deg,#effaf3,#fffdf5)",
          border:
            "1px solid #dcebe0",
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
                color: "#167040",
                marginBottom: 8,
              }}
            >
              PROCUREMENT DESK
            </div>

            <h1
              style={{
                margin: 0,
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontSize: 30,
              }}
            >
              <IconScale
                style={{
                  width: 25,
                  height: 25,
                  color: "#176b3a",
                }}
              />

              Procurement
            </h1>

            <p
              style={{
                margin: "9px 0 0",
                color: "#68776d",
                fontSize: 14,
              }}
            >
              Record weights, quality and generate
              the procurement lot.
            </p>
          </div>

          <span
            style={{
              padding: "8px 13px",
              borderRadius: 999,
              background: "#ecfbf1",
              border: "1px solid #c8ecd3",
              color: "#167040",
              fontSize: 11,
              fontWeight: 900,
            }}
          >
            ● READY FOR ENTRY
          </span>
        </div>
      </section>

      {/* CURRENT FARMER */}
      <section
        className="card"
        style={{
          padding: 20,
          marginBottom: 20,
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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 17,
                background: "#eaf7ee",
                color: "#16804b",
                display: "grid",
                placeItems: "center",
                fontSize: 18,
                fontWeight: 900,
              }}
            >
              {booking.token}
            </div>

            <div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 900,
                  letterSpacing: ".08em",
                  color: "#8a948d",
                }}
              >
                CURRENT FARMER
              </div>

              <h2
                style={{
                  margin: "4px 0 3px",
                  fontSize: 18,
                }}
              >
                {booking.farmerName}
              </h2>

              <div
                style={{
                  fontSize: 12,
                  color: "#7b857e",
                }}
              >
                {booking.crop} • Token{" "}
                {booking.token}
              </div>
            </div>
          </div>

          <div
            style={{
              textAlign: "right",
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 900,
                color: "#8a948d",
              }}
            >
              CENTRE
            </div>

            <strong
              style={{
                fontSize: 13,
                color: "#344139",
              }}
            >
              {centre?.name ||
                "Assigned centre"}
            </strong>
          </div>
        </div>
      </section>

      {/* FORM + SUMMARY */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "minmax(0, 1.5fr) minmax(300px, .8fr)",
          gap: 18,
          alignItems: "start",
        }}
      >
        {/* FORM */}
        <section
          className="card"
          style={{
            padding: 22,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 900,
              letterSpacing: ".09em",
              color: "#8a948d",
            }}
          >
            PROCUREMENT DETAILS
          </div>

          <h2
            style={{
              margin: "6px 0 5px",
            }}
          >
            Enter crop details
          </h2>

          <p
            style={{
              margin: "0 0 22px",
              color: "#7b857e",
              fontSize: 13,
            }}
          >
            Verify the physical weight and quality
            before generating the lot.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "1fr 1fr",
              gap: 15,
            }}
          >
            <div className="field">
              <label>Gross Weight (kg)</label>

              <input
                type="number"
                min="0"
                value={gross}
                onChange={(e) =>
                  setGross(e.target.value)
                }
              />
            </div>

            <div className="field">
              <label>Tare Weight (kg)</label>

              <input
                type="number"
                min="0"
                value={tare}
                onChange={(e) =>
                  setTare(e.target.value)
                }
              />
            </div>

            <div className="field">
              <label>Quality Grade</label>

              <select
                value={quality}
                onChange={(e) =>
                  setQuality(e.target.value)
                }
              >
                <option value="A">
                  A — Premium
                </option>

                <option value="B">
                  B — Standard
                </option>

                <option value="C">
                  C — Low Grade
                </option>

                <option value="REJECTED">
                  Rejected
                </option>
              </select>
            </div>

            <div className="field">
              <label>Moisture (%)</label>

              <input
                type="number"
                min="0"
                max="100"
                value={moisture}
                onChange={(e) =>
                  setMoisture(e.target.value)
                }
              />
            </div>
          </div>

          <div
            style={{
              marginTop: 18,
              padding: 16,
              borderRadius: 13,
              background: "#f7faf8",
              border:
                "1px solid #e1e9e3",
              fontSize: 12,
              lineHeight: 1.6,
              color: "#68746c",
            }}
          >
            <strong
              style={{
                color: "#3b4a41",
              }}
            >
              Calculation:
            </strong>{" "}
            Net Weight = Gross Weight − Tare
            Weight.
            <br />

            MSP for{" "}
            <strong
              style={{
                color: "#176b3a",
              }}
            >
              {booking.crop}
            </strong>
            :{" "}
            <strong
              style={{
                color: "#176b3a",
              }}
            >
              {cropRate
                ? money(cropRate) + "/kg"
                : "Not configured"}
            </strong>
          </div>

          <button
            className="btn"
            onClick={saveProc}
            disabled={busy}
            style={{
              width: "100%",
              marginTop: 18,
              height: 48,
              opacity: busy ? 0.7 : 1,
            }}
          >
            {busy
              ? "Saving Procurement…"
              : "Save Procurement & Generate Lot"}
          </button>
        </section>

        {/* SUMMARY */}
        <section
          style={{
            padding: 22,
            borderRadius: 19,
            background:
              "linear-gradient(145deg,#0d4d2e,#176b3a)",
            color: "#fff",
            boxShadow:
              "0 14px 30px rgba(13,77,46,.18)",
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 900,
              letterSpacing: ".1em",
              opacity: 0.68,
            }}
          >
            PROCUREMENT SUMMARY
          </div>

          <h2
            style={{
              margin: "7px 0 18px",
              color: "#fff",
            }}
          >
            Weight & Value
          </h2>

          <div
            style={{
              padding: 17,
              borderRadius: 15,
              background:
                "rgba(255,255,255,.1)",
              border:
                "1px solid rgba(255,255,255,.12)",
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 800,
                opacity: 0.65,
              }}
            >
              NET WEIGHT
            </div>

            <div
              style={{
                marginTop: 5,
                fontSize: 31,
                fontWeight: 900,
              }}
            >
              {Math.max(
                0,
                net
              ).toFixed(2)}

              <span
                style={{
                  fontSize: 14,
                  marginLeft: 5,
                  opacity: 0.7,
                }}
              >
                kg
              </span>
            </div>
          </div>

          <div
            style={{
              marginTop: 20,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                paddingBottom: 13,
                borderBottom:
                  "1px solid rgba(255,255,255,.15)",
              }}
            >
              <span
                style={{
                  opacity: 0.68,
                  fontSize: 12,
                }}
              >
                MSP Rate
              </span>

              <strong>
                {cropRate
                  ? money(cropRate) + "/kg"
                  : "—"}
              </strong>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding:
                  "13px 0",
                borderBottom:
                  "1px solid rgba(255,255,255,.15)",
              }}
            >
              <span
                style={{
                  opacity: 0.68,
                  fontSize: 12,
                }}
              >
                Quality
              </span>

              <strong>
                {quality}
              </strong>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding:
                  "13px 0",
              }}
            >
              <span
                style={{
                  opacity: 0.68,
                  fontSize: 12,
                }}
              >
                Moisture
              </span>

              <strong>
                {Number(moisture || 0).toFixed(1)}%
              </strong>
            </div>
          </div>

          <div
            style={{
              marginTop: 5,
              padding: 18,
              borderRadius: 15,
              background:
                "rgba(255,255,255,.1)",
              border:
                "1px solid rgba(255,255,255,.12)",
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 800,
                opacity: 0.65,
              }}
            >
              ESTIMATED PROCUREMENT VALUE
            </div>

            <div
              style={{
                marginTop: 6,
                fontSize: 25,
                fontWeight: 900,
              }}
            >
              {estimatedValue
                ? money(estimatedValue)
                : "—"}
            </div>

            <small
              style={{
                opacity: 0.62,
              }}
            >
              Net weight × MSP rate
            </small>
          </div>
        </section>
      </div>
    </>
  );
}