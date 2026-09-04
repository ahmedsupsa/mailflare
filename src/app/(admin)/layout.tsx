"use client";

import Link from "next/link";
import { HelpCircle, Search } from "lucide-react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { ComposeProvider } from "@/components/compose/compose-context";
import { FloatingComposer } from "@/components/compose/floating-composer";
import { MailboxProvider } from "@/components/mailbox-provider";
import { MailboxSelector } from "@/components/mailbox-selector";
import { AdminNav } from "@/components/admin-nav";
import { SidebarProvider } from "@/components/sidebar-state";
import { MobileMenuButton, MobileSidebarBackdrop, ResponsiveAside } from "@/components/mobile-sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard requireMailbox requireRole="admin">
      <SidebarProvider expandedWidth={256}>
      <MailboxProvider>
        <ComposeProvider>
          <div className="grid h-dvh grid-cols-1 overflow-hidden bg-[#f5f5f5] transition-[grid-template-columns] duration-200 lg:grid-cols-[var(--sidebar-width)_minmax(0,1fr)]">
            <MobileSidebarBackdrop />
            <ResponsiveAside className="min-h-0">
              <AdminNav />
            </ResponsiveAside>
            <div className="flex min-h-0 min-w-0 flex-col">
              <MobileMenuButton className="fixed top-6 start-6 z-20 bg-white shadow-sm" />
              <span className="fixed top-6 end-6 flex items-center gap-2">
                <MailboxSelector />
              </span>
              <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain rounded-ss-3xl px-6 pb-10 pt-20 scrollbar-gutter-stable lg:px-12 lg:pt-10">
                <div className="w-full max-w-3xl">{children}</div>
              </main>
            </div>
            <FloatingComposer />
          </div>
        </ComposeProvider>
      </MailboxProvider>
      </SidebarProvider>
    </AuthGuard>
  );
}
