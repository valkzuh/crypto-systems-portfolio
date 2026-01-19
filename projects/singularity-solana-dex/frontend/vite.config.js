import { defineConfig } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    nodePolyfills({
      globals: {
        Buffer: true,
        process: true,
      },
      // Enable all necessary polyfills for Solana/Drift SDK
      protocolImports: true,
    }),
  ],
  define: {
    "process.env": {},
    global: "globalThis",
  },
  optimizeDeps: {
    include: ["buffer"],
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
    },
  },
  resolve: {
    mainFields: ["browser", "module", "main"],
    alias: {
      // Ensure proper resolution of Node.js modules
      stream: "stream-browserify",
      crypto: "crypto-browserify",
      util: "util",
      "node:util/types": "util",
      // Fix rpc-websockets v7.5.1 internal imports - use absolute paths
      "rpc-websockets/dist/lib/client$": path.resolve(__dirname, "node_modules/rpc-websockets/dist/lib/client.js"),
      "rpc-websockets/dist/lib/client/websocket.browser": path.resolve(__dirname, "node_modules/rpc-websockets/dist/lib/client/websocket.browser.js"),
    },
  },
  server: {
    host: true,
    port: 5173,
    strictPort: true,
  },
  build: {
    target: "es2020",
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
});
