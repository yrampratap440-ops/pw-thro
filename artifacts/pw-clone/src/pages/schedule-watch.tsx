import { useEffect } from "react";
import { useWatchHistory } from "@/hooks/useWatchHistory";

// Vidcloud plays video directly in browser when accessed top-level.
// Simplest solution: redirect to vidcloud player. User can login there,
// watch, and use back button to return. No proxy/iframe complexity.

export default function ScheduleWatch() {
  const { addToHistory } = useWatchHistory();

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const batchId = sp.get("batchId") || "";
    const subjectId = sp.get("subjectId") || "";
    const scheduleId = sp.get("scheduleId") || "";
    const topicId = sp.get("topicId") || "";
    const title = sp.get("title") || sp.get("topic") || "Video";

    if (batchId && scheduleId) {
      // Record in watch history
      addToHistory({
        scheduleId, batchId, subjectId, title,
        watchedAt: Date.now(),
      });

      // Redirect to vidcloud player
      const playerUrl = `https://vidcloud.eu.org/play.php?${new URLSearchParams({
        batch_id: batchId,
        subject_id: subjectId,
        topic_id: topicId || scheduleId,
        video_id: scheduleId,
        video_name: title,
        video_type: "new",
        play_type: "Lecture",
      }).toString()}`;

      window.location.href = playerUrl;
    }
  }, []);

  // Show loading while redirect happens
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
