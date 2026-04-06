"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import DraftTabShell from "./components/DraftTabShell";

type DraftState = {
  session: any | null;
  picks: any[];
  currentPick: any | null;
  nextPick: any | null;
  revealedPicks: any[];
};

type DraftSessionRow = {
  draft_session_id: string;
  title: string;
  status: string;
  current_pick_number: number;
  total_picks: number;
  auto_mode: boolean;
  auto_interval_seconds: number;
  season_name: string;
  season_slug: string;
  created_at: string;
};

const defaultState: DraftState = {
  session: null,
  picks: [],
  currentPick: null,
  nextPick: null,
  revealedPicks: [],
};

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  return (
    tag === "input" ||
    tag === "textarea" ||
    tag === "select" ||
    target.isContentEditable
  );
}

export default function DraftHostConsole() {
  const [state, setState] = useState<DraftState>(defaultState);
  const [sessions, setSessions] = useState<DraftSessionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [speed, setSpeed] = useState(12);
  const [seasonSlug, setSeasonSlug] = useState("season-1");
  const [title, setTitle] = useState("Season 1 Draft Night");
  const [error, setError] = useState("");
  const [jumpPick, setJumpPick] = useState("");

  const hasInitializedSpeed = useRef(false);
  const userChangedSpeed = useRef(false);

  async function loadState() {
    const res = await fetch(`/api/epl/draft/state?seasonSlug=${seasonSlug}`, {
      cache: "no-store",
    });
    const json = await res.json();
    setState(json);

    const serverSpeed = json?.session?.auto_interval_seconds;

    if (!hasInitializedSpeed.current && serverSpeed) {
      setSpeed(serverSpeed);
      hasInitializedSpeed.current = true;
    }

    if (!userChangedSpeed.current && json?.session?.auto_mode && serverSpeed) {
      setSpeed(serverSpeed);
    }
  }

  async function loadSessions() {
    const res = await fetch("/api/epl/draft/sessions", { cache: "no-store" });
    const json = await res.json();
    setSessions(json?.sessions || []);
  }

  useEffect(() => {
    hasInitializedSpeed.current = false;
    userChangedSpeed.current = false;
    loadState();
    loadSessions();

    const poll = setInterval(() => {
      loadState();
      loadSessions();
    }, 1200);

    return () => clearInterval(poll);
  }, [seasonSlug]);

  useEffect(() => {
    async function onKeyDown(e: KeyboardEvent) {
      if (!state.session) return;
      if (isTypingTarget(e.target)) return;

      if (e.key === "ArrowRight") {
        e.preventDefault();
        await control("next");
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        await control("prev");
      } else if (e.code === "Space") {
        e.preventDefault();
        await toggleAuto(!state.session?.auto_mode);
      }
    }

    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", onKeyDown, { capture: true });
  }, [state.session, speed]);

  useEffect(() => {
    if (!state.session?.auto_mode) return;

    const timer = setInterval(async () => {
      await fetch("/api/epl/draft/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: state.session.draft_session_id,
          action: "next",
        }),
      });
      await loadState();
      await loadSessions();
    }, (state.session.auto_interval_seconds || speed) * 1000);

    return () => clearInterval(timer);
  }, [
    state.session?.auto_mode,
    state.session?.draft_session_id,
    state.session?.auto_interval_seconds,
    speed,
  ]);

  async function prepareDraft(mode: "new" | "resume") {
    setLoading(true);
    setError("");

    if (mode === "new") {
      const confirmed = window.confirm(
        `Create a brand new draft for ${seasonSlug}? This will reset the current draft for that season.`
      );
      if (!confirmed) {
        setLoading(false);
        return;
      }
    }

    const res = await fetch("/api/epl/draft/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        seasonSlug,
        title,
        snakeMode: true,
        autoIntervalSeconds: speed,
        mode,
      }),
    });

    const json = await res.json();

    if (!res.ok) {
      setError(json.error || "Draft preparation failed.");
      setLoading(false);
      return;
    }

    userChangedSpeed.current = false;
    await loadState();
    await loadSessions();
    setLoading(false);
  }

  async function control(action: "next" | "prev") {
    if (!state.session) return;
    await fetch("/api/epl/draft/control", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: state.session.draft_session_id,
        action,
      }),
    });
    await loadState();
    await loadSessions();
  }

  async function toggleAuto(nextAutoMode: boolean) {
    if (!state.session) return;
    await fetch("/api/epl/draft/control", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: state.session.draft_session_id,
        action: "auto",
        autoMode: nextAutoMode,
        autoIntervalSeconds: speed,
      }),
    });

    userChangedSpeed.current = false;
    await loadState();
    await loadSessions();
  }

  async function jumpToPick() {
    if (!state.session || !jumpPick) return;
    await fetch("/api/epl/draft/control", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: state.session.draft_session_id,
        action: "jump",
        pickNumber: Number(jumpPick),
      }),
    });
    await loadState();
    await loadSessions();
  }

  function reopenSession(session: DraftSessionRow) {
    setSeasonSlug(session.season_slug);
    setTitle(session.title);
    setSpeed(session.auto_interval_seconds || 12);
    hasInitializedSpeed.current = true;
    userChangedSpeed.current = false;
  }

  const progress = useMemo(() => {
    if (!state.session) return 0;
    if (!state.session.total_picks) return 0;
    return Math.round((state.session.current_pick_number / state.session.total_picks) * 100);
  }, [state.session]);

  return (
    <DraftTabShell
      state={state}
      sessions={sessions}
      seasonSlug={seasonSlug}
      title={title}
      speed={speed}
      loading={loading}
      error={error}
      jumpPick={jumpPick}
      setSeasonSlug={setSeasonSlug}
      setTitle={setTitle}
      setSpeed={setSpeed}
      setJumpPick={setJumpPick}
      prepareDraft={prepareDraft}
      control={control}
      toggleAuto={toggleAuto}
      jumpToPick={jumpToPick}
      reopenSession={reopenSession}
    />
  );
}
