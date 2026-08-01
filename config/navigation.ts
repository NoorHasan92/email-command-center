// config/navigation.ts
// Navigation links and routes configuration.

import { ROUTES } from "./routes";
import { LayoutDashboard, Settings, Mail, Bell } from "lucide-react";

export const NAVIGATION = [
  {
    title: "Dashboard",
    href: ROUTES.dashboard,
    icon: LayoutDashboard,
  },
  {
    title: "Inbox",
    href: "#",
    icon: Mail,
  },
  {
    title: "Alerts",
    href: "#",
    icon: Bell,
  },
  {
    title: "Settings",
    href: ROUTES.settings,
    icon: Settings,
  },
];
