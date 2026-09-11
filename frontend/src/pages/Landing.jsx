import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import {
  IconArrowRight, IconCheckCircle, IconClock, IconGlobe, IconLeaf,
  IconMapPin, IconScan, IconTicket, IconUsers,
} from "../components/icons.jsx";

const features = [
  {
    image: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=900&q=82",
    icon: IconMapPin,
    title: "Find your centre",
    text: "Choose the right procurement centre before you travel.",
  },
  {
    image: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=900&q=82",
    icon: IconTicket,
    title: "Book a digital token",
    text: "Reserve a time slot and reduce unnecessary waiting.",
  },
  {
    image: "https://images.unsplash.com/photo-1534773728080-33d31da27ae5?auto=format&fit=crop&w=900&q=82",
    icon: IconClock,
    title: "Track your turn live",
    text: "Follow queue position, check-in and payment status in one place.",
  },
];

export default function Landing() {
  const { user } = useAuth();
  const { t, lang, toggleLang } = useLanguage();

  if (user) return <Navigate to="/app/home" replace />;

  return (
    <main className="landing-page">
      <nav className="landing-nav">
        <Link className="landing-brand" to="/">
          <span className="brand-mark"><IconLeaf style={{ width: 18, height: 18 }} /></span>
          <span>{t("appName")}</span>
        </Link>
        <div className="landing-nav-actions">
          <button className="landing-language" onClick={toggleLang} type="button">
            <IconGlobe style={{ width: 15, height: 15 }} />
            {lang === "en" ? "हिन्दी" : "English"}
          </button>
          <Link className="btn landing-login-link" to="/login">{t("login")} <IconArrowRight style={{ width: 15, height: 15 }} /></Link>
        </div>
      </nav>

      <section className="landing-hero">
        <div className="landing-hero-copy">
          <span className="landing-eyebrow"><IconLeaf style={{ width: 15, height: 15 }} /> {t("Built for Indian agriculture")}</span>
          <h1>{t("A smarter way to reach the procurement centre.")}</h1>
          <p>{t("KrishiQueue helps farmers book a token, follow their live queue and complete procurement with less waiting.")}</p>
          <div className="landing-actions">
            <Link className="btn landing-primary" to="/login">{t("Get started") } <IconArrowRight style={{ width: 17, height: 17 }} /></Link>
            <a className="landing-secondary" href="#how-it-works">{t("See how it works")} <IconArrowRight style={{ width: 15, height: 15 }} /></a>
          </div>
          <div className="landing-trust-row">
            <span><IconCheckCircle style={{ width: 16, height: 16 }} /> {t("Farmer-first")}</span>
            <span><IconUsers style={{ width: 16, height: 16 }} /> {t("Built for centres")}</span>
            <span><IconScan style={{ width: 16, height: 16 }} /> {t("QR check-in")}</span>
          </div>
        </div>
        <div className="landing-hero-card">
          <div className="landing-hero-card-top"><span className="status green">{t("Live queue")}</span><span>{t("Today")}</span></div>
          <div className="landing-queue-icon"><IconTicket style={{ width: 22, height: 22 }} /></div>
          <span className="metric-label">{t("Your digital journey")}</span>
          <strong>{t("Book → Track → Get paid")}</strong>
          <div className="landing-progress"><span /></div>
          <small>{t("Everything you need for a smoother visit")}</small>
        </div>
      </section>

      <section className="landing-proof" id="how-it-works">
        <div><strong>{t("One simple journey")}</strong><span>{t("Find a centre, book your turn, arrive informed.")}</span></div>
        <div><strong>{t("Real-time clarity")}</strong><span>{t("Queue position and status stay visible.")}</span></div>
        <div><strong>{t("Farmer-friendly")}</strong><span>{t("English and Hindi support from the start.")}</span></div>
      </section>

      <section className="landing-features">
        <div className="landing-section-heading">
          <span className="hero-kicker">{t("How KrishiQueue helps")}</span>
          <h2>{t("From field to fair payment, with less waiting.")}</h2>
        </div>
        <div className="landing-feature-grid">
          {features.map(({ image, icon: Icon, title, text }) => (
            <article className="landing-feature-card" key={title}>
              <div className="landing-feature-image" style={{ backgroundImage: `url(${image})` }} />
              <div className="landing-feature-body">
                <div className="card-icon"><Icon style={{ width: 19, height: 19 }} /></div>
                <h3>{t(title)}</h3>
                <p>{t(text)}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-cta">
        <div>
          <span className="landing-eyebrow">{t("Ready when you are")}</span>
          <h2>{t("Spend less time waiting. Spend more time farming.")}</h2>
        </div>
        <Link className="btn" to="/login">{t("Login to KrishiQueue")} <IconArrowRight style={{ width: 16, height: 16 }} /></Link>
      </section>

      <footer className="landing-footer">
        <span>© KrishiQueue</span>
        <span>{t("Digital procurement, designed around the farmer.")}</span>
      </footer>
    </main>
  );
}
