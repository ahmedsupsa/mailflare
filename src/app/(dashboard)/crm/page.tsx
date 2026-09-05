"use client";

import { useEffect, useMemo, useState } from "react";
import { Briefcase, ListTodo, Plus, Search, Trash2, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Textarea } from "@/components/ui/textarea";
import { authFetch } from "@/lib/auth/client";

type LeadStatus = "new" | "contacted" | "interested" | "won" | "lost";
type TaskStatus = "pending" | "done";

type Lead = {
  id: string;
  businessName: string;
  contactName: string;
  phone: string;
  email: string;
  status: LeadStatus;
  notes: string;
  createdByName: string;
  createdAt: string;
};

type Task = {
  id: string;
  title: string;
  description: string;
  dueAt: string | null;
  status: TaskStatus;
  assigneeUserId: string | null;
  assigneeName: string | null;
  leadId: string | null;
  leadName: string | null;
  createdByName: string;
};

type TeamMember = { id: string; name: string; email: string };

const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: "جديد",
  contacted: "تم التواصل",
  interested: "مهتم",
  won: "أصبح عميل",
  lost: "غير مهتم",
};

const LEAD_STATUS_BADGE: Record<LeadStatus, "default" | "secondary" | "outline" | "success"> = {
  new: "secondary",
  contacted: "outline",
  interested: "outline",
  won: "success",
  lost: "outline",
};

const emptyLeadForm = { businessName: "", contactName: "", phone: "", email: "", status: "new" as LeadStatus, notes: "" };
const emptyTaskForm = { title: "", description: "", dueAt: "", assigneeUserId: "", leadId: "" };

export default function CrmPage() {
  const [tab, setTab] = useState<"leads" | "tasks">("leads");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);

  const [leadDialogOpen, setLeadDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [leadForm, setLeadForm] = useState(emptyLeadForm);
  const [leadSaving, setLeadSaving] = useState(false);
  const [leadError, setLeadError] = useState<string | null>(null);

  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskForm, setTaskForm] = useState(emptyTaskForm);
  const [taskSaving, setTaskSaving] = useState(false);
  const [taskError, setTaskError] = useState<string | null>(null);

  function loadLeads() {
    return authFetch("/api/crm/leads")
      .then((response) => response.json())
      .then((data) => setLeads((data as { leads?: Lead[] }).leads ?? []));
  }

  function loadTasks() {
    return authFetch("/api/crm/tasks")
      .then((response) => response.json())
      .then((data) => setTasks((data as { tasks?: Task[] }).tasks ?? []));
  }

  useEffect(() => {
    setLoading(true);
    Promise.all([
      loadLeads(),
      loadTasks(),
      authFetch("/api/team/members")
        .then((response) => response.json())
        .then((data) => setTeamMembers((data as { members?: TeamMember[] }).members ?? [])),
    ]).finally(() => setLoading(false));
  }, []);

  function openCreateLead() {
    setEditingLead(null);
    setLeadForm(emptyLeadForm);
    setLeadError(null);
    setLeadDialogOpen(true);
  }

  function openEditLead(lead: Lead) {
    setEditingLead(lead);
    setLeadForm({
      businessName: lead.businessName,
      contactName: lead.contactName,
      phone: lead.phone,
      email: lead.email,
      status: lead.status,
      notes: lead.notes,
    });
    setLeadError(null);
    setLeadDialogOpen(true);
  }

  async function saveLead() {
    setLeadSaving(true);
    setLeadError(null);
    try {
      const response = await authFetch(
        editingLead ? `/api/crm/leads/${editingLead.id}` : "/api/crm/leads",
        {
          method: editingLead ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(leadForm),
        },
      );
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "تعذر حفظ العميل المحتمل");
      await loadLeads();
      setLeadDialogOpen(false);
    } catch (error) {
      setLeadError(error instanceof Error ? error.message : "تعذر حفظ العميل المحتمل");
    } finally {
      setLeadSaving(false);
    }
  }

  async function deleteLead(id: string) {
    if (!window.confirm("هل تريد حذف هذا العميل المحتمل؟")) return;
    setPendingId(id);
    try {
      const response = await authFetch(`/api/crm/leads/${id}`, { method: "DELETE" });
      if (response.ok) {
        setLeads((items) => items.filter((item) => item.id !== id));
        setTasks((items) => items.map((item) => (item.leadId === id ? { ...item, leadId: null, leadName: null } : item)));
      }
    } finally {
      setPendingId(null);
    }
  }

  function openCreateTask() {
    setEditingTask(null);
    setTaskForm(emptyTaskForm);
    setTaskError(null);
    setTaskDialogOpen(true);
  }

  function openEditTask(task: Task) {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description,
      dueAt: task.dueAt ? task.dueAt.slice(0, 16) : "",
      assigneeUserId: task.assigneeUserId ?? "",
      leadId: task.leadId ?? "",
    });
    setTaskError(null);
    setTaskDialogOpen(true);
  }

  async function saveTask() {
    setTaskSaving(true);
    setTaskError(null);
    try {
      const response = await authFetch(
        editingTask ? `/api/crm/tasks/${editingTask.id}` : "/api/crm/tasks",
        {
          method: editingTask ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...taskForm,
            dueAt: taskForm.dueAt || null,
            assigneeUserId: taskForm.assigneeUserId || null,
            leadId: taskForm.leadId || null,
            status: editingTask?.status ?? "pending",
          }),
        },
      );
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "تعذر حفظ المهمة");
      await loadTasks();
      setTaskDialogOpen(false);
    } catch (error) {
      setTaskError(error instanceof Error ? error.message : "تعذر حفظ المهمة");
    } finally {
      setTaskSaving(false);
    }
  }

  async function toggleTaskStatus(task: Task) {
    setPendingId(task.id);
    const nextStatus: TaskStatus = task.status === "done" ? "pending" : "done";
    try {
      const response = await authFetch(`/api/crm/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: task.title,
          description: task.description,
          dueAt: task.dueAt,
          assigneeUserId: task.assigneeUserId,
          leadId: task.leadId,
          status: nextStatus,
        }),
      });
      if (response.ok) {
        setTasks((items) => items.map((item) => (item.id === task.id ? { ...item, status: nextStatus } : item)));
      }
    } finally {
      setPendingId(null);
    }
  }

  async function deleteTask(id: string) {
    if (!window.confirm("هل تريد حذف هذه المهمة؟")) return;
    setPendingId(id);
    try {
      const response = await authFetch(`/api/crm/tasks/${id}`, { method: "DELETE" });
      if (response.ok) setTasks((items) => items.filter((item) => item.id !== id));
    } finally {
      setPendingId(null);
    }
  }

  const filteredLeads = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return leads;
    return leads.filter(
      (lead) =>
        lead.contactName.toLowerCase().includes(query) ||
        lead.businessName.toLowerCase().includes(query) ||
        lead.phone.toLowerCase().includes(query) ||
        lead.email.toLowerCase().includes(query),
    );
  }, [leads, search]);

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-8">
      <div className="mb-6">
        <h1 className="flex items-center gap-3 text-2xl font-semibold text-neutral-900">
          <Briefcase className="h-7 w-7 text-neutral-900" />
          علاقات العملاء والمهام
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          اجمع بيانات العملاء المحتملين وتابع مهامك — يشوفها كل أعضاء الفريق.
        </p>
      </div>

      <div className="mb-6 flex gap-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setTab("leads")}
          className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            tab === "leads" ? "bg-neutral-900 text-white" : "bg-white text-neutral-600 hover:bg-neutral-100"
          }`}
        >
          <Users className="h-4 w-4" />
          العملاء المحتملون
          <span className="text-xs opacity-70">({leads.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setTab("tasks")}
          className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            tab === "tasks" ? "bg-neutral-900 text-white" : "bg-white text-neutral-600 hover:bg-neutral-100"
          }`}
        >
          <ListTodo className="h-4 w-4" />
          المهام
          <span className="text-xs opacity-70">({tasks.filter((task) => task.status === "pending").length})</span>
        </button>
      </div>

      {tab === "leads" && (
        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            {leads.length > 0 ? (
              <div className="flex h-11 min-w-56 flex-1 items-center gap-3 rounded-full border border-neutral-200 bg-white px-4 text-neutral-600">
                <Search className="h-4 w-4 shrink-0 text-neutral-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="ابحث بالاسم أو النشاط أو الجوال"
                  className="h-full min-w-0 flex-1 bg-transparent text-sm text-neutral-800 outline-none placeholder:text-neutral-400"
                />
              </div>
            ) : (
              <span />
            )}
            <Button onClick={openCreateLead}>
              <Plus className="h-4 w-4" />
              عميل محتمل جديد
            </Button>
          </div>

          <div className="overflow-hidden rounded-xl border border-neutral-200">
            {loading ? (
              <p className="p-8 text-center text-sm text-neutral-500">جارٍ التحميل...</p>
            ) : leads.length === 0 ? (
              <p className="p-8 text-center text-sm text-neutral-500">
                لا يوجد عملاء محتملون بعد. ابدأ بإضافة أول عميل محتمل.
              </p>
            ) : filteredLeads.length === 0 ? (
              <p className="p-8 text-center text-sm text-neutral-500">لا توجد نتائج مطابقة لـ «{search}»</p>
            ) : (
              filteredLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="flex flex-wrap items-start gap-3 border-b border-neutral-100 px-4 py-4 last:border-b-0 sm:px-5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEditLead(lead)}
                        className="truncate font-medium text-neutral-900 hover:underline"
                      >
                        {lead.businessName || lead.contactName}
                      </button>
                      <Badge variant={LEAD_STATUS_BADGE[lead.status]}>{LEAD_STATUS_LABELS[lead.status]}</Badge>
                    </div>
                    {lead.businessName && (
                      <p className="truncate text-sm text-neutral-600">{lead.contactName}</p>
                    )}
                    <p className="truncate text-sm text-neutral-500">
                      {[lead.phone, lead.email].filter(Boolean).join(" · ") || "لا توجد بيانات تواصل"}
                    </p>
                    {lead.notes && <p className="mt-1 truncate text-xs text-neutral-400">{lead.notes}</p>}
                    <p className="mt-1 text-xs text-neutral-400">أضافه {lead.createdByName}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="حذف العميل المحتمل"
                    disabled={pendingId !== null}
                    onClick={() => void deleteLead(lead.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {tab === "tasks" && (
        <div>
          <div className="mb-4 flex justify-end">
            <Button onClick={openCreateTask}>
              <Plus className="h-4 w-4" />
              مهمة جديدة
            </Button>
          </div>

          <div className="overflow-hidden rounded-xl border border-neutral-200">
            {loading ? (
              <p className="p-8 text-center text-sm text-neutral-500">جارٍ التحميل...</p>
            ) : tasks.length === 0 ? (
              <p className="p-8 text-center text-sm text-neutral-500">لا توجد مهام بعد.</p>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-start gap-3 border-b border-neutral-100 px-4 py-4 last:border-b-0 sm:px-5"
                >
                  <Checkbox
                    className="mt-1"
                    checked={task.status === "done"}
                    disabled={pendingId !== null}
                    onChange={() => void toggleTaskStatus(task)}
                  />
                  <div className="min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => openEditTask(task)}
                      className={`truncate text-start font-medium hover:underline ${
                        task.status === "done" ? "text-neutral-400 line-through" : "text-neutral-900"
                      }`}
                    >
                      {task.title}
                    </button>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                      {task.dueAt && <span>يستحق {new Date(task.dueAt).toLocaleDateString()}</span>}
                      {task.assigneeName && <Badge variant="secondary">{task.assigneeName}</Badge>}
                      {task.leadName && <Badge variant="outline">{task.leadName}</Badge>}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="حذف المهمة"
                    disabled={pendingId !== null}
                    onClick={() => void deleteTask(task.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <Dialog open={leadDialogOpen} onOpenChange={setLeadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingLead ? "تعديل عميل محتمل" : "عميل محتمل جديد"}</DialogTitle>
            <DialogDescription>هذه البيانات تظهر لجميع أعضاء الفريق.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="lead-business">اسم النشاط (المطعم أو المقهى)</Label>
              <Input
                id="lead-business"
                value={leadForm.businessName}
                onChange={(event) => setLeadForm((form) => ({ ...form, businessName: event.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lead-contact">اسم المسؤول</Label>
              <Input
                id="lead-contact"
                value={leadForm.contactName}
                onChange={(event) => setLeadForm((form) => ({ ...form, contactName: event.target.value }))}
                required
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="lead-phone">الجوال</Label>
                <Input
                  id="lead-phone"
                  dir="ltr"
                  className="text-end"
                  value={leadForm.phone}
                  onChange={(event) => setLeadForm((form) => ({ ...form, phone: event.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lead-email">البريد الإلكتروني</Label>
                <Input
                  id="lead-email"
                  dir="ltr"
                  className="text-end"
                  value={leadForm.email}
                  onChange={(event) => setLeadForm((form) => ({ ...form, email: event.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lead-status">الحالة</Label>
              <Select
                id="lead-status"
                className="h-10 w-full px-3 text-sm"
                value={leadForm.status}
                onChange={(event) => setLeadForm((form) => ({ ...form, status: event.target.value as LeadStatus }))}
              >
                {Object.entries(LEAD_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lead-notes">ملاحظات</Label>
              <Textarea
                id="lead-notes"
                value={leadForm.notes}
                onChange={(event) => setLeadForm((form) => ({ ...form, notes: event.target.value }))}
              />
            </div>
            {leadError && <p className="text-sm text-red-600">{leadError}</p>}
            <Button
              className="w-full"
              onClick={() => void saveLead()}
              disabled={!leadForm.contactName.trim() || leadSaving}
            >
              {leadSaving ? "جارٍ الحفظ..." : editingLead ? "حفظ التغييرات" : "إضافة العميل المحتمل"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTask ? "تعديل مهمة" : "مهمة جديدة"}</DialogTitle>
            <DialogDescription>المهام مشتركة بين جميع أعضاء الفريق.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="task-title">العنوان</Label>
              <Input
                id="task-title"
                value={taskForm.title}
                onChange={(event) => setTaskForm((form) => ({ ...form, title: event.target.value }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="task-description">الوصف</Label>
              <Textarea
                id="task-description"
                value={taskForm.description}
                onChange={(event) => setTaskForm((form) => ({ ...form, description: event.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="task-due">تاريخ الاستحقاق (اختياري)</Label>
              <Input
                id="task-due"
                type="datetime-local"
                dir="ltr"
                className="text-end"
                value={taskForm.dueAt}
                onChange={(event) => setTaskForm((form) => ({ ...form, dueAt: event.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="task-assignee">المسؤول عن المهمة (اختياري)</Label>
              <Select
                id="task-assignee"
                className="h-10 w-full px-3 text-sm"
                value={taskForm.assigneeUserId}
                onChange={(event) => setTaskForm((form) => ({ ...form, assigneeUserId: event.target.value }))}
              >
                <option value="">بدون تحديد</option>
                {teamMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="task-lead">مرتبطة بعميل محتمل (اختياري)</Label>
              <Select
                id="task-lead"
                className="h-10 w-full px-3 text-sm"
                value={taskForm.leadId}
                onChange={(event) => setTaskForm((form) => ({ ...form, leadId: event.target.value }))}
              >
                <option value="">بدون تحديد</option>
                {leads.map((lead) => (
                  <option key={lead.id} value={lead.id}>
                    {lead.businessName || lead.contactName}
                  </option>
                ))}
              </Select>
            </div>
            {taskError && <p className="text-sm text-red-600">{taskError}</p>}
            <Button className="w-full" onClick={() => void saveTask()} disabled={!taskForm.title.trim() || taskSaving}>
              {taskSaving ? "جارٍ الحفظ..." : editingTask ? "حفظ التغييرات" : "إضافة المهمة"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
