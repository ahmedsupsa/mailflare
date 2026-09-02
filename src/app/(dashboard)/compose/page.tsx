"use client";

import { ComposeForm } from "@/components/compose/compose-form";

export default function ComposePage() {
	return (
		<div className="h-full overflow-auto p-8">
			<div className="mb-6">
				<h1 className="text-2xl font-normal text-neutral-900">إنشاء رسالة</h1>
				<p className="mt-1 text-sm text-neutral-500">اكتب رسالة بريد إلكتروني جديدة. تُحفظ المسودات تلقائيًا.</p>
			</div>
			<ComposeForm mode="page" />
		</div>
	);
}
