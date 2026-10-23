import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SupportPage, type SupportTab } from "@/components/SupportPage";

export const Route = createFileRoute("/support")({
  validateSearch: (search: Record<string, unknown>): { tab?: "feedback" } => (search.tab === "feedback" ? { tab: "feedback" } : {}),
  head: () => ({
    meta: [
      { title: "Support & Feedback — Astra Music" },
      { name: "description", content: "Support the developer of Astra Music, rate the app and share your feedback." },
      { name: "robots", content: "noindex, follow" },
    ],
  }),
  component: SupportRoute,
});

function SupportRoute() {
  const navigate = useNavigate();
  const { tab } = Route.useSearch();
  const current: SupportTab = tab === "feedback" ? "feedback" : "support";
  return (
    <SupportPage
      tab={current}
      onTabChange={(next) => navigate({ to: "/support", search: next === "feedback" ? { tab: "feedback" } : {}, replace: true, resetScroll: false })}
      onBack={() => navigate({ to: "/" })}
    />
  );
}
