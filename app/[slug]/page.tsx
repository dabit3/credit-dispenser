import ClaimPage from "@/components/ClaimPage";

export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <ClaimPage slug={slug} />;
}
