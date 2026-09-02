"use client";

import {
  DatabaseBackup,
  Globe2,
  Activity,
  Mail,
  Settings,
  Palette,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NavItem } from "./components-nav";
import { SidebarFooter } from "./sidebar-footer";
import { useBranding } from "./branding-provider";
import { SidebarHeader } from "./sidebar-header";
import { useSidebar } from "./sidebar-state";

const sections = [
  {
    // label: "Overview",
    links: [{ href: "/admin", label: "نظرة عامة", icon: Settings }],
  },
  {
    label: "البريد الإلكتروني",
    links: [
      { href: "/mailboxes", label: "صناديق البريد", icon: Mail },
      { href: "/domains", label: "النطاقات", icon: Globe2 },
    ],
  },
  {
    label: "الإدارة",
    links: [
      { href: "/accounts", label: "الفريق", icon: Users },
      { href: "/activity", label: "النشاط", icon: Activity },
      { href: "/backups", label: "النسخ الاحتياطية", icon: DatabaseBackup },
    ],
  },
  {
    label: "المنتج",
    links: [
      { href: "/branding", label: "العلامة التجارية", icon: Palette },
      // { href: "/api-keys", label: "API Keys", icon: KeyRound },
      // { href: "/webhooks", label: "Webhooks", icon: Webhook }
    ],
  },
];

export function AdminNav({ className }: { className?: string }) {
  const branding = useBranding();
  const { minimal } = useSidebar();

  return (
    <nav className={cn("flex min-h-full flex-col gap-1", className)}>
      <SidebarHeader href="/inbox" label="الإدارة" />
      <div className={cn("space-y-4", minimal && "space-y-2")}>
        {sections.map((section) => {
          const links = section.links.filter(
            (link) =>
              link.href !== "/branding" || branding.canCustomizeBranding,
          );
          if (links.length === 0) return null;

          return (
            <section key={section.label}>
              {!minimal && section.label && (
                <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  {section.label}
                </p>
              )}
              <div className="space-y-1">
                {links.map((link) => (
                  <NavItem link={link} key={link.href} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
      <span className="flex-1" />
      <SidebarFooter />
    </nav>
  );
}
