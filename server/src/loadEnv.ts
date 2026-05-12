import { config } from "dotenv";
import fs from "fs";
import path from "path";

/**
 * Monorepo: env often lives at repo root (`../.env`), while `npm run dev` cwd is `server/`.
 * Load root first, then `server/.env` so server-local values can override.
 */
const serverCwd = process.cwd();
const repoRootEnv = path.resolve(serverCwd, "..", ".env");
const serverEnv = path.resolve(serverCwd, ".env");

if (fs.existsSync(repoRootEnv)) {
  config({ path: repoRootEnv });
}
if (fs.existsSync(serverEnv)) {
  config({ path: serverEnv, override: true });
}
