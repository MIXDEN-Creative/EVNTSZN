export default function StructuredData({
  id,
  data,
}: {
  id?: string;
  data: Record<string, unknown> | Array<Record<string, unknown>>;
}) {
  const payload = (Array.isArray(data) ? data : [data])
    .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object")
    .map((entry) => {
      const context = entry["@context"];

      if (typeof context === "string" && context.trim()) {
        return entry;
      }

      if ("@type" in entry || "@graph" in entry || "itemListElement" in entry) {
        return {
          "@context": "https://schema.org",
          ...entry,
        };
      }

      return entry;
    });

  if (!payload.length) {
    return null;
  }

  return (
    <script
      {...(id ? { id } : {})}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload.length === 1 ? payload[0] : payload) }}
    />
  );
}
