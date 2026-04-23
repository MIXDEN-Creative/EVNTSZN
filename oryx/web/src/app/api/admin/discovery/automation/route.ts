import { NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/admin-auth";
import {
  clearDiscoveryAutomationOverride,
  persistDiscoveryAutomationEvaluation,
  setDiscoveryAutomationOverride,
} from "@/lib/discovery-automation-store";

type SetOverrideBody = {
  action: "set_override";
  cityKey: string;
  cityLabel: string;
  forcedPolicyStatus: "monitoring" | "accelerating" | "recovering" | "intervening" | null;
  forcedMaturityState: "strong" | "growing" | "imported_fallback" | null;
  suppressPromotion: boolean;
  overrideReason: string | null;
};

type ClearOverrideBody = {
  action: "clear_override";
  cityKey: string;
  cityLabel: string;
};

type EvaluateCityBody = {
  action: "evaluate_city";
  cityKey: string;
};

type EvaluateAllBody = {
  action: "evaluate_all";
};

type DiscoveryAutomationBody = SetOverrideBody | ClearOverrideBody | EvaluateCityBody | EvaluateAllBody;

export async function POST(request: Request) {
  const { user } = await requireAdminPermission("catalog.manage", "/epl/admin/discovery");
  const actor = user.id.startsWith("founder:") ? user.id : user.id;
  const body = (await request.json()) as DiscoveryAutomationBody;

  if (body.action === "set_override") {
    const result = await setDiscoveryAutomationOverride({
      actor,
      cityKey: body.cityKey,
      cityLabel: body.cityLabel,
      forcedPolicyStatus: body.forcedPolicyStatus,
      forcedMaturityState: body.forcedMaturityState,
      suppressPromotion: body.suppressPromotion,
      overrideReason: body.overrideReason,
    });
    return NextResponse.json({ ok: true, result });
  }

  if (body.action === "clear_override") {
    const result = await clearDiscoveryAutomationOverride({
      actor,
      cityKey: body.cityKey,
      cityLabel: body.cityLabel,
    });
    return NextResponse.json({ ok: true, result });
  }

  if (body.action === "evaluate_city") {
    const result = await persistDiscoveryAutomationEvaluation({
      actor,
      cityKey: body.cityKey,
    });
    return NextResponse.json({ ok: true, result });
  }

  if (body.action === "evaluate_all") {
    const result = await persistDiscoveryAutomationEvaluation({
      actor,
    });
    return NextResponse.json({ ok: true, result });
  }

  return NextResponse.json({ error: "Unsupported automation action." }, { status: 400 });
}
