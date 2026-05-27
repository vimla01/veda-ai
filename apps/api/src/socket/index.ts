import type { Server } from "socket.io";

export function registerSocketHandlers(io: Server) {
  io.on("connection", (socket) => {
    socket.on("assignment:join", (assignmentId: string) => {
      socket.join(assignmentId);
    });

    socket.on("assignment:leave", (assignmentId: string) => {
      socket.leave(assignmentId);
    });
  });
}

