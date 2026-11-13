import PocketBase from "pocketbase";

// Vite proxies /api to the local PocketBase server (see vite.config.ts).
export const pb = new PocketBase('https://pb-api-autumn-river-9080.fly.dev');
