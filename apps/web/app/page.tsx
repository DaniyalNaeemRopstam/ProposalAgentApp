import type { Metadata } from "next";
import { Landing } from "@/components/marketing/Landing";

export const metadata: Metadata = {
  title: "ProposalAgent · Stop writing proposals. Start winning clients.",
  description:
    "AI job matching, personalized proposals in your voice, and automated follow-ups—built for freelance developers who want to ship more and pitch less.",
};

export default function HomePage() {
  return <Landing />;
}
