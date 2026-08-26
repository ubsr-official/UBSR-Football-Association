import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { startLogin } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import type { LucideIcon } from "lucide-react";
import { LogOut, PanelLeft } from "lucide-react";
import type { ReactNode } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";

type NavItem = { icon: LucideIcon; label: string; path: string };

export default function DashboardLayout({ children, navigation, brand }: { children: ReactNode; navigation: NavItem[]; brand: ReactNode }) {
  const { loading, user } = useAuth();

  if (loading) return <DashboardLayoutSkeleton />;
  if (!user) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#153126] px-5 text-white">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.06] p-9 shadow-2xl backdrop-blur">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#E0A02C]">UBSR Football Association</p>
          <h1 className="mt-4 font-display text-4xl leading-tight">Your league, in one place.</h1>
          <p className="mt-4 text-sm leading-6 text-white/70">Sign in with your approved account. The commissioner will link your profile to your league record.</p>
          <Button onClick={() => startLogin()} className="mt-8 w-full bg-[#E0A02C] text-[#153126] hover:bg-[#F0B844]">Secure sign in</Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <LeagueSidebar navigation={navigation} brand={brand}>{children}</LeagueSidebar>
    </SidebarProvider>
  );
}

function LeagueSidebar({ children, navigation, brand }: { children: ReactNode; navigation: NavItem[]; brand: ReactNode }) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const isMobile = useIsMobile();
  const active = navigation.find(item => item.path === location);

  return (
    <>
      <Sidebar collapsible="icon" className="border-r border-[#1B4332]/10 bg-white">
        <SidebarHeader className="h-20 border-b border-[#1B4332]/10 px-3">
          <div className="flex h-full items-center gap-3">
            <SidebarTrigger className="size-9 shrink-0 rounded-lg text-[#153126] hover:bg-[#1B4332]/8"><PanelLeft className="size-4" /></SidebarTrigger>
            <div className="flex min-w-0 items-center gap-2 overflow-hidden whitespace-nowrap font-display text-lg font-semibold text-[#153126] group-data-[collapsible=icon]:hidden">{brand}</div>
          </div>
        </SidebarHeader>
        <SidebarContent className="pt-4">
          <SidebarMenu className="gap-1 px-2">
            {navigation.map(item => {
              const isActive = location === item.path;
              return (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton isActive={isActive} tooltip={item.label} onClick={() => setLocation(item.path)} className={`h-11 rounded-lg px-3 text-[13px] font-medium transition-colors ${isActive ? "bg-[#1B4332] text-white hover:bg-[#1B4332] hover:text-white" : "text-slate-600 hover:bg-[#1B4332]/7 hover:text-[#153126]"}`}>
                    <item.icon className={`size-4 ${isActive ? "text-[#E0A02C]" : ""}`} />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="border-t border-[#1B4332]/10 p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-[#1B4332]/6 group-data-[collapsible=icon]:justify-center">
                <Avatar className="size-8 border border-[#1B4332]/15"><AvatarFallback className="bg-[#E8EEE8] text-xs font-bold text-[#153126]">{user?.name?.slice(0, 1).toUpperCase() ?? "U"}</AvatarFallback></Avatar>
                <div className="min-w-0 group-data-[collapsible=icon]:hidden"><p className="truncate text-sm font-semibold text-[#153126]">{user?.name ?? "League member"}</p><p className="mt-0.5 truncate text-xs text-slate-500">{user?.role === "admin" ? "Commissioner" : "Member account"}</p></div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end"><DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive"><LogOut className="mr-2 size-4" />Sign out</DropdownMenuItem></DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        {isMobile && <div className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-[#1B4332]/10 bg-[#F6F5F0]/95 px-3 backdrop-blur"><SidebarTrigger className="size-9 rounded-lg" /><span className="text-sm font-semibold text-[#153126]">{active?.label ?? "UBSR League"}</span></div>}
        <main className="min-h-screen flex-1 bg-[#F6F5F0] p-4 sm:p-7 lg:p-10">{children}</main>
      </SidebarInset>
    </>
  );
}
