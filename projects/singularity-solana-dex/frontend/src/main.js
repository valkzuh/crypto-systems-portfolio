import { Buffer } from "buffer";

// Polyfill Buffer globally
if (!globalThis.Buffer) {
  globalThis.Buffer = Buffer;
}

// Polyfill process globally
if (!globalThis.process) {
  globalThis.process = {
    env: {},
    version: "v18.0.0",
    browser: true,
  };
}

// Polyfill global if needed
if (typeof global === "undefined") {
  globalThis.global = globalThis;
}

// Note: TextEncoder/TextDecoder are already available in modern browsers
// The vite-plugin-node-polyfills handles other Node.js APIs

// Load the main application
import "../app.js";
