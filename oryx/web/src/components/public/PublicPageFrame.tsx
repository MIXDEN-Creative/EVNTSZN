import type { ReactNode } from "react";
import PublicNav from "@/components/public/PublicNav";
import PublicFooter from "@/components/public/PublicFooter";

export default function PublicPageFrame({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-black text-white">
      <PublicNav />
      {children}
      <PublicFooter />
    </main>
  );
}
