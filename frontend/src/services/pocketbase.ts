import PocketBase from "pocketbase";

// Vite proxies /api to the local PocketBase server (see vite.config.ts).
export const pb = new PocketBase(import.meta.env.VITE_PB_URL ?? "/");
