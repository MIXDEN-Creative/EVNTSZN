import DraftBoardScreen from "./DraftBoardScreen";

export default async function EPLDraftBoardPage({
  params,
}: {
  params: Promise<{ seasonSlug: string }>;
}) {
  const { seasonSlug } = await params;
  return <DraftBoardScreen seasonSlug={seasonSlug} />;
}
