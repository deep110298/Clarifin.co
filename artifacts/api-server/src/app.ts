import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import path from "path";
import { fileURLToPath } from "url";
import router from "./routes";
import { logger } from "./lib/logger";
import { indexHtml } from "./generated-index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === "production" || !!process.env.VERCEL;

const app: Express = express();

// Security headers
app.use(helmet({
  contentSecurityPolicy: false, // Managed by Vercel/CDN for the SPA
  crossOriginEmbedderPolicy: false,
}));

// CORS — only allow the deployed frontend origin
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(express.json({ limit: "1mb" })); // Prevent excessively large payloads
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.use("/api", router);

// Global error handler — never expose stack traces in production
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err }, "Unhandled error");
  res.status(500).json({
    error: isProd ? "Internal server error" : err.message,
    ...(isProd ? {} : { stack: err.stack?.split("\n").slice(0, 5).join(" | ") }),
  });
});

// Serve frontend static files
if (process.env.VERCEL) {
  app.get("/{*path}", (_req, res) => {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(indexHtml);
  });
} else {
  const frontendDist = path.resolve(__dirname, "../../clarifin/dist/public");
  app.use(express.static(frontendDist));
  app.get("/{*path}", (_req, res) => {
    res.sendFile(path.join(frontendDist, "index.html"));
  });
}

export default app;
