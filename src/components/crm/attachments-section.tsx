"use client";

import { useEffect, useState } from "react";
import { ImagePlus, Link as LinkIcon, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authFetch } from "@/lib/auth/client";

type Attachment = {
  id: string;
  kind: "image" | "link";
  url: string;
  label: string;
};

export function AttachmentsSection({ leadId, taskId }: { leadId?: string; taskId?: string }) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkLabel, setLinkLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const query = leadId ? `leadId=${leadId}` : `taskId=${taskId}`;

  function load() {
    setLoading(true);
    return authFetch(`/api/crm/attachments?${query}`)
      .then((response) => response.json())
      .then((data) => setAttachments((data as { attachments?: Attachment[] }).attachments ?? []))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId, taskId]);

  async function addLink() {
    if (!linkUrl.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const response = await authFetch("/api/crm/attachments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, taskId, url: linkUrl.trim(), label: linkLabel.trim() }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "تعذر إضافة الرابط");
      setLinkUrl("");
      setLinkLabel("");
      await load();
    } catch (addError) {
      setError(addError instanceof Error ? addError.message : "تعذر إضافة الرابط");
    } finally {
      setBusy(false);
    }
  }

  async function uploadImage(file: File) {
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      if (leadId) form.set("leadId", leadId);
      if (taskId) form.set("taskId", taskId);
      form.set("file", file);
      const response = await authFetch("/api/crm/attachments/upload", { method: "POST", body: form });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "تعذر رفع الصورة");
      await load();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "تعذر رفع الصورة");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setBusy(true);
    try {
      const response = await authFetch(`/api/crm/attachments/${id}`, { method: "DELETE" });
      if (response.ok) setAttachments((items) => items.filter((item) => item.id !== id));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-neutral-700">المرفقات</p>
      {loading ? (
        <p className="text-xs text-neutral-400">جارٍ التحميل...</p>
      ) : attachments.length === 0 ? (
        <p className="text-xs text-neutral-400">لا توجد مرفقات بعد.</p>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {attachments.map((attachment) =>
            attachment.kind === "image" ? (
              <div
                key={attachment.id}
                className="group relative aspect-square overflow-hidden rounded-lg border border-neutral-200"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={attachment.url} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  aria-label="حذف المرفق"
                  onClick={() => void remove(attachment.id)}
                  className="absolute end-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <a
                key={attachment.id}
                href={attachment.url}
                target="_blank"
                rel="noreferrer"
                className="group relative flex aspect-square flex-col justify-center gap-1 rounded-lg border border-neutral-200 p-2 text-xs hover:bg-neutral-50"
              >
                <LinkIcon className="h-4 w-4 shrink-0 text-neutral-500" />
                <span className="truncate text-neutral-700">{attachment.label || attachment.url}</span>
                <button
                  type="button"
                  aria-label="حذف المرفق"
                  onClick={(event) => {
                    event.preventDefault();
                    void remove(attachment.id);
                  }}
                  className="absolute end-1 top-1 rounded-full bg-white p-1 text-neutral-400 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 hover:text-red-600"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </a>
            ),
          )}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Input
          value={linkUrl}
          onChange={(event) => setLinkUrl(event.target.value)}
          placeholder="https://..."
          dir="ltr"
          className="h-8 flex-1 text-end text-xs"
        />
        <Input
          value={linkLabel}
          onChange={(event) => setLinkLabel(event.target.value)}
          placeholder="اسم الرابط (اختياري)"
          className="h-8 w-32 text-xs"
        />
        <Button type="button" size="sm" variant="outline" disabled={busy || !linkUrl.trim()} onClick={() => void addLink()}>
          <LinkIcon className="h-3.5 w-3.5" /> إضافة رابط
        </Button>
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50">
          <ImagePlus className="h-3.5 w-3.5" /> رفع صورة
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={busy}
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) void uploadImage(file);
            }}
          />
        </label>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
