export type TaskStatus = "pending" | "done";

export type TaskInput = {
	title: string;
	description?: string;
	dueAt?: string | null;
	status?: TaskStatus;
	assigneeUserId?: string | null;
	leadId?: string | null;
};

export type TaskResponse = {
	id: string;
	title: string;
	description: string;
	dueAt: string | null;
	status: TaskStatus;
	assigneeUserId: string | null;
	assigneeName: string | null;
	leadId: string | null;
	leadName: string | null;
	createdByUserId: string;
	createdByName: string;
	createdAt: string;
	updatedAt: string;
};
