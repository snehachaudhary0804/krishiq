import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import {
  IconBank,
  IconBuilding,
  IconCheckCircle,
  IconGlobe,
  IconUser,
  IconClock,
} from "../components/icons.jsx";

function InfoField({ label, value, icon }) {
  return (
    <div
      style={{
        padding: "14px 15px",
        border: "1px solid #e5ebe7",
        borderRadius: 13,
        background: "#fafcfb",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          color: "#98a2b3",
          fontSize: 10,
          fontWeight: 750,
          marginBottom: 6,
        }}
      >
        {icon && <span>{icon}</span>}
        {label}
      </div>

      <strong
        style={{
          color: "#26352d",
          fontSize: 13,
          wordBreak: "break-word",
        }}
      >
        {value || "—"}
      </strong>
    </div>
  );
}

function PermissionCard({ icon, title, description, to }) {
  return (
    <Link
      to={to}
      style={{
        textDecoration: "none",
        color: "inherit",
        display: "block",
        padding: 16,
        border: "1px solid #e4ebe6",
        borderRadius: 15,
        background: "#ffffff",
        transition: "transform .18s ease, box-shadow .18s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-3px)";
        e.currentTarget.style.boxShadow =
          "0 10px 25px rgba(15,23,42,.08)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 11,
          background: "#eaf8ef",
          color: "#13754e",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 17,
          marginBottom: 12,
        }}
      >
        {icon}
      </div>

      <strong
        style={{
          display: "block",
          fontSize: 13,
          color: "#26352d",
        }}
      >
        {title}
      </strong>

      <p
        style={{
          margin: "5px 0 0",
          color: "#98a2b3",
          fontSize: 10,
          lineHeight: 1.5,
        }}
      >
        {description}
      </p>

      <div
        style={{
          marginTop: 12,
          color: "#15803d",
          fontSize: 10,
          fontWeight: 800,
        }}
      >
        Open →
      </div>
    </Link>
  );
}

function SecurityRow({ title, description }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 11,
        padding: "12px 0",
        borderBottom: "1px solid #edf1ee",
      }}
    >
      <div
        style={{
          width: 29,
          height: 29,
          borderRadius: "50%",
          background: "#eaf8ef",
          color: "#15803d",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          fontWeight: 900,
        }}
      >
        ✓
      </div>

      <div>
        <strong
          style={{
            display: "block",
            color: "#344054",
            fontSize: 11,
          }}
        >
          {title}
        </strong>

        <span
          style={{
            display: "block",
            marginTop: 2,
            color: "#98a2b3",
            fontSize: 9,
          }}
        >
          {description}
        </span>
      </div>

      <span
        style={{
          marginLeft: "auto",
          color: "#15803d",
          fontSize: 9,
          fontWeight: 850,
        }}
      >
        VERIFIED
      </span>
    </div>
  );
}

export default function Profile() {
  const { user } = useAuth();
  const { t, lang, toggleLang } = useLanguage();

  const isFarmer = user.role === "farmer";
  const role = t(user.role);
  const initial = user.name?.charAt(0)?.toUpperCase() || "K";

  /*
   * Operator centre information.
   * If your API already sends centre/centreName this will show it.
   */
  const centreName =
    user.centre?.name ||
    user.centreName ||
    "Assigned procurement centre";

  return (
    <div
      className="profile-page"
      style={{
        paddingBottom: 45,
      }}
    >
      {/* =====================================================
          HERO
      ====================================================== */}

      <section
        style={{
          position: "relative",
          overflow: "hidden",
          minHeight: 230,
          borderRadius: 22,
          padding: "30px 34px",
          marginBottom: 18,
          background:
            "linear-gradient(120deg, #063f2c 0%, #0a6041 55%, #14734e 100%)",
          boxShadow: "0 12px 32px rgba(6,63,44,.14)",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 330,
            height: 330,
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,.11)",
            right: -100,
            top: -180,
          }}
        />

        <div
          style={{
            position: "absolute",
            width: 190,
            height: 190,
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,.08)",
            right: 110,
            bottom: -150,
          }}
        />

        <div
          style={{
            position: "relative",
            zIndex: 2,
          }}
        >
          <div
            style={{
              display: "inline-flex",
              padding: "6px 11px",
              borderRadius: 999,
              background: "rgba(255,255,255,.12)",
              color: "#d9f8e4",
              fontSize: 9,
              fontWeight: 850,
              letterSpacing: ".12em",
            }}
          >
            ● PROFILE
          </div>

          <h1
            style={{
              margin: "15px 0 7px",
              color: "#fff",
              fontSize: "clamp(30px,4vw,43px)",
              lineHeight: 1.05,
            }}
          >
            {user.name
              ? `${user.name}'s profile`
              : t("Your profile")}
          </h1>

          <p
            style={{
              margin: 0,
              color: "rgba(255,255,255,.76)",
              fontSize: 14,
            }}
          >
            Manage your identity, centre access and workspace tools.
          </p>

          <div
            style={{
              display: "flex",
              gap: 9,
              flexWrap: "wrap",
              marginTop: 18,
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "7px 10px",
                borderRadius: 999,
                background: "rgba(255,255,255,.12)",
                color: "#fff",
                fontSize: 10,
                fontWeight: 750,
              }}
            >
              <IconCheckCircle
                style={{
                  width: 14,
                  height: 14,
                }}
              />
              Verified account
            </span>

            <span
              style={{
                padding: "7px 10px",
                borderRadius: 999,
                background: "rgba(255,255,255,.12)",
                color: "#fff",
                fontSize: 10,
                fontWeight: 750,
              }}
            >
              ● {role}
            </span>

            {!isFarmer && (
              <span
                style={{
                  padding: "7px 10px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,.12)",
                  color: "#fff",
                  fontSize: 10,
                  fontWeight: 750,
                }}
              >
                Centre access active
              </span>
            )}
          </div>
        </div>
      </section>

      {/* =====================================================
          TOP PROFILE AREA
      ====================================================== */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "300px minmax(0,1fr)",
          gap: 18,
          alignItems: "start",
        }}
      >
        {/* ===================================================
            IDENTITY
        ==================================================== */}

        <section
          className="card"
          style={{
            padding: 21,
            borderRadius: 19,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 13,
              paddingBottom: 17,
              borderBottom: "1px solid #edf0ee",
            }}
          >
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: 17,
                flexShrink: 0,
                background:
                  "linear-gradient(145deg,#147550,#075339)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 25,
                fontWeight: 850,
              }}
            >
              {initial}
            </div>

            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: 18,
                  color: "#17211b",
                }}
              >
                {user.name || "KrishiQueue user"}
              </h2>

              <span
                style={{
                  display: "inline-flex",
                  marginTop: 5,
                  padding: "4px 8px",
                  borderRadius: 999,
                  background: "#e9f7ee",
                  color: "#166534",
                  fontSize: 9,
                  fontWeight: 850,
                }}
              >
                ● {role}
              </span>
            </div>
          </div>

          {/* Active account */}

          <div
            style={{
              marginTop: 17,
              padding: 13,
              borderRadius: 12,
              background: "#f2faf5",
              border: "1px solid #dcefe2",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#22c55e",
                }}
              />

              <strong
                style={{
                  color: "#166534",
                  fontSize: 11,
                }}
              >
                Account active
              </strong>
            </div>

            <p
              style={{
                margin: "5px 0 0",
                color: "#667085",
                fontSize: 10,
              }}
            >
              Your KrishiQueue account is verified.
            </p>
          </div>

          {/* Assigned centre */}

          {!isFarmer && (
            <div style={{ marginTop: 17 }}>
              <div
                style={{
                  color: "#98a2b3",
                  fontSize: 9,
                  fontWeight: 850,
                  letterSpacing: ".1em",
                }}
              >
                ASSIGNED CENTRE
              </div>

              <div
                style={{
                  marginTop: 8,
                  padding: 12,
                  borderRadius: 12,
                  background: "#fafcfb",
                  border: "1px solid #e5ebe7",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 9,
                  }}
                >
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      background: "#eaf8ef",
                      color: "#15803d",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <IconBuilding
                      style={{
                        width: 17,
                        height: 17,
                      }}
                    />
                  </div>

                  <div>
                    <strong
                      style={{
                        display: "block",
                        fontSize: 11,
                        color: "#344054",
                      }}
                    >
                      {centreName}
                    </strong>

                    <span
                      style={{
                        display: "block",
                        marginTop: 3,
                        fontSize: 9,
                        color: "#15803d",
                        fontWeight: 750,
                      }}
                    >
                      ✓ Centre access restricted
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <button
            className="btn alt"
            type="button"
            onClick={toggleLang}
            style={{
              width: "100%",
              justifyContent: "center",
              marginTop: 17,
            }}
          >
            <IconGlobe
              style={{
                width: 15,
                height: 15,
              }}
            />

            {lang === "en" ? "हिन्दी" : "English"}
          </button>
        </section>

        {/* ===================================================
            PERSONAL INFORMATION
        ==================================================== */}

        <section
          className="card"
          style={{
            padding: 23,
            borderRadius: 19,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingBottom: 16,
              borderBottom: "1px solid #edf0ee",
            }}
          >
            <div>
              <div
                style={{
                  color: "#15803d",
                  fontSize: 9,
                  fontWeight: 850,
                  letterSpacing: ".1em",
                }}
              >
                ACCOUNT DETAILS
              </div>

              <h2
                style={{
                  margin: "5px 0 0",
                  fontSize: 21,
                  color: "#17211b",
                }}
              >
                Personal information
              </h2>
            </div>

            <div
              style={{
                width: 39,
                height: 39,
                borderRadius: 11,
                background: "#eef9f2",
                color: "#15803d",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IconUser
                style={{
                  width: 20,
                  height: 20,
                }}
              />
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(2,minmax(0,1fr))",
              gap: 10,
              marginTop: 18,
            }}
          >
            <InfoField
              label={t("Name")}
              value={user.name}
              icon="●"
            />

            <InfoField
              label={
                isFarmer
                  ? t("Farmer ID")
                  : t("Employee ID")
              }
              value={
                user.farmerId ||
                user.employeeId ||
                user.email
              }
              icon="#"
            />

            <InfoField
              label={t("Mobile Number")}
              value={user.mobile || user.phone}
              icon="☎"
            />

            <InfoField
              label={t("Role")}
              value={role}
              icon="◆"
            />

            {isFarmer && (
              <InfoField
                label={t("Village")}
                value={user.village}
                icon="⌖"
              />
            )}

            <InfoField
              label="Account status"
              value="Active & verified"
              icon="✓"
            />
          </div>

          {/* Account verification */}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 11,
              marginTop: 17,
              padding: 14,
              borderRadius: 12,
              background:
                "linear-gradient(90deg,#effbf3,#f9fcfa)",
              border: "1px solid #d9eee0",
            }}
          >
            <IconCheckCircle
              style={{
                width: 20,
                height: 20,
                color: "#15803d",
              }}
            />

            <div>
              <strong
                style={{
                  display: "block",
                  fontSize: 11,
                  color: "#166534",
                }}
              >
                Verified KrishiQueue account
              </strong>

              <span
                style={{
                  display: "block",
                  marginTop: 2,
                  color: "#667085",
                  fontSize: 9,
                }}
              >
                Your role and workspace access are
                managed securely by the system.
              </span>
            </div>
          </div>
        </section>
      </div>

      {/* =====================================================
          QUICK ACTIONS
      ====================================================== */}

      {!isFarmer && (
        <section
          style={{
            marginTop: 18,
            padding: 22,
            background: "#ffffff",
            border: "1px solid #e2e8e4",
            borderRadius: 19,
            boxShadow:
              "0 7px 25px rgba(15,23,42,.045)",
          }}
        >
          <div>
            <div
              style={{
                color: "#15803d",
                fontSize: 9,
                fontWeight: 850,
                letterSpacing: ".1em",
              }}
            >
              QUICK ACTIONS
            </div>

            <h2
              style={{
                margin: "5px 0 0",
                color: "#17211b",
                fontSize: 20,
              }}
            >
              Operator workspace
            </h2>

            <p
              style={{
                margin: "4px 0 15px",
                color: "#98a2b3",
                fontSize: 10,
              }}
            >
              Jump directly to the tools you use during
              daily centre operations.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(3,minmax(0,1fr))",
              gap: 12,
            }}
          >
            <PermissionCard
              icon="◷"
              title="Live Queue"
              description="Monitor waiting farmers and call the next token."
              to="/app/live-queue"
            />

            <PermissionCard
              icon="⌗"
              title="Scan Check-in"
              description="Scan or manually enter a farmer token."
              to="/app/check-in"
            />

            <PermissionCard
              icon="⚖"
              title="Procurement"
              description="Record weight, quality and procurement details."
              to="/app/procurement"
            />
          </div>
        </section>
      )}

      {/* =====================================================
          SECURITY + ACCESS
      ====================================================== */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 18,
          marginTop: 18,
        }}
      >
        {/* Security */}

        <section
          className="card"
          style={{
            padding: 21,
            borderRadius: 19,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 4,
            }}
          >
            <div
              style={{
                width: 35,
                height: 35,
                borderRadius: 10,
                background: "#eef9f2",
                color: "#15803d",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ✓
            </div>

            <div>
              <div
                style={{
                  color: "#15803d",
                  fontSize: 9,
                  fontWeight: 850,
                  letterSpacing: ".1em",
                }}
              >
                SECURITY
              </div>

              <h3
                style={{
                  margin: "3px 0 0",
                  color: "#17211b",
                  fontSize: 16,
                }}
              >
                Account security
              </h3>
            </div>
          </div>

          <SecurityRow
            title="Account verified"
            description="Your KrishiQueue account is active."
          />

          <SecurityRow
            title="Role verified"
            description={`Workspace role: ${role}`}
          />

          {!isFarmer && (
            <SecurityRow
              title="Centre access"
              description="Access is limited to your assigned centre."
            />
          )}
        </section>

        {/* Access summary */}

        <section
          className="card"
          style={{
            padding: 21,
            borderRadius: 19,
          }}
        >
          <div
            style={{
              color: "#15803d",
              fontSize: 9,
              fontWeight: 850,
              letterSpacing: ".1em",
            }}
          >
            ACCESS SUMMARY
          </div>

          <h3
            style={{
              margin: "5px 0 3px",
              color: "#17211b",
              fontSize: 16,
            }}
          >
            Workspace permissions
          </h3>

          <p
            style={{
              margin: "0 0 12px",
              color: "#98a2b3",
              fontSize: 10,
            }}
          >
            Access is automatically determined by
            your account role.
          </p>

          <div
            style={{
              display: "grid",
              gap: 7,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "9px 11px",
                borderRadius: 9,
                background: "#f5faf7",
              }}
            >
              <span
                style={{
                  color: "#667085",
                  fontSize: 10,
                }}
              >
                Workspace
              </span>

              <strong
                style={{
                  color: "#166534",
                  fontSize: 10,
                }}
              >
                {role}
              </strong>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "9px 11px",
                borderRadius: 9,
                background: "#f5faf7",
              }}
            >
              <span
                style={{
                  color: "#667085",
                  fontSize: 10,
                }}
              >
                Centre access
              </span>

              <strong
                style={{
                  color: "#166534",
                  fontSize: 10,
                }}
              >
                {isFarmer ? "Farmer access" : "Restricted"}
              </strong>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "9px 11px",
                borderRadius: 9,
                background: "#f5faf7",
              }}
            >
              <span
                style={{
                  color: "#667085",
                  fontSize: 10,
                }}
              >
                Account
              </span>

              <strong
                style={{
                  color: "#166534",
                  fontSize: 10,
                }}
              >
                Active
              </strong>
            </div>
          </div>
        </section>
      </div>

      {/* =====================================================
          FARMER BANK DETAILS
      ====================================================== */}

      {isFarmer && (
        <section
          style={{
            marginTop: 18,
            padding: 18,
            borderRadius: 17,
            background:
              "linear-gradient(135deg,#fffaf0,#ffffff)",
            border: "1px solid #f1e4c5",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 15,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 11,
                background: "#fff4d8",
                color: "#a16207",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IconBank
                style={{
                  width: 19,
                  height: 19,
                }}
              />
            </div>

            <div>
              <strong
                style={{
                  display: "block",
                  fontSize: 12,
                  color: "#344054",
                }}
              >
                {t("Bank Details")}
              </strong>

              <span
                style={{
                  display: "block",
                  marginTop: 3,
                  fontSize: 9,
                  color: "#98a2b3",
                }}
              >
                Payment details for procurement payouts.
              </span>
            </div>
          </div>

          <Link
            className="btn alt"
            to="/app/bank"
            style={{
              whiteSpace: "nowrap",
            }}
          >
            {t("Open Bank Details")}
          </Link>
        </section>
      )}

      {/* =====================================================
          FOOTER NOTE
      ====================================================== */}

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 6,
          marginTop: 16,
          color: "#98a2b3",
          fontSize: 9,
        }}
      >
        <IconClock
          style={{
            width: 12,
            height: 12,
          }}
        />
        Role-based access • KrishiQueue secure workspace
      </div>
    </div>
  );
}
