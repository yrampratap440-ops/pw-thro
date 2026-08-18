import { useEffect, useState } from "react";
import { useWatchHistory } from "@/hooks/useWatchHistory";
import { ArrowLeft, AlertCircle } from "lucide-react";

// vidcloud.eu.org uses custom blob-loading + nested iframes. Rather than
// redirect (which fails cross-domain) or iframe (which triggers nested-frame
// rejection from testwave.cc), we proxy via /api/vidcloud-stream to get the
// HLS/DASH stream URL, then play it in our own Shaka player.

export default function ScheduleWatch() {
  const [params, setParams] = useState({
    batchId: "", subjectId: "", scheduleId: "",
    title: "", thumbnail: "", topicId: "",
  });
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addToHistory } = useWatchHistory();

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const p = {
      batchId: sp.get("batchId") || "",
      subjectId: sp.get("subjectId") || "",
      scheduleId: sp.get("scheduleId") || "",
      title: sp.get("title") || sp.get("topic") || "Lecture Video",
      thumbnail: sp.get("thumbnail") || "",
      topicId: sp.get("topicId") || "",
    };
    setParams(p);

    if (p.batchId && p.scheduleId) {
      addToHistory({
        scheduleId: p.scheduleId, batchId: p.batchId, subjectId: p.subjectId,
        title: p.title, thumbnail: p.thumbnail || undefined, watchedAt: Date.now(),
      });
      fetchStream(p.batchId, p.subjectId, p.scheduleId, p.topicId);
    } else {
      setError("Invalid video parameters");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchStream = async (batchId: string, subjectId: string, videoId: string, topicId: string = "") => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/vidcloud-stream?batchId=${encodeURIComponent(batchId)}&subjectId=${encodeURIComponent(subjectId)}&videoId=${encodeURIComponent(videoId)}&topicId=${encodeURIComponent(topicId || videoId)}`
      );
      if (!res.ok) throw new Error(`Stream fetch failed (${res.status})`);
      const data = await res.json();
      if (data.url) {
        setStreamUrl(data.url);
      } else {
        throw new Error("No stream URL in response");
      }
    } catch (err) {
      setError((err as Error).message || "Failed to load video");
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    fetchStream(params.batchId, params.subjectId, params.scheduleId);
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
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Video Load Error</div>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginBottom: 16 }}>{error}</div>
          <button
            onClick={handleRetry}
            style={{
              padding: "10px 24px", background: "#3b82f6", color: "#fff",
              border: "none", borderRadius: 6, fontSize: 14, cursor: "pointer",
              marginRight: 8,
            }}
          >
            Retry
          </button>
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

  if (!streamUrl) {
    return (
      <div style={{
        position: "fixed", inset: 0, background: "#000", display: "flex",
        flexDirection: "column", alignItems: "center", justifyContent: "center",
        color: "rgba(255,255,255,0.5)",
      }}>
        <div style={{ fontSize: 14 }}>Loading video…</div>
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
      <video
        src={streamUrl}
        controls
        autoPlay
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
      />
    </div>
  );
}
