import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// GitHub Pages serves the site from /<repo>/. The deploy workflow sets
// VITE_BASE=/doneenod.xyz/; local dev and custom domains use "/".
const base = process.env.VITE_BASE ?? "/";

export default defineConfig({
  base,
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    target: "es2022",
    cssTarget: "chrome110",
    // The renderer and trait engine are pure TS with no assets; the only
    // heavy third parties are gsap and the wallet stack.
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("gsap") || id.includes("lenis")) return "motion";
            if (
              id.includes("wagmi") ||
              id.includes("viem") ||
              id.includes("@tanstack") ||
              id.includes("@walletconnect") ||
              id.includes("@metamask") ||
              id.includes("ox")
            ) {
              return "wallet";
            }
            return "vendor";
          }
          return undefined;
        },
      },
    },
  },
});
