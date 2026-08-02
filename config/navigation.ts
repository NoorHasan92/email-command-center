// config/navigation.ts
// Navigation links and routes configuration.

import { ROUTES } from "./routes";
import { LayoutDashboard, Settings, Mail, Bell, Filter, BarChart, Plug } from "lucide-react";

export const NAVIGATION = [
  {
    id: "dashboard",
    title: "Dashboard",
    href: ROUTES.dashboard,
    icon: LayoutDashboard,
  },
  {
    id: "inbox",
    title: "Inbox",
    href: ROUTES.inbox,
    icon: Mail,
  },
  {
    id: "rules",
    title: "Rules Builder",
    href: ROUTES.rules,
    icon: Filter,
  },
  {
    id: "analytics",
    title: "Analytics",
    href: ROUTES.analytics,
    icon: BarChart,
  },
  {
    id: "integrations",
    title: "Integrations",
    href: ROUTES.integrations,
    icon: Plug,
  },
  {
    id: "alerts",
    title: "Alerts",
    href: ROUTES.alerts,
    icon: Bell,
  },
  {
    id: "settings",
    title: "Settings",
    href: ROUTES.settings,
    icon: Settings,
  },
];
