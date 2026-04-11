import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { pool } from "@workspace/db";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

router.get("/healthz/db", async (_req, res) => {
  try {
    const result = await pool.query("SELECT 1 as ok");
    res.json({ db: "ok", row: result.rows[0] });
  } catch (err: unknown) {
    const e = err as Error;
    res.status(500).json({ db: "error", message: e.message, code: (e as NodeJS.ErrnoException).code });
  }
});

export default router;
