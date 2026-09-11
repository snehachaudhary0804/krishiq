/**
 * RazorpayX Payout integration.
 *
 * This calls the REAL RazorpayX API (contacts -> fund_accounts -> payouts) so that money
 * actually moves to the farmer's bank account — but that only works if you have a genuine,
 * KYC-verified RazorpayX business account and put its credentials in .env:
 *
 * RAZORPAY_KEY_ID=...
 * RAZORPAY_KEY_SECRET=...
 * RAZORPAY_X_ACCOUNT_NUMBER=... (your RazorpayX current/virtual account number)
 *
 * Without those three variables set, isRazorpayConfigured() returns false and the caller
 * (bookingController.markPaid) records the payment as a DEMO payout instead of pretending
 * a real transfer happened. This is intentional — a hackathon demo should never claim money
 * moved when it didn't.
 */

const RAZORPAY_BASE = "https://api.razorpay.com/v1";

function isRazorpayConfigured() {
 return Boolean(
 process.env.RAZORPAY_KEY_ID &&
 process.env.RAZORPAY_KEY_SECRET &&
 process.env.RAZORPAY_X_ACCOUNT_NUMBER
 );
}

function authHeader() {
 const token = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString(
 "base64"
 );
 return { Authorization: `Basic ${token}`, "Content-Type": "application/json" };
}

async function rzCall(path, body) {
 const res = await fetch(`${RAZORPAY_BASE}${path}`, {
 method: "POST",
 headers: authHeader(),
 body: JSON.stringify(body),
 });
 const data = await res.json();
 if (!res.ok) {
 const message = data?.error?.description || `Razorpay request failed (${res.status})`;
 throw new Error(message);
 }
 return data;
}

/**
 * Sends `amount` (in rupees) to the farmer's bank account via RazorpayX.
 * Returns { payoutId, fundAccountId, status }.
 */
async function sendRealPayout({ farmerName, mobile, bankDetails, amount, referenceId, narration }) {
 // 1. Create (or reuse) a contact for the farmer
 const contact = await rzCall("/contacts", {
 name: farmerName,
 contact: mobile,
 type: "customer",
 reference_id: `farmer-${mobile}`,
 });

 // 2. Attach their bank account as a fund account
 const fundAccount = await rzCall("/fund_accounts", {
 contact_id: contact.id,
 account_type: "bank_account",
 bank_account: {
 name: bankDetails.accountHolderName,
 ifsc: bankDetails.ifsc,
 account_number: bankDetails.accountNumber,
 },
 });

 // 3. Trigger the payout
 const payout = await rzCall("/payouts", {
 account_number: process.env.RAZORPAY_X_ACCOUNT_NUMBER,
 fund_account_id: fundAccount.id,
 amount: Math.round(amount * 100), // paise
 currency: "INR",
 mode: "IMPS",
 purpose: "payout",
 queue_if_low_balance: true,
 reference_id: referenceId,
 narration: narration || "KrishiQueue procurement payment",
 });

 return { payoutId: payout.id, fundAccountId: fundAccount.id, status: payout.status };
}

module.exports = { isRazorpayConfigured, sendRealPayout };
