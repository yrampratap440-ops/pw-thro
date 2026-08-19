import { useEffect, useRef, useState } from "react";
import { useWatchHistory } from "@/hooks/useWatchHistory";
import { ArrowLeft, AlertCircle } from "lucide-react";

// pwthor.live serves DRM-protected DASH streams via /api/get-video-url.
// We fetch the stream URL + clearKeys, then play via Shaka Player (DRM-capable).

declare global {
  interface Window {
    shaka: any;
  }
}

export default function ScheduleWatch() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { addToHistory } = useWatchHistory();

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const batchId = sp.get("batchId") || "";
    const subjectId = sp.get("SubjectId") || "";
    const childId = sp.get("ChildId") || "";
    const title = sp.get("title") || "Video";

    if (!batchId || !childId) {
      setError("Invalid video parameters");
      setLoading(false);
      return;
    }

    addToHistory({
      scheduleId: childId,
      batchId,
      subjectId,
      title,
      watchedAt: Date.now(),
    });

    initShaka(batchId, subjectId, childId, title);
  }, []);

  const initShaka = async (batchId: string, subjectId: string, childId: string, title: string) => {
    try {
      // Load Shaka Player library
      if (!window.shaka) {
        const script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/shaka-player/4.7.5/shaka-player.compiled.min.js";
        script.onload = () => playVideo(batchId, subjectId, childId);
        script.onerror = () => setError("Failed to load Shaka Player");
        document.head.appendChild(script);
      } else {
        playVideo(batchId, subjectId, childId);
      }
    } catch (err) {
      setError((err as Error).message || "Init failed");
      setLoading(false);
    }
  };

  const playVideo = async (batchId: string, subjectId: string, childId: string) => {
    try {
      // Fetch video URL + DRM keys via our backend proxy (bypasses CORS)
      const res = await fetch("/api/pwthor-video-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchId, SubjectId: subjectId, ChildId: childId }),
      });

      if (!res.ok) throw new Error(`Proxy returned ${res.status}`);

      const json = await res.json();
      const { url, clearKeys, pssh } = json.data || {};

      if (!url) throw new Error("No video URL in response");

      // Init Shaka
      const shaka = window.shaka;
      shaka.polyfill.installAll();

      if (!shaka.Player.isBrowserSupported()) {
        throw new Error("Shaka Player not supported in this browser");
      }

      const player = new shaka.Player(videoRef.current);
      player.addEventListener("error", (event: any) => {
        setError(`Playback error: ${event.detail.message}`);
      });

      // Configure DRM (clearKey if available)
      if (clearKeys && clearKeys.length > 0) {
        const keyObj = clearKeys[0].split(":"); // "kid:key" format
        player.configure({
          drm: {
            clearKeys: {
              [keyObj[0]]: keyObj[1],
            },
          },
        });
      }

      // Load and play
      await player.load(url);
      setLoading(false);
      videoRef.current?.play();
    } catch (err) {
      setError((err as Error).message || "Failed to load video");
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div style={{
        position: "fixed", inset: 0, background: "#000", display: "flex",
        flexDirection: "column", alignItems: "center", justifyContent: "center",
        color: "rgba(255,255,255,0.8)", gap: 16, padding: 16, textAlign: "center",
      }}>
        <AlertCircle size={48} style={{ color: "#ef4444" }} />
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Video Error</div>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginBottom: 16 }}>{error}</div>
          <button
            onClick={() => window.history.back()}
            style={{
              padding: "10px 24px", background: "rgba(255,255,255,0.1)", color: "#fff",
              border: "1px solid rgba(255,255,255,0.2)", borderRadius: 6, fontSize: 14, cursor: "pointer",
            }}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000" }}>
      <button
        onClick={() => window.history.back()}
        style={{
          position: "absolute", top: 10, left: 10, zIndex: 20,
          display: "flex", alignItems: "center", justifyContent: "center",
          width: 36, height: 36, background: "rgba(0,0,0,0.55)",
          border: "1px solid rgba(255,255,255,0.15)", borderRadius: "50%",
          color: "#fff", cursor: "pointer", backdropFilter: "blur(6px)",
        }}
        title="Back"
      >
        <ArrowLeft size={16} />
      </button>

      {loading && (
        <div style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center",
          justifyContent: "center", color: "rgba(255,255,255,0.5)", fontSize: 14,
        }}>
          Loading video…
        </div>
      )}

      <video
        ref={videoRef}
        controls
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
      />
    </div>
  );
}
