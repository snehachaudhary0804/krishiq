import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { api } from "../api/api";
import { useToast } from "../context/ToastContext";

export default function VoiceAssistant({ onBookingAutoFill }) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [processing, setProcessing] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      return toast("Aapka browser voice recognition support nahi karta. Chrome use karein.");
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "hi-IN";
    recognition.interimResults = false;

    recognition.onstart = () => setListening(true);

    recognition.onresult = async (event) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      setListening(false);
      setProcessing(true);

      const lower = text.toLowerCase();

      // 1. Agar farmer Home ya kisi aur page par bole ki "Slot book karna hai"
      const isBookingIntent =
        lower.includes("slot book") ||
        lower.includes("स्लॉट बुक") ||
        lower.includes("token book") ||
        lower.includes("टोकन बुक") ||
        lower.includes("booking") ||
        lower.includes("बुक करना") ||
        lower.includes("बेचना है");

      if (isBookingIntent && location.pathname !== "/app/book") {
        if ("speechSynthesis" in window) {
          const u = new SpeechSynthesisUtterance("स्लॉट बुकिंग पेज खोला जा रहा है");
          u.lang = "hi-IN";
          window.speechSynthesis.speak(u);
        }
        toast("Opening Booking Page...");
        navigate("/app/book");
        setProcessing(false);
        return;
      }

      // 2. Agar /app/book par hai ya specific details bol raha hai
      try {
        const result = await api.parseVoiceBooking(text);

        if ("speechSynthesis" in window && result.replyMessage) {
          const utterance = new SpeechSynthesisUtterance(result.replyMessage);
          utterance.lang = "hi-IN";
          window.speechSynthesis.speak(utterance);
        }

        if (onBookingAutoFill) {
          onBookingAutoFill(result);
        }
        toast(result.replyMessage || "विवरण भर दिया गया है");
      } catch (err) {
        toast("आवाज समझ नहीं आई, कृपया दोबारा बोलें।");
      } finally {
        setProcessing(false);
      }
    };

    recognition.onerror = () => {
      setListening(false);
      setProcessing(false);
      toast("माइक से आवाज नहीं मिली।");
    };

    recognition.start();
  };

  return (
    <div style={{ margin: "12px 0", padding: "12px", background: "var(--card-bg, #f3f9f4)", borderRadius: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <button
          type="button"
          className="btn"
          style={{ background: listening ? "#dc2626" : "var(--brand, #15803d)" }}
          onClick={startListening}
          disabled={listening || processing}
        >
          {listening ? "🎙️ सुन रहा हूँ..." : processing ? "⏳ समझ रहा हूँ..." : "🎤 बोलकर काम करें"}
        </button>
        <span style={{ fontSize: "0.85rem", color: "#555" }}>
          (जैसे: "मुझे स्लॉट बुक करना है" या "कल 11 बजे का गेहूं का स्लॉट बुक करो")
        </span>
      </div>

      {transcript && (
        <p style={{ marginTop: 8, fontSize: "0.9rem" }}>
          <b>आपने बोला:</b> "{transcript}"
        </p>
      )}
    </div>
  );
}