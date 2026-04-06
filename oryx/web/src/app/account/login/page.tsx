import CustomerLoginForm from "./CustomerLoginForm";

export default async function CustomerLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;

  return <CustomerLoginForm next={params.next || "/account"} />;
}
