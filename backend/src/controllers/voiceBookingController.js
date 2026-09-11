require("dotenv").config();
const { GoogleGenAI } = require("@google/genai");

const VALID_SLOTS = [
  "09:00 - 10:00",
  "10:00 - 11:00",
  "11:00 - 12:00",
  "12:00 - 01:00",
  "02:00 - 03:00",
  "03:00 - 04:00",
  "04:00 - 05:00",
];

// Exact Match for 8 Crops used in Frontend
const VALID_CROPS = [
  "Barley (जौ)",
  "Gram (चना)",
  "Lentil/Masur (मसूर)",
  "Moong (मूंग)",
  "Mustard (सरसों)",
  "Paddy/Rice (धान)",
  "Sesamum (तिल)",
  "Wheat (गेहूं)",
];

function matchExactSlot(text) {
  const lower = text.toLowerCase();
  if (/\b(11|ग्यारह|gyarah)\s*(baje|bje|बजे|:00|am|pm)?/i.test(lower) && (lower.includes("11") || lower.includes("ग्यारह"))) {
    return "11:00 - 12:00";
  }
  if (/\b(12|बारह|barah)\s*(baje|bje|बजे|:00|pm)?/i.test(lower) && (lower.includes("12") || lower.includes("बारह"))) {
    return "12:00 - 01:00";
  }
  if (/\b(10|दस|das)\s*(baje|bje|बजे|:00|am)?/i.test(lower) && (lower.includes("10") || lower.includes("दस"))) {
    return "10:00 - 11:00";
  }
  if (/\b(9|09|नौ|nau)\s*(baje|bje|बजे|:00|am)?/i.test(lower) && (lower.includes("9") || lower.includes("नौ"))) {
    return "09:00 - 10:00";
  }
  if (/\b(4|04|चार|chaar|four)\s*(baje|bje|बजे|:00|pm)?/i.test(lower) && (lower.includes("4 b") || lower.includes("चार") || lower.includes("4:00"))) {
    return "04:00 - 05:00";
  }
  if (/\b(3|03|तीन|teen|three)\s*(baje|bje|बजे|:00|pm)?/i.test(lower) && (lower.includes("3 b") || lower.includes("तीन") || lower.includes("3:00"))) {
    return "03:00 - 04:00";
  }
  if (/\b(2|02|दो|do|two)\s*(baje|bje|बजे|:00|pm)?/i.test(lower) && (lower.includes("2 b") || lower.includes("दो") || lower.includes("2:00"))) {
    return "02:00 - 03:00";
  }
  if (/\b(1|01|एक|ek|one)\s*(baje|bje|बजे|:00|pm)?/i.test(lower) && (lower.includes("1 b") || lower.includes("एक") || lower.includes("1:00"))) {
    return "12:00 - 01:00";
  }
  return null;
}

function localRegexParse(transcript) {
  const text = transcript.toLowerCase();

  // 1. Crop Matching for All 8 Crops
  let crop = "Wheat (गेहूं)";
  if (text.includes("सरसों") || text.includes("sarso") || text.includes("mustard")) crop = "Mustard (सरसों)";
  else if (text.includes("चावल") || text.includes("धान") || text.includes("dhan") || text.includes("chawal") || text.includes("paddy") || text.includes("rice")) crop = "Paddy/Rice (धान)";
  else if (text.includes("चना") || text.includes("chana") || text.includes("gram")) crop = "Gram (चना)";
  else if (text.includes("मसूर") || text.includes("masur") || text.includes("masoor") || text.includes("lentil")) crop = "Lentil/Masur (मसूर)";
  else if (text.includes("मूंग") || text.includes("moong")) crop = "Moong (मूंग)";
  else if (text.includes("जौ") || text.includes("jau") || text.includes("barley")) crop = "Barley (जौ)";
  else if (text.includes("तिल") || text.includes("til") || text.includes("sesamum")) crop = "Sesamum (तिल)";
  else if (text.includes("गेहूं") || text.includes("gehu") || text.includes("gahun") || text.includes("wheat")) crop = "Wheat (गेहूं)";

  // 2. Centre Matching (Including Sikandra Rao & Nearby Mandis)
  let centre = null;
  if (text.includes("सिकंदरा") || text.includes("sikandra")) centre = "Sikandra Rao";
  else if (text.includes("हाथरस") || text.includes("hathras")) centre = "Hathras";
  else if (text.includes("अलीगढ़") || text.includes("aligarh")) centre = "Aligarh";
  else if (text.includes("एटा") || text.includes("etah")) centre = "Etah";
  else if (text.includes("कासगंज") || text.includes("kasganj")) centre = "Kasganj";
  else if (text.includes("गाजियाबाद") || text.includes("ghaziabad")) centre = "Ghaziabad";
  else if (text.includes("हापुड़") || text.includes("हापुड") || text.includes("hapur")) centre = "Hapur";
  else if (text.includes("रामपुर") || text.includes("rampur") || text.includes("rampu")) centre = "Rampur";
  else if (text.includes("हसनपुर") || text.includes("hasanpur")) centre = "Hasanpur";

  // 3. Date Matching
  const today = new Date();
  let targetDate = new Date(today);
  const dateMatch = text.match(/(\d{1,2})\s*(तारीख|tareek|tareekh|tarikh)/i);
  if (dateMatch) {
    targetDate.setDate(parseInt(dateMatch[1], 10));
  } else if (text.includes("परसों") || text.includes("parso")) {
    targetDate.setDate(today.getDate() + 2);
  } else if (text.includes("कल") || text.includes("kal") || text.includes("tomorrow")) {
    targetDate.setDate(today.getDate() + 1);
  }

  const yyyy = targetDate.getFullYear();
  const mm = String(targetDate.getMonth() + 1).padStart(2, "0");
  const dd = String(targetDate.getDate()).padStart(2, "0");
  const dateStr = `${yyyy}-${mm}-${dd}`;

  // 4. Slot Matching
  const slot = matchExactSlot(text) || "10:00 - 11:00";

  return {
    rawTranscript: transcript,
    centre,
    crop,
    date: dateStr,
    slot,
    quantityKg: 500,
    clarificationNeeded: false,
    replyMessage: `${centre || "मंडी केंद्र"} पर ${crop} के लिए ${slot} का स्लॉट चुन लिया गया है।`,
  };
}

async function parseVoiceBooking(req, res) {
  const { transcript } = req.body;
  if (!transcript) return res.status(400).json({ message: "No speech text provided" });

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("No API key configured");

    const ai = new GoogleGenAI({ apiKey });
    const today = new Date().toISOString().split("T")[0];

    const prompt = `
Extract procurement booking intent from an Indian farmer's speech: "${transcript}".
Reference Current Date: ${today}

Centres Available strictly:
["Sikandra Rao", "Hathras", "Aligarh", "Etah", "Kasganj", "Ghaziabad", "Hapur", "Rampur", "Hasanpur"].
- If mentions "सिकंदरा" or "sikandra", output "Sikandra Rao".
- If mentions "हाथरस" or "hathras", output "Hathras".
- If mentions "अलीगढ़" or "aligarh", output "Aligarh".
- If mentions "एटा" or "etah", output "Etah".
- If mentions "कासगंज" or "kasganj", output "Kasganj".
- If mentions "गाजियाबाद", output "Ghaziabad".
- If mentions "हापुड़", output "Hapur".
- If mentions "रामपुर", output "Rampur".
- If mentions "हसनपुर", output "Hasanpur".

Allowed Crops ONLY (Strictly choose from these exact names):
${JSON.stringify(VALID_CROPS)}
- gehu, wheat, gahun -> "Wheat (गेहूं)"
- sarson, rai, mustard -> "Mustard (सरसों)"
- chawal, dhan, paddy, rice -> "Paddy/Rice (धान)"
- chana, gram -> "Gram (चना)"
- masur, masoor, lentil -> "Lentil/Masur (मसूर)"
- moong -> "Moong (मूंग)"
- jau, barley -> "Barley (जौ)"
- til, sesamum -> "Sesamum (तिल)"

Allowed Slots ONLY:
${JSON.stringify(VALID_SLOTS)}

Date rules:
- If mentions "kal" / "tomorrow", use tomorrow's date (YYYY-MM-DD).
- If mentions "aaj" / "today", use ${today}.

Return strictly raw JSON (no backticks, no markdown):
{
  "centre": string or null,
  "crop": "exact crop string from Allowed Crops list",
  "date": "YYYY-MM-DD",
  "slot": "exact string from allowed slots",
  "quantityKg": 500,
  "replyMessage": "Aapka slot chun liya gaya hai."
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const rawText = (response.text || "").replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(rawText);
    parsed.rawTranscript = transcript;

    if (parsed.slot && !VALID_SLOTS.includes(parsed.slot)) {
      parsed.slot = matchExactSlot(parsed.slot) || matchExactSlot(transcript) || "10:00 - 11:00";
    }

    return res.json(parsed);
  } catch (err) {
    console.error("Gemini Error / Fallback:", err.message);
    const fallback = localRegexParse(transcript);
    return res.json(fallback);
  }
}

module.exports = { parseVoiceBooking };