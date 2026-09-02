import { MailboxAutoReplyForm } from "@/components/settings/mailbox-auto-reply-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsAutoReplyPage() {
	return (
		<div className="space-y-8 py-4">
			<div>
				<h1 className="text-3xl font-medium text-neutral-900">الرد التلقائي</h1>
				<p className="mt-1 text-sm text-neutral-500">
					يرسل ردًا تلقائيًا من البريد الوارد المحدد عند غيابك أو عدم توفرك.
				</p>
			</div>

			<Card className="rounded-3xl border-0 bg-white px-6">
				<CardHeader>
					<CardTitle>الرد التلقائي</CardTitle>
					<CardDescription>حدد الموضوع والرسالة لصندوق البريد المحدد أعلاه.</CardDescription>
				</CardHeader>
				<CardContent className="pb-6">
					<MailboxAutoReplyForm />
				</CardContent>
			</Card>
		</div>
	);
}
