"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { useSelectedMailbox } from "@/components/mailbox-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import type { ExportState } from "./types";
import { exportMailbox } from "./utils";

export default function SettingsExportPage() {
	const { selectedMailbox } = useSelectedMailbox();
	const [exportState, setExportState] = useState<ExportState>({ error: null, loading: false });

	async function onExport() {
		if (!selectedMailbox?.id) return;
		setExportState({ error: null, loading: true });
		try {
			await exportMailbox(selectedMailbox.id, `${selectedMailbox.localPart}.mbox`);
		} catch (error) {
			setExportState({ error: error instanceof Error ? error.message : "فشل التصدير", loading: false });
			return;
		}
		setExportState({ error: null, loading: false });
	}

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-medium text-neutral-900">تصدير</h1>
				<p className="mt-1 text-sm text-neutral-500">
					تنزيل البريد من صندوق البريد المحدد حاليًا.
				</p>
			</div>

			<Card className="rounded-3xl border-0 bg-white p-6">
				<CardHeader className="py-0">
					<CardDescription>
						تنزيل رؤوس الرسائل ومحتواها من صندوق البريد المحدد بصيغة ملف .mbox.
						لا يشمل هذا التصدير المرفقات.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-3 pt-5">
					<Button type="button" variant="outline" disabled={!selectedMailbox || exportState.loading} onClick={onExport}>
						{exportState.loading ? "جارٍ التجهيز..." : "تنزيل ملف .mbox"}
					</Button>
					{exportState.error && (
						<p className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
							{exportState.error}
						</p>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
