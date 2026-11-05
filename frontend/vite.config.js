import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
  root: fileURLToPath(new URL("./src", import.meta.url)),
  server: {
    proxy: {
      "/api": "http://localhost:3000",
    },
  },
});
