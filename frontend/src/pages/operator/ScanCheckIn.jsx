import { useEffect, useRef, useState } from "react";
import { api } from "../../api/api";
import { useToast } from "../../context/ToastContext.jsx";
import { IconScan } from "../../components/icons.jsx";

export default function ScanCheckIn() {
  const toast = useToast();

  const [manualToken, setManualToken] = useState("");
  const [scanning, setScanning] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [centre, setCentre] = useState(null);
  const [checking, setChecking] = useState(false);

  const scannerRef = useRef(null);
  const readerRef = useRef(null);

  async function checkIn(token) {
    if (!token?.trim()) {
      toast("Enter a token");
      return;
    }

    setChecking(true);

    try {
      const data = await api.checkInByToken(token.trim());

      setLastResult(data.booking);

      toast(
        `Checked in: ${data.booking.token} (${data.booking.farmerName})`
      );
    } catch (err) {
      toast(err.message);
    } finally {
      setChecking(false);
    }
  }

  async function startScanner() {
    const { Html5Qrcode } = await import("html5-qrcode");

    if (!readerRef.current) return;

    const scanner = new Html5Qrcode(readerRef.current.id);

    scannerRef.current = scanner;

    try {
      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: 220,
        },
        async (decodedText) => {
          const parts = decodedText.split(":");

          const token =
            parts.length > 1
              ? parts[1]
              : decodedText;

          await checkIn(token);
          await stopScanner();
        },
        () => {}
      );

      setScanning(true);
    } catch (err) {
      toast(
        "Camera not available: " +
          err.message
      );
    }
  }

  async function stopScanner() {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (_) {}
    }

    setScanning(false);
  }

  useEffect(() => {
    api
      .getCentres()
      .then((d) =>
        setCentre(
          d.centres?.[0] || null
        )
      )
      .catch(() => {});

    return () => {
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .catch(() => {});
      }
    };
  }, []);

  function submitManual(e) {
    e.preventDefault();

    if (!manualToken.trim()) {
      toast("Enter a token");
      return;
    }

    checkIn(manualToken.trim());
    setManualToken("");
  }

  function useExample(token) {
    setManualToken(token);
  }

  return (
    <div
      style={{
        paddingBottom: 40,
      }}
    >

      {/* =====================================================
          PAGE HEADER
      ====================================================== */}

      <section
        style={{
          padding: "27px 30px",
          marginBottom: 18,
          borderRadius: 22,
          background:
            "linear-gradient(135deg, #ecfdf3 0%, #ffffff 58%, #fffaf0 100%)",
          border:
            "1px solid #d5f1de",
          boxShadow:
            "0 8px 30px rgba(15,23,42,0.045)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 220,
            height: 220,
            border:
              "1px solid rgba(22,101,52,0.10)",
            borderRadius: "50%",
            right: -80,
            top: -100,
          }}
        />

        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent:
              "space-between",
            gap: 20,
          }}
        >
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                padding:
                  "6px 11px",
                borderRadius: 999,
                background:
                  "#dcfce7",
                color:
                  "#166534",
                fontSize: 10,
                fontWeight: 800,
                letterSpacing:
                  "0.1em",
                marginBottom: 10,
              }}
            >
              <span>●</span>
              CHECK-IN DESK
            </div>

            <h1
              style={{
                margin: 0,
                display: "flex",
                alignItems:
                  "center",
                gap: 11,
                color:
                  "#123b2a",
                fontSize:
                  "clamp(27px, 3vw, 36px)",
                fontWeight: 850,
                lineHeight: 1.1,
              }}
            >
              <IconScan
                style={{
                  width: 30,
                  height: 30,
                  color: "#16803c",
                }}
              />

              Scan Check-in
            </h1>

            <p
              style={{
                margin:
                  "9px 0 0",
                color:
                  "#667085",
                fontSize: 14,
              }}
            >
              {centre?.name ||
                "Assigned centre"}{" "}
              • Scan a farmer QR code or
              enter their token manually.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection:
                "column",
              alignItems:
                "flex-end",
              gap: 6,
            }}
          >
            <div
              style={{
                padding:
                  "9px 13px",
                borderRadius: 999,
                background:
                  "#ffffff",
                border:
                  "1px solid #ccefd8",
                color:
                  "#166534",
                fontSize: 11,
                fontWeight: 800,
                whiteSpace:
                  "nowrap",
              }}
            >
              🔒 CENTRE ONLY
            </div>

            <span
              style={{
                fontSize: 10,
                color:
                  "#98a2b3",
              }}
            >
              Secure queue check-in
            </span>
          </div>
        </div>
      </section>

      {/* =====================================================
          QUICK STATUS
      ====================================================== */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(3, minmax(0, 1fr))",
          gap: 12,
          marginBottom: 18,
        }}
      >
        <InfoCard
          number="01"
          title="SCAN"
          text="Use the farmer's QR code"
          icon="▣"
        />

        <InfoCard
          number="02"
          title="VERIFY"
          text="Confirm the booking token"
          icon="✓"
        />

        <InfoCard
          number="03"
          title="QUEUE"
          text="Farmer joins your centre queue"
          icon="→"
        />
      </div>

      {/* =====================================================
          MAIN WORKSPACE
      ====================================================== */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "1.15fr 0.85fr",
          gap: 18,
          alignItems:
            "stretch",
        }}
      >

        {/* ===================================================
            CAMERA
        ==================================================== */}

        <section
          style={{
            background:
              "#ffffff",
            border:
              "1px solid #e3e9e5",
            borderRadius: 20,
            padding: 21,
            boxShadow:
              "0 7px 25px rgba(15,23,42,0.04)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems:
                "center",
              justifyContent:
                "space-between",
              marginBottom: 13,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 10,
                  color:
                    "#98a2b3",
                  fontWeight: 800,
                  letterSpacing:
                    "0.1em",
                }}
              >
                PRIMARY METHOD
              </div>

              <h2
                style={{
                  margin:
                    "4px 0 0",
                  fontSize: 20,
                  color:
                    "#17211b",
                }}
              >
                Camera Scan
              </h2>
            </div>

            <div
              style={{
                display:
                  "flex",
                alignItems:
                  "center",
                gap: 6,
                padding:
                  "7px 10px",
                borderRadius: 999,
                background:
                  scanning
                    ? "#ecfdf3"
                    : "#f6f8f7",
                color:
                  scanning
                    ? "#15803d"
                    : "#667085",
                fontSize: 10,
                fontWeight: 800,
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius:
                    "50%",
                  background:
                    scanning
                      ? "#22c55e"
                      : "#98a2b3",
                }}
              />

              {scanning
                ? "CAMERA ACTIVE"
                : "READY"}
            </div>
          </div>

          {/* CAMERA AREA */}

          <div
            style={{
              position: "relative",
              minHeight: 310,
              borderRadius: 16,
              overflow: "hidden",
              background:
                "#f2f5f3",
              border:
                scanning
                  ? "2px solid #22c55e"
                  : "1px solid #e4e9e6",
            }}
          >
            <div
              id="qr-reader"
              ref={readerRef}
              style={{
                width: "100%",
                minHeight: 310,
              }}
            />

            {!scanning && (
              <div
                style={{
                  position:
                    "absolute",
                  inset: 0,
                  display:
                    "flex",
                  flexDirection:
                    "column",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                  pointerEvents:
                    "none",
                }}
              >
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius:
                      20,
                    background:
                      "#ffffff",
                    border:
                      "1px solid #dce5df",
                    display:
                      "flex",
                    alignItems:
                      "center",
                    justifyContent:
                      "center",
                    fontSize: 30,
                    color:
                      "#16803c",
                    boxShadow:
                      "0 8px 20px rgba(15,23,42,0.07)",
                  }}
                >
                  ⌁
                </div>

                <div
                  style={{
                    marginTop: 13,
                    fontSize: 15,
                    fontWeight: 750,
                    color:
                      "#344054",
                  }}
                >
                  Camera is ready
                </div>

                <div
                  style={{
                    marginTop: 4,
                    fontSize: 11,
                    color:
                      "#98a2b3",
                  }}
                >
                  Start camera to scan QR
                </div>
              </div>
            )}
          </div>

          {/* CAMERA ACTION */}

          <div
            style={{
              display:
                "flex",
              alignItems:
                "center",
              justifyContent:
                "space-between",
              gap: 12,
              marginTop: 14,
            }}
          >
            <div
              style={{
                fontSize: 11,
                color:
                  "#98a2b3",
              }}
            >
              Point the camera at the
              farmer QR code.
            </div>

            {!scanning ? (
              <button
                className="btn"
                onClick={
                  startScanner
                }
                style={{
                  minWidth: 135,
                }}
              >
                Start Camera
              </button>
            ) : (
              <button
                className="btn red"
                onClick={
                  stopScanner
                }
                style={{
                  minWidth: 135,
                }}
              >
                Stop Camera
              </button>
            )}
          </div>

          <div
            style={{
              marginTop: 12,
              padding:
                "10px 12px",
              borderRadius: 10,
              background:
                "#f8faf9",
              color:
                "#667085",
              fontSize: 10,
              lineHeight: 1.5,
            }}
          >
            💡 Camera access requires
            browser permission and works over
            HTTPS or localhost.
          </div>
        </section>

        {/* ===================================================
            MANUAL ENTRY
        ==================================================== */}

        <section
          style={{
            background:
              "linear-gradient(145deg, #ffffff 0%, #fbfefc 100%)",
            border:
              "1px solid #dce9e0",
            borderRadius: 20,
            padding: 21,
            boxShadow:
              "0 7px 25px rgba(15,23,42,0.04)",
            display:
              "flex",
            flexDirection:
              "column",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 10,
                color:
                  "#98a2b3",
                fontWeight: 800,
                letterSpacing:
                  "0.1em",
              }}
            >
              ALTERNATIVE METHOD
            </div>

            <h2
              style={{
                margin:
                  "4px 0 0",
                fontSize: 20,
                color:
                  "#17211b",
              }}
            >
              Manual Entry
            </h2>

            <p
              style={{
                margin:
                  "6px 0 0",
                color:
                  "#667085",
                fontSize: 12,
                lineHeight: 1.5,
              }}
            >
              Enter the token printed on the
              farmer's booking confirmation.
            </p>
          </div>

          <form
            onSubmit={submitManual}
            style={{
              marginTop: 24,
            }}
          >
            <label
              style={{
                display:
                  "block",
                marginBottom: 7,
                fontSize: 11,
                fontWeight: 750,
                color:
                  "#475467",
              }}
            >
              Booking Token
            </label>

            <div
              style={{
                height: 54,
                display:
                  "flex",
                alignItems:
                  "center",
                padding:
                  "0 14px",
                borderRadius: 12,
                border:
                  "1px solid #cfe1d5",
                background:
                  "#ffffff",
              }}
            >
              <span
                style={{
                  color:
                    "#16803c",
                  fontSize: 16,
                  fontWeight: 800,
                  marginRight: 9,
                }}
              >
                #
              </span>

              <input
                value={
                  manualToken
                }
                onChange={(e) =>
                  setManualToken(
                    e.target.value
                  )
                }
                placeholder="e.g. T-0001"
                style={{
                  width: "100%",
                  height: "100%",
                  border: "none",
                  outline:
                    "none",
                  background:
                    "transparent",
                  fontSize: 16,
                  fontWeight: 650,
                  color:
                    "#344054",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={checking}
              className="btn"
              style={{
                width: "100%",
                marginTop: 12,
                height: 48,
                justifyContent:
                  "center",
              }}
            >
              {checking
                ? "Checking in…"
                : "Check In Farmer"}
            </button>
          </form>

          {/* EXAMPLES */}

          <div
            style={{
              marginTop: 22,
            }}
          >
            <div
              style={{
                fontSize: 10,
                color:
                  "#98a2b3",
                fontWeight: 800,
                letterSpacing:
                  "0.08em",
                marginBottom:
                  9,
              }}
            >
              TOKEN EXAMPLES
            </div>

            <div
              style={{
                display:
                  "flex",
                gap: 7,
                flexWrap:
                  "wrap",
              }}
            >
              {[
                "T-0001",
                "T-0002",
                "T-0003",
              ].map(
                (token) => (
                  <button
                    key={token}
                    type="button"
                    onClick={() =>
                      useExample(
                        token
                      )
                    }
                    style={{
                      padding:
                        "7px 10px",
                      borderRadius:
                        8,
                      border:
                        "1px solid #dce8df",
                      background:
                        "#f4faf6",
                      color:
                        "#166534",
                      fontSize: 11,
                      fontWeight:
                        750,
                      cursor:
                        "pointer",
                    }}
                  >
                    {token}
                  </button>
                )
              )}
            </div>
          </div>

          {/* MANUAL INFO */}

          <div
            style={{
              marginTop:
                "auto",
              paddingTop: 22,
            }}
          >
            <div
              style={{
                padding:
                  "13px 14px",
                borderRadius:
                  12,
                background:
                  "#f8faf9",
                border:
                  "1px solid #edf1ee",
                fontSize: 11,
                lineHeight: 1.55,
                color:
                  "#667085",
              }}
            >
              <strong
                style={{
                  color:
                    "#344054",
                }}
              >
                Before checking in
              </strong>
              <br />
              Make sure the token belongs to
              today's farmer booking.
            </div>
          </div>
        </section>
      </div>

      {/* =====================================================
          LAST CHECK-IN
      ====================================================== */}

      {lastResult && (
        <section
          style={{
            marginTop: 18,
            padding: 20,
            borderRadius: 18,
            background:
              "linear-gradient(135deg, #ecfdf3, #f8fffa)",
            border:
              "1px solid #bceacb",
            boxShadow:
              "0 6px 20px rgba(22,101,52,0.06)",
          }}
        >
          <div
            style={{
              display:
                "flex",
              alignItems:
                "center",
              gap: 15,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                flexShrink: 0,
                borderRadius:
                  "50%",
                background:
                  "#dcfce7",
                color:
                  "#15803d",
                display:
                  "flex",
                alignItems:
                  "center",
                justifyContent:
                  "center",
                fontSize: 22,
                fontWeight: 900,
              }}
            >
              ✓
            </div>

            <div
              style={{
                flex: 1,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing:
                    "0.1em",
                  color:
                    "#15803d",
                }}
              >
                LAST SUCCESSFUL CHECK-IN
              </div>

              <div
                style={{
                  marginTop: 3,
                  display:
                    "flex",
                  alignItems:
                    "center",
                  gap: 9,
                  flexWrap:
                    "wrap",
                }}
              >
                <strong
                  style={{
                    fontSize: 17,
                    color:
                      "#14532d",
                  }}
                >
                  {lastResult.farmerName}
                </strong>

                <span
                  style={{
                    padding:
                      "4px 8px",
                    borderRadius:
                      7,
                    background:
                      "#ffffff",
                    color:
                      "#166534",
                    fontSize: 11,
                    fontWeight:
                      800,
                  }}
                >
                  {lastResult.token}
                </span>

                <span
                  style={{
                    fontSize: 11,
                    color:
                      "#667085",
                  }}
                >
                  {lastResult.crop}
                </span>
              </div>
            </div>

            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                color:
                  "#15803d",
              }}
            >
              ADDED TO QUEUE
            </div>
          </div>
        </section>
      )}

      {/* =====================================================
          SECURITY FOOTER
      ====================================================== */}

      <div
        style={{
          marginTop: 16,
          display:
            "flex",
          justifyContent:
            "center",
          color:
            "#98a2b3",
          fontSize: 10,
        }}
      >
        🔒 Check-ins are restricted to your
        assigned procurement centre.
      </div>
    </div>
  );
}

/* =========================================================
   SMALL INFO CARD
========================================================= */

function InfoCard({
  number,
  title,
  text,
  icon,
}) {
  return (
    <div
      style={{
        background:
          "#ffffff",
        border:
          "1px solid #e5eae7",
        borderRadius: 14,
        padding:
          "13px 15px",
        display:
          "flex",
        alignItems:
          "center",
        gap: 12,
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          flexShrink: 0,
          borderRadius: 10,
          background:
            "#edf9f1",
          color:
            "#16803c",
          display:
            "flex",
          alignItems:
            "center",
          justifyContent:
            "center",
          fontSize: 15,
          fontWeight: 850,
        }}
      >
        {icon}
      </div>

      <div
        style={{
          minWidth: 0,
        }}
      >
        <div
          style={{
            display:
              "flex",
            alignItems:
              "center",
            gap: 6,
          }}
        >
          <span
            style={{
              fontSize: 9,
              color:
                "#98a2b3",
              fontWeight: 800,
            }}
          >
            {number}
          </span>

          <span
            style={{
              fontSize: 9,
              color:
                "#15803d",
              fontWeight: 800,
              letterSpacing:
                "0.08em",
            }}
          >
            {title}
          </span>
        </div>

        <div
          style={{
            marginTop: 2,
            fontSize: 11,
            color:
              "#667085",
          }}
        >
          {text}
        </div>
      </div>
    </div>
  );
}