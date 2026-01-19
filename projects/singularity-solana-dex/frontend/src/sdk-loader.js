/**
 * SDK Loader - Handles loading Solana Web3.js and Drift SDK from CDN
 * Note: Local installation not supported on Windows due to platform-specific dependencies
 */

let cachedSdk = null;

async function tryImport(urls) {
  let lastError = null;
  for (const url of urls) {
    try {
      console.log(`[SDK] Trying: ${url}`);
      const module = await import(/* @vite-ignore */ url);
      console.log(`[SDK] ✓ Loaded: ${url}`);
      return module;
    } catch (err) {
      console.warn(`[SDK] ✗ Failed: ${url} - ${err.message}`);
      lastError = err;
    }
  }
  throw lastError || new Error("All import sources failed");
}

export async function loadSdk() {
  if (cachedSdk) {
    console.log("[SDK] Returning cached SDK");
    return cachedSdk;
  }

  console.log("[SDK] Loading SDK from CDN sources...");

  try {
    // Load both SDKs in parallel with multiple fallback options
    const [web3Module, driftModule] = await Promise.all([
      // Solana Web3.js - try multiple CDN sources
      tryImport([
        // esm.sh with explicit deps and no bundling (preferred)
        "https://esm.sh/@solana/web3.js@1.95.8?target=es2022",
        // UNPKG ESM version
        "https://unpkg.com/@solana/web3.js@1.95.8?module",
        // jsDelivr ESM
        "https://cdn.jsdelivr.net/npm/@solana/web3.js@1.95.8/+esm",
      ]),
      // Drift SDK - needs web3.js as peer dependency
      tryImport([
        // esm.sh with explicit web3.js dependency
        "https://esm.sh/@drift-labs/sdk@2.131.1?deps=@solana/web3.js@1.95.8&target=es2022&external=@solana/web3.js",
        // jsDelivr ESM
        "https://cdn.jsdelivr.net/npm/@drift-labs/sdk@2.131.1/+esm",
        // Skypack (optimized for browsers)
        "https://cdn.skypack.dev/@drift-labs/sdk@2.131.1",
      ]),
    ]);

    // Merge exports from both modules
    cachedSdk = { ...web3Module, ...driftModule };

    console.log("[SDK] ✓ SDK loaded successfully!");
    console.log("[SDK] Web3.js exports sample:", Object.keys(web3Module).slice(0, 10).join(", "));
    console.log("[SDK] Drift SDK exports sample:", Object.keys(driftModule).slice(0, 10).join(", "));

    // Verify critical classes exist
    const criticalExports = ["Connection", "PublicKey", "Keypair", "DriftClient", "Wallet"];
    const missing = criticalExports.filter((exp) => !cachedSdk[exp]);
    if (missing.length > 0) {
      throw new Error(`Missing critical exports: ${missing.join(", ")}`);
    }

    console.log("[SDK] All critical exports verified");
    return cachedSdk;
  } catch (err) {
    console.error("[SDK] ✗ Critical failure loading SDK:", err);
    console.error("[SDK] Error details:", err.message, err.stack);
    throw new Error(`Failed to load SDK: ${err.message}`);
  }
}
