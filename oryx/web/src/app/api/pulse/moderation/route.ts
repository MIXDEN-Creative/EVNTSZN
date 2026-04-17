import { NextResponse } from "next/server";
import { getPlatformViewer } from "@/lib/evntszn";
import {
  assignFallbackPulseModerator,
  canModeratePulseItem,
  getPulseModeratorContext,
  hasPulseModerationPersistence,
  hasPulsePostPersistence,
  listFallbackModeratorAssignments,
  listFallbackUserControls,
  logFallbackPulseAction,
  removeFallbackPulseModerator,
  setFallbackPulseUserControl,
  updateFallbackPulsePost,
} from "@/lib/pulse";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { listSystemLogEntries } from "@/lib/system-log-ledger";

async function logModerationAction(input: {
  pulsePostId?: string | null;
  targetUserId?: string | null;
  moderatorUserId?: string | null;
  actionType: string;
  city?: string | null;
  scopeType?: string | null;
  reason?: string | null;
  note?: string | null;
  assignedToUserId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  if (!(await hasPulseModerationPersistence())) {
    await logFallbackPulseAction(input);
    return;
  }
  await supabaseAdmin.from("evntszn_pulse_moderation_actions").insert({
    pulse_post_id: input.pulsePostId || null,
    target_user_id: input.targetUserId || null,
    moderator_user_id: input.moderatorUserId || null,
    action_type: input.actionType,
    city: input.city || null,
    scope_type: input.scopeType || null,
    reason: input.reason || null,
    note: input.note || null,
    assigned_to_user_id: input.assignedToUserId || null,
    metadata: input.metadata || {},
  });
}

export async function GET() {
  try {
    const viewer = await getPlatformViewer();
    const context = await getPulseModeratorContext(viewer);
    if (!context.canModerate) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const [hasPosts, hasModeration] = await Promise.all([
      hasPulsePostPersistence(),
      hasPulseModerationPersistence(),
    ]);

    if (!hasModeration) {
      const [fallbackPosts, fallbackModerators, fallbackActions, fallbackControls, profilesRes, operatorsRes] = await Promise.all([
        listSystemLogEntries(["pulse_post"], 150),
        listFallbackModeratorAssignments(),
        listSystemLogEntries(["pulse_moderation_action"], 150),
        listFallbackUserControls(),
        supabaseAdmin.from("evntszn_profiles").select("user_id, full_name, city, primary_role"),
        supabaseAdmin.from("evntszn_operator_profiles").select("user_id, role_key, city_scope, is_active"),
      ]);

      const profileMap = new Map(((profilesRes.data || []) as Array<{ user_id: string; full_name?: string | null; city?: string | null; primary_role?: string | null }>).map((profile) => [profile.user_id, profile]));
      const operatorMap = new Map(((operatorsRes.data || []) as Array<{ user_id: string; role_key?: string | null; city_scope?: string[] | null; is_active?: boolean }>).map((operator) => [operator.user_id, operator]));
      const defaultModeratorRoleKeys = new Set(["pro_host", "city_leader", "city_commissioner", "deputy_commissioner", "admin", "hq_operator"]);

      const defaultModerators = [...operatorMap.values()]
        .filter((operator) => operator.is_active && defaultModeratorRoleKeys.has(String(operator.role_key || "")))
        .map((operator) => {
          const profile = profileMap.get(operator.user_id);
          return {
            userId: operator.user_id,
            fullName: profile?.full_name || operator.user_id,
            cityScope: operator.city_scope || (profile?.city ? [profile.city] : []),
            scopeType: ["admin", "hq_operator"].includes(String(operator.role_key || "")) ? "global" : "city",
            source: "Role-based authority",
          };
        });

      const manualModerators = fallbackModerators.map((row) => {
        const contextRow = row.context && typeof row.context === "object" && !Array.isArray(row.context) ? row.context as Record<string, unknown> : {};
        const targetUserId = String(contextRow.targetUserId || "");
        const profile = profileMap.get(targetUserId);
        return {
          userId: targetUserId,
          fullName: profile?.full_name || targetUserId,
          cityScope: Array.isArray(contextRow.cityScope) ? contextRow.cityScope : [],
          scopeType: String(contextRow.scopeType || "city"),
          source: "Manual assignment",
        };
      });

      const queue = fallbackPosts
        .map((row) => {
          const contextRow = row.context && typeof row.context === "object" && !Array.isArray(row.context) ? row.context as Record<string, unknown> : {};
          return {
            id: row.id,
            title: String(contextRow.title || row.message),
            city: typeof contextRow.city === "string" ? contextRow.city : null,
            moderationState: String(contextRow.moderationState || "clear"),
            createdAt: row.occurred_at,
          };
        })
        .filter((post) => ["flagged", "hidden", "removed"].includes(post.moderationState) && canModeratePulseItem(context, post.city));

      const users = [...profileMap.values()].map((profile) => {
        const operator = operatorMap.get(profile.user_id);
        return {
          userId: profile.user_id,
          fullName: profile.full_name || profile.user_id,
          city: profile.city || null,
          roleKey: operator?.role_key || profile.primary_role || null,
        };
      });

      const controls = fallbackControls.map((row) => {
        const contextRow = row.context && typeof row.context === "object" && !Array.isArray(row.context) ? row.context as Record<string, unknown> : {};
        const targetUserId = String(contextRow.targetUserId || "");
        const profile = profileMap.get(targetUserId);
        return {
          userId: targetUserId,
          fullName: profile?.full_name || targetUserId,
          isMuted: Boolean(contextRow.isMuted),
          isSuspended: Boolean(contextRow.isSuspended),
        };
      });

      const actions = fallbackActions.map((row) => {
        const contextRow = row.context && typeof row.context === "object" && !Array.isArray(row.context) ? row.context as Record<string, unknown> : {};
        return {
          id: row.id,
          actionType: String(contextRow.actionType || row.message),
          reason: typeof contextRow.reason === "string" ? contextRow.reason : null,
          note: typeof contextRow.note === "string" ? contextRow.note : null,
          createdAt: row.occurred_at,
        };
      });

      return NextResponse.json({
        context,
        queue,
        moderators: [...defaultModerators, ...manualModerators],
        actions,
        users,
        controls,
        persistenceReady: false,
        message: "Pulse moderation is running from the system-log fallback until the live Supabase moderation tables are applied.",
      });
    }

    const [postsRes, moderatorsRes, actionsRes, controlsRes, profilesRes, operatorsRes] = await Promise.all([
      hasPosts
        ? supabaseAdmin
            .from("evntszn_pulse_posts")
            .select("id, title, city, moderation_state, created_at")
            .in("moderation_state", ["flagged", "hidden", "removed"])
            .order("created_at", { ascending: false })
            .limit(50)
        : Promise.resolve({ data: [], error: null }),
      supabaseAdmin
        .from("evntszn_pulse_moderators")
        .select("user_id, scope_type, city_scope, is_active")
        .eq("is_active", true)
        .order("updated_at", { ascending: false }),
      supabaseAdmin
        .from("evntszn_pulse_moderation_actions")
        .select("id, action_type, reason, note, created_at")
        .order("created_at", { ascending: false })
        .limit(50),
      supabaseAdmin
        .from("evntszn_pulse_user_controls")
        .select("user_id, is_muted, is_suspended")
        .order("updated_at", { ascending: false }),
      supabaseAdmin
        .from("evntszn_profiles")
        .select("user_id, full_name, city, primary_role"),
      supabaseAdmin
        .from("evntszn_operator_profiles")
        .select("user_id, role_key, city_scope, is_active"),
    ]);

    if (postsRes.error || moderatorsRes.error || actionsRes.error || controlsRes.error || profilesRes.error || operatorsRes.error) {
      throw new Error(
        postsRes.error?.message ||
          moderatorsRes.error?.message ||
          actionsRes.error?.message ||
          controlsRes.error?.message ||
          profilesRes.error?.message ||
          operatorsRes.error?.message ||
          "Could not load moderation data.",
      );
    }

    const profileMap = new Map((profilesRes.data || []).map((profile) => [profile.user_id, profile]));
    const operatorMap = new Map((operatorsRes.data || []).map((operator) => [operator.user_id, operator]));
    const defaultModeratorRoleKeys = new Set(["pro_host", "city_leader", "city_commissioner", "deputy_commissioner", "admin", "hq_operator"]);

    const manualModerators = (moderatorsRes.data || []).map((row) => {
      const profile = profileMap.get(row.user_id);
      return {
        userId: row.user_id,
        fullName: profile?.full_name || profile?.user_id || row.user_id,
        cityScope: row.city_scope || [],
        scopeType: row.scope_type,
        source: "Manual assignment",
      };
    });

    const defaultModerators = (operatorsRes.data || [])
      .filter((operator) => operator.is_active && defaultModeratorRoleKeys.has(String(operator.role_key || "")))
      .map((operator) => {
        const profile = profileMap.get(operator.user_id);
        return {
          userId: operator.user_id,
          fullName: profile?.full_name || operator.user_id,
          cityScope: operator.city_scope || (profile?.city ? [profile.city] : []),
          scopeType: ["admin", "hq_operator"].includes(String(operator.role_key || "")) ? "global" : "city",
          source: "Role-based authority",
        };
      });

    const moderators = [...defaultModerators, ...manualModerators].filter((record, index, array) => {
      return array.findIndex((candidate) => candidate.userId === record.userId && candidate.source === record.source) === index;
    });

    const queue = (postsRes.data || [])
      .filter((post) => canModeratePulseItem(context, post.city))
      .map((post) => ({
        id: post.id,
        title: post.title,
        city: post.city,
        moderationState: post.moderation_state,
        createdAt: post.created_at,
      }));

    const users = (profilesRes.data || []).map((profile) => {
      const operator = operatorMap.get(profile.user_id);
      return {
        userId: profile.user_id,
        fullName: profile.full_name || profile.user_id,
        city: profile.city,
        roleKey: operator?.role_key || profile.primary_role || null,
      };
    });

    const controls = (controlsRes.data || []).map((control) => {
      const profile = profileMap.get(control.user_id);
      return {
        userId: control.user_id,
        fullName: profile?.full_name || control.user_id,
        isMuted: control.is_muted,
        isSuspended: control.is_suspended,
      };
    });

    const actions = (actionsRes.data || []).map((action) => ({
      id: action.id,
      actionType: action.action_type,
      reason: action.reason,
      note: action.note,
      createdAt: action.created_at,
    }));

    return NextResponse.json({
      context,
      queue,
      moderators,
      actions,
      users,
      controls,
      persistenceReady: hasPosts && hasModeration,
      message: hasPosts ? null : "Pulse posts are loading from live event and venue signals until the database rollout is applied.",
    });
  } catch (error) {
    return NextResponse.json({ error: "Could not load moderation console." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const viewer = await getPlatformViewer();
    if (!viewer.user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const action = String(body.action || "").trim();
    const context = await getPulseModeratorContext(viewer);
    const [hasPosts, hasModeration] = await Promise.all([
      hasPulsePostPersistence(),
      hasPulseModerationPersistence(),
    ]);

    if (action === "flag_post") {
      if (!hasPosts || !hasModeration) {
        if (context.userControl.isMuted || context.userControl.isSuspended) {
          return NextResponse.json({ error: "Your Pulse actions are restricted." }, { status: 403 });
        }
        const pulsePostId = String(body.pulsePostId || "").trim();
        const reason = String(body.reason || "").trim() || "Flagged";
        if (!pulsePostId) {
          return NextResponse.json({ error: "pulsePostId is required." }, { status: 400 });
        }
        await updateFallbackPulsePost(pulsePostId, {
          moderationState: "flagged",
          moderationReason: reason,
          moderatedByUserId: viewer.user.id,
        });
        await logModerationAction({
          pulsePostId,
          moderatorUserId: viewer.user.id,
          actionType: "flag",
          scopeType: context.scopeType,
          reason,
        });
        return NextResponse.json({ ok: true });
      }

      if (context.userControl.isMuted || context.userControl.isSuspended) {
        return NextResponse.json({ error: "Your Pulse actions are restricted." }, { status: 403 });
      }

      const pulsePostId = String(body.pulsePostId || "").trim();
      const reason = String(body.reason || "").trim() || "Flagged";
      if (!pulsePostId) {
        return NextResponse.json({ error: "pulsePostId is required." }, { status: 400 });
      }

      const { data: post, error: postError } = await supabaseAdmin
        .from("evntszn_pulse_posts")
        .select("id, city, moderation_state")
        .eq("id", pulsePostId)
        .maybeSingle();
      if (postError || !post) {
        return NextResponse.json({ error: postError?.message || "Pulse post not found." }, { status: 404 });
      }

      await supabaseAdmin
        .from("evntszn_pulse_posts")
        .update({ moderation_state: post.moderation_state === "removed" ? post.moderation_state : "flagged" })
        .eq("id", pulsePostId);
      await logModerationAction({
        pulsePostId,
        moderatorUserId: viewer.user.id,
        actionType: "flag",
        city: post.city,
        reason,
      });
      return NextResponse.json({ ok: true });
    }

    if (!context.canModerate) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    if (["hide_post", "remove_post", "restore_post", "review_flag", "escalate_post"].includes(action)) {
      if (!hasPosts || !hasModeration) {
        const pulsePostId = String(body.pulsePostId || "").trim();
        const reason = String(body.reason || "").trim() || null;
        const note = String(body.note || "").trim() || null;
        if (!pulsePostId) {
          return NextResponse.json({ error: "pulsePostId is required." }, { status: 400 });
        }
        await updateFallbackPulsePost(pulsePostId, {
          postStatus: action === "restore_post" || action === "review_flag" ? "published" : "archived",
          moderationState:
            action === "hide_post"
              ? "hidden"
              : action === "remove_post"
                ? "removed"
                : action === "restore_post"
                  ? "restored"
                  : action === "review_flag"
                    ? "clear"
                    : "flagged",
          moderationReason: reason,
          moderationNote: note,
          escalatedToUserId: String(body.assignedToUserId || "").trim() || null,
          moderatedByUserId: viewer.user.id,
        });
        await logModerationAction({
          pulsePostId,
          moderatorUserId: viewer.user.id,
          actionType:
            action === "hide_post"
              ? "hide"
              : action === "remove_post"
                ? "remove"
                : action === "restore_post"
                  ? "restore"
                  : action === "review_flag"
                    ? "review_flag"
                    : "escalate",
          scopeType: context.scopeType,
          reason,
          note,
          assignedToUserId: String(body.assignedToUserId || "").trim() || null,
        });
        return NextResponse.json({ ok: true });
      }
      const pulsePostId = String(body.pulsePostId || "").trim();
      const reason = String(body.reason || "").trim() || null;
      const note = String(body.note || "").trim() || null;
      if (!pulsePostId) {
        return NextResponse.json({ error: "pulsePostId is required." }, { status: 400 });
      }

      const { data: post, error: postError } = await supabaseAdmin
        .from("evntszn_pulse_posts")
        .select("id, city")
        .eq("id", pulsePostId)
        .maybeSingle();
      if (postError || !post) {
        return NextResponse.json({ error: postError?.message || "Pulse post not found." }, { status: 404 });
      }
      if (!canModeratePulseItem(context, post.city)) {
        return NextResponse.json({ error: "You do not have moderation scope for this post." }, { status: 403 });
      }

      const update =
        action === "hide_post"
          ? { status: "archived", moderation_state: "hidden", moderation_reason: reason, moderation_note: note }
          : action === "remove_post"
            ? { status: "archived", moderation_state: "removed", moderation_reason: reason, moderation_note: note }
            : action === "restore_post"
              ? { status: "published", moderation_state: "restored", moderation_reason: reason, moderation_note: note }
              : action === "review_flag"
                ? { moderation_state: "clear", moderation_reason: reason, moderation_note: note }
                : { escalated_to_user_id: String(body.assignedToUserId || "").trim() || null, moderation_note: note };

      const { error: updateError } = await supabaseAdmin
        .from("evntszn_pulse_posts")
        .update({
          ...update,
          moderated_by_user_id: viewer.user.id,
          moderated_at: new Date().toISOString(),
        })
        .eq("id", pulsePostId);
      if (updateError) {
        return NextResponse.json({ error: "Could not update Pulse moderation state." }, { status: 500 });
      }

      await logModerationAction({
        pulsePostId,
        moderatorUserId: viewer.user.id,
        actionType:
          action === "hide_post"
            ? "hide"
            : action === "remove_post"
              ? "remove"
              : action === "restore_post"
                ? "restore"
                : action === "review_flag"
                  ? "review_flag"
                  : "escalate",
        city: post.city,
        scopeType: context.scopeType,
        reason,
        note,
        assignedToUserId: String(body.assignedToUserId || "").trim() || null,
      });

      return NextResponse.json({ ok: true });
    }

    if (["mute_user", "suspend_user", "restore_user"].includes(action)) {
      if (!hasModeration) {
        const targetUserId = String(body.targetUserId || "").trim();
        const note = String(body.note || "").trim() || null;
        if (!targetUserId) {
          return NextResponse.json({ error: "targetUserId is required." }, { status: 400 });
        }
        await setFallbackPulseUserControl({
          targetUserId,
          isMuted: action === "mute_user",
          isSuspended: action === "suspend_user",
          note,
          updatedByUserId: viewer.user.id,
        });
        await logModerationAction({
          targetUserId,
          moderatorUserId: viewer.user.id,
          actionType: action === "mute_user" ? "mute_user" : action === "suspend_user" ? "suspend_user" : "restore_user",
          scopeType: context.scopeType,
          note,
        });
        return NextResponse.json({ ok: true });
      }
      const targetUserId = String(body.targetUserId || "").trim();
      const note = String(body.note || "").trim() || null;
      if (!targetUserId) {
        return NextResponse.json({ error: "targetUserId is required." }, { status: 400 });
      }

      const payload =
        action === "mute_user"
          ? { is_muted: true, is_suspended: false }
          : action === "suspend_user"
            ? { is_muted: false, is_suspended: true }
            : { is_muted: false, is_suspended: false };

      const { error } = await supabaseAdmin.from("evntszn_pulse_user_controls").upsert({
        user_id: targetUserId,
        ...payload,
        note,
        updated_by_user_id: viewer.user.id,
      });
      if (error) {
        return NextResponse.json({ error: "Could not update Pulse user controls." }, { status: 500 });
      }

      await logModerationAction({
        targetUserId,
        moderatorUserId: viewer.user.id,
        actionType: action === "mute_user" ? "mute_user" : action === "suspend_user" ? "suspend_user" : "restore_user",
        scopeType: context.scopeType,
        note,
      });
      return NextResponse.json({ ok: true });
    }

    if (["assign_moderator", "remove_moderator"].includes(action)) {
      if (!hasModeration) {
        if (!context.canAssign) {
          return NextResponse.json({ error: "Only HQ/global moderators can manage moderator assignments." }, { status: 403 });
        }
        const targetUserId = String(body.targetUserId || "").trim();
        const scopeType = String(body.scopeType || "city").trim() || "city";
        const cityScope = String(body.cityScope || "")
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean);
        const note = String(body.note || "").trim() || null;

        if (!targetUserId) {
          return NextResponse.json({ error: "targetUserId is required." }, { status: 400 });
        }

        if (action === "remove_moderator") {
          await removeFallbackPulseModerator(targetUserId, note);
          await logModerationAction({
            targetUserId,
            moderatorUserId: viewer.user.id,
            actionType: "remove_moderator",
            scopeType: context.scopeType,
            note,
          });
          return NextResponse.json({ ok: true });
        }

        await assignFallbackPulseModerator({
          targetUserId,
          scopeType,
          cityScope,
          note,
          grantedByUserId: viewer.user.id,
        });
        await logModerationAction({
          targetUserId,
          moderatorUserId: viewer.user.id,
          actionType: "assign_moderator",
          scopeType,
          note,
          metadata: { cityScope },
        });
        return NextResponse.json({ ok: true });
      }
      if (!context.canAssign) {
        return NextResponse.json({ error: "Only HQ/global moderators can manage moderator assignments." }, { status: 403 });
      }

      const targetUserId = String(body.targetUserId || "").trim();
      const scopeType = String(body.scopeType || "city").trim() || "city";
      const cityScope = String(body.cityScope || "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
      const note = String(body.note || "").trim() || null;

      if (!targetUserId) {
        return NextResponse.json({ error: "targetUserId is required." }, { status: 400 });
      }

      if (action === "remove_moderator") {
        const { error } = await supabaseAdmin.from("evntszn_pulse_moderators").delete().eq("user_id", targetUserId);
        if (error) {
          return NextResponse.json({ error: "Could not remove moderator assignment." }, { status: 500 });
        }
        await logModerationAction({
          targetUserId,
          moderatorUserId: viewer.user.id,
          actionType: "remove_moderator",
          scopeType: context.scopeType,
          note,
        });
        return NextResponse.json({ ok: true });
      }

      const { error } = await supabaseAdmin.from("evntszn_pulse_moderators").upsert({
        user_id: targetUserId,
        scope_type: scopeType,
        city_scope: cityScope,
        is_active: true,
        can_assign: false,
        can_override: false,
        note,
        granted_by_user_id: viewer.user.id,
      });
      if (error) {
        return NextResponse.json({ error: "Could not assign moderator." }, { status: 500 });
      }

      await logModerationAction({
        targetUserId,
        moderatorUserId: viewer.user.id,
        actionType: "assign_moderator",
        scopeType,
        note,
        metadata: { cityScope },
      });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unsupported moderation action." }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Moderation action failed." }, { status: 500 });
  }
}
