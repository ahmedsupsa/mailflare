import {
	Archive,
	BookOpen,
	Calendar,
	Contact,
	Inbox,
	KeyRound,
	Mail,
	PenLine,
	Search,
	Settings,
	Shield,
	ShieldCheck,
	Star,
	Upload,
} from "lucide-react";

const sections = [
	{ id: "start", label: "البداية" },
	{ id: "inbox", label: "البريد الوارد" },
	{ id: "compose", label: "إنشاء رسالة" },
	{ id: "reply", label: "الرد والتحويل" },
	{ id: "organize", label: "تنظيم بريدك" },
	{ id: "search", label: "البحث" },
	{ id: "contacts", label: "جهات الاتصال" },
	{ id: "calendar", label: "التقويم" },
	{ id: "settings", label: "إعداداتك الشخصية" },
	{ id: "import", label: "استيراد وتصدير" },
	{ id: "admin", label: "للمسؤولين بس" },
];

export default function GuidePage() {
	return (
		<div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
			<div className="mb-8 flex items-center gap-3">
				<span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-neutral-900 text-white">
					<BookOpen className="h-6 w-6" />
				</span>
				<div>
					<h1 className="text-3xl font-medium text-neutral-900">دليل الاستخدام</h1>
					<p className="mt-1 text-sm text-neutral-500">
						كل اللي تحتاجه عشان تستخدم البريد براحتك — مكتوب بلغتنا العادية، بدون تعقيد.
					</p>
				</div>
			</div>

			<div className="flex flex-col gap-8 lg:flex-row">
				<nav className="lg:w-52 lg:shrink-0">
					<div className="sticky top-6 space-y-1 rounded-3xl bg-white p-4">
						<p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
							المحتويات
						</p>
						{sections.map((section) => (
							<a
								key={section.id}
								href={`#${section.id}`}
								className="block rounded-xl px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
							>
								{section.label}
							</a>
						))}
					</div>
				</nav>

				<div className="min-w-0 flex-1 space-y-6">
					<section id="start" className="scroll-mt-6 rounded-3xl bg-white p-6">
						<h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-neutral-900">
							<Mail className="h-5 w-5" /> يلا نبدأ
						</h2>
						<p className="text-sm leading-7 text-neutral-600">
							تسجّل دخولك بالبريد الإلكتروني وكلمة المرور اللي أعطاك إياها المسؤول. نسيت
							كلمة المرور؟ ما فيه مشكلة — اضغط <strong>"نسيت كلمة المرور؟"</strong> بصفحة
							تسجيل الدخول، وبنرسل لك رابط تعيين كلمة مرور جديدة على بريدك البديل
							(اللي مسجّل بحسابك). الرابط صالح لمدة ساعة وحدة بس، وبعد ما تغيّر كلمة
							المرور بتسجّل خروجك من كل الأجهزة تلقائيًا — فسجّل دخولك من جديد بالكلمة
							الجديدة.
						</p>
					</section>

					<section id="inbox" className="scroll-mt-6 rounded-3xl bg-white p-6">
						<h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-neutral-900">
							<Inbox className="h-5 w-5" /> البريد الوارد
						</h2>
						<p className="text-sm leading-7 text-neutral-600">
							صفحة "البريد الوارد" هي أول شي تشوفه. الرسائل الجديدة (اللي ما قريتها بعد)
							تطلع بخط عريض. اضغط على أي رسالة تفتحها وتقرأها. تقدر تحدد أكثر من رسالة
							بنفس الوقت (بالمربع اللي جنب كل رسالة) عشان تسوي عليها إجراء جماعي — تحديد
							كمقروءة، أرشفة، أو حذف.
						</p>
					</section>

					<section id="compose" className="scroll-mt-6 rounded-3xl bg-white p-6">
						<h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-neutral-900">
							<PenLine className="h-5 w-5" /> تسوي رسالة جديدة
						</h2>
						<p className="text-sm leading-7 text-neutral-600">
							اضغط زر <strong>"إنشاء رسالة"</strong> بالقائمة الجانبية، أو أيقونة القلم لو
							كنت بجوالك. تفتح لك نافذة صغيرة تكتب فيها المستلم والموضوع والرسالة.
						</p>
						<p className="mt-3 text-sm leading-7 text-neutral-600">
							فوق مربع الكتابة فيه شريط أدوات تقدر بيه تنسّق رسالتك بشكل احترافي: عريض،
							مائل، تسطير، ألوان للنص، قوائم نقطية ومرقّمة، اقتباس، وحتى تضيف رابط. جرب
							تلعب فيه — رسالتك بتوصل بنفس التنسيق اللي شفته.
						</p>
						<p className="mt-3 text-sm leading-7 text-neutral-600">
							ما تنسى: الرسالة تُحفظ كمسودة تلقائيًا وأنت تكتب، فلو أغلقت النافذة غلط ما
							تضيع — بتلقاها بقسم "المسودات".
						</p>
					</section>

					<section id="reply" className="scroll-mt-6 rounded-3xl bg-white p-6">
						<h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-neutral-900">
							<Upload className="h-5 w-5 rotate-180" /> الرد وإعادة التحويل
						</h2>
						<p className="text-sm leading-7 text-neutral-600">
							لما تفتح أي رسالة، بتلقى أزرار "رد" و"الرد على الجميع" و"إعادة توجيه" —
							تختار اللي يناسبك وتكمل كتابتك فوق الرسالة الأصلية اللي تنضاف تلقائيًا كاقتباس
							تحت. تقدر ترفق ملفات لأي رسالة بالضغط على أيقونة المشبك — بحد أقصى 10 مرفقات
							وحجم إجمالي 20 ميغابايت.
						</p>
					</section>

					<section id="organize" className="scroll-mt-6 rounded-3xl bg-white p-6">
						<h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-neutral-900">
							<Archive className="h-5 w-5" /> تنظّم بريدك
						</h2>
						<ul className="space-y-2 text-sm leading-7 text-neutral-600">
							<li className="flex items-start gap-2">
								<Star className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
								<span><strong>مميزة بنجمة:</strong> علّم أي رسالة مهمة بضغطة على أيقونة النجمة، وترجع تلقاها بقسم "المميزة بنجمة".</span>
							</li>
							<li className="flex items-start gap-2">
								<Archive className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
								<span><strong>الأرشيف:</strong> خلّها بعيدة عن الوارد بدون ما تحذفها — لو احتجتها ترجع تلقاها بالأرشيف.</span>
							</li>
							<li className="flex items-start gap-2">
								<Shield className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
								<span><strong>البريد العشوائي والمهملات:</strong> رسايل مشبوهة أو محذوفة تروح هناك، وتنحذف نهائيًا بعد فترة.</span>
							</li>
							<li className="flex items-start gap-2">
								<Mail className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
								<span><strong>مؤجّلة:</strong> رسالة وصلتك بوقت مو مناسب؟ أجّلها لين وقت أنسب وبترجع تطلع لك بالوارد.</span>
							</li>
						</ul>
					</section>

					<section id="search" className="scroll-mt-6 rounded-3xl bg-white p-6">
						<h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-neutral-900">
							<Search className="h-5 w-5" /> تدور على رسالة؟
						</h2>
						<p className="text-sm leading-7 text-neutral-600">
							فوق كل صفحة فيه شريط بحث — اكتب اسم المرسل، كلمة من الموضوع، أو أي جزء من
							محتوى الرسالة وبيدور لك فيها كلها بثواني.
						</p>
					</section>

					<section id="contacts" className="scroll-mt-6 rounded-3xl bg-white p-6">
						<h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-neutral-900">
							<Contact className="h-5 w-5" /> جهات الاتصال
						</h2>
						<p className="text-sm leading-7 text-neutral-600">
							كل شخص تراسله يتحفظ تلقائيًا بجهات الاتصال. تقدر تفتح ملفه وتشوف آخر مراسلة
							معه، أو تحظره لو ما تبي تستقبل منه رسايل بعد كذا.
						</p>
					</section>

					<section id="calendar" className="scroll-mt-6 rounded-3xl bg-white p-6">
						<h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-neutral-900">
							<Calendar className="h-5 w-5" /> التقويم
						</h2>
						<p className="text-sm leading-7 text-neutral-600">
							تقدر تسوي مواعيد وتدعو لها زملاءك من صفحة التقويم — تنرسل لهم دعوة على
							بريدهم يقدرون يضيفونها لتقويمهم.
						</p>
					</section>

					<section id="settings" className="scroll-mt-6 rounded-3xl bg-white p-6">
						<h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-neutral-900">
							<Settings className="h-5 w-5" /> إعداداتك الشخصية
						</h2>
						<p className="text-sm leading-7 text-neutral-600">
							من أيقونة حسابك (أعلى يمين الصفحة) ← "الإعدادات"، تقدر تتحكم بـ:
						</p>
						<ul className="mt-3 space-y-2 text-sm leading-7 text-neutral-600">
							<li>• <strong>التوقيع:</strong> نص يتضاف تلقائيًا آخر كل رسالة جديدة تسويها.</li>
							<li>• <strong>الرد التلقائي:</strong> فعّله لو راح تكون بعيد عن جهازك (إجازة مثلًا) وبيرد على أي وحد يراسلك بنص تحدده أنت.</li>
							<li>• <strong>تحويل البريد:</strong> حوّل نسخة من رسايلك الواردة لبريد ثاني.</li>
							<li>• <strong>كلمة المرور:</strong> غيّرها وقت ما تبي من نفس الصفحة.</li>
						</ul>
					</section>

					<section id="import" className="scroll-mt-6 rounded-3xl bg-white p-6">
						<h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-neutral-900">
							<Upload className="h-5 w-5" /> استيراد وتصدير الرسائل
						</h2>
						<p className="text-sm leading-7 text-neutral-600">
							عندك بريد بمكان ثاني (Gmail أو Outlook مثلًا) وتبي تجيب رسائله هنا؟ من
							صفحة "الاستيراد والتصدير" بالإعدادات تقدر تربط حسابك القديم وتسحب رسائله،
							أو تصدّر نسخة من رسائلك الحالية.
						</p>
					</section>

					<section id="admin" className="scroll-mt-6 rounded-3xl border-2 border-dashed border-neutral-200 bg-white p-6">
						<h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-neutral-900">
							<ShieldCheck className="h-5 w-5" /> للمسؤولين بس 🔒
						</h2>
						<p className="text-sm leading-7 text-neutral-600">
							لو أنت مسؤول، عندك لوحة إدارة إضافية (تلقاها من أيقونة حسابك ← "الإدارة")
							فيها:
						</p>
						<ul className="mt-3 space-y-2 text-sm leading-7 text-neutral-600">
							<li>• <strong>الفريق:</strong> ضيف موظف جديد ويوصله بريد إلكتروني خاص فيه تلقائيًا.</li>
							<li>• <strong>صناديق البريد والنطاقات:</strong> أدر عناوين البريد والنطاقات المربوطة.</li>
							<li>• <strong>الهوية:</strong> غيّر اسم النظام وشعاره، وسوّي تذييل موحّد يتضاف لكل رسالة صادرة.</li>
							<li>• <strong>النسخ الاحتياطية:</strong> خذ نسخة من قاعدة البيانات وقت ما تبي.</li>
							<li>• <strong>سجل النشاط:</strong> شوف مين دخل ومتى، لأي مراجعة أمنية.</li>
						</ul>
					</section>

					<section className="rounded-3xl bg-neutral-50 p-6 text-center">
						<KeyRound className="mx-auto mb-2 h-5 w-5 text-neutral-400" />
						<p className="text-sm text-neutral-500">
							ما لقيت اللي تبيه هنا؟ تواصل مع مسؤول النظام عندك، وهو يقدر يساعدك.
						</p>
					</section>
				</div>
			</div>
		</div>
	);
}
