"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  DatabaseBackup,
  Download,
  Play,
  RefreshCw,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SkeletonRows } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import type { BackupItem, BackupSettings } from "./types";
import {
  WEEKDAYS,
  downloadBackup,
  fetchBackups,
  formatBackupDate,
  formatBackupSize,
  getStatusClass,
  removeBackup,
  restoreBackup,
  saveBackupSettings,
  startBackup,
} from "./utils";

export default function BackupsPage() {
  const queryClient = useQueryClient();
  const restoreInput = useRef<HTMLInputElement | null>(null);
  const [settings, setSettings] = useState<BackupSettings | null>(null);
  const backups = useQuery({
    queryKey: ["backups"],
    queryFn: fetchBackups,
    refetchInterval: (query) =>
      query.state.data?.backups.some(
        (backup) => backup.status === "queued" || backup.status === "running",
      )
        ? 5000
        : false,
  });

  useEffect(() => {
    if (backups.data?.settings) setSettings(backups.data.settings);
  }, [backups.data?.settings]);

  const saveSettings = useMutation({
    mutationFn: async () => {
      if (!settings) return;
      await saveBackupSettings(settings);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["backups"] }),
  });

  const runBackup = useMutation({
    mutationFn: startBackup,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["backups"] }),
  });

  const deleteBackup = useMutation({
    mutationFn: removeBackup,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["backups"] }),
  });

  const download = useMutation({ mutationFn: downloadBackup });
  const restore = useMutation({
    mutationFn: restoreBackup,
    onSuccess: () => window.location.assign("/login"),
  });
  const error =
    backups.error ||
    saveSettings.error ||
    runBackup.error ||
    deleteBackup.error ||
    download.error ||
    restore.error;
  const configuration = backups.data?.configuration;
  const backupConfigured = configuration?.configured === true;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-medium text-neutral-900">
            نسخ قاعدة البيانات الاحتياطية
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            تصدير سجلات قاعدة البيانات عبر ربط D1 وتخزينها في حزمة R2 المُعدّة.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            ref={restoreInput}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (!file || !window.confirm("استعادة هذه النسخة الاحتياطية؟ سيؤدي هذا إلى استبدال جميع سجلات قاعدة البيانات الحالية وقد يسجّل خروجك.")) return;
              restore.mutate(file);
            }}
          />
          <Button type="button" variant="outline" disabled={restore.isPending} onClick={() => restoreInput.current?.click()}>
            <Upload className="h-4 w-4" />
            {restore.isPending ? "جارٍ الاستعادة..." : "استعادة"}
          </Button>
          <Button onClick={() => runBackup.mutate()} disabled={runBackup.isPending || !backupConfigured}>
            <Play className="h-4 w-4" />
            {runBackup.isPending ? "جارٍ البدء..." : "نسخ احتياطي الآن"}
          </Button>
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error instanceof Error ? error.message : "فشلت عملية النسخ الاحتياطي"}
        </p>
      )}

      {configuration && !configuration.configured && (
        <Card className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
          <CardHeader className="py-0">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
              <div>
                <CardTitle className="text-amber-950">
                  أكمل إعداد النسخ الاحتياطي
                </CardTitle>
                <CardDescription className="mt-1 text-amber-800">
                  أضف القيم المفقودة ضمن إعدادات المتغيرات والأسرار الخاصة بالـ Worker المنشور.
                  يختفي هذا التنبيه بعد اكتمال إعداد النسخ الاحتياطي.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="flex flex-wrap items-center gap-2">
              {configuration.missing.map((item) => (
                <Badge
                  key={item}
                  variant="outline"
                  className="border-amber-300 bg-white/70 text-amber-900"
                >
                  {item}
                </Badge>
              ))}
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="ml-auto border-amber-300 bg-white/70"
                disabled={backups.isFetching}
                onClick={() => void backups.refetch()}
              >
                <RefreshCw
                  className={`h-4 w-4 ${backups.isFetching ? "animate-spin" : ""}`}
                />
                إعادة التحقق
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="rounded-3xl border-0 bg-white p-6">
        <CardHeader className="py-0">
          <CardTitle>النسخ الاحتياطي التلقائي</CardTitle>
          <CardDescription>
            يعمل الجدول في الساعة 02:00 بالتوقيت العالمي المنسق (UTC). تقتصر الجداول
            الشهرية على الأيام من 1 إلى 28. ملاحظة: الجدولة التلقائية تتطلب خطة Cloudflare
            Workers المدفوعة — على الخطة المجانية استخدم زر "نسخ احتياطي الآن" يدويًا بدلًا من ذلك.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 pt-5">
          {settings && (
            <>
              <div className="flex items-center gap-3 text-sm font-medium">
                <Switch
                  checked={settings.enabled}
                  onCheckedChange={(enabled) =>
                    setSettings({ ...settings, enabled })
                  }
                  aria-label="تفعيل النسخ الاحتياطي التلقائي"
                />
                <span>تفعيل النسخ الاحتياطي التلقائي</span>
              </div>

              {settings.enabled && (
                <>
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="schedule-type">التكرار</Label>
                      <Select
                        id="schedule-type"
                        value={settings.scheduleType}
                        onChange={(event) => {
                          const scheduleType = event.target
                            .value as BackupSettings["scheduleType"];
                          setSettings({
                            ...settings,
                            scheduleType,
                            scheduleValue:
                              scheduleType === "weekly"
                                ? 1
                                : scheduleType === "monthly"
                                  ? 1
                                  : null,
                          });
                        }}
                        className="flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm"
                      >
                        <option value="daily">يوميًا</option>
                        <option value="weekly">يوم محدد من الأسبوع</option>
                        <option value="monthly">يوم محدد من الشهر</option>
                      </Select>
                    </div>

                    {settings.scheduleType === "weekly" && (
                      <div className="space-y-2">
                        <Label htmlFor="weekday">يوم الأسبوع</Label>
                        <Select
                          id="weekday"
                          value={settings.scheduleValue ?? 1}
                          onChange={(event) =>
                            setSettings({
                              ...settings,
                              scheduleValue: Number(event.target.value),
                            })
                          }
                          className="flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm"
                        >
                          {WEEKDAYS.map((day) => (
                            <option key={day.value} value={day.value}>
                              {day.label}
                            </option>
                          ))}
                        </Select>
                      </div>
                    )}

                    {settings.scheduleType === "monthly" && (
                      <div className="space-y-2">
                        <Label htmlFor="month-day">يوم الشهر</Label>
                        <Input
                          id="month-day"
                          type="number"
                          min={1}
                          max={28}
                          value={settings.scheduleValue ?? 1}
                          onChange={(event) =>
                            setSettings({
                              ...settings,
                              scheduleValue: Number(event.target.value),
                            })
                          }
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid gap-4 border-t border-neutral-100 pt-5">
                    <div className="flex items-center gap-3 text-sm font-medium">
                      <Switch
                        checked={settings.retentionEnabled}
                        onCheckedChange={(retentionEnabled) =>
                          setSettings({
                            ...settings,
                            retentionEnabled,
                          })
                        }
                        aria-label="حذف النسخ الاحتياطية القديمة تلقائيًا"
                      />
                      <span>حذف النسخ الاحتياطية القديمة تلقائيًا</span>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="retention-days">
                        حذف النسخ الاحتياطية الأقدم من
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="retention-days"
                          type="number"
                          min={1}
                          max={3650}
                          value={settings.retentionDays}
                          disabled={!settings.retentionEnabled}
                          onChange={(event) =>
                            setSettings({
                              ...settings,
                              retentionDays: Number(event.target.value),
                            })
                          }
                        />
                        <span className="text-sm text-neutral-500">يوم</span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <Button
                onClick={() => saveSettings.mutate()}
                disabled={saveSettings.isPending}
              >
                <Save className="h-4 w-4" />
                {saveSettings.isPending ? "جارٍ الحفظ..." : "حفظ الإعدادات"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <section className="overflow-hidden rounded-3xl bg-white">
        <div className="flex items-center gap-3 border-b border-neutral-100 px-4 py-4">
          <DatabaseBackup className="h-5 w-5 text-neutral-500" />
          <h2 className="font-semibold text-neutral-900">سجل النسخ الاحتياطية</h2>
        </div>
        <div className="grid grid-cols-[1fr_110px_110px_170px_120px] gap-4 border-b border-neutral-100 bg-neutral-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
          <span>الملف</span>
          <span>الحالة</span>
          <span>الحجم</span>
          <span>تاريخ الإنشاء</span>
          <span>الإجراءات</span>
        </div>
        {backups.isLoading && <SkeletonRows count={5} />}
        {!backups.isLoading && (backups.data?.backups ?? []).length === 0 && (
          <p className="px-4 py-6 text-sm text-neutral-500">لا توجد نسخ احتياطية بعد.</p>
        )}
        {(backups.data?.backups ?? []).map((backup: BackupItem) => (
          <div
            key={backup.id}
            className="grid grid-cols-[1fr_110px_110px_170px_120px] items-center gap-4 border-b border-neutral-100 px-4 py-3 last:border-b-0"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-neutral-900">
                {backup.filename ?? backup.id}
              </p>
              <p className="truncate text-xs text-neutral-500">
                {backup.trigger === "manual" ? "يدوي" : "مجدوَل"}
                {backup.error ? `: ${backup.error}` : ""}
              </p>
            </div>
            <Badge variant="outline" className={getStatusClass(backup.status)}>
              {backup.status}
            </Badge>
            <span className="text-sm text-neutral-600">
              {formatBackupSize(backup.size)}
            </span>
            <span className="text-sm text-neutral-600">
              {formatBackupDate(backup.createdAt)}
            </span>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                title="تنزيل النسخة الاحتياطية"
                disabled={backup.status !== "completed" || download.isPending}
                onClick={() => download.mutate(backup)}
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                title="حذف النسخة الاحتياطية"
                disabled={
                  deleteBackup.isPending ||
                  backup.status === "queued" ||
                  backup.status === "running"
                }
                onClick={() => deleteBackup.mutate(backup.id)}
              >
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
