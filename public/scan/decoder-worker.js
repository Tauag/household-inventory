importScripts("/scan/vendor/3.1.4/zxing-reader.js");

const WASM_URL = "/scan/vendor/3.1.4/zxing_reader.wasm";

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
