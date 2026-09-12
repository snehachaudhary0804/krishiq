import { useEffect, useMemo, useState } from "react";
import { api } from "../../api/api";
import { useToast } from "../../context/ToastContext.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";
import BookingsTable from "../../components/BookingsTable.jsx";
import {
  IconBuilding,
  IconHistory,
  IconUsers,
} from "../../components/icons.jsx";

export default function AllBookings() {
  const toast = useToast();
  const { t } = useLanguage();

  const [centres, setCentres] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [selectedCentreId, setSelectedCentreId] = useState("");
  const [loadingCentres, setLoadingCentres] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [page, setPage] = useState(1);
  const [updatingPaymentId, setUpdatingPaymentId] = useState(null);

  const pageSize = 10;

  /* =========================
     LOAD CENTRES
  ========================= */

  useEffect(() => {
    api.getCentres()
      .then((data) => {
        setCentres(data.centres || []);
      })
      .catch((err) => toast(err.message))
      .finally(() => setLoadingCentres(false));
  }, [toast]);

  /* =========================
     LOAD BOOKINGS
  ========================= */

  useEffect(() => {
    if (!selectedCentreId) {
      setBookings([]);
      setLoadingBookings(false);
      return undefined;
    }

    let cancelled = false;

    setLoadingBookings(true);
    setBookings([]);
    setPage(1);

    api.getAllBookings({ centreId: selectedCentreId })
      .then((data) => {
        if (!cancelled) {
          setBookings(data.bookings || []);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          toast(err.message);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingBookings(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedCentreId, toast]);

  /* =========================
     SELECTED CENTRE
  ========================= */

  const selectedCentre = centres.find(
    (centre) =>
      String(centre._id) === String(selectedCentreId)
  );

  const scopedBookings = bookings.filter(
    (booking) =>
      String(booking.centre?._id || booking.centre) ===
      String(selectedCentreId)
  );

  /* =========================
     COUNTS
  ========================= */

  const counts = useMemo(() => ({
    total: scopedBookings.length,

    pending: scopedBookings.filter(
      (booking) => booking.status === "BOOKED"
    ).length,

    completed: scopedBookings.filter(
      (booking) => booking.status === "COMPLETED"
    ).length,

    cancelled: scopedBookings.filter(
      (booking) => booking.status === "CANCELLED"
    ).length,
  }), [scopedBookings]);

  const pages = Math.max(
    1,
    Math.ceil(scopedBookings.length / pageSize)
  );

  const visible = scopedBookings.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  /* =========================
     TABLE LABELS
  ========================= */

  const labels = {
    token: t("token"),
    farmer: t("farmer"),
    centre: t("center"),
    crop: t("crop"),
    date: t("bookingDate"),
    slot: t("slot"),
    status: t("status"),
    weight: t("weight"),
    amount: t("amount"),
    payment: t("payment"),

    empty: t("noBookingsForCenter"),

    statusLabels: {
      BOOKED: t("booked"),
      CALLED: t("called"),
      IN_SERVICE: t("inService"),
      COMPLETED: t("completed"),
      REJECTED: t("rejected"),
      CANCELLED: t("cancelled"),
      PAYMENT_PENDING: t("paymentPendingStatus"),
      PROCESSING: "Processing",
      PAID: t("paid"),
    },
  };

  function clearCentre() {
    setSelectedCentreId("");
    setPage(1);
  }

  function handleUpdatePayment(bookingId, status) {
    setUpdatingPaymentId(bookingId);

    api
      .updatePaymentStatus(bookingId, status)
      .then((data) => {
        setBookings((prev) =>
          prev.map((b) =>
            b._id === bookingId ? { ...b, payment: data.booking.payment } : b
          )
        );
        toast(
          status === "PROCESSING"
            ? "Marked as processing. Farmer notified."
            : "Marked as paid. Farmer notified and can download receipt."
        );
      })
      .catch((err) => toast(err.message))
      .finally(() => setUpdatingPaymentId(null));
  }

  return (
    <div
      className="dashboard-page admin-dashboard all-bookings-page"
      style={{
        width: "100%",
        maxWidth: "100%",
        minWidth: 0,
        boxSizing: "border-box",
        overflowX: "clip",
        overflowY: "visible",
        padding: "0 0 40px",
        margin: 0,
        position: "relative",
        isolation: "isolate",
      }}
    >

      <style>{`
        .all-bookings-page,
        .all-bookings-page * {
          box-sizing: border-box;
        }

        .all-bookings-page {
          width: 100%;
          max-width: 100%;
          min-width: 0;
        }

        .all-bookings-page .centre-selector-grid,
        .all-bookings-page .booking-stats-grid {
          min-width: 0;
          max-width: 100%;
        }

        .all-bookings-page .booking-table-scroll {
          max-width: 100%;
        }

        @media (max-width: 900px) {
          .all-bookings-page .centre-selector-grid {
            grid-template-columns: minmax(0, 1fr) !important;
            gap: 18px !important;
          }

          .all-bookings-page .booking-stats-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }

        @media (max-width: 560px) {
          .all-bookings-page {
            padding-bottom: 24px !important;
          }

          .all-bookings-page .booking-stats-grid {
            grid-template-columns: minmax(0, 1fr) !important;
          }

          .all-bookings-page section {
            border-radius: 14px !important;
          }
        }
      `}</style>

      {/* =================================================
          HERO
      ================================================= */}

      <section
        style={{
          width: "100%",
          maxWidth: "100%",
          minWidth: 0,
          boxSizing: "border-box",
          padding: "30px 34px",
          marginBottom: 20,
          borderRadius: 22,
          overflow: "hidden",
          background:
            "linear-gradient(135deg, #eefbf4 0%, #fffdf3 100%)",
          border: "1px solid #dcebe3",
          boxShadow: "0 5px 20px rgba(15,23,42,.05)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 20,
            minWidth: 0,
          }}
        >

          <div style={{ minWidth: 0 }}>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 10,
                color: "#087443",
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: 1.5,
              }}
            >
              <span
                style={{
                  width: 26,
                  height: 2,
                  background: "#b7791f",
                  flexShrink: 0,
                }}
              />

              ADMIN CONTROL CENTRE
            </div>

            <h1
              style={{
                display: "flex",
                alignItems: "center",
                gap: 11,
                margin: 0,
                color: "#17251e",
                fontSize: 34,
                lineHeight: 1.15,
                fontWeight: 800,
              }}
            >
              <IconHistory
                style={{
                  width: 29,
                  height: 29,
                  color: "#087443",
                  flexShrink: 0,
                }}
              />

              {t("allBookings")}
            </h1>

            <p
              style={{
                margin: "9px 0 0",
                color: "#687870",
                fontSize: 14,
              }}
            >
              {t("allBookingsDescription")}
            </p>

          </div>

          <div
            style={{
              width: 62,
              height: 62,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 17,
              background: "rgba(255,255,255,.7)",
              border: "1px solid #cfe5d9",
              color: "#087443",
            }}
          >
            <IconHistory
              style={{
                width: 27,
                height: 27,
              }}
            />
          </div>

        </div>
      </section>


      {/* =================================================
          CENTRE SELECTOR
      ================================================= */}

      <section
        style={{
          width: "100%",
          maxWidth: "100%",
          minWidth: 0,
          boxSizing: "border-box",
          padding: "21px 25px",
          marginBottom: 20,
          borderRadius: 19,
          background: "#ffffff",
          border: "1px solid #e1eae5",
          boxShadow: "0 4px 17px rgba(15,23,42,.045)",
          overflow: "hidden",
        }}
      >

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "minmax(0, 1fr) minmax(280px, 430px)",
            gap: 25,
            alignItems: "center",
            width: "100%",
            minWidth: 0,
          }}
        >

          {/* LEFT */}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              minWidth: 0,
            }}
          >

            <div
              style={{
                width: 52,
                height: 52,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 15,
                background: "#eaf7f0",
                color: "#087443",
              }}
            >
              <IconBuilding
                style={{
                  width: 23,
                  height: 23,
                }}
              />
            </div>

            <div
              style={{
                minWidth: 0,
                overflow: "hidden",
              }}
            >

              <div
                style={{
                  marginBottom: 4,
                  color: "#087443",
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: 1.3,
                }}
              >
                PROCUREMENT CENTRE
              </div>

              <h2
                style={{
                  margin: 0,
                  color: "#1d2b24",
                  fontSize: 19,
                  fontWeight: 750,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {selectedCentre
                  ? selectedCentre.name
                  : "Select a procurement centre"}
              </h2>

              {selectedCentre && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 7,
                    marginTop: 6,
                    color: "#78867f",
                    fontSize: 11,
                  }}
                >

                  <span>
                    {selectedCentre.district ||
                      "District not set"}
                  </span>

                  <span>•</span>

                  <span>
                    Capacity: {selectedCentre.capacity}
                  </span>

                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      padding: "4px 8px",
                      borderRadius: 999,
                      background: "#e9f7ef",
                      color: "#17643f",
                      fontSize: 9,
                      fontWeight: 800,
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

                    {selectedCentre.status}
                  </span>

                </div>
              )}

            </div>

          </div>


          {/* RIGHT */}

          <div
            style={{
              width: "100%",
              minWidth: 0,
            }}
          >

            <label
              style={{
                display: "block",
                marginBottom: 7,
                color: "#718078",
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: 1.1,
              }}
            >
              SELECT CENTRE
            </label>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                width: "100%",
                minWidth: 0,
              }}
            >

              <select
                value={selectedCentreId}
                onChange={(event) => {
                  setSelectedCentreId(event.target.value);
                  setPage(1);
                }}
                disabled={loadingCentres}
                style={{
                  width: "100%",
                  minWidth: 0,
                  height: 44,
                  padding: "0 12px",
                  borderRadius: 10,
                  border: "1px solid #cfded6",
                  background: "#fafcfb",
                  color: "#304038",
                  fontSize: 13,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              >

                <option value="">
                  {loadingCentres
                    ? t("loadingCenters")
                    : "Select centre"}
                </option>

                {centres.map((centre) => (
                  <option
                    key={centre._id}
                    value={centre._id}
                  >
                    {centre.name}
                  </option>
                ))}

              </select>

              {selectedCentreId && (
                <button
                  type="button"
                  onClick={clearCentre}
                  style={{
                    height: 44,
                    flexShrink: 0,
                    padding: "0 15px",
                    borderRadius: 10,
                    border: "1px solid #d8e2dd",
                    background: "#ffffff",
                    color: "#53635b",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Clear
                </button>
              )}

            </div>

          </div>

        </div>

      </section>


      {/* =================================================
          NO CENTRE SELECTED
      ================================================= */}

      {!selectedCentreId ? (

        <section
          style={{
            width: "100%",
            minWidth: 0,
            minHeight: 250,
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: 30,
            borderRadius: 19,
            background: "#ffffff",
            border: "1px solid #e1eae5",
            boxShadow: "0 4px 17px rgba(15,23,42,.04)",
          }}
        >

          <div
            style={{
              width: 56,
              height: 56,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 12,
              borderRadius: 16,
              background: "#edf7f2",
              color: "#6f8077",
            }}
          >
            <IconBuilding
              style={{
                width: 25,
                height: 25,
              }}
            />
          </div>

          <h3
            style={{
              margin: 0,
              color: "#29372f",
              fontSize: 18,
            }}
          >
            Select a procurement centre
          </h3>

          <p
            style={{
              maxWidth: 480,
              margin: "7px 0 0",
              color: "#7b8982",
              fontSize: 12,
              lineHeight: 1.6,
            }}
          >
            Choose a centre above to view its booking
            records, queue progress and procurement status.
          </p>

        </section>

      ) : (

        <>

          {/* =================================================
              STATS
          ================================================= */}

          <section
            className="booking-stats-grid"
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(4, minmax(0, 1fr))",
              gap: 14,
              width: "100%",
              minWidth: 0,
              marginBottom: 20,
            }}
          >

            {/* TOTAL */}

            <div
              style={{
                minWidth: 0,
                padding: 18,
                borderRadius: 17,
                background: "#ffffff",
                border: "1px solid #e1eae5",
                boxShadow:
                  "0 4px 15px rgba(15,23,42,.04)",
              }}
            >

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 13,
                }}
              >

                <div
                  style={{
                    width: 36,
                    height: 36,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 10,
                    background: "#edf7f1",
                    color: "#16804e",
                  }}
                >
                  <IconHistory
                    style={{
                      width: 18,
                      height: 18,
                    }}
                  />
                </div>

                <span
                  style={{
                    color: "#89958f",
                    fontSize: 9,
                    fontWeight: 800,
                    letterSpacing: 1,
                  }}
                >
                  TOTAL
                </span>

              </div>

              <strong
                style={{
                  display: "block",
                  color: "#1d2b24",
                  fontSize: 30,
                  lineHeight: 1,
                }}
              >
                {counts.total}
              </strong>

              <small
                style={{
                  display: "block",
                  marginTop: 7,
                  color: "#839088",
                  fontSize: 11,
                }}
              >
                All bookings
              </small>

            </div>


            {/* PENDING */}

            <div
              style={{
                minWidth: 0,
                padding: 18,
                borderRadius: 17,
                background: "#ffffff",
                border: "1px solid #e1eae5",
                boxShadow:
                  "0 4px 15px rgba(15,23,42,.04)",
              }}
            >

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 13,
                }}
              >

                <div
                  style={{
                    width: 36,
                    height: 36,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 10,
                    background: "#fff7e8",
                    color: "#b7791f",
                  }}
                >
                  <IconUsers
                    style={{
                      width: 18,
                      height: 18,
                    }}
                  />
                </div>

                <span
                  style={{
                    color: "#89958f",
                    fontSize: 9,
                    fontWeight: 800,
                    letterSpacing: 1,
                  }}
                >
                  PENDING
                </span>

              </div>

              <strong
                style={{
                  display: "block",
                  color: "#1d2b24",
                  fontSize: 30,
                  lineHeight: 1,
                }}
              >
                {counts.pending}
              </strong>

              <small
                style={{
                  display: "block",
                  marginTop: 7,
                  color: "#839088",
                  fontSize: 11,
                }}
              >
                Awaiting procurement
              </small>

            </div>


            {/* COMPLETED */}

            <div
              style={{
                minWidth: 0,
                padding: 18,
                borderRadius: 17,
                background: "#ffffff",
                border: "1px solid #e1eae5",
                boxShadow:
                  "0 4px 15px rgba(15,23,42,.04)",
              }}
            >

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 13,
                }}
              >

                <div
                  style={{
                    width: 36,
                    height: 36,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 10,
                    background: "#e9f8ef",
                    color: "#16804e",
                    fontSize: 20,
                    fontWeight: 800,
                  }}
                >
                  ✓
                </div>

                <span
                  style={{
                    color: "#89958f",
                    fontSize: 9,
                    fontWeight: 800,
                    letterSpacing: 1,
                  }}
                >
                  COMPLETED
                </span>

              </div>

              <strong
                style={{
                  display: "block",
                  color: "#1d2b24",
                  fontSize: 30,
                  lineHeight: 1,
                }}
              >
                {counts.completed}
              </strong>

              <small
                style={{
                  display: "block",
                  marginTop: 7,
                  color: "#839088",
                  fontSize: 11,
                }}
              >
                Successfully completed
              </small>

            </div>


            {/* CANCELLED */}

            <div
              style={{
                minWidth: 0,
                padding: 18,
                borderRadius: 17,
                background: "#ffffff",
                border: "1px solid #e1eae5",
                boxShadow:
                  "0 4px 15px rgba(15,23,42,.04)",
              }}
            >

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 13,
                }}
              >

                <div
                  style={{
                    width: 36,
                    height: 36,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 10,
                    background: "#fff0f0",
                    color: "#dc4444",
                    fontSize: 20,
                    fontWeight: 800,
                  }}
                >
                  ×
                </div>

                <span
                  style={{
                    color: "#89958f",
                    fontSize: 9,
                    fontWeight: 800,
                    letterSpacing: 1,
                  }}
                >
                  CANCELLED
                </span>

              </div>

              <strong
                style={{
                  display: "block",
                  color: "#1d2b24",
                  fontSize: 30,
                  lineHeight: 1,
                }}
              >
                {counts.cancelled}
              </strong>

              <small
                style={{
                  display: "block",
                  marginTop: 7,
                  color: "#839088",
                  fontSize: 11,
                }}
              >
                Cancelled bookings
              </small>

            </div>

          </section>


          {/* =================================================
              BOOKINGS RECORDS
          ================================================= */}

          <section
            style={{
              width: "100%",
              maxWidth: "100%",
              minWidth: 0,
              boxSizing: "border-box",
              background: "#ffffff",
              border: "1px solid #e1e9e5",
              borderRadius: 19,
              overflow: "hidden",
              boxShadow:
                "0 4px 17px rgba(15,23,42,.045)",
            }}
          >

            {/* HEADER */}

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 15,
                padding: "21px 24px",
                borderBottom: "1px solid #e5ece8",
                minWidth: 0,
              }}
            >

              <div
                style={{
                  minWidth: 0,
                }}
              >

                <div
                  style={{
                    marginBottom: 5,
                    color: "#087443",
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: 1.3,
                  }}
                >
                  PROCUREMENT RECORDS
                </div>

                <h2
                  style={{
                    margin: 0,
                    color: "#1d2b24",
                    fontSize: 21,
                    fontWeight: 800,
                  }}
                >
                  Booking Records
                </h2>

                <p
                  style={{
                    margin: "5px 0 0",
                    color: "#7d8b84",
                    fontSize: 11,
                  }}
                >
                  {selectedCentre?.name}
                  {" • "}
                  {counts.total} booking
                  {counts.total !== 1 ? "s" : ""}
                </p>

              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  flexShrink: 0,
                  padding: "7px 11px",
                  borderRadius: 999,
                  background: "#edf8f2",
                  color: "#27704c",
                  fontSize: 10,
                  fontWeight: 700,
                }}
              >

                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "#22c55e",
                  }}
                />

                Live records

              </div>

            </div>


            {/* TABLE */}

            <div
              className="booking-table-scroll"
              style={{
                display: "block",
                width: "100%",
                maxWidth: "100%",
                minWidth: 0,
                overflowX: "auto",
                overflowY: "hidden",
                boxSizing: "border-box",
                contain: "inline-size",
                WebkitOverflowScrolling: "touch",
              }}
            >

              {loadingBookings ? (

                <div
                  style={{
                    minHeight: 240,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >

                  <div className="loader-ring"></div>

                  <p
                    style={{
                      marginTop: 10,
                      color: "#738179",
                      fontSize: 12,
                    }}
                  >
                    {t("loadingBookings")}
                  </p>

                </div>

              ) : scopedBookings.length === 0 ? (

                <div
                  style={{
                    minHeight: 240,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    padding: 30,
                  }}
                >

                  <div
                    style={{
                      width: 55,
                      height: 55,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 12,
                      borderRadius: 15,
                      background: "#edf7f2",
                      color: "#718279",
                    }}
                  >
                    <IconHistory
                      style={{
                        width: 25,
                        height: 25,
                      }}
                    />
                  </div>

                  <h3
                    style={{
                      margin: 0,
                      color: "#29372f",
                      fontSize: 18,
                    }}
                  >
                    No bookings found
                  </h3>

                  <p
                    style={{
                      margin: "7px 0 0",
                      color: "#7a8881",
                      fontSize: 12,
                    }}
                  >
                    No procurement bookings are available
                    for this centre yet.
                  </p>

                </div>

              ) : (

                <BookingsTable
                  bookings={visible}
                  labels={labels}
                  onUpdatePayment={handleUpdatePayment}
                  updatingId={updatingPaymentId}
                />

              )}

            </div>


            {/* =================================================
                PAGINATION
            ================================================= */}

            {!loadingBookings &&
              scopedBookings.length > pageSize && (

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 15,
                    padding: "12px 19px",
                    borderTop: "1px solid #e5ece8",
                    minWidth: 0,
                  }}
                >

                  <div
                    style={{
                      color: "#7a8881",
                      fontSize: 11,
                    }}
                  >
                    Showing{" "}
                    <strong>
                      {(page - 1) * pageSize + 1}
                    </strong>

                    {" – "}

                    <strong>
                      {Math.min(
                        page * pageSize,
                        scopedBookings.length
                      )}
                    </strong>

                    {" of "}

                    <strong>
                      {scopedBookings.length}
                    </strong>
                  </div>


                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 7,
                    }}
                  >

                    <button
                      type="button"
                      disabled={page === 1}
                      onClick={() =>
                        setPage(
                          (current) => current - 1
                        )
                      }
                      style={{
                        height: 33,
                        padding: "0 11px",
                        borderRadius: 8,
                        border: "1px solid #d9e3de",
                        background: "#ffffff",
                        color: "#405148",
                        fontSize: 11,
                        fontWeight: 700,
                        cursor:
                          page === 1
                            ? "not-allowed"
                            : "pointer",
                        opacity: page === 1 ? 0.4 : 1,
                      }}
                    >
                      ← Previous
                    </button>

                    <span
                      style={{
                        minWidth: 42,
                        textAlign: "center",
                        color: "#4c5d54",
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      {page} / {pages}
                    </span>

                    <button
                      type="button"
                      disabled={page === pages}
                      onClick={() =>
                        setPage(
                          (current) => current + 1
                        )
                      }
                      style={{
                        height: 33,
                        padding: "0 11px",
                        borderRadius: 8,
                        border: "1px solid #d9e3de",
                        background: "#ffffff",
                        color: "#405148",
                        fontSize: 11,
                        fontWeight: 700,
                        cursor:
                          page === pages
                            ? "not-allowed"
                            : "pointer",
                        opacity:
                          page === pages ? 0.4 : 1,
                      }}
                    >
                      Next →
                    </button>

                  </div>

                </div>
              )}

          </section>

        </>
      )}

    </div>
  );
}