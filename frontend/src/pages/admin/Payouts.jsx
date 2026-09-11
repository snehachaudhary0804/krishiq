import { useEffect, useMemo, useState } from "react";
import { api } from "../../api/api";
import { useToast } from "../../context/ToastContext.jsx";
import { money } from "../../utils/format";
import { IconReceipt } from "../../components/icons.jsx";

export default function Payouts() {
  const toast = useToast();
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getPayouts()
      .then((data) => {
        setPayouts(data.payouts || []);
      })
      .catch((err) => toast(err.message))
      .finally(() => setLoading(false));
  }, [toast]);

  const stats = useMemo(() => {
    const successful = payouts.filter(
      (p) => p.status === "SUCCESS"
    );

    const failed = payouts.filter(
      (p) => p.status === "FAILED"
    );

    const pending = payouts.filter(
      (p) =>
        p.status !== "SUCCESS" &&
        p.status !== "FAILED"
    );

    const realPayments = payouts.filter(
      (p) => p.mode === "REAL"
    );

    const totalDisbursed = successful.reduce(
      (sum, p) => sum + Number(p.amount || 0),
      0
    );

    return {
      total: payouts.length,
      successful: successful.length,
      failed: failed.length,
      pending: pending.length,
      realPayments: realPayments.length,
      totalDisbursed,
    };
  }, [payouts]);

  if (loading) {
    return (
      <div
        style={{
          width: "100%",
          minHeight: 420,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          color: "#687870",
        }}
      >
        <div className="loader-ring" />

        <span
          style={{
            fontSize: 13,
            fontWeight: 650,
          }}
        >
          Loading payout records...
        </span>
      </div>
    );
  }

  return (
    <div
      className="payouts-page"
      style={{
        width: "100%",
        maxWidth: "100%",
        minWidth: 0,
        margin: 0,
        padding: 0,
        paddingBottom: 40,
        boxSizing: "border-box",
        overflowX: "clip",
      }}
    >
      <style>
        {`
          .payouts-page,
          .payouts-page * {
            box-sizing: border-box;
          }

          .payouts-page {
            width: 100%;
            max-width: 100%;
            min-width: 0;
          }

          .payouts-hero {
            width: 100%;
            max-width: 100%;
            min-width: 0;
          }

          .payouts-stats {
            width: 100%;
            max-width: 100%;
            min-width: 0;
            display: grid;
            grid-template-columns:
              repeat(4, minmax(0, 1fr));
            gap: 15px;
          }

          .payout-stat {
            min-width: 0;
            position: relative;
            overflow: hidden;
            transition:
              transform .2s ease,
              box-shadow .2s ease;
          }

          .payout-stat:hover {
            transform: translateY(-2px);
            box-shadow:
              0 12px 28px rgba(15, 23, 42, .07) !important;
          }

          .payout-stat::after {
            content: "";
            position: absolute;
            right: -25px;
            bottom: -35px;
            width: 90px;
            height: 90px;
            border-radius: 50%;
            background: rgba(8, 116, 67, .035);
          }

          .payout-table-card {
            width: 100%;
            max-width: 100%;
            min-width: 0;
            overflow: hidden;
          }

          .payout-table-wrapper {
            width: 100%;
            max-width: 100%;
            min-width: 0;
            overflow-x: auto;
            overflow-y: hidden;
            -webkit-overflow-scrolling: touch;
          }

          .payout-table {
            width: 100%;
            min-width: 980px;
            border-collapse: collapse;
            border-spacing: 0;
          }

          .payout-table th {
            height: 48px;
            padding: 0 18px;
            background: #f7faf8;
            border-bottom: 1px solid #e2ebe6;
            color: #6e7c75;
            font-size: 9px;
            font-weight: 850;
            letter-spacing: 1px;
            text-align: left;
            white-space: nowrap;
          }

          .payout-table td {
            padding: 15px 18px;
            border-bottom: 1px solid #edf1ef;
            color: #35443c;
            font-size: 12px;
            white-space: nowrap;
            vertical-align: middle;
          }

          .payout-table tbody tr {
            transition: background .15s ease;
          }

          .payout-table tbody tr:hover {
            background: #f9fcfa;
          }

          .payout-table tbody tr:last-child td {
            border-bottom: none;
          }

          .payout-token {
            display: inline-flex;
            align-items: center;
            min-height: 28px;
            padding: 0 9px;
            border-radius: 7px;
            background: #edf7f2;
            color: #087443;
            font-size: 11px;
            font-weight: 800;
          }

          .payout-status {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            min-height: 27px;
            padding: 0 10px;
            border-radius: 999px;
            font-size: 9px;
            font-weight: 800;
            letter-spacing: .25px;
          }

          .payout-status-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            flex-shrink: 0;
          }

          .payout-mode {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            min-height: 27px;
            padding: 0 10px;
            border-radius: 999px;
            font-size: 9px;
            font-weight: 800;
          }

          .payout-avatar {
            width: 34px;
            height: 34px;
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            background: #eaf6ef;
            color: #087443;
            font-size: 11px;
            font-weight: 850;
          }

          .payout-summary-label {
            color: #849089;
            font-size: 9px;
            font-weight: 800;
            letter-spacing: .8px;
          }

          @media (max-width: 1100px) {
            .payouts-stats {
              grid-template-columns:
                repeat(2, minmax(0, 1fr));
            }
          }

          @media (max-width: 700px) {
            .payouts-page {
              padding-bottom: 25px !important;
            }

            .payouts-hero {
              min-height: 145px !important;
              padding: 27px 21px !important;
              border-radius: 17px !important;
            }

            .payouts-hero-content {
              align-items: flex-start !important;
            }

            .payout-hero-icon {
              display: none !important;
            }

            .payouts-title {
              font-size: 27px !important;
            }

            .payouts-description {
              max-width: 100% !important;
              font-size: 12px !important;
            }

            .payouts-stats {
              grid-template-columns: 1fr !important;
            }

            .payout-card-header {
              align-items: flex-start !important;
              flex-direction: column !important;
            }

            .payout-live-badge {
              align-self: flex-start !important;
            }

            .payout-table-card {
              border-radius: 16px !important;
            }
          }

          @media (max-width: 450px) {
            .payouts-hero {
              padding: 23px 17px !important;
            }

            .payouts-title {
              font-size: 24px !important;
            }

            .payouts-description {
              font-size: 11px !important;
            }
          }
        `}
      </style>

      {/* =====================================================
          HERO
      ===================================================== */}

      <section
        className="payouts-hero"
        style={{
          width: "100%",
          maxWidth: "100%",
          minHeight: 165,
          padding: "36px 42px",
          marginBottom: 20,
          borderRadius: 21,
          overflow: "hidden",
          background:
            "linear-gradient(135deg, #edf9f2 0%, #fffdf5 100%)",
          border: "1px solid #dbe9e1",
          boxShadow:
            "0 7px 24px rgba(15, 23, 42, .055)",
          boxSizing: "border-box",
        }}
      >
        <div
          className="payouts-hero-content"
          style={{
            width: "100%",
            minWidth: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 25,
          }}
        >
          <div
            style={{
              minWidth: 0,
              flex: "1 1 auto",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 9,
                marginBottom: 10,
                color: "#087443",
                fontSize: 10,
                fontWeight: 850,
                letterSpacing: 1.6,
              }}
            >
              <span
                style={{
                  width: 29,
                  height: 2,
                  flexShrink: 0,
                  background: "#b7791f",
                  borderRadius: 2,
                }}
              />

              FINANCIAL OPERATIONS
            </div>

            <h1
              className="payouts-title"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 11,
                margin: 0,
                color: "#17251e",
                fontSize: 35,
                lineHeight: 1.15,
                fontWeight: 850,
                letterSpacing: "-.5px",
              }}
            >
              <IconReceipt
                style={{
                  width: 30,
                  height: 30,
                  flexShrink: 0,
                  color: "#087443",
                }}
              />

              Payouts
            </h1>

            <p
              className="payouts-description"
              style={{
                maxWidth: 650,
                margin: "10px 0 0",
                color: "#6d7b74",
                fontSize: 13,
                lineHeight: 1.55,
              }}
            >
              Monitor farmer payment settlements, payout
              status, transaction references and
              disbursement activity from one place.
            </p>
          </div>

          <div
            className="payout-hero-icon"
            style={{
              width: 70,
              height: 70,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 19,
              background: "rgba(255,255,255,.72)",
              border: "1px solid #cfe2d7",
              color: "#087443",
              boxShadow:
                "0 4px 12px rgba(15,23,42,.035)",
            }}
          >
            <IconReceipt
              style={{
                width: 32,
                height: 32,
              }}
            />
          </div>
        </div>
      </section>

      {/* =====================================================
          FINANCIAL SUMMARY
      ===================================================== */}

      <section
        className="payouts-stats"
        style={{
          marginBottom: 20,
        }}
      >
        {/* TOTAL */}

        <div
          className="payout-stat"
          style={{
            padding: 20,
            borderRadius: 17,
            background: "#ffffff",
            border: "1px solid #e1eae5",
            boxShadow:
              "0 5px 17px rgba(15,23,42,.045)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 15,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 11,
                background: "#edf7f1",
                color: "#087443",
              }}
            >
              <IconReceipt
                style={{
                  width: 19,
                  height: 19,
                }}
              />
            </div>

            <span className="payout-summary-label">
              PAYOUTS
            </span>
          </div>

          <strong
            style={{
              display: "block",
              color: "#1b2a22",
              fontSize: 30,
              lineHeight: 1,
              fontWeight: 800,
            }}
          >
            {stats.total}
          </strong>

          <span
            style={{
              display: "block",
              marginTop: 8,
              color: "#7b8982",
              fontSize: 11,
            }}
          >
            Total transactions
          </span>
        </div>

        {/* SUCCESSFUL */}

        <div
          className="payout-stat"
          style={{
            padding: 20,
            borderRadius: 17,
            background: "#ffffff",
            border: "1px solid #e1eae5",
            boxShadow:
              "0 5px 17px rgba(15,23,42,.045)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 15,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 11,
                background: "#eaf8ef",
                color: "#15804e",
                fontSize: 20,
                fontWeight: 850,
              }}
            >
              ✓
            </div>

            <span className="payout-summary-label">
              SUCCESSFUL
            </span>
          </div>

          <strong
            style={{
              display: "block",
              color: "#1b2a22",
              fontSize: 30,
              lineHeight: 1,
              fontWeight: 800,
            }}
          >
            {stats.successful}
          </strong>

          <span
            style={{
              display: "block",
              marginTop: 8,
              color: "#7b8982",
              fontSize: 11,
            }}
          >
            Completed payments
          </span>
        </div>

        {/* PENDING */}

        <div
          className="payout-stat"
          style={{
            padding: 20,
            borderRadius: 17,
            background: "#ffffff",
            border: "1px solid #e1eae5",
            boxShadow:
              "0 5px 17px rgba(15,23,42,.045)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 15,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 11,
                background: "#fff7e7",
                color: "#b7791f",
                fontSize: 20,
                fontWeight: 850,
              }}
            >
              ◷
            </div>

            <span className="payout-summary-label">
              PENDING
            </span>
          </div>

          <strong
            style={{
              display: "block",
              color: "#1b2a22",
              fontSize: 30,
              lineHeight: 1,
              fontWeight: 800,
            }}
          >
            {stats.pending}
          </strong>

          <span
            style={{
              display: "block",
              marginTop: 8,
              color: "#7b8982",
              fontSize: 11,
            }}
          >
            Awaiting processing
          </span>
        </div>

        {/* DISBURSED */}

        <div
          className="payout-stat"
          style={{
            padding: 20,
            borderRadius: 17,
            background: "#ffffff",
            border: "1px solid #e1eae5",
            boxShadow:
              "0 5px 17px rgba(15,23,42,.045)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 15,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 11,
                background: "#eef5ff",
                color: "#356da9",
                fontSize: 18,
                fontWeight: 850,
              }}
            >
              ₹
            </div>

            <span className="payout-summary-label">
              DISBURSED
            </span>
          </div>

          <strong
            style={{
              display: "block",
              color: "#1b2a22",
              fontSize: 24,
              lineHeight: 1.1,
              fontWeight: 800,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {money(stats.totalDisbursed)}
          </strong>

          <span
            style={{
              display: "block",
              marginTop: 8,
              color: "#7b8982",
              fontSize: 11,
            }}
          >
            Successfully transferred
          </span>
        </div>
      </section>

      {/* =====================================================
          PAYOUT HISTORY
      ===================================================== */}

      <section
        className="payout-table-card"
        style={{
          background: "#ffffff",
          border: "1px solid #e1e9e5",
          borderRadius: 19,
          boxShadow:
            "0 5px 19px rgba(15,23,42,.045)",
        }}
      >
        {/* HEADER */}

        <div
          className="payout-card-header"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 18,
            padding: "21px 23px",
            borderBottom: "1px solid #e5ece8",
          }}
        >
          <div
            style={{
              minWidth: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 6,
                color: "#087443",
                fontSize: 9,
                fontWeight: 850,
                letterSpacing: 1.4,
              }}
            >
              <span
                style={{
                  width: 20,
                  height: 2,
                  background: "#b7791f",
                  borderRadius: 2,
                }}
              />

              PAYMENT LEDGER
            </div>

            <h2
              style={{
                margin: 0,
                color: "#1c2b23",
                fontSize: 21,
                lineHeight: 1.2,
                fontWeight: 800,
              }}
            >
              Payout History
            </h2>

            <p
              style={{
                margin: "6px 0 0",
                color: "#7a8881",
                fontSize: 11,
                lineHeight: 1.4,
              }}
            >
              Complete record of farmer payment
              transactions and settlement references.
            </p>
          </div>

          <div
            className="payout-live-badge"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              flexShrink: 0,
              padding: "8px 12px",
              borderRadius: 999,
              background: "#edf8f2",
              color: "#27704c",
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: .3,
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "#22c55e",
                boxShadow:
                  "0 0 0 3px rgba(34,197,94,.1)",
              }}
            />

            LIVE LEDGER
          </div>
        </div>

        {/* EMPTY */}

        {payouts.length === 0 ? (
          <div
            style={{
              minHeight: 300,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: 35,
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 62,
                height: 62,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 14,
                borderRadius: 17,
                background: "#edf7f2",
                color: "#087443",
              }}
            >
              <IconReceipt
                style={{
                  width: 28,
                  height: 28,
                }}
              />
            </div>

            <h3
              style={{
                margin: 0,
                color: "#29372f",
                fontSize: 18,
                fontWeight: 750,
              }}
            >
              No payout records
            </h3>

            <p
              style={{
                maxWidth: 430,
                margin: "8px 0 0",
                color: "#7b8982",
                fontSize: 12,
                lineHeight: 1.55,
              }}
            >
              Farmer payment transactions will appear
              here once a payout has been initiated.
            </p>
          </div>
        ) : (
          <>
            {/* TABLE */}

            <div
              className="payout-table-wrapper"
              style={{
                width: "100%",
                maxWidth: "100%",
                minWidth: 0,
              }}
            >
              <table className="payout-table">
                <thead>
                  <tr>
                    <th>TOKEN</th>
                    <th>FARMER</th>
                    <th>AMOUNT</th>
                    <th>MODE</th>
                    <th>STATUS</th>
                    <th>ACCOUNT</th>
                    <th>REFERENCE</th>
                    <th>DATE</th>
                  </tr>
                </thead>

                <tbody>
                  {payouts.map((p) => {
                    const success =
                      p.status === "SUCCESS";

                    const failed =
                      p.status === "FAILED";

                    const pending =
                      !success && !failed;

                    const statusBackground = success
                      ? "#eaf8ef"
                      : failed
                      ? "#fff0f0"
                      : "#fff7e7";

                    const statusColor = success
                      ? "#176b43"
                      : failed
                      ? "#b93838"
                      : "#a06a16";

                    const statusDot = success
                      ? "#22c55e"
                      : failed
                      ? "#ef4444"
                      : "#f59e0b";

                    const isReal =
                      p.mode === "REAL";

                    const farmerName =
                      p.farmer?.name || "-";

                    const farmerInitial =
                      farmerName !== "-"
                        ? farmerName
                            .charAt(0)
                            .toUpperCase()
                        : "?";

                    return (
                      <tr key={p._id}>
                        {/* TOKEN */}

                        <td>
                          <span className="payout-token">
                            {p.booking?.token || "-"}
                          </span>
                        </td>

                        {/* FARMER */}

                        <td>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                            }}
                          >
                            <div className="payout-avatar">
                              {farmerInitial}
                            </div>

                            <div>
                              <div
                                style={{
                                  color: "#34443b",
                                  fontSize: 12,
                                  fontWeight: 700,
                                }}
                              >
                                {farmerName}
                              </div>

                              <div
                                style={{
                                  marginTop: 2,
                                  color: "#9aa49f",
                                  fontSize: 9,
                                }}
                              >
                                Registered farmer
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* AMOUNT */}

                        <td>
                          <div
                            style={{
                              color: "#1b2b22",
                              fontSize: 13,
                              fontWeight: 800,
                            }}
                          >
                            {money(p.amount)}
                          </div>
                        </td>

                        {/* MODE */}

                        <td>
                          <span
                            className="payout-mode"
                            style={{
                              background: isReal
                                ? "#eaf8ef"
                                : "#fff7e7",
                              color: isReal
                                ? "#176b43"
                                : "#a06a16",
                            }}
                          >
                            <span
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: "50%",
                                background: isReal
                                  ? "#22c55e"
                                  : "#f59e0b",
                              }}
                            />

                            {p.mode || "DEMO"}
                          </span>
                        </td>

                        {/* STATUS */}

                        <td>
                          <span
                            className="payout-status"
                            style={{
                              background:
                                statusBackground,
                              color: statusColor,
                            }}
                          >
                            <span
                              className="payout-status-dot"
                              style={{
                                background:
                                  statusDot,
                              }}
                            />

                            {p.status ||
                              (pending
                                ? "PENDING"
                                : "-")}
                          </span>
                        </td>

                        {/* ACCOUNT */}

                        <td>
                          <span
                            style={{
                              color: "#65736c",
                              fontFamily:
                                "monospace",
                              fontSize: 11,
                            }}
                          >
                            {p.accountNumberMasked ||
                              "-"}
                          </span>
                        </td>

                        {/* REFERENCE */}

                        <td>
                          <span
                            style={{
                              display: "inline-block",
                              maxWidth: 180,
                              overflow: "hidden",
                              textOverflow:
                                "ellipsis",
                              verticalAlign:
                                "middle",
                              color: "#617069",
                              fontFamily:
                                "monospace",
                              fontSize: 10,
                            }}
                            title={
                              p.razorpayPayoutId ||
                              "DEMO-" +
                                p._id
                                  .slice(-6)
                                  .toUpperCase()
                            }
                          >
                            {p.razorpayPayoutId ||
                              "DEMO-" +
                                p._id
                                  .slice(-6)
                                  .toUpperCase()}
                          </span>
                        </td>

                        {/* DATE */}

                        <td>
                          <span
                            style={{
                              color: "#68776f",
                              fontSize: 11,
                            }}
                          >
                            {p.createdAt
                              ? new Date(
                                  p.createdAt
                                ).toLocaleDateString(
                                  "en-IN",
                                  {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  }
                                )
                              : "-"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* FOOTER */}

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                padding: "12px 21px",
                borderTop: "1px solid #e5ece8",
                background: "#fbfdfc",
                color: "#7b8982",
                fontSize: 10,
              }}
            >
              <span>
                Showing{" "}
                <strong
                  style={{
                    color: "#43534b",
                  }}
                >
                  {payouts.length}
                </strong>{" "}
                payout
                {payouts.length !== 1
                  ? " records"
                  : " record"}
              </span>

              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#22c55e",
                  }}
                />

                Secure payment ledger
              </span>
            </div>
          </>
        )}
      </section>
    </div>
  );
}