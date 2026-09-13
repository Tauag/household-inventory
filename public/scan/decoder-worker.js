// Classic worker, shipped prebuilt on purpose.
//
// Turbopack does not compile `new Worker(new URL("./x.ts", import.meta.url))`.
// It copies the file into static/media verbatim, so the browser fetches raw
// TypeScript and the worker dies on a SyntaxError. Loading zxing's IIFE build
// with importScripts sidesteps the bundler entirely.
// lazy: these are copies of node_modules files, so a zxing-wasm version bump
// needs a manual re-copy of both into a folder named for the new version, and
// the two paths here updated. Upgrade path is a postinstall step that copies
// them automatically. The version lives in the path because next.config.ts
// serves /scan/vendor/* as immutable, so a bump must change the URL to reach
// a phone that already cached the old one.
importScripts("/scan/vendor/3.1.4/zxing-reader.js");

const WASM_URL = "/scan/vendor/3.1.4/zxing_reader.wasm";

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
    // AllReadable, not EANUPC. Restricting to EAN/UPC hides Code 128, which
    // Amazon FNSKU labels use, and the ITF/2D codes on other packaging. Costs
    // decode time, which the worker absorbs.
    const [result] = await ZXingWASM.readBarcodes(image, {
      formats: ["AllReadable"],
      tryHarder: true,
    });
    self.postMessage(
      result && result.isValid ? { code: result.text, format: result.format } : {},
    );
  } catch (e) {
    self.postMessage({ error: e instanceof Error ? e.name + ": " + e.message : String(e) });
  }
};
