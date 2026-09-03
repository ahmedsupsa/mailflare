export type CalendarEventInput = {
	title: string;
	description?: string;
	location?: string;
	attendeeIds?: string[];
	startsAt: string;
	endsAt: string;
	mailboxId?: string | null;
};

export type CalendarEventAttendee = {
	userId: string;
	name: string;
	email: string;
	status: "pending" | "accepted" | "declined";
};

export type CalendarEventResponse = {
	id: string;
	userId: string;
	mailboxId: string | null;
	title: string;
	description: string;
	location: string;
	startsAt: Date;
	endsAt: Date;
	organizerName: string;
	isOrganizer: boolean;
	attendees: CalendarEventAttendee[];
	myStatus: "organizer" | "pending" | "accepted" | "declined";
};
