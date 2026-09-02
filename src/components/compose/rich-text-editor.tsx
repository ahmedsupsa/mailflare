"use client";

import { useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import TextAlign from "@tiptap/extension-text-align";
import {
	Bold,
	Italic,
	Underline as UnderlineIcon,
	Strikethrough,
	List,
	ListOrdered,
	Quote,
	Link2,
	AlignRight,
	AlignCenter,
	AlignLeft,
	Eraser,
	Undo2,
	Redo2,
} from "lucide-react";
import { cn } from "@/lib/utils";

function ToolbarButton({
	onClick,
	active,
	disabled,
	label,
	children,
}: {
	onClick: () => void;
	active?: boolean;
	disabled?: boolean;
	label: string;
	children: React.ReactNode;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled}
			aria-label={label}
			title={label}
			className={cn(
				"flex h-7 w-7 items-center justify-center rounded-md text-neutral-600 transition-colors hover:bg-neutral-100 disabled:pointer-events-none disabled:opacity-40",
				active && "bg-neutral-900 text-white hover:bg-neutral-800",
			)}
		>
			{children}
		</button>
	);
}

export function RichTextEditor({
	value,
	onChange,
	disabled,
}: {
	value: string;
	onChange: (html: string) => void;
	disabled?: boolean;
}) {
	const onChangeRef = useRef(onChange);
	onChangeRef.current = onChange;

	const editor = useEditor({
		extensions: [
			StarterKit,
			Underline,
			TextStyle,
			Color,
			Link.configure({ openOnClick: false, autolink: true }),
			TextAlign.configure({ types: ["heading", "paragraph"] }),
		],
		content: value,
		editable: !disabled,
		immediatelyRender: false,
		editorProps: {
			attributes: {
				class: "prose-sm min-h-full max-w-none focus:outline-none",
				dir: "auto",
			},
		},
		onUpdate: ({ editor }) => onChangeRef.current(editor.getHTML()),
	});

	useEffect(() => {
		editor?.setEditable(!disabled);
	}, [disabled, editor]);

	if (!editor) return null;

	function setLink() {
		const previousUrl = editor?.getAttributes("link").href as string | undefined;
		const url = window.prompt("رابط الوصلة", previousUrl ?? "https://");
		if (url === null) return;
		if (!url.trim()) {
			editor?.chain().focus().extendMarkRange("link").unsetLink().run();
			return;
		}
		editor?.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
	}

	return (
		<div className="flex h-full min-h-0 flex-col">
			<div className="mb-2 flex flex-wrap items-center gap-0.5 border-b border-neutral-100 pb-2">
				<ToolbarButton
					label="عريض"
					active={editor.isActive("bold")}
					onClick={() => editor.chain().focus().toggleBold().run()}
				>
					<Bold className="h-4 w-4" />
				</ToolbarButton>
				<ToolbarButton
					label="مائل"
					active={editor.isActive("italic")}
					onClick={() => editor.chain().focus().toggleItalic().run()}
				>
					<Italic className="h-4 w-4" />
				</ToolbarButton>
				<ToolbarButton
					label="تسطير"
					active={editor.isActive("underline")}
					onClick={() => editor.chain().focus().toggleUnderline().run()}
				>
					<UnderlineIcon className="h-4 w-4" />
				</ToolbarButton>
				<ToolbarButton
					label="يتوسطه خط"
					active={editor.isActive("strike")}
					onClick={() => editor.chain().focus().toggleStrike().run()}
				>
					<Strikethrough className="h-4 w-4" />
				</ToolbarButton>

				<span className="mx-1 h-5 w-px bg-neutral-200" />

				<ToolbarButton
					label="قائمة نقطية"
					active={editor.isActive("bulletList")}
					onClick={() => editor.chain().focus().toggleBulletList().run()}
				>
					<List className="h-4 w-4" />
				</ToolbarButton>
				<ToolbarButton
					label="قائمة مرقّمة"
					active={editor.isActive("orderedList")}
					onClick={() => editor.chain().focus().toggleOrderedList().run()}
				>
					<ListOrdered className="h-4 w-4" />
				</ToolbarButton>
				<ToolbarButton
					label="اقتباس"
					active={editor.isActive("blockquote")}
					onClick={() => editor.chain().focus().toggleBlockquote().run()}
				>
					<Quote className="h-4 w-4" />
				</ToolbarButton>
				<ToolbarButton label="رابط" active={editor.isActive("link")} onClick={setLink}>
					<Link2 className="h-4 w-4" />
				</ToolbarButton>

				<span className="mx-1 h-5 w-px bg-neutral-200" />

				<ToolbarButton
					label="محاذاة لليمين"
					active={editor.isActive({ textAlign: "right" })}
					onClick={() => editor.chain().focus().setTextAlign("right").run()}
				>
					<AlignRight className="h-4 w-4" />
				</ToolbarButton>
				<ToolbarButton
					label="محاذاة للوسط"
					active={editor.isActive({ textAlign: "center" })}
					onClick={() => editor.chain().focus().setTextAlign("center").run()}
				>
					<AlignCenter className="h-4 w-4" />
				</ToolbarButton>
				<ToolbarButton
					label="محاذاة لليسار"
					active={editor.isActive({ textAlign: "left" })}
					onClick={() => editor.chain().focus().setTextAlign("left").run()}
				>
					<AlignLeft className="h-4 w-4" />
				</ToolbarButton>

				<span className="mx-1 h-5 w-px bg-neutral-200" />

				<label
					title="لون النص"
					className="relative flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-neutral-600 hover:bg-neutral-100"
				>
					<span
						className="h-4 w-4 rounded-full border border-neutral-300"
						style={{ backgroundColor: (editor.getAttributes("textStyle").color as string) || "#171717" }}
					/>
					<input
						type="color"
						className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
						onChange={(event) => editor.chain().focus().setColor(event.target.value).run()}
						aria-label="لون النص"
					/>
				</label>
				<ToolbarButton label="إزالة التنسيق" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}>
					<Eraser className="h-4 w-4" />
				</ToolbarButton>

				<span className="mx-1 h-5 w-px bg-neutral-200" />

				<ToolbarButton
					label="تراجع"
					disabled={!editor.can().undo()}
					onClick={() => editor.chain().focus().undo().run()}
				>
					<Undo2 className="h-4 w-4" />
				</ToolbarButton>
				<ToolbarButton
					label="إعادة"
					disabled={!editor.can().redo()}
					onClick={() => editor.chain().focus().redo().run()}
				>
					<Redo2 className="h-4 w-4" />
				</ToolbarButton>
			</div>
			<div className="min-h-0 flex-1 overflow-y-auto">
				<EditorContent editor={editor} className="h-full" />
			</div>
		</div>
	);
}
