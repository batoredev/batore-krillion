// Loads .env.local for command-line scripts (Next.js does this itself for the app).
import { existsSync } from "fs";
if (existsSync(".env.local")) process.loadEnvFile(".env.local");
