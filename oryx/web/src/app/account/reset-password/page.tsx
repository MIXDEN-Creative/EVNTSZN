import Link from "next/link";
import type { Metadata } from "next";
import PublicNav from "@/components/public/PublicNav";
import PublicFooter from "@/components/public/PublicFooter";
import ResetPasswordForm from "./ResetPasswordForm";
import { getWebOrigin } from "@/lib/domains";

export const metadata: Metadata = {
  title: "Reset Password | EVNTSZN",
  description: "Set a new password for your EVNTSZN member account.",
};

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <PublicNav />
      <div className="mx-auto flex max-w-3xl flex-col justify-center px-4 py-10 md:px-6 lg:py-16">
        <div className="mb-8 text-center">
          <Link href={getWebOrigin()} className="text-2xl font-black tracking-tight text-white">
            EVNTSZN
          </Link>
        </div>
        
        <section className="rounded-[32px] border border-white/10 bg-[#0c0c15] p-6 md:p-8">
          <ResetPasswordForm />
        </section>
      </div>
      <PublicFooter />
    </main>
  );
}
