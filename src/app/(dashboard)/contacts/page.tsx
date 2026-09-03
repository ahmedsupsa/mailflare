"use client";

import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { Ban, Contact as ContactIcon, Search, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SkeletonRows } from "@/components/ui/skeleton";
import { ContactDetailsTrigger } from "@/components/contacts/contact-details";
import { authFetch } from "@/lib/auth/client";
import { useSelectedMailbox } from "@/components/mailbox-provider";

type ContactRow = {
  id: string;
  email: string;
  displayName: string | null;
  source: "manual" | "inbound" | "outbound";
  blocked: boolean;
  lastSeenAt: string | null;
};

export default function ContactsPage() {
  const { selectedMailbox } = useSelectedMailbox();
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);

  function loadContacts(mailboxId: string) {
    setLoading(true);
    void authFetch(`/api/contacts?mailboxId=${mailboxId}`)
      .then((response) => response.json())
      .then((data) => setContacts((data as { contacts?: ContactRow[] }).contacts ?? []))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (!selectedMailbox?.id) return;
    loadContacts(selectedMailbox.id);
  }, [selectedMailbox?.id]);

  async function toggleBlock(contact: ContactRow) {
    if (!selectedMailbox?.id) return;
    setPendingId(contact.id);
    try {
      const response = await authFetch(`/api/contacts/${contact.blocked ? "unblock" : "block"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mailboxId: selectedMailbox.id, address: contact.email }),
      });
      if (response.ok) {
        setContacts((items) =>
          items.map((item) => (item.id === contact.id ? { ...item, blocked: !contact.blocked } : item)),
        );
      }
    } finally {
      setPendingId(null);
    }
  }

  const filteredContacts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return contacts;
    return contacts.filter(
      (contact) =>
        contact.email.toLowerCase().includes(query) ||
        (contact.displayName ?? "").toLowerCase().includes(query),
    );
  }, [contacts, search]);

  return (
    <div className="mx-auto max-w-5xl p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-semibold text-neutral-900">
            <ContactIcon className="h-7 w-7 text-neutral-900" />
            جهات الاتصال
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            كل شخص راسلك أو راسلته يتحفظ هنا تلقائيًا.
          </p>
        </div>
      </div>

      {contacts.length > 0 && (
        <div className="mb-4 flex h-11 items-center gap-3 rounded-full border border-neutral-200 bg-white px-4 text-neutral-600">
          <Search className="h-4 w-4 shrink-0 text-neutral-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="ابحث بالاسم أو البريد الإلكتروني"
            className="h-full min-w-0 flex-1 bg-transparent text-sm text-neutral-800 outline-none placeholder:text-neutral-400"
          />
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-neutral-200">
        {loading ? (
          <SkeletonRows count={5} compact />
        ) : contacts.length === 0 ? (
          <p className="p-8 text-center text-sm text-neutral-500">
            لا توجد جهات اتصال بعد — كل شخص تراسله من صندوقك سيظهر هنا تلقائيًا.
          </p>
        ) : filteredContacts.length === 0 ? (
          <p className="p-8 text-center text-sm text-neutral-500">لا توجد نتائج مطابقة لـ «{search}»</p>
        ) : (
          filteredContacts.map((contact) => {
            const name = contact.displayName ?? contact.email;
            return (
              <div
                key={contact.id}
                className="flex items-center gap-4 border-b border-neutral-100 px-5 py-4 last:border-b-0"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-sm font-semibold text-neutral-800">
                  {name.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <ContactDetailsTrigger
                      mailboxId={selectedMailbox?.id ?? null}
                      address={contact.email}
                      name={name}
                      className="font-medium text-neutral-900"
                    />
                    {contact.blocked && (
                      <Badge variant="outline" className="gap-1 text-red-600">
                        <Ban className="h-3 w-3" /> محظور
                      </Badge>
                    )}
                  </div>
                  <p className="truncate text-sm text-neutral-500">{contact.email}</p>
                </div>
                <span className="shrink-0 text-xs text-neutral-400">
                  {contact.lastSeenAt ? dayjs(contact.lastSeenAt).format("D MMM YYYY") : ""}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pendingId === contact.id}
                  onClick={() => void toggleBlock(contact)}
                >
                  {contact.blocked ? (
                    <>
                      <ShieldCheck className="h-4 w-4" /> إلغاء الحظر
                    </>
                  ) : (
                    <>
                      <Ban className="h-4 w-4" /> حظر
                    </>
                  )}
                </Button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
