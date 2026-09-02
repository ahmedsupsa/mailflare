"use client";

import type { FormEvent, KeyboardEvent } from "react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Folder, Plus, ShieldAlert, Trash2 } from "lucide-react";
import { useSelectedMailbox } from "@/components/mailbox-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { InboxRule, InboxRuleInput } from "./inbox-rules-types";
import {
  createInboxRule,
  deleteInboxRule,
  fetchInboxRules,
  fetchRuleFolders,
  getInboxRuleDestination,
  getRuleFieldLabel,
  getRuleOperatorLabel,
  updateInboxRule,
} from "./inbox-rules-utils";

export function InboxRules() {
  const queryClient = useQueryClient();
  const { selectedMailbox } = useSelectedMailbox();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<InboxRule | null>(null);
  const [matchField, setMatchField] = useState<"email" | "content" | "title">(
    "email",
  );
  const [matchOperator, setMatchOperator] = useState<"contains" | "exact">(
    "contains",
  );
  const [matchValue, setMatchValue] = useState("");
  const [destination, setDestination] = useState("");
  const mailboxId = selectedMailbox?.id ?? "";

  const folders = useQuery({
    queryKey: ["folders", mailboxId],
    enabled: !!mailboxId,
    queryFn: () => fetchRuleFolders(mailboxId),
  });
  const rules = useQuery({
    queryKey: ["routing-rules", mailboxId],
    enabled: !!mailboxId,
    queryFn: () => fetchInboxRules(mailboxId),
  });

  const save = useMutation({
    mutationFn: () => {
      const input: InboxRuleInput = {
        mailboxId,
        matchField,
        matchOperator,
        matchValue,
        destination,
        priority: editingRule?.priority ?? 10,
      };
      return editingRule
        ? updateInboxRule(editingRule.id, input)
        : createInboxRule(input);
    },
    onSuccess: () => {
      setDialogOpen(false);
      setEditingRule(null);
      queryClient.invalidateQueries({ queryKey: ["routing-rules", mailboxId] });
    },
  });
  const remove = useMutation({
    mutationFn: deleteInboxRule,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["routing-rules", mailboxId] }),
  });

  const folderMap = new Map(
    (folders.data?.folders ?? []).map((folder) => [folder.id, folder.name]),
  );

  function getRuleDestinationLabel(
    rule: Pick<InboxRule, "action" | "folderId">,
  ) {
    if (rule.action === "spam") return "البريد العشوائي";
    if (rule.action === "trash") return "المهملات";
    return folderMap.get(rule.folderId ?? "") ?? "مجلد غير معروف";
  }

  function openCreateDialog() {
    setEditingRule(null);
    setMatchField("email");
    setMatchOperator("contains");
    setMatchValue("");
    setDestination("");
    save.reset();
    setDialogOpen(true);
  }

  function openEditDialog(rule: InboxRule) {
    setEditingRule(rule);
    setMatchField(rule.matchField);
    setMatchOperator(rule.matchOperator);
    setMatchValue(rule.matchValue || rule.pattern);
    setDestination(getInboxRuleDestination(rule));
    save.reset();
    setDialogOpen(true);
  }

  function onRuleKeyDown(
    event: KeyboardEvent<HTMLDivElement>,
    rule: InboxRule,
  ) {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    openEditDialog(rule);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    save.mutate();
  }

  return (
    <section className="space-y-4">
			<div className="flex flex-row justify-end">
      <Button
        type="button"
        size="sm"
        onClick={openCreateDialog}
        disabled={!mailboxId}
      >
        <Plus className="h-4 w-4" />
        قاعدة جديدة
      </Button>
			</div>
      {(rules.data?.rules ?? []).length === 0 && (
        <p className="rounded-lg border border-dashed border-neutral-200 px-4 py-5 text-sm text-neutral-500">
          لا توجد قواعد حتى الآن
        </p>
      )}
      <div className="divide-y divide-neutral-100">
        {(rules.data?.rules ?? []).map((rule) => (
          <div
            key={rule.id}
            role="button"
            tabIndex={0}
            onClick={() => openEditDialog(rule)}
            onKeyDown={(event) => onRuleKeyDown(event, rule)}
            className="group -mx-3 flex cursor-pointer items-center gap-3 rounded-lg px-3 py-3 outline-none transition-colors hover:bg-neutral-50 focus-visible:bg-neutral-50 focus-visible:ring-2 focus-visible:ring-neutral-200"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-50 text-neutral-800">
              {rule.action === "spam" ? (
                <ShieldAlert className="h-4 w-4" />
              ) : rule.action === "trash" ? (
                <Trash2 className="h-4 w-4" />
              ) : (
                <Folder className="h-4 w-4" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-neutral-900">
                {getRuleFieldLabel(rule.matchField)}{" "}
                {getRuleOperatorLabel(rule.matchOperator)}{" "}
                {rule.matchValue || rule.pattern}
              </p>
              <p className="truncate text-xs text-neutral-500">
                {getRuleDestinationLabel(rule)}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={remove.isPending}
              onClick={(event) => {
                event.stopPropagation();
                remove.mutate(rule.id);
              }}
              onKeyDown={(event) => event.stopPropagation()}
              className="opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
              aria-label="حذف القاعدة"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingRule ? "تحديث القاعدة" : "قاعدة جديدة"}
            </DialogTitle>
            <DialogDescription>
              اختر ما تريد مطابقته والوجهة التي يجب أن تذهب إليها الرسالة.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="matchField">الحقل</Label>
                <Select
                  id="matchField"
                  className="h-10 w-full rounded-md border border-neutral-200 px-3 text-sm"
                  value={matchField}
                  onChange={(event) =>
                    setMatchField(
                      event.target.value as "email" | "content" | "title",
                    )
                  }
                >
                  <option value="email">عنوان البريد الإلكتروني</option>
                  <option value="content">المحتوى</option>
                  <option value="title">العنوان</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="matchOperator">المطابقة</Label>
                <Select
                  id="matchOperator"
                  className="h-10 w-full rounded-md border border-neutral-200 px-3 text-sm"
                  value={matchOperator}
                  onChange={(event) =>
                    setMatchOperator(event.target.value as "contains" | "exact")
                  }
                >
                  <option value="contains">يحتوي على</option>
                  <option value="exact">مطابقة تامة</option>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="matchValue">القيمة</Label>
              <Input
                id="matchValue"
                value={matchValue}
                onChange={(event) => setMatchValue(event.target.value)}
                placeholder={
                  matchField === "email" ? "sender@example.com" : "فاتورة"
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="destination">الوجهة</Label>
              <Select
                id="destination"
                className="h-10 w-full rounded-md border border-neutral-200 px-3 text-sm"
                value={destination}
                onChange={(event) => setDestination(event.target.value)}
              >
                <option value="">اختر الوجهة</option>
                <option value="spam">البريد العشوائي</option>
                <option value="trash">المهملات</option>
                {(folders.data?.folders ?? []).map((folder) => (
                  <option key={folder.id} value={`folder:${folder.id}`}>
                    {folder.name}
                  </option>
                ))}
              </Select>
            </div>
            {save.isError && (
              <p className="text-sm text-red-600">{save.error.message}</p>
            )}
            <Button
              type="submit"
              disabled={
                !mailboxId ||
                !destination ||
                !matchValue.trim() ||
                save.isPending
              }
            >
              {save.isPending
                ? "جارٍ الحفظ..."
                : editingRule
                  ? "تحديث القاعدة"
                  : "إضافة قاعدة"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
