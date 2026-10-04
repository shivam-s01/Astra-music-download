import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SupportPage } from "@/components/SupportPage";

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: "Support Shivam — Astra Music" },
      { name: "description", content: "Support the developer of Astra Music." },
      { name: "robots", content: "noindex, follow" },
    ],
  }),
  component: SupportRoute,
});

function SupportRoute() {
  const navigate = useNavigate();
  return <SupportPage onBack={() => navigate({ to: "/" })} />;
}
