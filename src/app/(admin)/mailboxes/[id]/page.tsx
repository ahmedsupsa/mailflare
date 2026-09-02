"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save, Trash2, UserPlus } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  deleteMailbox,
  fetchMailbox,
  fetchSharedInboxAccess,
  getMailboxAddress,
  grantSharedInboxAccess,
  revokeSharedInboxAccess,
  updateMailboxSettings,
} from "./utils";
import MailboxAvatarForm from "./MailboxAvatarForm";

export default function MailboxSettingsPage() {
  const params = useParams<{ id: string }>();
  const mailboxId = params.id;
  const qc = useQueryClient();
  const [displayName, setDisplayName] = useState("");
  const [useAllDomains, setUseAllDomains] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState("");

  const mailbox = useQuery({
    queryKey: ["mailbox", mailboxId],
    queryFn: () => fetchMailbox(mailboxId),
    enabled: !!mailboxId,
  });

  useEffect(() => {
    if (mailbox.data) {
      setDisplayName(mailbox.data.displayName ?? "");
      setUseAllDomains(mailbox.data.useAllDomains);
    }
  }, [mailbox.data]);

  const updateName = useMutation({
    mutationFn: () => updateMailboxSettings(mailboxId, { displayName, useAllDomains }),
    onSuccess: (updatedMailbox) => {
      qc.setQueryData(["mailbox", mailboxId], updatedMailbox);
      qc.invalidateQueries({ queryKey: ["mailboxes"] });
    },
  });

  const router = useRouter();
  const removeMailbox = useMutation({
    mutationFn: () => deleteMailbox(mailboxId),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["mailboxes"] });
      router.push("/mailboxes");
    },
  });

  const sharedAccess = useQuery({
    queryKey: ["mailbox", mailboxId, "access"],
    queryFn: () => fetchSharedInboxAccess(mailboxId),
    enabled: mailbox.data?.type === "shared",
  });
  const addMember = useMutation({
    mutationFn: () => grantSharedInboxAccess(mailboxId, selectedUserId),
    onSuccess: async () => {
      setSelectedUserId("");
      await qc.invalidateQueries({ queryKey: ["mailbox", mailboxId, "access"] });
    },
  });
  const removeMember = useMutation({
    mutationFn: (userId: string) => revokeSharedInboxAccess(mailboxId, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mailbox", mailboxId, "access"] }),
  });

  const address = mailbox.data ? getMailboxAddress(mailbox.data) : "";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-3xl font-medium text-neutral-900">
            الإعدادات
          </h1>
          {address ? (
            <p className="mt-1 truncate no-font-mono text-sm text-neutral-500">
              {address}
            </p>
          ) : (
            <Skeleton className="mt-2 h-4 w-52" />
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {mailbox.data?.type === "shared" && (
            <Badge variant="secondary">مشترك</Badge>
          )}
          {mailbox.data?.isPrimary && (
            <Badge variant="secondary">أساسي</Badge>
          )}
        </div>
      </div>

      {mailbox.isError && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {mailbox.error instanceof Error
            ? mailbox.error.message
            : "تعذر تحميل صندوق البريد"}
        </p>
      )}

      <Card className="rounded-3xl border-0 bg-white p-6">
        <CardHeader className="py-0">
          <CardTitle>الحساب</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-5">
          {mailbox.data ? (
            <MailboxAvatarForm
              mailboxId={mailbox.data.id}
              hasAvatar={!!mailbox.data.hasAvatar}
              name={mailbox.data.displayName || mailbox.data.localPart}
            />
          ) : (
            <Skeleton className="h-24 w-24 rounded-full" />
          )}

          <div className="space-y-2">
            <Label htmlFor="displayName">الاسم</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder={mailbox.data?.localPart ?? "اسم صندوق البريد"}
              disabled={mailbox.isLoading || updateName.isPending}
            />
          </div>
          <label className="flex items-start gap-3 rounded-xl bg-neutral-50 p-4">
            <Checkbox
              checked={useAllDomains}
              onChange={(event) => setUseAllDomains(event.target.checked)}
              disabled={mailbox.isLoading || updateName.isPending}
            />
            <span>
              <span className="block text-sm font-medium text-neutral-900">استخدام جميع النطاقات</span>
              <span className="mt-1 block text-sm text-neutral-500">
                استقبال البريد وإرساله بهذا الاسم على كل نطاق نشط في حساب الإدارة هذا.
              </span>
            </span>
          </label>
          {updateName.isError && (
            <p className="text-sm text-red-600">
              {updateName.error instanceof Error
                ? updateName.error.message
                : "تعذر تحديث صندوق البريد"}
            </p>
          )}
          {updateName.isSuccess && (
            <p className="text-sm text-green-700">تم حفظ إعدادات صندوق البريد</p>
          )}
          <Button
            onClick={() => updateName.mutate()}
            disabled={mailbox.isLoading || updateName.isPending}
          >
            <Save className="h-4 w-4" />
            {updateName.isPending ? "جارٍ الحفظ..." : "حفظ التغييرات"}
          </Button>
        </CardContent>
      </Card>

      {mailbox.data?.type === "shared" && (
        <Card className="rounded-3xl border-0 bg-white p-6">
          <CardHeader className="py-0">
            <CardTitle>الوصول المشترك</CardTitle>
            <CardDescription>
              يمكن لأعضاء الفريق المضافين هنا قراءة البريد في هذا الصندوق وإرساله وتنظيمه وإدارته.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            {sharedAccess.isLoading && <Skeleton className="h-16 w-full rounded-2xl" />}
            {(sharedAccess.data?.members ?? []).map((member) => (
              <div
                key={member.userId}
                className="flex items-center justify-between gap-3 rounded-2xl bg-neutral-50 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-neutral-900">
                    {member.userName}
                  </p>
                  <p className="truncate text-xs text-neutral-500">{member.userEmail}</p>
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label={`إزالة ${member.userName}`}
                  disabled={removeMember.isPending}
                  onClick={() => removeMember.mutate(member.userId)}
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            ))}
            {sharedAccess.data && sharedAccess.data.members.length === 0 && (
              <p className="rounded-2xl bg-neutral-50 px-4 py-3 text-sm text-neutral-500">
                لا يملك أي عضو من الفريق حق الوصول بعد.
              </p>
            )}
            {sharedAccess.isError && (
              <p className="text-sm text-red-600">
                {sharedAccess.error instanceof Error
                  ? sharedAccess.error.message
                  : "تعذر تحميل الوصول المشترك"}
              </p>
            )}
            <div className="flex gap-2">
              <Select
                value={selectedUserId}
                onChange={(event) => setSelectedUserId(event.target.value)}
                className="h-10 min-w-0 flex-1 text-sm"
              >
                <option value="">اختر حسابًا</option>
                {(sharedAccess.data?.availableUsers ?? [])
                  .filter(
                    (account) =>
                      !sharedAccess.data?.members.some((member) => member.userId === account.id),
                  )
                  .map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} ({account.email})
                    </option>
                  ))}
              </Select>
              <Button
                type="button"
                disabled={!selectedUserId || addMember.isPending}
                onClick={() => addMember.mutate()}
              >
                <UserPlus className="h-4 w-4" />
                {addMember.isPending ? "جارٍ الإضافة..." : "إضافة مستخدم"}
              </Button>
            </div>
            {addMember.isError && (
              <p className="text-sm text-red-600">
                {addMember.error instanceof Error ? addMember.error.message : "تعذرت إضافة الحساب"}
              </p>
            )}
          </CardContent>
        </Card>
      )}
      <Card className="rounded-3xl border-0 bg-white p-6">
        <CardHeader className="py-0">
          <CardTitle className="text-red-700">منطقة الخطر</CardTitle>
          <CardDescription>
            حذف صندوق البريد هذا يزيل قاعدة توجيه البريد الإلكتروني الخاصة به في
            Cloudflare، لذا لن يُقبل بعد الآن أي بريد جديد يُرسل إلى {address || "هذا العنوان"}.
            تبقى الرسائل المستلمة سابقًا في قاعدة البيانات لكنها لن تظهر بعد الآن في
            أي صندوق وارد. لا يمكن التراجع عن هذا الإجراء.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-5">
          {removeMailbox.isError && (
            <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {removeMailbox.error instanceof Error
                ? removeMailbox.error.message
                : "تعذر حذف صندوق البريد"}
            </p>
          )}
          <Button
            type="button"
            variant="destructive"
            disabled={!mailbox.data || removeMailbox.isPending}
            onClick={() => {
              if (
                !window.confirm(
                  `هل تريد حذف ${address}؟ سيؤدي هذا إلى إزالة قاعدة توجيه البريد الإلكتروني الخاصة به ولا يمكن التراجع عنه.`,
                )
              )
                return;
              removeMailbox.mutate();
            }}
          >
            <Trash2 className="h-4 w-4" />
            {removeMailbox.isPending ? "جارٍ الحذف..." : "حذف صندوق البريد"}
          </Button>
        </CardContent>
      </Card>

{/* 
      <Card className="rounded-3xl border-0 bg-white p-6">
        <CardHeader className="py-0">
          <CardTitle>Address</CardTitle>
          <CardDescription>
            The email address, username, and domain are managed as routing
            resources.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 pt-5">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              Email
            </p>
            <p className="truncate no-font-mono text-sm text-neutral-900">
              {address || "-"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              Username
            </p>
            <p className="truncate no-font-mono text-sm text-neutral-900">
              {mailbox.data?.localPart ?? "-"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              Domain
            </p>
            <p className="truncate no-font-mono text-sm text-neutral-900">
              {mailbox.data?.hostname ?? "-"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              Routing
            </p>
            <p className="flex items-center gap-2 text-sm text-neutral-900">
              <Mail className="h-4 w-4 text-neutral-400" />
              Cloudflare Email Routing
            </p>
          </div>
        </CardContent>
      </Card> */}
    </div>
  );
}
