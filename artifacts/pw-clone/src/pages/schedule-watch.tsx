import { useEffect } from "react";
import { useWatchHistory } from "@/hooks/useWatchHistory";

// pwthor.live player works directly when accessed top-level in browser.
// Simple redirect approach - same as vidcloud worked before.

export default function ScheduleWatch() {
  const { addToHistory } = useWatchHistory();

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const batchId = sp.get("batchId") || "";
    const subjectId = sp.get("SubjectId") || "";
    const childId = sp.get("ChildId") || "";
    const title = sp.get("title") || "Video";

    if (batchId && childId) {
      addToHistory({
        scheduleId: childId,
        batchId,
        subjectId,
        title,
        watchedAt: Date.now(),
      });

      // Redirect to pwthor.live player (works top-level)
      const playerUrl = `https://pwthor.live/watch?batchId=${encodeURIComponent(batchId)}&SubjectId=${encodeURIComponent(subjectId)}&ChildId=${encodeURIComponent(childId)}&Type=penpencilvdo&title=${encodeURIComponent(title)}`;
      
      window.location.replace(playerUrl);
    }
  }, []);

  return (
    <div style={{
      position: "fixed", inset: 0, background: "#000",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "rgba(255,255,255,0.5)", fontSize: 14,
    }}>
      Opening video…
    </div>
  );
}
