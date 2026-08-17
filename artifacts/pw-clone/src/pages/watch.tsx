import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { AkpPlayer } from "@/components/AkpPlayer";

export default function Watch() {
  const [params, setParams] = useState<{
    batchId: string;
    subjectId: string;
    childId: string;
    title: string;
  } | null>(null);

  const backUrlRef = useRef("/");
  const [, navigate] = useLocation();

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);

    // URLSearchParams is case-sensitive, so support both
    // lowercase and the capitalized parameter names used by some links.
    const batchId =
      sp.get("batchId") ||
      sp.get("BatchId") ||
      "";

    const subjectId =
      sp.get("subjectId") ||
      sp.get("SubjectId") ||
      "";

    const topicId =
      sp.get("topicId") ||
      sp.get("TopicId") ||
      "";

    const childId =
      sp.get("childId") ||
      sp.get("ChildId") ||
      sp.get("videoId") ||
      sp.get("VideoId") ||
      sp.get("ContentId") ||
      "";

    const title =
      sp.get("title") ||
      sp.get("Title") ||
      "";

    // Build the URL used by the player's Back button.
    const backUrl = sp.get("backUrl");

    if (backUrl) {
      backUrlRef.current = backUrl;
    } else if (batchId && subjectId && topicId) {
      backUrlRef.current =
        `/batch/${batchId}/subject/${subjectId}/topic/${topicId}`;
    } else if (batchId && subjectId) {
      backUrlRef.current =
        `/batch/${batchId}/subject/${subjectId}`;
    } else if (batchId) {
      backUrlRef.current =
        `/batch/${batchId}`;
    } else {
      backUrlRef.current = "/";
    }

    // Debug information — useful for checking the actual URL parameters.
    console.log("[Watch] Video parameters:", {
      batchId,
      subjectId,
      topicId,
      childId,
      title,
      backUrl: backUrlRef.current,
    });

    if (batchId && childId) {
      setParams({
        batchId,
        subjectId,
        childId,
        title,
      });
    } else {
      console.warn("[Watch] Missing video parameters:", {
        batchId,
        childId,
      });
      setParams(null);
    }
  }, []);

  // Handle browser/device Back navigation.
  useEffect(() => {
    const onPopState = () => {
      navigate(backUrlRef.current);
    };

    window.addEventListener("popstate", onPopState);

    return () => {
      window.removeEventListener("popstate", onPopState);
    };
  }, [navigate]);

  if (!params) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "#000",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            color: "rgba(255,255,255,0.4)",
            fontSize: 14,
            textAlign: "center",
            padding: 20,
          }}
        >
          Missing video parameters
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#000",
      }}
    >
      <AkpPlayer
        batchId={params.batchId}
        subjectId={params.subjectId}
        scheduleId={params.childId}
        childId={params.childId}
        title={params.title}
      />
    </div>
  );
}
