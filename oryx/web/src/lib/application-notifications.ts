type PipelineNotificationInput = {
  kind: "stayops" | "sponsor";
  title: string;
  companyName?: string | null;
  contactName?: string | null;
  city?: string | null;
  status?: string | null;
  estimatedValueUsd?: number | null;
  metadata?: Record<string, unknown>;
};

export async function notifyPipelineEvent(input: PipelineNotificationInput) {
  const payload = {
    kind: input.kind,
    title: input.title,
    companyName: input.companyName || null,
    contactName: input.contactName || null,
    city: input.city || null,
    status: input.status || "new",
    estimatedValueUsd: input.estimatedValueUsd || null,
    metadata: input.metadata || {},
    occurredAt: new Date().toISOString(),
  };

  console.info("[pipeline-notify]", payload);

  const webhookUrl = process.env.APPLICATION_WEBHOOK_URL || process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("[pipeline-notify] webhook_failed", error);
  }
}
