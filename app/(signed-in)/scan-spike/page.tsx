"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { emptyTrial, recordFrame, summarize, type Trial } from "@/lib/scan-stats";

// lazy: BarcodeDetector is not in TS's DOM lib. Only the two members we call.
declare global {
  interface Window {
    BarcodeDetector?: new (options?: { formats?: string[] }) => {
      detect(source: ImageData): Promise<{ rawValue: string }[]>;
    };
  }
}

type Engine = "native" | "wasm";
type Decode = (frame: ImageData) => Promise<string | undefined>;

async function makeDecoder(engine: Engine): Promise<Decode> {
  if (engine === "native") {
    const detector = new window.BarcodeDetector!({
      formats: ["ean_13", "ean_8", "upc_a", "upc_e"],
    });
    return async (frame) => (await detector.detect(frame))[0]?.rawValue;
  }

  const { prepareZXingModule, readBarcodes } = await import("zxing-wasm/reader");
  // Serve the 931 KB wasm ourselves; the default is a jsDelivr URL, which would
  // put CDN latency into the decode timings this spike exists to measure.
  await prepareZXingModule({
    overrides: { locateFile: () => "/zxing_reader.wasm" },
    fireImmediately: true,
  });
  return async (frame) => {
    const [result] = await readBarcodes(frame, { formats: ["EANUPC"], tryHarder: true });
    return result?.isValid ? result.text : undefined;
  };
}

export default function ScanSpikePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [engineOverride, setEngineOverride] = useState<Engine | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trial, setTrial] = useState<Trial>(emptyTrial);
  const [label, setLabel] = useState("");
  const [log, setLog] = useState<object[]>([]);

  // Read the capability without a setState-in-effect cascade; the server snapshot
  // is false so hydration matches on Safari and on Chrome alike.
  const hasNative = useSyncExternalStore(
    () => () => {},
    () => typeof window.BarcodeDetector === "function",
    () => false,
  );
  const engine: Engine = engineOverride ?? (hasNative ? "native" : "wasm");

  useEffect(() => {
    if (!running) return;
    let stopped = false;

    (async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      if (stopped) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      const video = videoRef.current!;
      video.srcObject = stream;
      await video.play();

      const decode = await makeDecoder(engine);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
      const startedAt = performance.now();

      while (!stopped) {
        if (video.readyState < 2) {
          await new Promise(requestAnimationFrame);
          continue;
        }
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);

        const t0 = performance.now();
        const code = await decode(frame);
        const decodeMs = performance.now() - t0;
        if (stopped) break;
        setTrial((t) => recordFrame(t, { elapsedMs: t0 - startedAt, decodeMs, code }));
      }
    })().catch((e: unknown) => {
      setError(e instanceof Error ? `${e.name}: ${e.message}` : String(e));
      setRunning(false);
    });

    return () => {
      stopped = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [running, engine]);

  const stats = summarize(trial);

  function logTrial() {
    setLog((l) => [...l, { label: label || `trial ${l.length + 1}`, engine, ...stats }]);
    setTrial(emptyTrial());
    setLabel("");
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-3 p-4">
      <h1 className="text-lg font-medium">Barcode decode spike</h1>

      <video
        ref={videoRef}
        muted
        playsInline
        className="aspect-[3/4] w-full rounded-lg bg-muted object-cover"
      />

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex gap-2">
        <Button
          onClick={() => {
            setTrial(emptyTrial());
            setRunning((r) => !r);
          }}
          className="flex-1"
        >
          {running ? "Stop" : "Start camera"}
        </Button>
        {hasNative ? (
          <Button
            variant="outline"
            onClick={() => {
              setTrial(emptyTrial());
              setEngineOverride(engine === "native" ? "wasm" : "native");
            }}
          >
            {engine === "native" ? "BarcodeDetector" : "zxing-wasm"}
          </Button>
        ) : (
          <Button variant="outline" disabled>
            zxing-wasm only
          </Button>
        )}
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 rounded-lg border p-3 text-sm tabular-nums">
        <dt className="text-muted-foreground">Frames</dt>
        <dd className="text-right">{stats.frames}</dd>
        <dt className="text-muted-foreground">Decoded</dt>
        <dd className="text-right">
          {stats.hits} ({Math.round(stats.hitRate * 100)}%)
        </dd>
        <dt className="text-muted-foreground">First hit</dt>
        <dd className="text-right">
          {stats.firstHitMs === null ? "none" : `${Math.round(stats.firstHitMs)} ms`}
        </dd>
        <dt className="text-muted-foreground">Median decode</dt>
        <dd className="text-right">
          {stats.medianDecodeMs === null ? "-" : `${Math.round(stats.medianDecodeMs)} ms`}
        </dd>
        {Object.entries(stats.codes).map(([code, count]) => (
          <div key={code} className="col-span-2 flex justify-between">
            <span className="font-mono text-xs">{code}</span>
            <span>{count}</span>
          </div>
        ))}
      </dl>

      <div className="flex gap-2">
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="bottle, lighting"
        />
        <Button variant="outline" onClick={logTrial} disabled={stats.frames === 0}>
          Log trial
        </Button>
      </div>

      {log.length > 0 ? (
        <>
          <pre className="overflow-x-auto rounded-lg border p-3 text-xs">
            {JSON.stringify(log, null, 2)}
          </pre>
          <Button variant="ghost" onClick={() => navigator.clipboard.writeText(JSON.stringify(log, null, 2))}>
            Copy results
          </Button>
        </>
      ) : null}
    </div>
  );
}
