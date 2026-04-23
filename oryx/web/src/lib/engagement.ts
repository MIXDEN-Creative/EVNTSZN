import { ensurePlatformProfile } from "@/lib/evntszn";
import { buildActivitySourceMetadata, normalizeActivitySource } from "@/lib/activity-source";
import { getSupabaseRuntimeConfig } from "@/lib/runtime-env";
import { supabaseAdmin } from "@/lib/supabase-admin";

export type EngagementEventType =
  | "discover_view"
  | "discovery_lane_explored"
  | "saved_item"
  | "city_explored"
  | "night_plan_created"
  | "profile_completed"
  | "pulse_posted"
  | "pulse_view"
  | "reserve_requested"
  | "reserve_waitlist_joined"
  | "reserve_view"
  | "crew_requested"
  | "crew_view"
  | "epl_followed"
  | "epl_view"
  | "sponsor_perk_viewed"
  | "stayops_intake_submitted"
  | "stayops_view";

export type EngagementFrequency = "daily" | "weekly" | "one_time";

export type EngagementMission = {
  missionKey: string;
  title: string;
  description: string;
  category: string;
  frequency: EngagementFrequency;
  actionKey: EngagementEventType;
  targetCount: number;
  xpReward: number;
  badgeRewardKey: string | null;
  sortOrder: number;
  metadata?: Record<string, unknown>;
};

export type EngagementRun = {
  runKey: string;
  title: string;
  description: string;
  category: string;
  frequency: "daily" | "weekly";
  targetSteps: number;
  xpReward: number;
  badgeRewardKey: string | null;
  nextRunKey: string | null;
  actionKeys: EngagementEventType[];
  metadata?: Record<string, unknown>;
};

export type EngagementCollection = {
  collectionKey: string;
  title: string;
  description: string;
  category: string;
  targetCount: number;
  xpReward: number;
  badgeRewardKey: string | null;
  metadata?: Record<string, unknown>;
};

export type EngagementBadge = {
  badgeKey: string;
  badgeLabel: string;
  badgeDescription: string;
  tone: "city" | "trust" | "league" | "crew" | "perks" | "ops";
  awardedAt?: string;
};

export type SurpriseReward = {
  title: string;
  detail: string;
  bonusXp: number;
  rewardType: "bonus_xp" | "streak_multiplier" | "hidden_badge" | "perk_unlocked" | "visibility_boost";
  revealedAt: string;
};

export type EngagementMissionProgress = {
  missionKey: string;
  title: string;
  description: string;
  category: string;
  frequency: EngagementFrequency;
  progressCount: number;
  targetCount: number;
  completed: boolean;
  completedAt: string | null;
  xpReward: number;
  completionRatio: number;
  windowLabel: string | null;
  timeLeftLabel: string | null;
};

export type EngagementRunProgress = {
  runKey: string;
  title: string;
  description: string;
  category: string;
  progressCount: number;
  targetSteps: number;
  progressPercent: number;
  xpReward: number;
  completed: boolean;
  completedAt: string | null;
  nextRunKey: string | null;
  urgencyLabel: string | null;
  timeLeftLabel: string | null;
};

export type EngagementCollectionProgress = {
  collectionKey: string;
  title: string;
  description: string;
  category: string;
  progressCount: number;
  targetCount: number;
  progressPercent: number;
  xpReward: number;
  completed: boolean;
  completedAt: string | null;
};

export type NearCompletionItem = {
  id: string;
  kind: "mission" | "level" | "badge" | "collection" | "run";
  title: string;
  label: string;
  detail: string;
  progressPercent: number;
  actionsRemaining: number;
  xpReward: number;
  bonusXp: number;
  streakMultiplier: number;
  surpriseRewardChance: number;
  timeLeftLabel: string | null;
  windowLabel: string | null;
};

export type LiveMomentumItem = {
  title: string;
  body: string;
  label: string;
  value: string;
};

export type MissedOpportunityItem = {
  id: string;
  title: string;
  detail: string;
  kind: "run" | "mission";
  urgencyLabel: string;
};

export type SocialMomentumItem = {
  title: string;
  body: string;
  label: string;
};

export type EngagementSnapshot = {
  signedIn: boolean;
  ready: boolean;
  level: number;
  totalXp: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  currentStreak: number;
  longestStreak: number;
  cityParticipationScore: number;
  trustScore: number;
  reputationScore: number;
  savedCount: number;
  pulsePostsCount: number;
  reserveActionsCount: number;
  crewRequestsCount: number;
  eplActionsCount: number;
  sponsorPerkActionsCount: number;
  stayopsActionsCount: number;
  cityCollectionCount: number;
  lastCity: string | null;
  bestNextMove: string;
  nearCompleteHeadline: string;
  todaySignal: {
    title: string;
    body: string;
    bonusXp: number;
    resetLabel: string;
  };
  timePressureLabel: string;
  timePressureCountdown: string;
  dailyXpBonus: number;
  dailyMission: EngagementMissionProgress | null;
  streakAtRisk: boolean;
  streakRiskLabel: string | null;
  streakMultiplier: number;
  nextBestAction: NearCompletionItem | null;
  expiringRewards: Array<{
    title: string;
    detail: string;
    timeLeftLabel: string;
    kind: "mission" | "run" | "reward";
  }>;
  missions: EngagementMissionProgress[];
  runs: EngagementRunProgress[];
  collections: EngagementCollectionProgress[];
  badges: EngagementBadge[];
  unlockedCollections: Array<{ collectionKey: string; itemKey: string; city: string | null; unlockedAt: string }>;
  nearComplete: NearCompletionItem[];
  liveMomentum: LiveMomentumItem[];
  socialMomentum: SocialMomentumItem[];
  missedOpportunities: MissedOpportunityItem[];
  nextRun: EngagementRunProgress | null;
  recentReward: SurpriseReward | null;
  socialIdentity: string[];
  aheadOfUsersPercent: number | null;
  socialComparisonLabel: string;
  peopleLikeYouLabel: string;
  unlockedThisSession?: EngagementBadge[];
  completedThisSession?: string[];
  xpGained?: number;
};

type TrackEngagementInput = {
  userId: string | null;
  eventType: EngagementEventType;
  city?: string | null;
  referenceType?: string | null;
  referenceId?: string | null;
  value?: number | null;
  dedupeKey?: string | null;
  metadata?: Record<string, unknown>;
};

type ProgressRow = {
  user_id: string;
  total_xp: number;
  current_level: number;
  current_streak: number;
  longest_streak: number;
  city_participation_score: number;
  trust_score: number;
  reputation_score: number;
  saved_count: number;
  pulse_posts_count: number;
  reserve_actions_count: number;
  crew_requests_count: number;
  epl_actions_count: number;
  sponsor_perk_actions_count: number;
  stayops_actions_count: number;
  city_collection_count: number;
  last_activity_date: string | null;
  last_city: string | null;
  metadata: Record<string, unknown> | null;
};

type MissionProgressRow = {
  mission_key: string;
  period_key: string;
  progress_count: number;
  target_count: number;
  completed_at: string | null;
};

type RunProgressRow = {
  run_key: string;
  period_key: string;
  progress_count: number;
  target_steps: number;
  completed_at: string | null;
};

type CollectionProgressRow = {
  collection_key: string;
  progress_count: number;
  target_count: number;
  completed_at: string | null;
};

const STATIC_MISSIONS: EngagementMission[] = [
  { missionKey: "complete_profile", title: "Complete your profile", description: "Set your EVNTSZN profile so the platform can tailor cities, nights, and status to you.", category: "identity", frequency: "one_time", actionKey: "profile_completed", targetCount: 1, xpReward: 80, badgeRewardKey: "profile_built", sortOrder: 10 },
  { missionKey: "save_three_this_week", title: "Save 3 plans this week", description: "Build your weekend run by saving three events, venues, or reserve options.", category: "discovery", frequency: "weekly", actionKey: "saved_item", targetCount: 3, xpReward: 90, badgeRewardKey: "city_planner", sortOrder: 20 },
  { missionKey: "explore_two_cities", title: "Explore 2 city lanes", description: "Move through two city contexts to build a broader EVNTSZN map.", category: "city", frequency: "weekly", actionKey: "city_explored", targetCount: 2, xpReward: 70, badgeRewardKey: "city_scout", sortOrder: 30 },
  { missionKey: "post_pulse_signal", title: "Post 1 Pulse signal", description: "Add one useful city signal to the public momentum layer.", category: "pulse", frequency: "daily", actionKey: "pulse_posted", targetCount: 1, xpReward: 60, badgeRewardKey: "pulse_contributor", sortOrder: 40 },
  { missionKey: "build_your_night", title: "Build your night", description: "Save a real four-stop night plan so EVNTSZN becomes part of the plan, not just the browse.", category: "planning", frequency: "weekly", actionKey: "night_plan_created", targetCount: 1, xpReward: 75, badgeRewardKey: "night_planner", sortOrder: 50 },
  { missionKey: "follow_epl", title: "Follow your EPL lane", description: "Watch a league city or team so game-week movement becomes part of your feed.", category: "epl", frequency: "weekly", actionKey: "epl_followed", targetCount: 1, xpReward: 55, badgeRewardKey: "supporter_status", sortOrder: 60 },
  { missionKey: "book_or_inquire_crew", title: "Open a crew request", description: "Send one marketplace request to unlock pro-requester momentum.", category: "crew", frequency: "weekly", actionKey: "crew_requested", targetCount: 1, xpReward: 85, badgeRewardKey: "crew_connector", sortOrder: 70 },
  { missionKey: "unlock_sponsor_perk", title: "Unlock a sponsor perk", description: "Open a sponsor-backed offer or featured placement path.", category: "perks", frequency: "weekly", actionKey: "sponsor_perk_viewed", targetCount: 1, xpReward: 45, badgeRewardKey: "perk_unlocked", sortOrder: 80 },
  { missionKey: "start_stayops_pipeline", title: "Start a StayOps intake", description: "Move a property into the StayOps revenue system.", category: "stayops", frequency: "one_time", actionKey: "stayops_intake_submitted", targetCount: 1, xpReward: 100, badgeRewardKey: "asset_operator", sortOrder: 90 },
];

const STATIC_RUNS: EngagementRun[] = [
  { runKey: "weekend_run", title: "Weekend Run", description: "Save two vibes, build one night plan, and check one momentum lane before the weekend slips.", category: "discover", frequency: "weekly", targetSteps: 4, xpReward: 120, badgeRewardKey: "weekend_operator", nextRunKey: "city_run", actionKeys: ["saved_item", "saved_item", "night_plan_created", "pulse_view"], metadata: { expires: "weekend", urgencyLabel: "Ends Sunday night" } },
  { runKey: "city_run", title: "City Run", description: "Explore three neighborhoods or city zones and widen your map even if there are no live events.", category: "city", frequency: "weekly", targetSteps: 3, xpReward: 100, badgeRewardKey: "city_runner", nextRunKey: "pulse_run", actionKeys: ["city_explored", "discovery_lane_explored", "city_explored"], metadata: { expires: "weekly", urgencyLabel: "Resets this week" } },
  { runKey: "pulse_run", title: "Pulse Run", description: "Open the Pulse lane, read the city, and add one useful signal back into the system.", category: "pulse", frequency: "weekly", targetSteps: 3, xpReward: 95, badgeRewardKey: "signal_runner", nextRunKey: "night_run", actionKeys: ["pulse_view", "pulse_view", "pulse_posted"], metadata: { expires: "weekly", urgencyLabel: "Resets this week" } },
  { runKey: "night_run", title: "Night Run", description: "Explore one lane, check momentum, and build one night plan before tonight closes.", category: "nightlife", frequency: "daily", targetSteps: 3, xpReward: 85, badgeRewardKey: "night_runner", nextRunKey: "weekend_run", actionKeys: ["discovery_lane_explored", "pulse_view", "night_plan_created"], metadata: { expires: "night", urgencyLabel: "Ends tonight" } },
];

const STATIC_COLLECTIONS: EngagementCollection[] = [
  { collectionKey: "rooftop_circuit", title: "Rooftop Circuit", description: "Build a premium rooftop shortlist by saving and opening elevated city plans.", category: "nightlife", targetCount: 5, xpReward: 90, badgeRewardKey: "rooftop_unlocked", metadata: { keywords: ["rooftop", "skyline", "terrace"] } },
  { collectionKey: "nightlife_circuit", title: "Nightlife Circuit", description: "Complete a core city nightlife set through repeated discovery actions.", category: "city", targetCount: 6, xpReward: 105, badgeRewardKey: "nightlife_insider", metadata: { cityDriven: true } },
  { collectionKey: "downtown_unlock", title: "Downtown Unlock", description: "Complete a concentrated city-center loop through discovery and reserve pressure.", category: "neighborhood", targetCount: 4, xpReward: 80, badgeRewardKey: "downtown_unlocked", metadata: { keywords: ["downtown", "center city", "midtown"] } },
];

const BADGE_LIBRARY: Record<string, Omit<EngagementBadge, "awardedAt">> = {
  profile_built: { badgeKey: "profile_built", badgeLabel: "Profile Built", badgeDescription: "Your EVNTSZN identity is complete and ready to drive the rest of the platform.", tone: "trust" },
  city_planner: { badgeKey: "city_planner", badgeLabel: "City Planner", badgeDescription: "You have started building a repeatable weekend run.", tone: "city" },
  city_scout: { badgeKey: "city_scout", badgeLabel: "City Scout", badgeDescription: "You are exploring across city lanes instead of waiting on one feed.", tone: "city" },
  pulse_contributor: { badgeKey: "pulse_contributor", badgeLabel: "Pulse Contributor", badgeDescription: "Your activity is helping keep the city signal layer alive.", tone: "trust" },
  night_planner: { badgeKey: "night_planner", badgeLabel: "Night Planner", badgeDescription: "Reserve movement is part of your EVNTSZN loop now.", tone: "city" },
  supporter_status: { badgeKey: "supporter_status", badgeLabel: "Supporter Status", badgeDescription: "You have opened your EPL identity lane.", tone: "league" },
  crew_connector: { badgeKey: "crew_connector", badgeLabel: "Crew Connector", badgeDescription: "You have used the marketplace like an operator, not just a browser.", tone: "crew" },
  perk_unlocked: { badgeKey: "perk_unlocked", badgeLabel: "Perk Unlocked", badgeDescription: "You have started collecting sponsor-backed EVNTSZN value.", tone: "perks" },
  asset_operator: { badgeKey: "asset_operator", badgeLabel: "Asset Operator", badgeDescription: "You moved a property into the StayOps pipeline.", tone: "ops" },
  level_three: { badgeKey: "level_three", badgeLabel: "Weekend Operator", badgeDescription: "You reached level 3 and started acting like a repeat EVNTSZN member.", tone: "city" },
  seven_day_streak: { badgeKey: "seven_day_streak", badgeLabel: "Seven-Day Run", badgeDescription: "Your city streak held for a full week.", tone: "city" },
  weekend_operator: { badgeKey: "weekend_operator", badgeLabel: "Weekend Run Complete", badgeDescription: "You finished a full weekend run before leaving the app.", tone: "city" },
  city_runner: { badgeKey: "city_runner", badgeLabel: "City Runner", badgeDescription: "You finished a full city exploration run.", tone: "city" },
  signal_runner: { badgeKey: "signal_runner", badgeLabel: "Signal Runner", badgeDescription: "You closed the loop from watching the city to contributing back to it.", tone: "trust" },
  night_runner: { badgeKey: "night_runner", badgeLabel: "Night Runner", badgeDescription: "You finished a same-night run before the city window closed.", tone: "city" },
  rooftop_unlocked: { badgeKey: "rooftop_unlocked", badgeLabel: "Rooftop Unlocked", badgeDescription: "You completed a premium rooftop collection.", tone: "city" },
  nightlife_insider: { badgeKey: "nightlife_insider", badgeLabel: "Nightlife Insider", badgeDescription: "You completed a nightlife circuit collection.", tone: "city" },
  downtown_unlocked: { badgeKey: "downtown_unlocked", badgeLabel: "Downtown Unlocked", badgeDescription: "You completed a downtown-focused city collection.", tone: "city" },
  first_light: { badgeKey: "first_light", badgeLabel: "First Light", badgeDescription: "You started the day with a clean EVNTSZN move.", tone: "trust" },
  momentum_shaper: { badgeKey: "momentum_shaper", badgeLabel: "Momentum Shaper", badgeDescription: "You turned a near-finished lane into a completed reward.", tone: "city" },
};

const XP_BY_EVENT: Record<EngagementEventType, number> = {
  discover_view: 12,
  discovery_lane_explored: 18,
  saved_item: 25,
  city_explored: 18,
  night_plan_created: 42,
  profile_completed: 50,
  pulse_posted: 35,
  pulse_view: 8,
  reserve_requested: 40,
  reserve_waitlist_joined: 32,
  reserve_view: 10,
  crew_requested: 45,
  crew_view: 10,
  epl_followed: 28,
  epl_view: 8,
  sponsor_perk_viewed: 14,
  stayops_intake_submitted: 60,
  stayops_view: 6,
};

function hasEngagementRuntime() {
  return getSupabaseRuntimeConfig("server-admin", "engagement").ok;
}

function isMissingRelationError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error ? String((error as { code?: unknown }).code || "") : "";
  const message = "message" in error ? String((error as { message?: unknown }).message || "") : "";
  return code === "42P01" || /does not exist|relation .* does not exist/i.test(message);
}

function normalizeCityKey(city?: string | null) {
  return String(city || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function toIsoDate(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function startOfWeekKey(date = new Date()) {
  const copy = new Date(date);
  const day = copy.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setUTCDate(copy.getUTCDate() + diff);
  copy.setUTCHours(0, 0, 0, 0);
  return copy.toISOString().slice(0, 10);
}

function getPeriodKey(frequency: EngagementFrequency | "daily" | "weekly", now = new Date()) {
  if (frequency === "daily") return `day:${toIsoDate(now)}`;
  if (frequency === "weekly") return `week:${startOfWeekKey(now)}`;
  return "all_time";
}

function getLevelRequirement(level: number) {
  return 100 + (level - 1) * 40;
}

function getLevelFromXp(totalXp: number) {
  let level = 1;
  let xpRemaining = totalXp;
  let requirement = getLevelRequirement(level);
  while (xpRemaining >= requirement) {
    xpRemaining -= requirement;
    level += 1;
    requirement = getLevelRequirement(level);
  }
  return { level, xpIntoLevel: xpRemaining, xpForNextLevel: requirement };
}

function toPercent(progress: number, target: number) {
  if (!target) return 0;
  return Math.max(0, Math.min(100, Math.round((progress / target) * 100)));
}

function calculateBonusPack(item: { progressPercent: number; xpReward: number }) {
  const bonusXp = item.progressPercent >= 90 ? Math.round(item.xpReward * 0.35) : Math.round(item.xpReward * 0.2);
  return {
    bonusXp,
    streakMultiplier: item.progressPercent >= 90 ? 2 : 1.5,
    surpriseRewardChance: item.progressPercent >= 90 ? 0.35 : 0.18,
  };
}

function sortNearComplete(items: NearCompletionItem[]) {
  return [...items].sort((a, b) => {
    if (a.actionsRemaining !== b.actionsRemaining) return a.actionsRemaining - b.actionsRemaining;
    return (b.xpReward + b.bonusXp) - (a.xpReward + a.bonusXp);
  });
}

function getRunDeadline(run: EngagementRun) {
  const mode = String(run.metadata?.expires || run.frequency);
  const deadline = new Date();
  if (mode === "night") {
    deadline.setHours(23, 59, 59, 999);
    return deadline;
  }
  const day = deadline.getDay();
  const diff = day === 0 ? 0 : 7 - day;
  deadline.setDate(deadline.getDate() + diff);
  deadline.setHours(23, 59, 59, 999);
  return deadline;
}

function formatTimeLeft(deadline: Date) {
  const ms = deadline.getTime() - Date.now();
  if (ms <= 0) return "Expired";
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  if (hours >= 24) return `${Math.ceil(hours / 24)}d left`;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${Math.max(1, minutes)}m left`;
}

function getWindowBounds(now = new Date()) {
  const local = new Date(now);
  const day = local.getDay();
  const hour = local.getHours();
  const isWeekend = day === 5 || day === 6 || day === 0;

  if (isWeekend || hour >= 18) {
    const deadline = new Date(local);
    const daysUntilSunday = (7 - day) % 7;
    deadline.setDate(deadline.getDate() + (daysUntilSunday || (day === 0 ? 0 : 1)));
    deadline.setHours(23, 59, 59, 999);
    return { label: isWeekend ? "Weekend window" : "Tonight window", deadline };
  }

  const deadline = new Date(local);
  deadline.setHours(23, 59, 59, 999);
  return { label: "Tonight window", deadline };
}

function getMissionWindowLabel(frequency: EngagementFrequency, metadata?: Record<string, unknown>, now = new Date()) {
  const explicit = String(metadata?.expires || "").trim().toLowerCase();
  const window = explicit || frequency;
  switch (window) {
    case "night":
    case "tonight":
      return { label: "Tonight window", deadline: getWindowBounds(now).deadline };
    case "weekend":
      {
        const deadline = new Date(now);
        const day = deadline.getDay();
        const daysUntilSunday = (7 - day) % 7;
        deadline.setDate(deadline.getDate() + (day === 0 ? 0 : daysUntilSunday || 7));
        deadline.setHours(23, 59, 59, 999);
        return { label: "Weekend window", deadline };
      }
    default:
      return { label: frequency === "daily" ? "Tonight window" : "Limited-time mission", deadline: getWindowBounds(now).deadline };
  }
}

function buildDefaultMissionRows() {
  return STATIC_MISSIONS.slice(0, 4).map((mission) => ({
    missionKey: mission.missionKey,
    title: mission.title,
    description: mission.description,
    category: mission.category,
    frequency: mission.frequency,
    progressCount: 0,
    targetCount: mission.targetCount,
    completed: false,
    completedAt: null,
    xpReward: mission.xpReward,
    completionRatio: 0,
    windowLabel: mission.frequency === "weekly" ? "Weekend window" : "Tonight window",
    timeLeftLabel: mission.frequency === "weekly" ? "Ends Sunday night" : "Ends tonight",
  }));
}

function buildDefaultRunRows() {
  return STATIC_RUNS.map((run) => ({
    runKey: run.runKey,
    title: run.title,
    description: run.description,
    category: run.category,
    progressCount: 0,
    targetSteps: run.targetSteps,
    progressPercent: 0,
    xpReward: run.xpReward,
    completed: false,
    completedAt: null,
    nextRunKey: run.nextRunKey,
    urgencyLabel: String(run.metadata?.urgencyLabel || ""),
    timeLeftLabel: formatTimeLeft(getRunDeadline(run)),
  }));
}

function buildDefaultCollectionRows() {
  return STATIC_COLLECTIONS.map((collection) => ({
    collectionKey: collection.collectionKey,
    title: collection.title,
    description: collection.description,
    category: collection.category,
    progressCount: 0,
    targetCount: collection.targetCount,
    progressPercent: 0,
    xpReward: collection.xpReward,
    completed: false,
    completedAt: null,
  }));
}

function getDefaultSnapshot(): EngagementSnapshot {
  return {
    signedIn: false,
    ready: true,
    level: 1,
    totalXp: 0,
    xpIntoLevel: 0,
    xpForNextLevel: 100,
    currentStreak: 0,
    longestStreak: 0,
    cityParticipationScore: 0,
    trustScore: 0,
    reputationScore: 0,
    savedCount: 0,
    pulsePostsCount: 0,
    reserveActionsCount: 0,
    crewRequestsCount: 0,
    eplActionsCount: 0,
    sponsorPerkActionsCount: 0,
    stayopsActionsCount: 0,
    cityCollectionCount: 0,
    lastCity: null,
    bestNextMove: "Complete your profile and save your first plan to start your city run.",
    nearCompleteHeadline: "Open EVNTSZN and make one move to start storing progress.",
    todaySignal: {
      title: "Today’s Signal",
      body: "Open EVNTSZN, see what moved, and make one quick action to keep your run alive.",
      bonusXp: 25,
      resetLabel: "Resets in 24 hours",
    },
    timePressureLabel: "Tonight window",
    timePressureCountdown: "Ends tonight",
    dailyXpBonus: 25,
    dailyMission: null,
    streakAtRisk: false,
    streakRiskLabel: null,
    streakMultiplier: 1,
    nextBestAction: null,
    expiringRewards: [],
    missions: buildDefaultMissionRows(),
    runs: buildDefaultRunRows(),
    collections: buildDefaultCollectionRows(),
    badges: [],
    unlockedCollections: [],
    nearComplete: [],
    liveMomentum: [{ title: "City movement preview", body: "Save plans, open reserve, and follow Pulse to turn this into a live city feed.", label: "Momentum", value: "Ready" }],
    socialMomentum: [{ title: "Your city is ready to move", body: "As more members save, reserve, and post Pulse, the city layer becomes socially alive here.", label: "Social momentum" }],
    missedOpportunities: [],
    nextRun: null,
    recentReward: null,
    socialIdentity: [],
    aheadOfUsersPercent: null,
    socialComparisonLabel: "You're gaining momentum",
    peopleLikeYouLabel: "People like you are exploring this tonight",
  };
}

async function getMissionDefinitions() {
  if (!hasEngagementRuntime()) return STATIC_MISSIONS;
  try {
    const { data, error } = await supabaseAdmin.from("evntszn_engagement_missions").select("mission_key, title, description, category, frequency, action_key, target_count, xp_reward, badge_reward_key, sort_order, metadata").eq("is_active", true).order("sort_order", { ascending: true });
    if (error) throw error;
    if (!data?.length) return STATIC_MISSIONS;
    return data.map((row) => ({
      missionKey: row.mission_key,
      title: row.title,
      description: row.description,
      category: row.category,
      frequency: row.frequency as EngagementFrequency,
      actionKey: row.action_key as EngagementEventType,
      targetCount: row.target_count,
      xpReward: row.xp_reward,
      badgeRewardKey: row.badge_reward_key,
      sortOrder: row.sort_order,
      metadata: (row.metadata as Record<string, unknown> | null) || undefined,
    }));
  } catch (error) {
    if (isMissingRelationError(error)) return STATIC_MISSIONS;
    throw error;
  }
}

async function getRunDefinitions() {
  if (!hasEngagementRuntime()) return STATIC_RUNS;
  try {
    const { data, error } = await supabaseAdmin.from("evntszn_engagement_runs").select("run_key, title, description, category, frequency, target_steps, xp_reward, badge_reward_key, next_run_key, metadata").eq("is_active", true);
    if (error) throw error;
    if (!data?.length) return STATIC_RUNS;
    return data.map((row) => ({
      runKey: row.run_key,
      title: row.title,
      description: row.description,
      category: row.category,
      frequency: row.frequency as "daily" | "weekly",
      targetSteps: row.target_steps,
      xpReward: row.xp_reward,
      badgeRewardKey: row.badge_reward_key,
      nextRunKey: row.next_run_key,
      actionKeys: Array.isArray((row.metadata as Record<string, unknown> | null)?.actions)
        ? ((((row.metadata as Record<string, unknown>).actions as unknown[]) || []).map((value) => String(value)) as EngagementEventType[])
        : [],
      metadata: (row.metadata as Record<string, unknown> | null) || undefined,
    }));
  } catch (error) {
    if (isMissingRelationError(error)) return STATIC_RUNS;
    throw error;
  }
}

async function getCollectionDefinitions() {
  if (!hasEngagementRuntime()) return STATIC_COLLECTIONS;
  try {
    const { data, error } = await supabaseAdmin.from("evntszn_engagement_collections").select("collection_key, title, description, category, target_count, xp_reward, badge_reward_key, metadata").eq("is_active", true);
    if (error) throw error;
    if (!data?.length) return STATIC_COLLECTIONS;
    return data.map((row) => ({
      collectionKey: row.collection_key,
      title: row.title,
      description: row.description,
      category: row.category,
      targetCount: row.target_count,
      xpReward: row.xp_reward,
      badgeRewardKey: row.badge_reward_key,
      metadata: (row.metadata as Record<string, unknown> | null) || undefined,
    }));
  } catch (error) {
    if (isMissingRelationError(error)) return STATIC_COLLECTIONS;
    throw error;
  }
}

async function getProgressRow(userId: string): Promise<ProgressRow | null> {
  const { data, error } = await supabaseAdmin.from("evntszn_member_progress").select("*").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  return (data as ProgressRow | null) ?? null;
}

async function upsertProgressRow(row: Partial<ProgressRow> & { user_id: string }) {
  const { data, error } = await supabaseAdmin.from("evntszn_member_progress").upsert({ ...row, updated_at: new Date().toISOString() }, { onConflict: "user_id" }).select("*").single();
  if (error) throw error;
  return data as ProgressRow;
}

async function awardBadge(userId: string, badgeKey: string) {
  const badge = BADGE_LIBRARY[badgeKey];
  if (!badge) return null;
  const { data, error } = await supabaseAdmin.from("evntszn_member_badges").upsert({
    user_id: userId,
    badge_key: badge.badgeKey,
    badge_label: badge.badgeLabel,
    badge_description: badge.badgeDescription,
    tone: badge.tone,
  }, { onConflict: "user_id,badge_key", ignoreDuplicates: true }).select("badge_key, badge_label, badge_description, tone, awarded_at").maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return { badgeKey: data.badge_key, badgeLabel: data.badge_label, badgeDescription: data.badge_description || "", tone: data.tone as EngagementBadge["tone"], awardedAt: data.awarded_at };
}

async function touchUnlockedCity(userId: string, city?: string | null) {
  const normalized = normalizeCityKey(city);
  if (!normalized) return false;
  const { data, error } = await supabaseAdmin.from("evntszn_member_collections").upsert({
    user_id: userId,
    collection_key: "city",
    item_key: normalized,
    city: city || null,
  }, { onConflict: "user_id,collection_key,item_key", ignoreDuplicates: true }).select("id").maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

function getNextStreak(lastActivityDate: string | null, currentStreak: number, now = new Date()) {
  const today = toIsoDate(now);
  if (!lastActivityDate) return 1;
  if (lastActivityDate === today) return currentStreak || 1;
  const previous = new Date(`${lastActivityDate}T00:00:00.000Z`);
  const current = new Date(`${today}T00:00:00.000Z`);
  const diffDays = Math.round((current.getTime() - previous.getTime()) / 86400000);
  if (diffDays === 1) return Math.max(1, currentStreak + 1);
  return 1;
}

function accumulateCounters(progressRow: ProgressRow | null, eventType: EngagementEventType) {
  const base = {
    saved_count: progressRow?.saved_count || 0,
    pulse_posts_count: progressRow?.pulse_posts_count || 0,
    reserve_actions_count: progressRow?.reserve_actions_count || 0,
    crew_requests_count: progressRow?.crew_requests_count || 0,
    epl_actions_count: progressRow?.epl_actions_count || 0,
    sponsor_perk_actions_count: progressRow?.sponsor_perk_actions_count || 0,
    stayops_actions_count: progressRow?.stayops_actions_count || 0,
    trust_score: progressRow?.trust_score || 0,
    reputation_score: progressRow?.reputation_score || 0,
  };
  switch (eventType) {
    case "saved_item":
      base.saved_count += 1;
      break;
    case "night_plan_created":
      base.reputation_score += 1;
      break;
    case "discovery_lane_explored":
      base.trust_score += 1;
      break;
    case "pulse_posted":
      base.pulse_posts_count += 1;
      base.trust_score += 1;
      base.reputation_score += 1;
      break;
    case "reserve_requested":
    case "reserve_waitlist_joined":
      base.reserve_actions_count += 1;
      break;
    case "crew_requested":
      base.crew_requests_count += 1;
      base.reputation_score += 1;
      break;
    case "epl_followed":
      base.epl_actions_count += 1;
      break;
    case "sponsor_perk_viewed":
      base.sponsor_perk_actions_count += 1;
      break;
    case "stayops_intake_submitted":
      base.stayops_actions_count += 1;
      base.reputation_score += 2;
      break;
    default:
      break;
  }
  return base;
}

function buildSocialIdentity(progress: { reserveActionsCount: number; cityParticipationScore: number; currentStreak: number; pulsePostsCount: number; savedCount?: number }) {
  const tags: string[] = [];
  if ((progress.savedCount || 0) >= 2 || progress.reserveActionsCount >= 1) tags.push("Night Planner");
  if (progress.cityParticipationScore >= 4) tags.push("City Scout");
  if (progress.currentStreak >= 3) tags.push("Weekend Runner");
  if (progress.pulsePostsCount >= 1) tags.push("Pulse Contributor");
  return tags;
}

function buildStreakRisk(progressRow: ProgressRow | null) {
  const lastActivityAt = String(progressRow?.metadata?.lastActivityAt || "");
  if (!lastActivityAt) return { streakAtRisk: false, streakRiskLabel: null, streakMultiplier: 1 };
  const elapsedHours = (Date.now() - new Date(lastActivityAt).getTime()) / 3600000;
  if (elapsedHours >= 18 && elapsedHours < 30) return { streakAtRisk: true, streakRiskLabel: "Your streak is at risk", streakMultiplier: 1.25 };
  if (elapsedHours >= 30) return { streakAtRisk: true, streakRiskLabel: "Don’t break your run", streakMultiplier: 1 };
  return { streakAtRisk: false, streakRiskLabel: null, streakMultiplier: 1.5 };
}

function buildNearComplete(missions: EngagementMissionProgress[], runs: EngagementRunProgress[], collections: EngagementCollectionProgress[], levelInfo: { xpIntoLevel: number; xpForNextLevel: number }, badges: EngagementBadge[]) {
  const items: NearCompletionItem[] = [];
  for (const mission of missions) {
    if (mission.completed || mission.completionRatio < 0.6) continue;
    const actionsRemaining = Math.max(1, mission.targetCount - mission.progressCount);
    const bonus = calculateBonusPack({ progressPercent: mission.completionRatio * 100, xpReward: mission.xpReward });
    items.push({ id: `mission:${mission.missionKey}`, kind: "mission", title: mission.title, label: actionsRemaining === 1 ? "Finish this tonight" : "You're close to...", detail: `${actionsRemaining} more action${actionsRemaining === 1 ? "" : "s"} closes this mission.`, progressPercent: Math.round(mission.completionRatio * 100), actionsRemaining, xpReward: mission.xpReward, bonusXp: bonus.bonusXp, streakMultiplier: bonus.streakMultiplier, surpriseRewardChance: bonus.surpriseRewardChance, timeLeftLabel: mission.timeLeftLabel, windowLabel: mission.windowLabel });
  }
  for (const run of runs) {
    if (run.completed || run.progressPercent < 60) continue;
    const actionsRemaining = Math.max(1, run.targetSteps - run.progressCount);
    const bonus = calculateBonusPack({ progressPercent: run.progressPercent, xpReward: run.xpReward });
    items.push({ id: `run:${run.runKey}`, kind: "run", title: run.title, label: actionsRemaining === 1 ? "Finish your run" : "Almost there", detail: `${actionsRemaining} more step${actionsRemaining === 1 ? "" : "s"} completes this run.`, progressPercent: run.progressPercent, actionsRemaining, xpReward: run.xpReward, bonusXp: bonus.bonusXp, streakMultiplier: bonus.streakMultiplier, surpriseRewardChance: bonus.surpriseRewardChance, timeLeftLabel: run.timeLeftLabel, windowLabel: run.urgencyLabel });
  }
  for (const collection of collections) {
    if (collection.completed || collection.progressPercent < 60) continue;
    const actionsRemaining = Math.max(1, collection.targetCount - collection.progressCount);
    const bonus = calculateBonusPack({ progressPercent: collection.progressPercent, xpReward: collection.xpReward });
    items.push({ id: `collection:${collection.collectionKey}`, kind: "collection", title: collection.title, label: "Complete your city", detail: `${actionsRemaining} more action${actionsRemaining === 1 ? "" : "s"} unlocks this collection.`, progressPercent: collection.progressPercent, actionsRemaining, xpReward: collection.xpReward, bonusXp: bonus.bonusXp, streakMultiplier: bonus.streakMultiplier, surpriseRewardChance: bonus.surpriseRewardChance, timeLeftLabel: "Limited-time mission", windowLabel: "City collection" });
  }
  const levelPercent = toPercent(levelInfo.xpIntoLevel, levelInfo.xpForNextLevel);
  if (levelPercent >= 70) {
    const remainingXp = Math.max(1, levelInfo.xpForNextLevel - levelInfo.xpIntoLevel);
    const approximateActions = Math.max(1, Math.ceil(remainingXp / 25));
    const bonus = calculateBonusPack({ progressPercent: levelPercent, xpReward: 100 });
    items.push({ id: "level-up", kind: "level", title: "Level up", label: approximateActions === 1 ? "1 more action to level up" : "Almost unlocked", detail: `${remainingXp} XP left to hit the next level.`, progressPercent: levelPercent, actionsRemaining: approximateActions, xpReward: 100, bonusXp: bonus.bonusXp, streakMultiplier: bonus.streakMultiplier, surpriseRewardChance: bonus.surpriseRewardChance, timeLeftLabel: "Next move closes the gap", windowLabel: "Level progress" });
  }
  if (!badges.find((badge) => badge.badgeKey === "seven_day_streak")) {
    items.push({ id: "badge:seven_day_streak", kind: "badge", title: "Seven-Day Run", label: "You're close to...", detail: "Keep your streak alive to unlock the seven-day city run badge.", progressPercent: 65, actionsRemaining: 2, xpReward: 60, bonusXp: 15, streakMultiplier: 2, surpriseRewardChance: 0.2, timeLeftLabel: "Streak window", windowLabel: "Badge pressure" });
  }
  return sortNearComplete(items).slice(0, 6);
}

function buildBestNextMove(snapshot: Pick<EngagementSnapshot, "nearComplete" | "missions" | "runs">) {
  if (snapshot.nearComplete.length) return `${snapshot.nearComplete[0].title}: ${snapshot.nearComplete[0].detail}`;
  if (snapshot.runs.find((run) => !run.completed)) {
    const run = snapshot.runs.find((entry) => !entry.completed)!;
    return `${run.title}: ${Math.max(1, run.targetSteps - run.progressCount)} steps left`;
  }
  if (snapshot.missions.find((mission) => !mission.completed)) {
    const mission = snapshot.missions.find((entry) => !entry.completed)!;
    return `${mission.title}: ${mission.progressCount}/${mission.targetCount}`;
  }
  return "You cleared the active progress lanes. Open discovery and start a new city run.";
}

function buildNearCompleteHeadline(items: NearCompletionItem[]) {
  if (!items.length) return "One move is enough to restart your city loop.";
  return `${items[0].label} · ${items[0].title}`;
}

function buildDailyMission(missions: EngagementMissionProgress[]) {
  return missions.find((mission) => mission.frequency === "daily" && !mission.completed) || missions.find((mission) => mission.frequency === "daily") || null;
}

function buildTodaySignal(mission: EngagementMissionProgress | null, progressRow: ProgressRow | null) {
  const today = toIsoDate();
  const lastActivity = String(progressRow?.metadata?.lastActivityAt || "");
  const isFirstAction = !lastActivity || lastActivity.slice(0, 10) !== today;
  if (mission) {
    return {
      title: "Today’s Signal",
      body: isFirstAction
        ? `${mission.title} is ready. Open EVNTSZN and earn a clean first-action bonus before the day closes.`
        : `${mission.title} is your best daily unlock. One more move keeps momentum alive.`,
      bonusXp: 25,
      resetLabel: "Resets in 24 hours",
    };
  }
  return {
    title: "Today’s Signal",
    body: "Open EVNTSZN, scan the city, and make one low-friction move before the day resets.",
    bonusXp: 25,
    resetLabel: "Resets in 24 hours",
  };
}

function buildExpiringRewards(nearComplete: NearCompletionItem[], runRows: EngagementRunProgress[], dailyMission: EngagementMissionProgress | null) {
  const items = [
    ...nearComplete.slice(0, 3).map((item) => ({
      title: item.title,
      detail: item.detail,
      timeLeftLabel: item.timeLeftLabel || item.windowLabel || "Expiring soon",
      kind: item.kind as "mission" | "run" | "reward",
    })),
    ...runRows.filter((run) => !run.completed).slice(0, 2).map((run) => ({
      title: run.title,
      detail: run.description,
      timeLeftLabel: run.timeLeftLabel || run.urgencyLabel || "Expiring soon",
      kind: "run" as const,
    })),
  ];
  if (dailyMission) {
    items.unshift({
      title: dailyMission.title,
      detail: dailyMission.description,
      timeLeftLabel: dailyMission.timeLeftLabel || dailyMission.windowLabel || "Tonight window",
      kind: "mission",
    });
  }
  return items.slice(0, 4);
}

function buildMissedOpportunities(runs: EngagementRunProgress[], missions: EngagementMissionProgress[]) {
  const items: MissedOpportunityItem[] = [];
  for (const run of runs) {
    if (!run.completed && run.progressPercent >= 50 && run.timeLeftLabel === "Expired") items.push({ id: `run:${run.runKey}`, title: run.title, detail: `You almost completed this run at ${run.progressPercent}%.`, kind: "run", urgencyLabel: "You missed this" });
  }
  for (const mission of missions) {
    const percent = Math.round(mission.completionRatio * 100);
    if (!mission.completed && percent >= 60) items.push({ id: `mission:${mission.missionKey}`, title: mission.title, detail: `You almost completed this at ${percent}%.`, kind: "mission", urgencyLabel: "You almost completed this" });
  }
  return items.slice(0, 4);
}

async function buildLiveMomentum() {
  try {
    const [{ data: recentEvents, error: recentError }, { data: cityCounts, error: cityError }, { data: reserveCounts, error: reserveError }] = await Promise.all([
      supabaseAdmin.from("evntszn_activity_events").select("event_type, city, reference_type, metadata, occurred_at").gte("occurred_at", new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString()).order("occurred_at", { ascending: false }).limit(120),
      supabaseAdmin.from("evntszn_activity_events").select("city, event_type, reference_type, metadata").not("city", "is", null).gte("occurred_at", new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()).limit(400),
      supabaseAdmin.from("evntszn_activity_events").select("reference_id, event_type, reference_type, metadata").in("event_type", ["reserve_requested", "reserve_waitlist_joined", "saved_item"]).gte("occurred_at", new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString()).limit(400),
    ]);
    if (recentError) throw recentError;
    if (cityError) throw cityError;
    if (reserveError) throw reserveError;
    const events = recentEvents || [];
    const savesNow = events.filter((event) => event.event_type === "saved_item").length;
    const plansNow = events.filter((event) => event.event_type === "night_plan_created").length;
    const laneNow = events.filter((event) => event.event_type === "discovery_lane_explored" || event.event_type === "city_explored").length;
    const pulseNow = events.filter((event) => event.event_type === "pulse_posted").length;
    const reserveNow = events.filter((event) => event.event_type === "reserve_requested" || event.event_type === "reserve_waitlist_joined").length;
    const sourceCounter = new Map<string, number>();
    for (const row of recentEvents || []) {
      const metadata = (row as { metadata?: Record<string, unknown> | null }).metadata || {};
      const normalized = normalizeActivitySource({
        sourceType: String(metadata.source_type || "").trim() || null,
        sourceLabel: String(metadata.source_label || "").trim() || null,
        referenceType: (row as { reference_type?: string | null }).reference_type || null,
        metadata,
      });
      sourceCounter.set(normalized.sourceLabel, (sourceCounter.get(normalized.sourceLabel) || 0) + 1);
    }
    const topSource = [...sourceCounter.entries()].sort((a, b) => b[1] - a[1])[0];
    const cityCounter = new Map<string, number>();
    for (const row of cityCounts || []) {
      const city = String(row.city || "").trim();
      if (!city) continue;
      cityCounter.set(city, (cityCounter.get(city) || 0) + 1);
    }
    const hottestCity = [...cityCounter.entries()].sort((a, b) => b[1] - a[1])[0];
    const reserveCounter = new Map<string, number>();
    for (const row of reserveCounts || []) {
      const id = String(row.reference_id || "").trim();
      if (!id) continue;
      reserveCounter.set(id, (reserveCounter.get(id) || 0) + 1);
    }
    const hottestReserve = [...reserveCounter.entries()].sort((a, b) => b[1] - a[1])[0];
    return [
      topSource
        ? {
            title: `${topSource[0]} is leading tonight`,
            body: `${topSource[1]} tracked actions are coming from ${topSource[0].toLowerCase()} inventory and signals. `,
            label: "Source mix",
            value: topSource[0],
          }
        : {
            title: "Source-aware momentum",
            body: "Curator, Partner, and EVNTSZN Native activity will rise here as source metadata starts landing.",
            label: "Source mix",
            value: "Ready",
          },
      { title: "People are saving plans right now", body: savesNow > 0 ? `${savesNow} save actions landed in the last 12 hours.` : "Save momentum will appear here as members start building tonight.", label: "Live saves", value: String(savesNow) },
      { title: hottestCity ? `${hottestCity[0]} is moving` : "Your city is moving", body: hottestCity ? `${hottestCity[1]} tracked actions hit this city in the last day.` : "City momentum gets stronger as discovery, Pulse, plans, and saved vibes stack together.", label: "Hot neighborhood", value: hottestCity ? hottestCity[0] : "Live" },
      { title: hottestReserve ? "Filling fast" : "Reserve demand is live", body: hottestReserve ? `${hottestReserve[0]} is getting the most reserve-side pressure right now.` : `${reserveNow} reserve actions have landed recently.`, label: "Reserve pressure", value: hottestReserve ? "Tonight only" : String(reserveNow) },
      { title: "Synthetic city momentum", body: `${laneNow} lane explorations and ${plansNow} night plans are helping the city feel active even when live inventory is light.`, label: "Trending vibes", value: laneNow || plansNow ? "City is moving" : "Warming up" },
      { title: "Pulse overlay", body: pulseNow > 0 ? `${pulseNow} Pulse contribution${pulseNow === 1 ? "" : "s"} landed recently.` : "Pulse contribution will show up here as the city layer gets richer.", label: "Pulse", value: pulseNow ? "Popular right now" : "Quiet" },
    ] satisfies LiveMomentumItem[];
  } catch (error) {
    if (isMissingRelationError(error)) return getDefaultSnapshot().liveMomentum;
    throw error;
  }
}

async function buildSocialMomentum(progressRow: ProgressRow | null) {
  try {
    const [{ data: cityRows, error: cityError }, { data: userRows, error: userError }] = await Promise.all([
      supabaseAdmin.from("evntszn_activity_events").select("city, event_type, reference_type, metadata").not("city", "is", null).gte("occurred_at", new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString()).limit(400),
      supabaseAdmin.from("evntszn_member_progress").select("current_streak, city_participation_score").limit(200),
    ]);
    if (cityError) throw cityError;
    if (userError) throw userError;
    const cityCounter = new Map<string, number>();
    const sourceCounter = new Map<string, number>();
    for (const row of cityRows || []) {
      const city = String(row.city || "").trim();
      if (!city) continue;
      cityCounter.set(city, (cityCounter.get(city) || 0) + 1);
      const metadata = (row as { metadata?: Record<string, unknown> | null }).metadata || {};
      const normalized = normalizeActivitySource({
        sourceType: String(metadata.source_type || "").trim() || null,
        sourceLabel: String(metadata.source_label || "").trim() || null,
        referenceType: (row as { reference_type?: string | null }).reference_type || null,
        metadata,
      });
      sourceCounter.set(normalized.sourceLabel, (sourceCounter.get(normalized.sourceLabel) || 0) + 1);
    }
    const ranked = [...cityCounter.entries()].sort((a, b) => b[1] - a[1]);
    const top = ranked[0];
    const second = ranked[1];
    const scores = (userRows || []).map((row) => Number(row.current_streak || 0) + Number(row.city_participation_score || 0));
    const currentScore = (progressRow?.current_streak || 0) + (progressRow?.city_participation_score || 0);
    const aheadOfUsersPercent = scores.length ? Math.round((scores.filter((value) => value <= currentScore).length / scores.length) * 100) : null;
    const socialComparisonLabel = aheadOfUsersPercent !== null
      ? `Top ${Math.max(1, 100 - aheadOfUsersPercent)}% of explorers this week`
      : "You're gaining momentum";
    const topSource = [...sourceCounter.entries()].sort((a, b) => b[1] - a[1])[0];
    return {
      aheadOfUsersPercent,
      items: [
        { title: topSource ? `${topSource[0]} signals are leading tonight` : "People like you are exploring this tonight", body: topSource ? `${topSource[1]} recent actions landed in ${topSource[0].toLowerCase()}.` : "Others at your level are building plans, saving vibes, and keeping their run moving.", label: "Peer signal" },
        { title: top && second ? `${top[0]} is more active than ${second[0]} tonight` : "Rising in your area", body: top && second ? `${top[0]} has the stronger nightlife signal right now.` : "You’re gaining momentum even when the native network is still growing.", label: "City comparison" },
        { title: "Shared run momentum", body: top ? `${Math.max(1, Math.floor(top[1] / 2))} people completed part of a run today.` : "People unlocked this this week as city behavior stacked together.", label: "Shared progress" },
        { title: socialComparisonLabel, body: aheadOfUsersPercent !== null ? "You’re ahead of where most users start." : "Light social comparison appears once more activity lands.", label: "Light comparison" },
      ] satisfies SocialMomentumItem[],
    };
  } catch (error) {
    if (isMissingRelationError(error)) return { aheadOfUsersPercent: null, items: getDefaultSnapshot().socialMomentum };
    throw error;
  }
}

function collectionMatchesEvent(collection: EngagementCollection, input: TrackEngagementInput) {
  if (!["saved_item", "city_explored", "reserve_requested", "reserve_waitlist_joined"].includes(input.eventType)) return false;
  const metadata = collection.metadata || {};
  const keywords = Array.isArray(metadata.keywords) ? metadata.keywords.map((value) => String(value).toLowerCase()) : [];
  const haystack = [input.referenceType, input.referenceId, input.metadata?.title, input.metadata?.areaLabel, input.city].filter(Boolean).join(" ").toLowerCase();
  if (keywords.length && keywords.some((keyword) => haystack.includes(keyword))) return true;
  if (metadata.cityDriven) return Boolean(input.city);
  return input.eventType === "saved_item";
}

async function getSnapshotInputs(userId: string) {
  const [missions, runs, collections, progressRow, badgesRes, unlockedCollectionsRes, missionProgressRes, runProgressRes, collectionProgressRes, liveMomentum, socialMomentumPack] = await Promise.all([
    getMissionDefinitions(),
    getRunDefinitions(),
    getCollectionDefinitions(),
    getProgressRow(userId),
    supabaseAdmin.from("evntszn_member_badges").select("badge_key, badge_label, badge_description, tone, awarded_at").eq("user_id", userId).order("awarded_at", { ascending: false }).limit(12),
    supabaseAdmin.from("evntszn_member_collections").select("collection_key, item_key, city, unlocked_at").eq("user_id", userId).order("unlocked_at", { ascending: false }).limit(20),
    supabaseAdmin.from("evntszn_member_mission_progress").select("mission_key, period_key, progress_count, target_count, completed_at").eq("user_id", userId),
    supabaseAdmin.from("evntszn_member_run_progress").select("run_key, period_key, progress_count, target_steps, completed_at").eq("user_id", userId),
    supabaseAdmin.from("evntszn_member_collection_progress").select("collection_key, progress_count, target_count, completed_at").eq("user_id", userId),
    buildLiveMomentum(),
    buildSocialMomentum(await getProgressRow(userId)),
  ]);
  if (badgesRes.error) throw badgesRes.error;
  if (unlockedCollectionsRes.error) throw unlockedCollectionsRes.error;
  if (missionProgressRes.error) throw missionProgressRes.error;
  if (runProgressRes.error) throw runProgressRes.error;
  if (collectionProgressRes.error) throw collectionProgressRes.error;
  return { missions, runs, collections, progressRow, badgesRes, unlockedCollectionsRes, missionProgressRes, runProgressRes, collectionProgressRes, liveMomentum, socialMomentumPack };
}

export async function getEngagementSnapshot(userId?: string | null): Promise<EngagementSnapshot> {
  if (!userId || !hasEngagementRuntime()) return getDefaultSnapshot();
  try {
    const { missions, runs, collections, progressRow, badgesRes, unlockedCollectionsRes, missionProgressRes, runProgressRes, collectionProgressRes, liveMomentum, socialMomentumPack } = await getSnapshotInputs(userId);
    const derived = getLevelFromXp(progressRow?.total_xp || 0);

    const missionMap = new Map<string, MissionProgressRow>();
    for (const row of (missionProgressRes.data || []) as MissionProgressRow[]) {
      const existing = missionMap.get(row.mission_key);
      if (!existing || row.period_key > existing.period_key) missionMap.set(row.mission_key, row);
    }
    const runMap = new Map<string, RunProgressRow>();
    for (const row of (runProgressRes.data || []) as RunProgressRow[]) {
      const existing = runMap.get(row.run_key);
      if (!existing || row.period_key > existing.period_key) runMap.set(row.run_key, row);
    }
    const collectionMap = new Map<string, CollectionProgressRow>();
    for (const row of (collectionProgressRes.data || []) as CollectionProgressRow[]) {
      collectionMap.set(row.collection_key, row);
    }

    const missionRows: EngagementMissionProgress[] = missions.map((mission) => {
      const row = missionMap.get(mission.missionKey);
      const progressCount = row?.progress_count || 0;
      const targetCount = row?.target_count || mission.targetCount;
      const window = getMissionWindowLabel(mission.frequency, mission.metadata);
      return {
        missionKey: mission.missionKey,
        title: mission.title,
        description: mission.description,
        category: mission.category,
        frequency: mission.frequency,
        progressCount,
        targetCount,
        completed: Boolean(row?.completed_at) || progressCount >= targetCount,
        completedAt: row?.completed_at || null,
        xpReward: mission.xpReward,
        completionRatio: targetCount ? progressCount / targetCount : 0,
        windowLabel: String(mission.metadata?.windowLabel || window.label || null) || null,
        timeLeftLabel: formatTimeLeft(window.deadline),
      };
    });

    const runRows: EngagementRunProgress[] = runs.map((run) => {
      const row = runMap.get(run.runKey);
      const progressCount = row?.progress_count || 0;
      const targetSteps = row?.target_steps || run.targetSteps;
      return { runKey: run.runKey, title: run.title, description: run.description, category: run.category, progressCount, targetSteps, progressPercent: toPercent(progressCount, targetSteps), xpReward: run.xpReward, completed: Boolean(row?.completed_at) || progressCount >= targetSteps, completedAt: row?.completed_at || null, nextRunKey: run.nextRunKey, urgencyLabel: String(run.metadata?.urgencyLabel || ""), timeLeftLabel: formatTimeLeft(getRunDeadline(run)) };
    });

    const collectionRows: EngagementCollectionProgress[] = collections.map((collection) => {
      const row = collectionMap.get(collection.collectionKey);
      const progressCount = row?.progress_count || 0;
      const targetCount = row?.target_count || collection.targetCount;
      return { collectionKey: collection.collectionKey, title: collection.title, description: collection.description, category: collection.category, progressCount, targetCount, progressPercent: toPercent(progressCount, targetCount), xpReward: collection.xpReward, completed: Boolean(row?.completed_at) || progressCount >= targetCount, completedAt: row?.completed_at || null };
    });

    const badges: EngagementBadge[] = (badgesRes.data || []).map((row) => ({ badgeKey: row.badge_key, badgeLabel: row.badge_label, badgeDescription: row.badge_description || "", tone: row.tone as EngagementBadge["tone"], awardedAt: row.awarded_at }));
    const nearComplete = buildNearComplete(missionRows, runRows, collectionRows, derived, badges);
    const nextRun = runRows.find((run) => !run.completed) || null;
    const streakRisk = buildStreakRisk(progressRow);
    const dailyMission = buildDailyMission(missionRows);
    const todaySignal = buildTodaySignal(dailyMission, progressRow);
    const window = getWindowBounds();
    const recentRewardMeta = (progressRow?.metadata?.lastSurpriseReward || null) as Record<string, unknown> | null;
    const recentReward = recentRewardMeta
      ? { title: String(recentRewardMeta.title || "Surprise reward"), detail: String(recentRewardMeta.detail || "You unlocked something."), bonusXp: Number(recentRewardMeta.bonusXp || 0), rewardType: String(recentRewardMeta.rewardType || "bonus_xp") as SurpriseReward["rewardType"], revealedAt: String(recentRewardMeta.revealedAt || new Date().toISOString()) }
      : null;

    const snapshot: EngagementSnapshot = {
      signedIn: true,
      ready: true,
      level: progressRow?.current_level || derived.level,
      totalXp: progressRow?.total_xp || 0,
      xpIntoLevel: derived.xpIntoLevel,
      xpForNextLevel: derived.xpForNextLevel,
      currentStreak: progressRow?.current_streak || 0,
      longestStreak: progressRow?.longest_streak || 0,
      cityParticipationScore: progressRow?.city_participation_score || 0,
      trustScore: progressRow?.trust_score || 0,
      reputationScore: progressRow?.reputation_score || 0,
      savedCount: progressRow?.saved_count || 0,
      pulsePostsCount: progressRow?.pulse_posts_count || 0,
      reserveActionsCount: progressRow?.reserve_actions_count || 0,
      crewRequestsCount: progressRow?.crew_requests_count || 0,
      eplActionsCount: progressRow?.epl_actions_count || 0,
      sponsorPerkActionsCount: progressRow?.sponsor_perk_actions_count || 0,
      stayopsActionsCount: progressRow?.stayops_actions_count || 0,
      cityCollectionCount: progressRow?.city_collection_count || 0,
      lastCity: progressRow?.last_city || null,
      bestNextMove: "",
      nearCompleteHeadline: buildNearCompleteHeadline(nearComplete),
      todaySignal,
      timePressureLabel: window.label,
      timePressureCountdown: formatTimeLeft(window.deadline),
      dailyXpBonus: todaySignal.bonusXp,
      dailyMission,
      streakAtRisk: streakRisk.streakAtRisk,
      streakRiskLabel: streakRisk.streakRiskLabel,
      streakMultiplier: streakRisk.streakMultiplier,
      nextBestAction: nearComplete[0] || null,
      expiringRewards: buildExpiringRewards(nearComplete, runRows, dailyMission),
      missions: missionRows,
      runs: runRows,
      collections: collectionRows,
      badges,
      unlockedCollections: (unlockedCollectionsRes.data || []).map((row) => ({ collectionKey: row.collection_key, itemKey: row.item_key, city: row.city, unlockedAt: row.unlocked_at })),
      nearComplete,
      liveMomentum,
      socialMomentum: socialMomentumPack.items,
      missedOpportunities: buildMissedOpportunities(runRows, missionRows),
      nextRun,
      recentReward,
      socialIdentity: buildSocialIdentity({ reserveActionsCount: progressRow?.reserve_actions_count || 0, cityParticipationScore: progressRow?.city_participation_score || 0, currentStreak: progressRow?.current_streak || 0, pulsePostsCount: progressRow?.pulse_posts_count || 0, savedCount: progressRow?.saved_count || 0 }),
      aheadOfUsersPercent: socialMomentumPack.aheadOfUsersPercent,
      socialComparisonLabel: socialMomentumPack.aheadOfUsersPercent !== null
        ? `Top ${Math.max(1, 100 - socialMomentumPack.aheadOfUsersPercent)}% of explorers this week`
        : "You're gaining momentum",
      peopleLikeYouLabel: socialMomentumPack.items[0]?.title || "People like you are exploring this tonight",
    };
    snapshot.bestNextMove = buildBestNextMove(snapshot);
    return snapshot;
  } catch (error) {
    if (isMissingRelationError(error)) return getDefaultSnapshot();
    throw error;
  }
}

async function updateMissionProgress(userId: string, mission: EngagementMission, nearCompleteSet: Set<string>) {
  const periodKey = getPeriodKey(mission.frequency);
  const { data, error } = await supabaseAdmin.from("evntszn_member_mission_progress").select("id, progress_count, target_count, completed_at").eq("user_id", userId).eq("mission_key", mission.missionKey).eq("period_key", periodKey).maybeSingle();
  if (error) throw error;
  const currentCount = data?.progress_count || 0;
  const nextCount = Math.min(mission.targetCount, currentCount + 1);
  const completedNow = !data?.completed_at && nextCount >= mission.targetCount;
  if (currentCount / mission.targetCount >= 0.6) nearCompleteSet.add(`mission:${mission.missionKey}`);
  const { error: progressError } = await supabaseAdmin.from("evntszn_member_mission_progress").upsert({
    id: data?.id,
    user_id: userId,
    mission_key: mission.missionKey,
    period_key: periodKey,
    progress_count: nextCount,
    target_count: mission.targetCount,
    completed_at: completedNow ? new Date().toISOString() : data?.completed_at || null,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id,mission_key,period_key" });
  if (progressError) throw progressError;
  return { completedNow, completedLabel: mission.title };
}

async function updateRunProgress(userId: string, eventType: EngagementEventType, runs: EngagementRun[], nearCompleteSet: Set<string>) {
  const completed: string[] = [];
  const unlockedBadges: EngagementBadge[] = [];
  let xpBonus = 0;
  for (const run of runs.filter((entry) => entry.actionKeys.includes(eventType))) {
    const periodKey = getPeriodKey(run.frequency);
    const { data, error } = await supabaseAdmin.from("evntszn_member_run_progress").select("id, progress_count, target_steps, completed_at").eq("user_id", userId).eq("run_key", run.runKey).eq("period_key", periodKey).maybeSingle();
    if (error) throw error;
    const currentCount = data?.progress_count || 0;
    const nextCount = Math.min(run.targetSteps, currentCount + 1);
    const completedNow = !data?.completed_at && nextCount >= run.targetSteps;
    if (currentCount / run.targetSteps >= 0.6) nearCompleteSet.add(`run:${run.runKey}`);
    const { error: progressError } = await supabaseAdmin.from("evntszn_member_run_progress").upsert({
      id: data?.id,
      user_id: userId,
      run_key: run.runKey,
      period_key: periodKey,
      progress_count: nextCount,
      target_steps: run.targetSteps,
      completed_at: completedNow ? new Date().toISOString() : data?.completed_at || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,run_key,period_key" });
    if (progressError) throw progressError;
    if (completedNow) {
      xpBonus += run.xpReward;
      completed.push(run.title);
      if (run.badgeRewardKey) {
        const awarded = await awardBadge(userId, run.badgeRewardKey);
        if (awarded) unlockedBadges.push(awarded);
      }
    }
  }
  return { xpBonus, completed, unlockedBadges };
}

async function updateCollectionProgress(userId: string, input: TrackEngagementInput, collections: EngagementCollection[], nearCompleteSet: Set<string>) {
  const completed: string[] = [];
  const unlockedBadges: EngagementBadge[] = [];
  let xpBonus = 0;
  for (const collection of collections.filter((entry) => collectionMatchesEvent(entry, input))) {
    const { data, error } = await supabaseAdmin.from("evntszn_member_collection_progress").select("id, progress_count, target_count, completed_at").eq("user_id", userId).eq("collection_key", collection.collectionKey).maybeSingle();
    if (error) throw error;
    const currentCount = data?.progress_count || 0;
    const nextCount = Math.min(collection.targetCount, currentCount + 1);
    const completedNow = !data?.completed_at && nextCount >= collection.targetCount;
    if (currentCount / collection.targetCount >= 0.6) nearCompleteSet.add(`collection:${collection.collectionKey}`);
    const { error: progressError } = await supabaseAdmin.from("evntszn_member_collection_progress").upsert({
      id: data?.id,
      user_id: userId,
      collection_key: collection.collectionKey,
      progress_count: nextCount,
      target_count: collection.targetCount,
      completed_at: completedNow ? new Date().toISOString() : data?.completed_at || null,
      metadata: { lastCity: input.city || null },
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,collection_key" });
    if (progressError) throw progressError;
    if (completedNow) {
      xpBonus += collection.xpReward;
      completed.push(collection.title);
      if (collection.badgeRewardKey) {
        const awarded = await awardBadge(userId, collection.badgeRewardKey);
        if (awarded) unlockedBadges.push(awarded);
      }
    }
  }
  return { xpBonus, completed, unlockedBadges };
}

export async function trackEngagementEvent(input: TrackEngagementInput) {
  if (!input.userId || !hasEngagementRuntime()) {
    return { ok: true, signedIn: false, xpGained: 0, completedMissions: [] as string[], unlockedBadges: [] as EngagementBadge[], snapshot: getDefaultSnapshot() };
  }
  try {
    await ensurePlatformProfile(input.userId).catch(() => null);
    const sourceMetadata = buildActivitySourceMetadata({
      sourceType: String(input.metadata?.sourceType || input.metadata?.source_type || "").trim() || null,
      sourceLabel: String(input.metadata?.sourceLabel || input.metadata?.source_label || "").trim() || null,
      referenceType: input.referenceType || null,
      entityType: String(input.metadata?.entityType || input.metadata?.entity_type || "").trim() || null,
      metadata: input.metadata || null,
    });
    const { error: insertError } = await supabaseAdmin.from("evntszn_activity_events").insert({
      user_id: input.userId,
      event_type: input.eventType,
      city: input.city || null,
      reference_type: input.referenceType || null,
      reference_id: input.referenceId || null,
      value: input.value ?? null,
      dedupe_key: input.dedupeKey || null,
      metadata: {
        ...(input.metadata || {}),
        ...sourceMetadata,
      },
    });
    if (insertError) {
      const code = String((insertError as { code?: unknown }).code || "");
      if (code === "23505") {
        return { ok: true, signedIn: true, xpGained: 0, completedMissions: [] as string[], unlockedBadges: [] as EngagementBadge[], snapshot: await getEngagementSnapshot(input.userId) };
      }
      throw insertError;
    }

    const [missions, runs, collections, progressRow] = await Promise.all([getMissionDefinitions(), getRunDefinitions(), getCollectionDefinitions(), getProgressRow(input.userId)]);
    let xpGained = XP_BY_EVENT[input.eventType] || 0;
    const completedMissions: string[] = [];
    const unlockedBadges: EngagementBadge[] = [];
    const nearCompleteSet = new Set<string>();

    for (const mission of missions.filter((mission) => mission.actionKey === input.eventType)) {
      const result = await updateMissionProgress(input.userId, mission, nearCompleteSet);
      if (result.completedNow) {
        xpGained += mission.xpReward;
        completedMissions.push(result.completedLabel);
        if (mission.badgeRewardKey) {
          const awarded = await awardBadge(input.userId, mission.badgeRewardKey);
          if (awarded) unlockedBadges.push(awarded);
        }
      }
    }

    const runResult = await updateRunProgress(input.userId, input.eventType, runs, nearCompleteSet);
    xpGained += runResult.xpBonus;
    completedMissions.push(...runResult.completed);
    unlockedBadges.push(...runResult.unlockedBadges);

    const collectionResult = await updateCollectionProgress(input.userId, input, collections, nearCompleteSet);
    xpGained += collectionResult.xpBonus;
    completedMissions.push(...collectionResult.completed);
    unlockedBadges.push(...collectionResult.unlockedBadges);

    const nextStreak = getNextStreak(progressRow?.last_activity_date || null, progressRow?.current_streak || 0);
    const counters = accumulateCounters(progressRow, input.eventType);
    const cityUnlocked = await touchUnlockedCity(input.userId, input.city).catch((error) => {
      if (isMissingRelationError(error)) return false;
      throw error;
    });
    if (cityUnlocked) {
      xpGained += 18;
      completedMissions.push(`Unlocked ${input.city}`);
    }

    const eventHour = new Date().getHours();
    const isFirstActionOfDay = !progressRow?.last_activity_date || progressRow.last_activity_date !== toIsoDate();
    const nearCompletionBonusXp = nearCompleteSet.size ? 20 * nearCompleteSet.size : 0;
    const streakBoost = nearCompleteSet.size ? 1 : 0;
    const timePressureBonus = eventHour >= 18 || eventHour <= 1 ? 15 : 0;
    const surpriseChance = (nearCompleteSet.size ? 0.28 : 0.12) + (nextStreak >= 3 ? 0.08 : 0) + (eventHour >= 21 || eventHour <= 2 ? 0.12 : 0) + (isFirstActionOfDay ? 0.12 : 0) + (nearCompleteSet.size && isFirstActionOfDay ? 0.06 : 0);
    const surpriseTriggered = Math.random() < surpriseChance;
    const surpriseXp = surpriseTriggered ? (nearCompleteSet.size ? 35 : 20) : 0;
    const rareBadgeTriggered = surpriseTriggered && (nearCompleteSet.size > 0 || isFirstActionOfDay) && Math.random() < 0.45;
    const rareBadgeKey = rareBadgeTriggered ? (isFirstActionOfDay ? "first_light" : "momentum_shaper") : null;
    const surpriseReward: SurpriseReward | null = surpriseTriggered
      ? {
          title: rareBadgeTriggered ? "Unexpected bonus" : "Surprise reward",
          detail: rareBadgeTriggered
            ? "You unlocked something rarer for hitting a pressure point at the right time."
            : nearCompleteSet.size
              ? "You unlocked something for closing a near-complete lane."
              : "You unlocked something for pushing the run one step further.",
          bonusXp: surpriseXp,
          rewardType: rareBadgeTriggered ? "hidden_badge" : nearCompleteSet.size ? "bonus_xp" : "perk_unlocked",
          revealedAt: new Date().toISOString(),
        }
      : null;
    xpGained += nearCompletionBonusXp + surpriseXp + timePressureBonus + (isFirstActionOfDay ? 12 : 0);

    const totalXp = (progressRow?.total_xp || 0) + xpGained;
    const levelInfo = getLevelFromXp(totalXp);
    const nextCityScore = (progressRow?.city_participation_score || 0) + (input.city ? 1 : 0) + (cityUnlocked ? 2 : 0);
    const nextStreakWithBonus = nextStreak + streakBoost;
    const progressMetadata = (progressRow?.metadata || {}) as Record<string, unknown>;
    const categoriesExplored = Array.isArray(progressMetadata.categoriesExplored) ? progressMetadata.categoriesExplored.map(String) : [];
    const interestVariety = Array.isArray(progressMetadata.interestVariety) ? progressMetadata.interestVariety.map(String) : [];

    const updated = await upsertProgressRow({
      user_id: input.userId,
      total_xp: totalXp,
      current_level: levelInfo.level,
      current_streak: nextStreakWithBonus,
      longest_streak: Math.max(progressRow?.longest_streak || 0, nextStreakWithBonus),
      city_participation_score: nextCityScore,
      trust_score: counters.trust_score,
      reputation_score: counters.reputation_score,
      saved_count: counters.saved_count,
      pulse_posts_count: counters.pulse_posts_count,
      reserve_actions_count: counters.reserve_actions_count,
      crew_requests_count: counters.crew_requests_count,
      epl_actions_count: counters.epl_actions_count,
      sponsor_perk_actions_count: counters.sponsor_perk_actions_count,
      stayops_actions_count: counters.stayops_actions_count,
      city_collection_count: (progressRow?.city_collection_count || 0) + (cityUnlocked ? 1 : 0),
      last_activity_date: toIsoDate(),
      last_city: input.city || progressRow?.last_city || null,
      metadata: {
        ...progressMetadata,
        lastEventType: input.eventType,
        lastReferenceType: input.referenceType || null,
        lastSourceType: sourceMetadata.source_type,
        lastSourceLabel: sourceMetadata.source_label,
        lastSourceOrigin: sourceMetadata.source_origin,
        lastActivityAt: new Date().toISOString(),
        lastActivityDate: toIsoDate(),
        nearCompletionBonusXp,
        surpriseXp,
        timePressureBonus,
        lastSurpriseReward: surpriseReward,
        lastDailyHookAt: isFirstActionOfDay ? new Date().toISOString() : progressMetadata.lastDailyHookAt || null,
        lastWindowLabel: getWindowBounds().label,
        discoveryDepth: Number(progressMetadata.discoveryDepth || 0) + (input.eventType === "discover_view" || input.eventType === "discovery_lane_explored" ? 1 : 0),
        categoriesExplored: Array.from(new Set([
          ...categoriesExplored.filter(Boolean),
          ...(typeof input.metadata?.category === "string" ? [input.metadata.category] : []),
        ])).slice(0, 12),
        interestVariety: Array.from(new Set([
          ...interestVariety.filter(Boolean),
          ...(typeof input.metadata?.title === "string" ? [input.metadata.title] : []),
          ...(typeof input.metadata?.vibeLane === "string" ? [input.metadata.vibeLane] : []),
        ])).slice(0, 12),
      },
    });

    if ((progressRow?.current_level || 1) < 3 && updated.current_level >= 3) {
      const awarded = await awardBadge(input.userId, "level_three");
      if (awarded) unlockedBadges.push(awarded);
    }
    if ((progressRow?.longest_streak || 0) < 7 && updated.longest_streak >= 7) {
      const awarded = await awardBadge(input.userId, "seven_day_streak");
      if (awarded) unlockedBadges.push(awarded);
    }
    if (rareBadgeKey) {
      const awarded = await awardBadge(input.userId, rareBadgeKey);
      if (awarded) unlockedBadges.push(awarded);
    }

    const snapshot = await getEngagementSnapshot(input.userId);
    return { ok: true, signedIn: true, xpGained, completedMissions, unlockedBadges, snapshot: { ...snapshot, xpGained, completedThisSession: completedMissions, unlockedThisSession: unlockedBadges } };
  } catch (error) {
    if (isMissingRelationError(error)) {
      return { ok: true, signedIn: true, xpGained: 0, completedMissions: [] as string[], unlockedBadges: [] as EngagementBadge[], snapshot: await getEngagementSnapshot(input.userId) };
    }
    throw error;
  }
}
