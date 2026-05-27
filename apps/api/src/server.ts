import cors from "cors";
import express from "express";
import http from "node:http";
import mongoose from "mongoose";
import { Server } from "socket.io";
import { env } from "./config/env.js";
import { GenerationQueue } from "./jobs/generationQueue.js";
import { AssignmentRepository } from "./repositories/assignmentRepository.js";
import { assignmentRoutes } from "./routes/assignments.js";
import { registerSocketHandlers } from "./socket/index.js";

async function bootstrap() {
  let useMongo = false;
  if (env.mongodbUri) {
    await mongoose.connect(env.mongodbUri);
    useMongo = true;
  }

  // without mongodb, use in-memory storage so reviewers can run it quickly.
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: env.clientUrl, credentials: true }
  });

  const repository = new AssignmentRepository(useMongo);
  const generationQueue = new GenerationQueue(repository, io);
  generationQueue.start();
  registerSocketHandlers(io);

  app.use(cors({ origin: env.clientUrl, credentials: true }));
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_req, res) => {
    res.json({
      ok: true,
      mongo: useMongo ? "connected" : "memory",
      queue: env.redisUrl ? "bullmq" : "memory"
    });
  });

  app.use("/api/assignments", assignmentRoutes(repository, generationQueue));

  server.listen(env.port, () => {
    console.log(`VedaAI API running on http://localhost:${env.port}`);
  });
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
