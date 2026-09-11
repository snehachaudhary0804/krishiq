import { useEffect, useMemo, useState } from "react";
import { api } from "../../api/api";
import { useToast } from "../../context/ToastContext.jsx";
import { money } from "../../utils/format";
import { IconWheat } from "../../components/icons.jsx";

export default function CropsMSP() {
  const toast = useToast();

  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [name, setName] = useState("");
  const [msp, setMsp] = useState("");

  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);

  const [hoveredCard, setHoveredCard] = useState(null);
  const [hoveredAction, setHoveredAction] = useState(null);

  const GREEN = "#147a4a";
  const DARK_GREEN = "#0d5f3a";
  const LIGHT_GREEN = "#eaf6ef";
  const SOFT_GREEN = "#f3faf6";
  const BORDER = "#dfe9e3";
  const TEXT = "#1c2922";
  const MUTED = "#77847d";

  async function load() {
    try {
      setLoading(true);

      const data = await api.getCrops();

      setCrops(data.crops || []);
    } catch (err) {
      toast(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  /* -----------------------------
     ADD
  ----------------------------- */

  function startAdd() {
    setEditingId(null);
    setName("");
    setMsp("");
    setShowForm(true);
  }

  /* -----------------------------
     EDIT
  ----------------------------- */

  function startEdit(crop) {
    setEditingId(crop._id);
    setName(crop.name || "");
    setMsp(crop.msp ?? "");
    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  /* -----------------------------
     CANCEL
  ----------------------------- */

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setName("");
    setMsp("");
  }

  /* -----------------------------
     SAVE / UPDATE
  ----------------------------- */

  async function submit(e) {
    e.preventDefault();

    if (!name.trim()) {
      toast("Crop name is required");
      return;
    }

    if (!msp || Number(msp) <= 0) {
      toast("Invalid MSP");
      return;
    }

    setBusy(true);

    try {
      const payload = {
        name: name.trim(),
        msp: Number(msp),
      };

      if (editingId) {
        if (typeof api.updateCrop !== "function") {
          toast(
            "updateCrop API is missing in api.js"
          );
          return;
        }

        await api.updateCrop(editingId, payload);

        toast("Crop updated successfully");
      } else {
        await api.createCrop(payload);

        toast("Crop added successfully");
      }

      cancelForm();
      await load();
    } catch (err) {
      toast(err.message);
    } finally {
      setBusy(false);
    }
  }

  /* -----------------------------
     DELETE
  ----------------------------- */

  async function remove(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this crop?"
    );

    if (!confirmed) return;

    try {
      await api.deleteCrop(id);

      toast("Crop deleted successfully");

      await load();
    } catch (err) {
      toast(err.message);
    }
  }

  /* -----------------------------
     SEARCH
  ----------------------------- */

  const filteredCrops = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return crops;

    return crops.filter((crop) =>
      String(crop.name || "")
        .toLowerCase()
        .includes(query)
    );
  }, [crops, search]);

  /* -----------------------------
     STATS
  ----------------------------- */

  const stats = useMemo(() => {
    if (!crops.length) {
      return {
        total: 0,
        average: 0,
        highest: 0,
        lowest: 0,
      };
    }

    const values = crops.map((crop) =>
      Number(crop.msp || 0)
    );

    const total = values.reduce(
      (sum, value) => sum + value,
      0
    );

    return {
      total: crops.length,
      average: total / values.length,
      highest: Math.max(...values),
      lowest: Math.min(...values),
    };
  }, [crops]);

  /* -----------------------------
     LOADING
  ----------------------------- */

  if (loading) {
    return (
      <div
        style={{
          minHeight: 360,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 12,
          color: MUTED,
          fontSize: 13,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            border: "3px solid #dcebe2",
            borderTopColor: GREEN,
            animation:
              "cropLoader 0.8s linear infinite",
          }}
        />

        Loading crops...
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        boxSizing: "border-box",
        paddingBottom: 45,
        color: TEXT,
      }}
    >
      {/* =====================================================
          HERO
      ===================================================== */}

      <section
        style={{
          background:
            "linear-gradient(135deg, #f1faf5 0%, #f8fcfa 100%)",
          border: `1px solid ${BORDER}`,
          borderRadius: 20,
          padding: "24px 26px",
          marginBottom: 20,
          boxShadow:
            "0 5px 18px rgba(18,70,45,.045)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 20,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                display: "inline-flex",
                padding: "5px 10px",
                borderRadius: 999,
                background: LIGHT_GREEN,
                color: GREEN,
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: ".8px",
                marginBottom: 9,
              }}
            >
              MSP MANAGEMENT
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 39,
                  height: 39,
                  borderRadius: 11,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#e5f4eb",
                  color: GREEN,
                  flexShrink: 0,
                }}
              >
                <IconWheat />
              </div>

              <h1
                style={{
                  margin: 0,
                  fontSize: 29,
                  lineHeight: 1.1,
                  fontWeight: 800,
                  letterSpacing: "-.7px",
                  color: TEXT,
                }}
              >
                Crops & MSP
              </h1>
            </div>

            <p
              style={{
                margin: "8px 0 0",
                maxWidth: 650,
                fontSize: 13,
                lineHeight: 1.5,
                color: MUTED,
              }}
            >
              Manage registered crops and maintain the
              minimum support price used across
              procurement operations.
            </p>
          </div>

          <button
            type="button"
            onClick={
              showForm ? cancelForm : startAdd
            }
            onMouseEnter={() =>
              setHoveredAction("hero")
            }
            onMouseLeave={() =>
              setHoveredAction(null)
            }
            style={{
              border: "none",
              borderRadius: 10,
              padding: "11px 17px",
              background:
                hoveredAction === "hero"
                  ? DARK_GREEN
                  : GREEN,
              color: "#fff",
              fontSize: 12,
              fontWeight: 800,
              cursor: "pointer",
              transition: "all .2s ease",
              boxShadow:
                hoveredAction === "hero"
                  ? "0 8px 20px rgba(20,122,74,.18)"
                  : "0 4px 12px rgba(20,122,74,.10)",
              transform:
                hoveredAction === "hero"
                  ? "translateY(-1px)"
                  : "translateY(0)",
            }}
          >
            {showForm ? "× Cancel" : "+ Add Crop"}
          </button>
        </div>
      </section>

      {/* =====================================================
          STATS
      ===================================================== */}

      <section
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(190px, 1fr))",
          gap: 14,
          marginBottom: 22,
        }}
      >
        {[
          {
            title: "Total Crops",
            value: stats.total,
            icon: "🌾",
          },
          {
            title: "Average MSP",
            value: money(stats.average),
            icon: "₹",
          },
          {
            title: "Highest MSP",
            value: money(stats.highest),
            icon: "↗",
          },
          {
            title: "Lowest MSP",
            value: money(stats.lowest),
            icon: "↘",
          },
        ].map((stat) => (
          <div
            key={stat.title}
            style={{
              background: "#fff",
              border: `1px solid ${BORDER}`,
              borderRadius: 15,
              padding: "13px 15px",
              display: "flex",
              alignItems: "center",
              gap: 12,
              boxShadow:
                "0 4px 14px rgba(20,55,38,.04)",
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: LIGHT_GREEN,
                color: GREEN,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize:
                  stat.icon === "₹" ? 17 : 15,
                fontWeight: 800,
                flexShrink: 0,
              }}
            >
              {stat.icon}
            </div>

            <div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: MUTED,
                  marginBottom: 3,
                }}
              >
                {stat.title}
              </div>

              <div
                style={{
                  fontSize: 18,
                  lineHeight: 1.1,
                  fontWeight: 800,
                  color: TEXT,
                }}
              >
                {stat.value}
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* =====================================================
          ADD / EDIT FORM
      ===================================================== */}

      {showForm && (
        <section
          style={{
            background: "#fff",
            border: `1px solid ${BORDER}`,
            borderRadius: 17,
            padding: 20,
            marginBottom: 22,
            boxShadow:
              "0 8px 25px rgba(20,65,42,.065)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 15,
              marginBottom: 16,
            }}
          >
            <div>
              <div
                style={{
                  color: GREEN,
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: ".8px",
                  marginBottom: 4,
                }}
              >
                {editingId
                  ? "EDIT CROP"
                  : "ADD NEW CROP"}
              </div>

              <h2
                style={{
                  margin: 0,
                  fontSize: 18,
                  fontWeight: 800,
                  color: TEXT,
                }}
              >
                {editingId
                  ? "Update Crop & MSP"
                  : "Add Crop & MSP"}
              </h2>
            </div>

            <button
              type="button"
              onClick={cancelForm}
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                border: `1px solid ${BORDER}`,
                background: "#fff",
                color: "#68766f",
                cursor: "pointer",
                fontSize: 17,
              }}
            >
              ×
            </button>
          </div>

          <form onSubmit={submit}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(230px, 1fr))",
                gap: 14,
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#53625a",
                    marginBottom: 6,
                  }}
                >
                  Crop Name
                </label>

                <input
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  placeholder="Enter crop name"
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "11px 12px",
                    borderRadius: 9,
                    border: "1px solid #d9e4de",
                    background: "#fbfdfc",
                    outline: "none",
                    fontSize: 12,
                    color: TEXT,
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#53625a",
                    marginBottom: 6,
                  }}
                >
                  MSP / Quintal
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={msp}
                  onChange={(e) =>
                    setMsp(e.target.value)
                  }
                  placeholder="Enter MSP"
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "11px 12px",
                    borderRadius: 9,
                    border: "1px solid #d9e4de",
                    background: "#fbfdfc",
                    outline: "none",
                    fontSize: 12,
                    color: TEXT,
                  }}
                />
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 8,
                marginTop: 16,
              }}
            >
              <button
                type="button"
                onClick={cancelForm}
                style={{
                  border: "1px solid #d8e3dd",
                  borderRadius: 9,
                  background: "#fff",
                  color: "#63716a",
                  padding: "9px 15px",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={busy}
                style={{
                  border: "none",
                  borderRadius: 9,
                  background: GREEN,
                  color: "#fff",
                  padding: "9px 17px",
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: busy
                    ? "not-allowed"
                    : "pointer",
                  opacity: busy ? 0.7 : 1,
                }}
              >
                {busy
                  ? "Saving..."
                  : editingId
                  ? "Update Crop"
                  : "Save Crop"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* =====================================================
          SECTION TITLE + SEARCH
      ===================================================== */}

      <section
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 15,
          marginBottom: 14,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 800,
              color: TEXT,
            }}
          >
            Registered Crops
          </h2>

          <div
            style={{
              marginTop: 4,
              fontSize: 11,
              color: MUTED,
            }}
          >
            {filteredCrops.length}{" "}
            {filteredCrops.length === 1
              ? "crop"
              : "crops"}{" "}
            available
          </div>
        </div>

        <div
          style={{
            position: "relative",
            width: 235,
            maxWidth: "100%",
          }}
        >
          <span
            style={{
              position: "absolute",
              left: 11,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#89958f",
              fontSize: 13,
            }}
          >
            ⌕
          </span>

          <input
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search crops..."
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "10px 12px 10px 30px",
              borderRadius: 10,
              border: `1px solid ${BORDER}`,
              background: "#fff",
              outline: "none",
              fontSize: 11,
              color: TEXT,
              boxShadow:
                "0 2px 7px rgba(20,50,35,.025)",
            }}
          />
        </div>
      </section>

      {/* =====================================================
          CROPS
      ===================================================== */}

      {filteredCrops.length === 0 ? (
        <div
          style={{
            background: "#fff",
            border: `1px solid ${BORDER}`,
            borderRadius: 16,
            padding: 45,
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 45,
              height: 45,
              borderRadius: 12,
              background: LIGHT_GREEN,
              color: GREEN,
              margin: "0 auto 10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
            }}
          >
            ⌕
          </div>

          <div
            style={{
              fontSize: 14,
              fontWeight: 800,
              color: TEXT,
              marginBottom: 4,
            }}
          >
            No crops found
          </div>

          <div
            style={{
              fontSize: 11,
              color: MUTED,
            }}
          >
            Try searching with another crop name.
          </div>
        </div>
      ) : (
        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(270px, 1fr))",
            gap: 16,
          }}
        >
          {filteredCrops.map((crop) => {
            const hovered =
              hoveredCard === crop._id;

            return (
              <article
                key={crop._id}
                onMouseEnter={() =>
                  setHoveredCard(crop._id)
                }
                onMouseLeave={() =>
                  setHoveredCard(null)
                }
                style={{
                  background: "#fff",
                  border: `1px solid ${
                    hovered ? "#bdd9c9" : BORDER
                  }`,
                  borderTop:
                    "3px solid #79b894",
                  borderRadius: 16,
                  padding: 16,
                  boxShadow: hovered
                    ? "0 12px 28px rgba(20,75,48,.10)"
                    : "0 4px 14px rgba(20,55,38,.045)",
                  transform: hovered
                    ? "translateY(-3px)"
                    : "translateY(0)",
                  transition:
                    "transform .2s ease, box-shadow .2s ease, border-color .2s ease",
                }}
              >
                {/* TOP */}

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 15,
                  }}
                >
                  <div
                    style={{
                      width: 41,
                      height: 41,
                      borderRadius: 11,
                      background: LIGHT_GREEN,
                      color: GREEN,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <IconWheat />
                  </div>

                  <span
                    style={{
                      padding: "5px 9px",
                      borderRadius: 999,
                      background: LIGHT_GREEN,
                      color: GREEN,
                      fontSize: 9,
                      fontWeight: 800,
                    }}
                  >
                    ACTIVE
                  </span>
                </div>

                {/* NAME */}

                <h3
                  style={{
                    margin: 0,
                    fontSize: 16,
                    fontWeight: 800,
                    color: TEXT,
                    lineHeight: 1.3,
                  }}
                >
                  {crop.name}
                </h3>

                <p
                  style={{
                    margin: "4px 0 14px",
                    color: MUTED,
                    fontSize: 10,
                  }}
                >
                  Minimum Support Price
                </p>

                {/* MSP */}

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                    padding: "12px 13px",
                    borderRadius: 10,
                    background: SOFT_GREEN,
                    marginBottom: 13,
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: "#728078",
                    }}
                  >
                    MSP / Quintal
                  </span>

                  <strong
                    style={{
                      fontSize: 17,
                      color: GREEN,
                    }}
                  >
                    {money(crop.msp)}
                  </strong>
                </div>

                {/* ID */}

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderTop:
                      "1px solid #e8eeea",
                    paddingTop: 10,
                    marginBottom: 12,
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      color: MUTED,
                    }}
                  >
                    Crop ID
                  </span>

                  <span
                    title={crop._id}
                    style={{
                      fontSize: 9,
                      color: "#9aa59f",
                      fontFamily: "monospace",
                    }}
                  >
                    {crop._id
                      ? `${crop._id.slice(
                          0,
                          8
                        )}...`
                      : "—"}
                  </span>
                </div>

                {/* ACTION BUTTONS */}

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "1fr 1fr",
                    gap: 8,
                  }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      startEdit(crop)
                    }
                    onMouseEnter={() =>
                      setHoveredAction(
                        `edit-${crop._id}`
                      )
                    }
                    onMouseLeave={() =>
                      setHoveredAction(null)
                    }
                    style={{
                      border:
                        "1px solid #cfe1d6",
                      borderRadius: 9,
                      padding: "9px 8px",
                      background:
                        hoveredAction ===
                        `edit-${crop._id}`
                          ? LIGHT_GREEN
                          : "#fff",
                      color: GREEN,
                      fontSize: 11,
                      fontWeight: 800,
                      cursor: "pointer",
                      transition:
                        "all .18s ease",
                    }}
                  >
                    ✎ Edit
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      remove(crop._id)
                    }
                    onMouseEnter={() =>
                      setHoveredAction(
                        `delete-${crop._id}`
                      )
                    }
                    onMouseLeave={() =>
                      setHoveredAction(null)
                    }
                    style={{
                      border:
                        "1px solid #e0e7e3",
                      borderRadius: 9,
                      padding: "9px 8px",
                      background:
                        hoveredAction ===
                        `delete-${crop._id}`
                          ? "#f6f8f7"
                          : "#fff",
                      color: "#68766f",
                      fontSize: 11,
                      fontWeight: 800,
                      cursor: "pointer",
                      transition:
                        "all .18s ease",
                    }}
                  >
                    Delete
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {/* Loader animation only */}

      <style>
        {`
          @keyframes cropLoader {
            to {
              transform: rotate(360deg);
            }
          }
        `}
      </style>
    </div>
  );
}