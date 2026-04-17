import type { EplMenuVisibilityContent } from "@/lib/site-content";
import PublicNav from "@/components/public/PublicNav";

export default function EplNav({ menu }: { menu: EplMenuVisibilityContent }) {
  void menu;
  return <PublicNav />;
}
