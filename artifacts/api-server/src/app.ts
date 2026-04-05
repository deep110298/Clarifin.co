import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "path";
import { fileURLToPath } from "url";
import router from "./routes";
import { logger } from "./lib/logger";
import { clerkMiddleware } from "./middleware/auth";
import { indexHtml } from "./generated-index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app: Express = express();

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
app.use(cors());
app.use(clerkMiddleware());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// Serve frontend static files
if (process.env.VERCEL) {
  // On Vercel the Lambda handles ALL requests (LAMBDAS deployment type).
  // Serve the SPA shell (index.html) for every non-API, non-asset GET request
  // so that React-Router / wouter deep links work correctly.
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
