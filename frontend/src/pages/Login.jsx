import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/api";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import { IconLeaf, IconGlobe } from "../components/icons.jsx";

const ROLES = ["farmer", "operator", "admin"];

export default function Login() {
  const { t, lang, toggleLang } = useLanguage();
  const [role, setRole] = useState("farmer");
  const [step, setStep] = useState("mobile"); // 'mobile' -> 'otp'

  // Farmer fields
  const [farmerId, setFarmerId] = useState("");
  const [mobile, setMobile] = useState("");
  const [name, setName] = useState("");
  const [village, setVillage] = useState("");
  const [otp, setOtp] = useState("");

  // Staff fields
  const [mode, setMode] = useState("login");
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const { loginSuccess } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  function pickRole(r) {
    setRole(r);
    setMode("login");
    setStep("mobile");
  }

  // STEP 1: Farmer checks ID + Mobile, gets OTP
  async function sendFarmerOtp(e) {
    e.preventDefault();
    if (!farmerId.trim() || !mobile.trim()) {
      return toast("Farmer ID and Mobile number are required");
    }
    setBusy(true);
    try {
      const data = await api.requestFarmerOtp({
        farmerId: farmerId.trim(),
        mobile: mobile.trim(),
      });
      if (data.autoName && !name) setName(data.autoName);
      if (data.autoVillage && !village) setVillage(data.autoVillage);

      toast("OTP sent to your mobile");
      setStep("otp");
    } catch (err) {
      toast(err.message);
    } finally {
      setBusy(false);
    }
  }

  // STEP 2: Farmer enters OTP + verifies
  async function verifyOtp(e) {
    e.preventDefault();
    if (!otp.trim()) return toast("Enter the OTP");
    setBusy(true);
    try {
      const data = await api.verifyFarmerOtp({
        farmerId: farmerId.trim(),
        mobile: mobile.trim(),
        otp: otp.trim(),
        name: name.trim(),
        village: village.trim(),
      });
      loginSuccess(data.token, data.user);
      navigate("/app/home");
    } catch (err) {
      toast(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function staffSubmit(e) {
    e.preventDefault();
    if (!employeeId.trim()) return toast(`Enter ${role} ID`);
    if (!password.trim()) return toast("Enter password");
    setBusy(true);
    try {
      let data;
      if (mode === "register") {
        if (!name.trim()) return toast("Enter your name");
        data = await api.staffRegister({ role, name, employeeId, password });
      } else {
        data = await api.staffLogin({ role, employeeId, password });
      }
      loginSuccess(data.token, data.user);
      navigate("/app/home");
    } catch (err) {
      toast(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login">
      {/* ---- Left visual panel: original vector field illustration ---- */}
      <div className="login-visual">
        <svg
          className="field-art"
          viewBox="0 0 900 700"
          preserveAspectRatio="xMidYMax slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffd98a" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#ffd98a" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="hill1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2f8f5b" />
              <stop offset="100%" stopColor="#1f6e46" />
            </linearGradient>
            <linearGradient id="hill2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0f4d30" />
              <stop offset="100%" stopColor="#0a3a24" />
            </linearGradient>
          </defs>
          <circle cx="700" cy="140" r="230" fill="url(#sky)" />
          <path d="M0 430 Q 220 340 460 420 T 900 400 V700 H0 Z" fill="url(#hill1)" opacity="0.85" />
          <path d="M0 520 Q 260 460 500 520 T 900 500 V700 H0 Z" fill="url(#hill2)" />
          {Array.from({ length: 9 }).map((_, row) =>
            Array.from({ length: 14 }).map((_, col) => (
              <path
                key={`${row}-${col}`}
                d={`M${40 + col * 62 + (row % 2 === 0 ? 0 : 28)} ${560 + row * 15} q -3 -20 0 -34`}
                stroke="#ffe9a8"
                strokeOpacity="0.55"
                strokeWidth="2.4"
                strokeLinecap="round"
                fill="none"
              />
            ))
          )}
          {/* simple farmer silhouette, walking the field at dusk */}
          <g transform="translate(150,470)" fill="#0a2e1c" opacity="0.9">
            <circle cx="18" cy="0" r="10" />
            <path d="M18 10 C 6 16 2 34 4 58 L 12 58 L 14 34 L 20 58 L 30 58 C 30 34 30 20 18 10 Z" />
            <path d="M4 24 L -18 6" stroke="#0a2e1c" strokeWidth="5" strokeLinecap="round" />
            <path d="M-18 6 L -18 -26" stroke="#0a2e1c" strokeWidth="4" strokeLinecap="round" />
          </g>
        </svg>
      </div>

      {/* ---- Right panel: the exact existing login logic ---- */}
      <div className="loginbox-wrap">
        <div>
          <div className="loginbox">
            <div className="between">
              <div className="brand" style={{ color: "var(--brand)" }}>
                <span
                  className="brand-mark"
                  style={{ background: "var(--brand-light)", border: "1px solid var(--border)" }}
                >
                  <IconLeaf style={{ width: 17, height: 17, color: "var(--brand)" }} />
                </span>
                {t("appName")}
              </div>
              <button
                type="button"
                className="btn alt"
                style={{ padding: "6px 12px" }}
                onClick={toggleLang}
              >
                <IconGlobe style={{ width: 14, height: 14 }} />
                {lang === "en" ? "हिन्दी" : "English"}
              </button>
            </div>
            <h1 style={{ marginTop: 16 }}>{t("tagline")}</h1>
            <p className="muted">{t("subtitle")}</p>

            <div className="roles">
              {ROLES.map((r) => (
                <button
                  key={r}
                  type="button"
                  className={`role ${role === r ? "sel" : ""}`}
                  onClick={() => pickRole(r)}
                >
                  {t(r)}
                </button>
              ))}
            </div>

            {/* Farmer Step 1: ID + Mobile -> Get OTP */}
            {role === "farmer" && step === "mobile" && (
              <form onSubmit={sendFarmerOtp}>
                <div className="field">
                  <label>Farmer ID (AgriStack / PM-Kisan)</label>
                  <input
                    value={farmerId}
                    onChange={(e) => setFarmerId(e.target.value)}
                    placeholder="e.g. UP-AGRI-2026-89412"
                    required
                  />
                </div>
                <div className="field">
                  <label>{t("mobileNumber")}</label>
                  <input
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="10-digit registered mobile number"
                    maxLength={10}
                    required
                  />
                </div>
                <button
                  className="btn"
                  style={{ width: "100%", marginTop: 12, justifyContent: "center" }}
                  disabled={busy}
                  type="submit"
                >
                  {busy ? "Verifying..." : t("sendOtp")}
                </button>
              </form>
            )}

            {/* Farmer Step 2: Enter OTP */}
            {role === "farmer" && step === "otp" && (
              <form onSubmit={verifyOtp}>
                <div className="field">
                  <label>{t("enterOtp")}</label>
                  <input
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="6-digit OTP"
                    maxLength={6}
                    required
                  />
                </div>
                <div className="form2">
                  <div className="field">
                    <label>{t("name")}</label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Farmer name"
                    />
                  </div>
                  <div className="field">
                    <label>{t("village")}</label>
                    <input
                      value={village}
                      onChange={(e) => setVillage(e.target.value)}
                      placeholder="Village"
                    />
                  </div>
                </div>
                <button
                  className="btn"
                  style={{ width: "100%", marginTop: 12, justifyContent: "center" }}
                  disabled={busy}
                  type="submit"
                >
                  {busy ? "..." : t("verifyLogin")}
                </button>
                <button
                  type="button"
                  className="btn alt"
                  style={{ width: "100%", marginTop: 8, justifyContent: "center" }}
                  onClick={() => setStep("mobile")}
                >
                  Change ID / Mobile number
                </button>
              </form>
            )}

            {/* Staff Login / Register */}
            {role !== "farmer" && (
              <form onSubmit={staffSubmit}>
                <div className="field">
                  <label>{role === "operator" ? "Operator ID" : "Admin ID"}</label>
                  <input
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    placeholder={`e.g. name@${role}`}
                  />
                </div>
                {mode === "register" && (
                  <div className="field">
                    <label>{t("name")}</label>
                    <input value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                )}
                <div className="field">
                  <label>{t("password")}</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <button
                  className="btn"
                  style={{ width: "100%", justifyContent: "center" }}
                  disabled={busy}
                  type="submit"
                >
                  {busy ? "..." : t("continue")}
                </button>
                <p className="muted" style={{ marginTop: 10, textAlign: "center" }}>
                  {mode === "login" ? (
                    <>
                      New {role}?{" "}
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setMode("register");
                        }}
                      >
                        Create an account
                      </a>
                    </>
                  ) : (
                    <>
                      Already registered?{" "}
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setMode("login");
                        }}
                      >
                        Log in
                      </a>
                    </>
                  )}
                </p>
              </form>
            )}
          </div>
          <p className="login-footnote">Built to simplify the farming journey.</p>
        </div>
      </div>
    </div>
  );
}