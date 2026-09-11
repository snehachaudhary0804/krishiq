let io = null;

function initSocket(server) {
  const { Server } = require("socket.io");
  io = new Server(server, {
    cors: { origin: "*", credentials: true },
  });

  io.on("connection", (socket) => {
    console.log("[Socket] Client connected:", socket.id);

    // 1. Operator manual alert broadcast
    socket.on("operator:call-farmer", (data) => {
      console.log(`[Socket] Broadcasting alert for ${data.token}`);
      const payload = {
        bookingId: data.bookingId,
        token: data.token,
        farmerName: data.farmerName || "Kisaan Bhai",
        desk: data.desk || "1",
        gate: data.gate || "2",
      };
      io.emit("farmer:turn-alert", payload);
      // Position aur status sabhi clients ke liye update karo
      io.emit("booking:updated", { action: "CALLED", token: data.token });
    });

    socket.on("disconnect", () => {
      console.log("[Socket] Client disconnected:", socket.id);
    });
  });

  return io;
}

function emitQueueUpdate(event, payload) {
  if (io) {
    io.emit(event, payload);
    console.log(`[Socket] Emitted event ${event}`);
  }
}

module.exports = { initSocket, emitQueueUpdate };