export function money(n) {
 return n == null ? "—" : `₹${Number(n).toLocaleString("en-IN")}`;
}

export function statusClass(status) {
 if (status === "CALLED") return "yellow";
 if (["COMPLETED", "PAID"].includes(status)) return "green";
 if (["REJECTED", "CANCELLED"].includes(status)) return "red";
 return "blue";
}

export function todayISO() {
 return new Date().toISOString().slice(0, 10);
}

