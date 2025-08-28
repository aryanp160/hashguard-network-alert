import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          // Using a dynamic import for cartographer as it's conditionally loaded
          // and might not be available in all environments during initial parsing.
          // This ensures the promise resolves before being added to plugins.
          (async () => {
            const m = await import("@replit/vite-plugin-cartographer");
            return m.cartographer();
          })(),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
    },
  },
  // The 'root' specifies the base directory for resolving entry points.
  // It is correctly set to the project root (where vite.config.ts is located).
  root: path.resolve(import.meta.dirname, "."),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist"), // Output to dist directly from project root
    emptyOutDir: true,
    rollupOptions: {
      input: {
        // Now, paths are directly relative to the project root,
        // as index.html and popup.html have been moved there.
        main: path.resolve(import.meta.dirname, 'index.html'), // Changed from 'public/index.html'
        popup: path.resolve(import.meta.dirname, 'popup.html'), // Changed from 'public/popup.html'
      },
      output: {
        manualChunks: undefined,
      },
    },
  },
  // Ensure proper base URL for Vercel deployment
  base: "/",
});
