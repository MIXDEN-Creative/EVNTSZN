export default function StructuredData({
  id,
  data,
}: {
  id?: string;
  data: Record<string, unknown> | Array<Record<string, unknown>>;
}) {
  const payload = Array.isArray(data) ? data : [data];

  return (
    <script
      {...(id ? { id } : {})}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload.length === 1 ? payload[0] : payload) }}
    />
  );
}
