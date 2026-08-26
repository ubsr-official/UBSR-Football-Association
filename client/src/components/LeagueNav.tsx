import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { CalendarDays, LayoutDashboard, MessageCircle, Search, ShieldCheck, ShoppingBag, Trophy, UsersRound } from "lucide-react";

const baseNavigation = [
  { icon: LayoutDashboard, label: "Overview", path: "/" },
  { icon: Search, label: "League directory", path: "/directory" },
  { icon: UsersRound, label: "Teams & rosters", path: "/rosters" },
  { icon: CalendarDays, label: "Fixtures", path: "/fixtures" },
  { icon: ShoppingBag, label: "Transfer market", path: "/market" },
  { icon: MessageCircle, label: "Team room", path: "/team-room" },
];

export default function LeagueNav({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const navigation = user?.role === "admin"
    ? [...baseNavigation, { icon: ShieldCheck, label: "Commissioner", path: "/commissioner" }]
    : baseNavigation;
  return <DashboardLayout brand={<><Trophy className="size-4 text-[#E0A02C]" /><span>UBSR <span className="text-[#E0A02C]">League</span></span></>} navigation={navigation}>{children}</DashboardLayout>;
}
