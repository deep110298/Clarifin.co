#!/usr/bin/env node
/**
 * Post-build script: compiles artifacts/api-server/src/app.ts with esbuild
 * into a self-contained bundle at artifacts/api-server/dist/app.mjs so that
 * the Vercel Lambda at artifacts/clarifin/api/index.js can import plain JS
 * instead of TypeScript (avoiding Vercel's strict tsc pass on the api-server).
 *
 * Run AFTER generate-html-module.mjs (which generates generated-index.ts).
 */
import { build as esbuild } from "esbuild";
import esbuildPluginPino from "esbuild-plugin-pino";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

// esbuild-plugin-pino uses require() internally
globalThis.require = createRequire(import.meta.url);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const apiServerDir = path.resolve(root, "artifacts/api-server");

await esbuild({
  entryPoints: [path.resolve(apiServerDir, "src/app.ts")],
  platform: "node",
  bundle: true,
  format: "esm",
  outfile: path.resolve(apiServerDir, "dist/app.mjs"),
  logLevel: "info",
  external: [
    "*.node",
    // native / platform-specific modules
    "sharp", "better-sqlite3", "sqlite3", "canvas", "bcrypt", "argon2",
    "fsevents", "re2", "farmhash", "xxhash-addon", "bufferutil",
    "utf-8-validate", "ssh2", "cpu-features", "dtrace-provider",
    "isolated-vm", "lightningcss", "pg-native", "oracledb",
    "mongodb-client-encryption", "nodemailer", "handlebars", "knex",
    "typeorm", "protobufjs", "onnxruntime-node",
    "@tensorflow/*", "@prisma/client", "@mikro-orm/*", "@grpc/*",
    "@swc/*", "@aws-sdk/*", "@azure/*", "@opentelemetry/*",
    "@google-cloud/*", "@google/*", "googleapis", "firebase-admin",
    "@parcel/watcher", "@sentry/profiling-node", "@tree-sitter/*",
    "aws-sdk", "classic-level", "dd-trace", "ffi-napi", "grpc",
    "hiredis", "kerberos", "leveldown", "miniflare", "mysql2",
    "newrelic", "odbc", "piscina", "realm", "ref-napi", "rocksdb",
    "sass-embedded", "sequelize", "serialport", "snappy", "tinypool",
    "usb", "workerd", "wrangler", "zeromq", "zeromq-prebuilt",
    "playwright", "puppeteer", "puppeteer-core", "electron",
  ],
  plugins: [esbuildPluginPino({ transports: ["pino-pretty"] })],
  banner: {
    js: `import { createRequire as __crReq } from 'node:module';
import __path from 'node:path';
import __url from 'node:url';
globalThis.require = __crReq(import.meta.url);
globalThis.__filename = __url.fileURLToPath(import.meta.url);
globalThis.__dirname = __path.dirname(globalThis.__filename);
`,
  },
});

console.log("✅  Built api-server Lambda bundle → artifacts/api-server/dist/app.mjs");
