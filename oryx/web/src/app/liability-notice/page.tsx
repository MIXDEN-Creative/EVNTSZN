import type { Metadata } from "next";
import PublicPageFrame from "@/components/public/PublicPageFrame";

export const metadata: Metadata = {
  title: "Liability Notice",
  description: "Important notice regarding event attendance, league participation, and platform use through EVNTSZN.",
};

export default function LiabilityNoticePage() {
  return (
    <PublicPageFrame>
      <section className="mx-auto max-w-4xl px-4 py-14 md:px-6 lg:px-8">
        <div className="ev-kicker">Notice</div>
        <h1 className="ev-title">Liability Notice</h1>
        <div className="ev-panel mt-8 space-y-6 p-6 md:p-8 text-white/74">
          <p>
            Attending events, participating in sports leagues, entering venues, and using live scanner/check-in systems all carry ordinary operational and personal-risk considerations. Users remain responsible for their own conduct, readiness, and compliance with venue, organizer, and league rules.
          </p>
          <p>
            EVNTSZN facilitates discovery, ticketing, registration, and operations tooling, but venue conditions, organizer conduct, weather impacts, transportation issues, and participant safety remain shared responsibilities across organizers, venues, participants, and attendees.
          </p>
          <p>
            For league or physically active experiences, participants should only register or attend if medically and practically able to do so. If you have a question about event safety, access, or participation expectations, contact the organizer or league operator before attending.
          </p>
        </div>
      </section>
    </PublicPageFrame>
  );
}
