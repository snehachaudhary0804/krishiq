/**
 * SMS sending for OTP login.
 *
 * Set these in .env to send REAL SMS via Twilio:
 * TWILIO_ACCOUNT_SID=...
 * TWILIO_AUTH_TOKEN=...
 * TWILIO_FROM_NUMBER=+1...
 *
 * Without those, the app runs in DEMO mode: the OTP is not texted anywhere, it is returned
 * directly in the API response (and logged to the server console) so the demo still works
 * end-to-end. The UI clearly labels this as demo mode instead of pretending an SMS was sent.
 */

function isSmsConfigured() {
 return Boolean(
 process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER
 );
}

async function sendOtpSms(mobile, code) {
 if (!isSmsConfigured()) {
 console.log(`[DEMO SMS] OTP for ${mobile}: ${code}`);
 return { sent: false, demo: true };
 }

 // Lazy-require so the app doesn't crash if the package/creds aren't set up.
 const twilio = require("twilio");
 const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
 await client.messages.create({
 body: `Your KrishiQueue login OTP is ${code}. Valid for 5 minutes.`,
 from: process.env.TWILIO_FROM_NUMBER,
 to: mobile.startsWith("+") ? mobile : `+91${mobile}`,
 });
 return { sent: true, demo: false };
}

module.exports = { isSmsConfigured, sendOtpSms };
