"use client";

import { useState } from "react";
import OverviewTab from "../tabs/OverviewTab";
import SetupTab from "../tabs/SetupTab";
import PlayerPoolTab from "../tabs/PlayerPoolTab";
import DraftBoardTab from "../tabs/DraftBoardTab";
import LiveControlTab from "../tabs/LiveControlTab";
import TeamsTab from "../tabs/TeamsTab";
import SessionsTab from "../tabs/SessionsTab";
import OutputsTab from "../tabs/OutputsTab";

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

const tabs = [
  "overview",
  "setup",
  "player-pool",
  "draft-board",
  "live-control",
  "teams",
  "sessions",
  "outputs",
] as const;

type TabKey = (typeof tabs)[number];

export default function DraftTabShell(props: {
  state: DraftState;
  sessions: DraftSessionRow[];
  seasonSlug: string;
  title: string;
  speed: number;
  loading: boolean;
  error: string;
  jumpPick: string;
  setSeasonSlug: (v: string) => void;
  setTitle: (v: string) => void;
  setSpeed: (v: number) => void;
  setJumpPick: (v: string) => void;
  prepareDraft: (mode: "new" | "resume") => Promise<void>;
  control: (action: "next" | "prev") => Promise<void>;
  toggleAuto: (nextAutoMode: boolean) => Promise<void>;
  jumpToPick: () => Promise<void>;
  reopenSession: (session: DraftSessionRow) => void;
}) {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto rounded-[28px] border border-white/10 bg-white/[0.03] p-3">
        <div className="flex min-w-max gap-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={
                  isActive
                    ? "rounded-2xl bg-[#A259FF] px-4 py-2 text-sm font-semibold text-white"
                    : "rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/70"
                }
              >
                {tab.replace("-", " ").replace(/\b\w/g, (m) => m.toUpperCase())}
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === "overview" && <OverviewTab {...props} />}
      {activeTab === "setup" && <SetupTab {...props} />}
      {activeTab === "player-pool" && <PlayerPoolTab {...props} />}
      {activeTab === "draft-board" && <DraftBoardTab {...props} />}
      {activeTab === "live-control" && <LiveControlTab {...props} />}
      {activeTab === "teams" && <TeamsTab {...props} />}
      {activeTab === "sessions" && <SessionsTab {...props} />}
      {activeTab === "outputs" && <OutputsTab {...props} />}
    </div>
  );
}
