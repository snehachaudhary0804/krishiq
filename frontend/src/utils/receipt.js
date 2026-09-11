import jsPDF from "jspdf";

export function downloadReceipt(booking) {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("KrishiQueue - Procurement Receipt", 14, 20);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Farmer Procurement Queue Management System", 14, 27);
  doc.line(14, 31, 196, 31);

  const rows = [
    ["Token", booking.token],
    ["Farmer Name", booking.farmerName],
    ["Mobile", booking.mobile],
    ["Centre", booking.centre?.name || "-"],
    ["Crop", booking.crop],
    ["Date", booking.date],
    ["Slot", booking.slot],
    ["Gross Weight", booking.grossWeight ? `${booking.grossWeight} kg` : "-"],
    ["Tare Weight", booking.tareWeight ? `${booking.tareWeight} kg` : "-"],
    ["Net Weight", booking.weight ? `${booking.weight} kg` : "-"],
    ["Quality Grade", booking.quality || "-"],
    ["Moisture", booking.moisture ? `${booking.moisture}%` : "-"],
    ["Lot Number", booking.lot || "-"],
    ["Amount", booking.amount ? `Rs. ${Number(booking.amount).toLocaleString("en-IN")}` : "-"],
    ["Payment Status", booking.payment || "-"],
    ["Status", booking.status],
  ];

  let y = 42;
  doc.setFontSize(11);
  rows.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold");
    doc.text(`${label}:`, 14, y);
    doc.setFont("helvetica", "normal");
    doc.text(String(value), 70, y);
    y += 8;
  });

  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`Generated on ${new Date().toLocaleString("en-IN")}`, 14, y + 6);
  doc.text("This is a system-generated receipt from KrishiQueue.", 14, y + 12);

  doc.save(`KrishiQueue_Receipt_${booking.token}.pdf`);
}
