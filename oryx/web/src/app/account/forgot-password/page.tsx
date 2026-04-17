import Link from "next/link";
import type { Metadata } from "next";
import PublicNav from "@/components/public/PublicNav";
import PublicFooter from "@/components/public/PublicFooter";
import ForgotPasswordForm from "./ForgotPasswordForm";
import { getAppOrigin, getWebOrigin } from "@/lib/domains";

export const metadata: Metadata = {
  title: "Forgot Password | EVNTSZN",
  description: "Reset your EVNTSZN member account password.",
};

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <PublicNav />
      <div className="mx-auto flex max-w-3xl flex-col justify-center px-4 py-10 md:px-6 lg:py-16">
        <div className="mb-8 flex items-center justify-between">
          <Link href={getWebOrigin()} className="text-2xl font-black tracking-tight text-white">
            EVNTSZN
          </Link>
          <Link href={`${getAppOrigin()}/account/login`} className="text-sm font-semibold text-white/50 hover:text-white transition">
            Sign in instead
          </Link>
        </div>
        
        <section className="rounded-[32px] border border-white/10 bg-[#0c0c15] p-6 md:p-8">
          <ForgotPasswordForm />
        </section>
      </div>
      <PublicFooter />
    </main>
  );
}
