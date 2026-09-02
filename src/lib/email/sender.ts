import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { domains, mailboxes, users } from "@/db/schema";
import { getMailboxAccessLevel } from "@/lib/mailboxes/access";
import { formatEmailAddress, getEmailAddress } from "@/lib/email/address";
import { getMailboxDomainAddresses } from "@/lib/mailboxes/domain-addresses";

export async function getAuthorizedSenderAddress(
	env: CloudflareEnv,
	input: {
		userId: string;
		from: string;
		mailboxId?: string | null;
	},
): Promise<{ fromAddr: string; mailboxId: string }> {
	if (!input.mailboxId) throw new Error("صندوق البريد مطلوب");

	const db = getDb(env);
	const [mailbox] = await db
		.select({
		localPart: mailboxes.localPart,
		displayName: mailboxes.displayName,
		hostname: domains.hostname,
		domainId: mailboxes.domainId,
		useAllDomains: mailboxes.useAllDomains,
			id: mailboxes.id,
		})
		.from(mailboxes)
		.innerJoin(domains, eq(mailboxes.domainId, domains.id))
		.where(eq(mailboxes.id, input.mailboxId))
		.limit(1);

	if (!mailbox) throw new Error("صندوق البريد غير موجود");
	const [actor] = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
	if (!actor || actor.disabled) throw new Error("حساب المرسل غير موجود");

	const access = await getMailboxAccessLevel(db, actor, mailbox.id);
	if (!access?.canSendOnBehalf) {
		throw new Error("ليس لديك إذن للإرسال من صندوق البريد هذا");
	}

	const requestedAddress = getEmailAddress(input.from);
	const permittedAddresses = await getMailboxDomainAddresses(db, mailbox);
	if (!permittedAddresses.includes(requestedAddress.toLowerCase())) {
		throw new Error("عنوان المرسل لا يطابق صندوق البريد المحدد");
	}
	const senderAddress = requestedAddress.toLowerCase();

	if (access.canSendAs) {
		return {
			fromAddr: formatEmailAddress(senderAddress, mailbox.displayName),
			mailboxId: mailbox.id,
		};
	}

	const mailboxName = mailbox.displayName || senderAddress;
	return {
		fromAddr: formatEmailAddress(senderAddress, `${actor.name} on behalf of ${mailboxName}`),
		mailboxId: mailbox.id,
	};
}
