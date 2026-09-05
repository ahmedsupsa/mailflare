export type LeadStatus = "new" | "contacted" | "interested" | "won" | "lost";

export type LeadInput = {
	businessName?: string;
	contactName: string;
	phones?: string[];
	email?: string;
	status?: LeadStatus;
	notes?: string;
};

export type LeadResponse = {
	id: string;
	businessName: string;
	contactName: string;
	phones: string[];
	email: string;
	status: LeadStatus;
	notes: string;
	createdByUserId: string;
	createdByName: string;
	createdAt: string;
	updatedAt: string;
};
