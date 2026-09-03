"use client";

import { useEffect, useState } from "react";
import { Check, CalendarDays, Pencil, Plus, Trash2, UsersRound, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { authFetch } from "@/lib/auth/client";
import { useSelectedMailbox } from "@/components/mailbox-provider";

type AttendeeStatus = "pending" | "accepted" | "declined";

type Attendee = {
  userId: string;
  name: string;
  email: string;
  status: AttendeeStatus;
};

type CalendarEvent = {
  id: string;
  title: string;
  description: string;
  location: string;
  startsAt: string;
  endsAt: string;
  organizerName: string;
  isOrganizer: boolean;
  attendees: Attendee[];
  myStatus: "organizer" | AttendeeStatus;
};

type TeamMember = {
  id: string;
  name: string;
  email: string;
};

function statusLabel(status: AttendeeStatus) {
  if (status === "accepted") return "قبِل";
  if (status === "declined") return "اعتذر";
  return "بالانتظار";
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [title, setTitle] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [adding, setAdding] = useState(false);
  const [attendeeIds, setAttendeeIds] = useState<string[]>([]);
  const [editing, setEditing] = useState<CalendarEvent | null>(null);
  const [pendingAction, setPendingAction] = useState<"save" | string | null>(null);
  const { selectedMailbox } = useSelectedMailbox();

  useEffect(() => {
    refreshEvents();
    void authFetch("/api/team/members")
      .then((response) => response.json())
      .then((data) => setTeamMembers((data as { members?: TeamMember[] }).members ?? []));
  }, []);

  function refreshEvents() {
    const start = new Date();
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
    void authFetch(
      `/api/calendar/events?start=${start.toISOString()}&end=${end.toISOString()}`,
    )
      .then((response) => response.json())
      .then((data) => setEvents((data as { events?: CalendarEvent[] }).events ?? []));
  }

  async function addEvent() {
    setPendingAction("save");
    try {
      const response = await authFetch(
        editing ? `/api/calendar/events/${editing.id}` : "/api/calendar/events",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            startsAt,
            endsAt,
            attendeeIds,
            mailboxId: selectedMailbox?.id,
          }),
        },
      );
      if (response.ok) {
        refreshEvents();
        setTitle("");
        setStartsAt("");
        setEndsAt("");
        setAttendeeIds([]);
        setEditing(null);
        setAdding(false);
      }
    } finally {
      setPendingAction(null);
    }
  }

  async function deleteEvent(id: string) {
    if (!window.confirm("هل تريد حذف هذا الحدث؟")) return;
    setPendingAction(id);
    try {
      const response = await authFetch(`/api/calendar/events/${id}`, {
        method: "DELETE",
      });
      if (response.ok)
        setEvents((items) => items.filter((event) => event.id !== id));
    } finally {
      setPendingAction(null);
    }
  }

  async function respond(id: string, status: "accepted" | "declined") {
    setPendingAction(id);
    try {
      const response = await authFetch(`/api/calendar/events/${id}/rsvp`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (response.ok) {
        setEvents((items) =>
          items.map((event) => (event.id === id ? { ...event, myStatus: status } : event)),
        );
      }
    } finally {
      setPendingAction(null);
    }
  }

  function editEvent(event: CalendarEvent) {
    setEditing(event);
    setTitle(event.title);
    setStartsAt(event.startsAt.slice(0, 16));
    setEndsAt(event.endsAt.slice(0, 16));
    setAttendeeIds(event.attendees.map((attendee) => attendee.userId));
    setAdding(true);
  }

  function toggleAttendee(id: string) {
    setAttendeeIds((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    );
  }

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-semibold text-neutral-900">
            <CalendarDays className="h-7 w-7 text-neutral-900" />
            التقويم
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            أحداثك القادمة ودعوات زملائك — تظهر مباشرة في تقويمهم دون إرسال أي رسالة.
          </p>
        </div>
        <Button disabled={pendingAction !== null} onClick={() => { setEditing(null); setAttendeeIds([]); setAdding(true); }}>
          <Plus className="h-4 w-4" />
          حدث جديد
        </Button>
      </div>
      {adding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/35 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-semibold">{editing ? "تعديل الحدث" : "إنشاء حدث"}</h2>
            <div className="mt-5 grid gap-3">
              <Input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="عنوان الحدث"
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Input
                  type="datetime-local"
                  dir="ltr"
                  value={startsAt}
                  onChange={(event) => setStartsAt(event.target.value)}
                  aria-label="تاريخ ووقت البدء"
                  className="text-end"
                />
                <Input
                  type="datetime-local"
                  dir="ltr"
                  value={endsAt}
                  onChange={(event) => setEndsAt(event.target.value)}
                  aria-label="تاريخ ووقت الانتهاء"
                  className="text-end"
                />
              </div>
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-neutral-700">
                  <UsersRound className="h-4 w-4" />
                  دعوة زملاء (يظهر الحدث في تقويمهم مباشرة)
                </p>
                {teamMembers.length === 0 ? (
                  <p className="text-sm text-neutral-400">لا يوجد زملاء آخرون في الفريق بعد.</p>
                ) : (
                  <div className="max-h-40 overflow-y-auto rounded-xl border border-neutral-200 p-2">
                    {teamMembers.map((member) => (
                      <label
                        key={member.id}
                        className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-neutral-50"
                      >
                        <Checkbox
                          checked={attendeeIds.includes(member.id)}
                          onChange={() => toggleAttendee(member.id)}
                        />
                        <span className="text-sm text-neutral-800">{member.name}</span>
                        <span className="text-xs text-neutral-400">{member.email}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <div className="mt-2 flex justify-end gap-2">
                <Button variant="ghost" disabled={pendingAction === "save"} onClick={() => { setEditing(null); setAdding(false); }}>
                  إلغاء
                </Button>
                <Button
                  onClick={() => void addEvent()}
                  disabled={!title || !startsAt || !endsAt || pendingAction === "save"}
                >
                  {pendingAction === "save" ? (editing ? "جارٍ الحفظ..." : "جارٍ الإنشاء...") : (editing ? "حفظ التغييرات" : "إنشاء الحدث")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="overflow-hidden rounded-xl border border-neutral-200">
        {events.length === 0 ? (
          <p className="p-8 text-center text-sm text-neutral-500">
            لا توجد أحداث هذا الشهر.
          </p>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              className="flex items-center gap-3 border-b border-neutral-100 px-4 py-4 last:border-b-0 sm:gap-5 sm:px-5"
            >
              <div className="w-auto shrink-0 text-sm sm:w-36">
                <span>{new Date(event.startsAt).toLocaleDateString()}</span>
                <time className="text-xs text-neutral-500 flex flex-col">
                  <span>{new Date(event.startsAt).toLocaleTimeString()}</span>
                </time>
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-neutral-900">{event.title}</p>
                  {event.isOrganizer ? (
                    event.attendees.length > 0 && (
                      <Badge variant="outline">
                        {event.attendees.filter((a) => a.status === "accepted").length}/{event.attendees.length} قبلوا الدعوة
                      </Badge>
                    )
                  ) : (
                    <Badge variant={event.myStatus === "accepted" ? "success" : event.myStatus === "declined" ? "outline" : "secondary"}>
                      دعوة من {event.organizerName} — {statusLabel(event.myStatus as AttendeeStatus)}
                    </Badge>
                  )}
                </div>
                {event.location && (
                  <p className="text-sm text-neutral-500">{event.location}</p>
                )}
              </div>
              {!event.isOrganizer && event.myStatus === "pending" && (
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="قبول الدعوة"
                    disabled={pendingAction !== null}
                    onClick={() => void respond(event.id, "accepted")}
                  >
                    <Check className="h-4 w-4 text-green-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="الاعتذار عن الدعوة"
                    disabled={pendingAction !== null}
                    onClick={() => void respond(event.id, "declined")}
                  >
                    <X className="h-4 w-4 text-neutral-500" />
                  </Button>
                </div>
              )}
              {event.isOrganizer && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="تعديل الحدث"
                    disabled={pendingAction !== null}
                    onClick={() => void editEvent(event)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="حذف الحدث"
                    disabled={pendingAction !== null}
                    onClick={() => void deleteEvent(event.id)}
                  >
                    <Trash2 className="h-4 w-4" />{pendingAction === event.id && <span className="sr-only">جارٍ الحذف...</span>}
                  </Button>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
