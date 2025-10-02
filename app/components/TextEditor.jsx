"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Link as LinkIcon,
  Undo,
  Redo
} from "lucide-react";

export default function TextEditor({ value, onChange }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline',
        },
      }),
    ],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[120px] px-3 py-2.5 text-sm text-black',
      },
    },
  });

  if (!editor) {
    return null;
  }

  const setLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 p-2 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 flex-wrap">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded-md transition-all ${
            editor.isActive('bold')
              ? 'bg-gray-800 text-white shadow-sm'
              : 'text-gray-700 hover:bg-white hover:shadow-sm'
          }`}
          type="button"
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded-md transition-all ${
            editor.isActive('italic')
              ? 'bg-gray-800 text-white shadow-sm'
              : 'text-gray-700 hover:bg-white hover:shadow-sm'
          }`}
          type="button"
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-2 rounded-md transition-all ${
            editor.isActive('underline')
              ? 'bg-gray-800 text-white shadow-sm'
              : 'text-gray-700 hover:bg-white hover:shadow-sm'
          }`}
          type="button"
          title="Underline"
        >
          <UnderlineIcon className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-gray-300 mx-2" />

        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded-md transition-all ${
            editor.isActive('bulletList')
              ? 'bg-gray-800 text-white shadow-sm'
              : 'text-gray-700 hover:bg-white hover:shadow-sm'
          }`}
          type="button"
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded-md transition-all ${
            editor.isActive('orderedList')
              ? 'bg-gray-800 text-white shadow-sm'
              : 'text-gray-700 hover:bg-white hover:shadow-sm'
          }`}
          type="button"
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-gray-300 mx-2" />

        <button
          onClick={setLink}
          className={`p-2 rounded-md transition-all ${
            editor.isActive('link')
              ? 'bg-gray-800 text-white shadow-sm'
              : 'text-gray-700 hover:bg-white hover:shadow-sm'
          }`}
          type="button"
          title="Insert Link"
        >
          <LinkIcon className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-gray-300 mx-2" />

        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-2 rounded-md text-gray-700 hover:bg-white hover:shadow-sm transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none"
          type="button"
          title="Undo"
        >
          <Undo className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-2 rounded-md text-gray-700 hover:bg-white hover:shadow-sm transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none"
          type="button"
          title="Redo"
        >
          <Redo className="w-4 h-4" />
        </button>
      </div>

      {/* Editor Content */}
      <div className="bg-white">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
