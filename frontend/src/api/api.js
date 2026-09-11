// In local dev, Vite proxies "/api" to http://localhost:5000 (see vite.config.js).
// In production, the frontend and backend are on different domains (e.g. Vercel + Render),
// so set VITE_API_URL to the deployed backend's full URL, e.g. https://krishiqueue-backend.onrender.com/api
const BASE = import.meta.env.VITE_API_URL || "/api";

function getToken() {
  return localStorage.getItem("kq_token");
}

async function request(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch (_) {
    /* no body */
  }

  if (!res.ok) {
    const message = data?.message || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data;
}

export const api = {
  parseVoiceBooking: (transcript) =>
    request("/bookings/voice-parse", {
      method: "POST",
      body: { transcript },
    }),

  farmerRegister: (data) =>
    request("/auth/farmer/register", {
      method: "POST",
      body: data,
      auth: false,
    }),

  farmerLoginDirect: (data) =>
    request("/auth/farmer/login-direct", {
      method: "POST",
      body: data,
      auth: false,
    }),
  // auth - farmer (OTP based)
  requestFarmerOtp: (payload) =>
    request("/auth/farmer/request-otp", {
      method: "POST",
      body: payload,
      auth: false,
    }),
  verifyFarmerOtp: (payload) =>
    request("/auth/farmer/verify-otp", {
      method: "POST",
      body: payload,
      auth: false,
    }),

  // auth - staff
  staffLogin: (payload) => request("/auth/staff-login", { method: "POST", body: payload, auth: false }),
  staffRegister: (payload) => request("/auth/staff-register", { method: "POST", body: payload, auth: false }),
  me: () => request("/auth/me"),
  saveBankDetails: (payload) => request("/auth/bank-details", { method: "PUT", body: payload }),

  // centres
  getCentres: () => request("/centres"),
  getPublicCentres: () =>
  request("/centres/public", { auth: false }),
  getNearbyCentres: (lat, lng) => request(`/centres/nearby?lat=${lat}&lng=${lng}`),
  createCentre: (payload) => request("/centres", { method: "POST", body: payload }),
  updateCentre: (id, payload) => request(`/centres/${id}`, { method: "PUT", body: payload }),
  deleteCentre: (id) => request(`/centres/${id}`, { method: "DELETE" }),
  getOperators: () => request("/centres/operators"),
  assignOperator: (centreId, operatorId) =>
    request(`/centres/${centreId}/operator`, {
      method: "PATCH",
      body: { operatorId: operatorId || null },
    }),

  // crops
  getCrops: () => request("/crops"),
  createCrop: (payload) => request("/crops", { method: "POST", body: payload }),
  deleteCrop: (id) => request(`/crops/${id}`, { method: "DELETE" }),

  // bookings
  getSlots: (centreId, date) => request(`/bookings/slots?centreId=${centreId}&date=${date}`),
  createBooking: (payload) => request("/bookings", { method: "POST", body: payload }),
  getMyBookings: () => request("/bookings/mine"),
  getActiveBookings: () => request("/bookings/active"),
  getAllBookings: (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    const query = params.toString();
    return request(`/bookings${query ? `?${query}` : ""}`);
  },
  callNext: () => request("/bookings/call-next", { method: "PATCH" }),
  checkInByToken: (token) => request("/bookings/check-in", { method: "PATCH", body: { token } }),
  callToken: (id) => request(`/bookings/${id}/call`, { method: "PATCH" }),
  startService: (id) => request(`/bookings/${id}/start-service`, { method: "PATCH" }),
  processBooking: (id, payload) => request(`/bookings/${id}/process`, { method: "PATCH", body: payload }),
  markPaid: (id) => request(`/bookings/${id}/pay`, { method: "PATCH" }),
  updatePaymentStatus: (id, status) =>
    request(`/bookings/${id}/payment-status`, { method: "PATCH", body: { status } }),
  refreshQueue: (id) => request(`/bookings/${id}/refresh`, { method: "PATCH" }),
  getCurrentToken: () => request("/bookings/current"),

  // payouts, notifications, audit, analytics
  getPayouts: () => request("/payouts"),
  getMyNotifications: () => request("/notifications/mine"),
  getAudit: () => request("/audit"),
  getMyAudit: () => request("/audit/mine"),
  getAnalytics: () => request("/analytics/summary"),
};

export { getToken };

