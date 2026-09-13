// Classic worker, shipped prebuilt on purpose.
//
// Turbopack does not compile `new Worker(new URL("./x.ts", import.meta.url))`.
// It copies the file into static/media verbatim, so the browser fetches raw
// TypeScript and the worker dies on a SyntaxError. Loading zxing's IIFE build
// with importScripts sidesteps the bundler entirely.
// lazy: zxing-reader.js and zxing_reader.wasm are copies of node_modules files,
// so a zxing-wasm version bump needs a manual re-copy of both. If the spike
// graduates, replace the copies with a postinstall step.
importScripts("/scan/zxing-reader.js");

const WASM_URL = "/scan/zxing_reader.wasm";

// Emscripten answers a bad wasm response by calling abort(), which throws
// outside any promise chain we can catch. Fetch the bytes first so a miss is
// an ordinary error we can report back to the page.
async function init() {
  const response = await fetch(WASM_URL);
  const contentType = response.headers.get("content-type") || "none";
  if (!response.ok || !contentType.includes("wasm")) {
    throw new Error(WASM_URL + " returned " + response.status + ", content-type " + contentType);
  }
  return ZXingWASM.prepareZXingModule({
    overrides: { wasmBinary: await response.arrayBuffer() },
    fireImmediately: true,
  });
}

let ready = null;

self.onmessage = async ({ data: { data, width, height } }) => {
  try {
    ready = ready || init();
    await ready;
    const image = new ImageData(new Uint8ClampedArray(data), width, height);
    const [result] = await ZXingWASM.readBarcodes(image, {
      formats: ["EANUPC"],
      tryHarder: true,
    });
    self.postMessage({ code: result && result.isValid ? result.text : undefined });
  } catch (e) {
    self.postMessage({ error: e instanceof Error ? e.name + ": " + e.message : String(e) });
  }
};
