"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { useInventory } from "@/components/inventory";
import { Button } from "@/components/ui/button";

declare global {
  interface Window {
    BarcodeDetector?: new () => {
      detect(source: ImageData): Promise<{ rawValue: string }[]>;
    };
  }
}

const WORKER_URL = "/scan/decoder-worker.js";

type DecodeRequest = { data: ArrayBuffer; width: number; height: number };
type DecodeResponse = { code?: string; error?: string };

/** Native detection is already off-thread in Chrome; only zxing needs the worker. */
function makeDecoder(hasNative: boolean) {
  if (hasNative) {
    const detector = new window.BarcodeDetector!();
    return {
      decode: async (frame: ImageData) => (await detector.detect(frame))[0]?.rawValue,
      dispose: () => {},
    };
  }

  const worker = new Worker(WORKER_URL);
  const decode = (frame: ImageData) =>
    new Promise<string | undefined>((resolve, reject) => {
      worker.onmessage = ({ data }: MessageEvent<DecodeResponse>) =>
        data.error ? reject(new Error(data.error)) : resolve(data.code);
      worker.onerror = (e) => reject(new Error(e.message || "decoder worker failed"));
      // Transfer rather than copy; a 1280x720 frame is 3.7 MB per attempt.
      const request: DecodeRequest = {
        data: frame.data.buffer as ArrayBuffer,
        width: frame.width,
        height: frame.height,
      };
      worker.postMessage(request, [request.data]);
    });
  return { decode, dispose: () => worker.terminate() };
}

export default function ScanPage() {
  const router = useRouter();
  const { resolveScan } = useInventory();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  // Read the capability without a setState-in-effect cascade; the server
  // snapshot is false so hydration matches on Safari and on Chrome alike.
  const hasNative = useSyncExternalStore(
    () => () => {},
    () => typeof window.BarcodeDetector === "function",
    () => false
  );

  useEffect(() => {
    let stopped = false;
    let stream: MediaStream | null = null;
    let dispose = () => {};

    (async () => {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      if (stopped) return stream.getTracks().forEach((t) => t.stop());

      const video = videoRef.current!;
      video.srcObject = stream;
      await video.play();
      if (stopped) return;

      const decoder = makeDecoder(hasNative);
      dispose = decoder.dispose;
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d", { willReadFrequently: true })!;

      while (!stopped) {
        if (video.readyState < 2) {
          await new Promise(requestAnimationFrame);
          continue;
        }
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        const code = await decoder.decode(ctx.getImageData(0, 0, canvas.width, canvas.height));
        if (stopped) return;
        if (code) {
          stopped = true;
          resolveScan(code);
          router.push("/");
          return;
        }
      }
    })().catch((e: unknown) => {
      setError(
        e instanceof DOMException && e.name === "NotAllowedError"
          ? "Camera access is blocked. Allow it in your browser's site settings."
          : e instanceof Error
            ? e.message
            : String(e)
      );
    });

    return () => {
      stopped = true;
      stream?.getTracks().forEach((t) => t.stop());
      dispose();
    };
    // hasNative is read once per mount; a mid-scan camera switch is very unlikely.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-4">
      <video
        ref={videoRef}
        muted
        playsInline
        className="aspect-[3/4] w-full max-w-sm rounded-xl bg-muted object-cover"
      />
      <p className="text-center text-sm text-pretty text-muted-foreground">
        {error ? error : "Point the camera at a barcode."}
      </p>
      <Button variant="outline" size="xl" onClick={() => router.push("/")}>
        <HugeiconsIcon icon={Cancel01Icon} />
        Cancel
      </Button>
    </div>
  );
}
