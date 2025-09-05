
import React, { useRef, useImperativeHandle, forwardRef, useEffect } from 'react';

interface RichTextEditorProps {
  initialValue?: string;
  onChange: (html: string) => void;
}

export interface RichTextEditorRef {
  insertHTML: (html: string) => void;
  setContent: (html: string) => void;
  // FIX: Add getHTML to the ref interface to allow parent components to read the content.
  getHTML: () => string;
}

const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(({ initialValue, onChange }, ref) => {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && initialValue) {
      // Only set initial value if it's different to avoid losing cursor position on re-renders
      if (editorRef.current.innerHTML !== initialValue) {
          editorRef.current.innerHTML = initialValue;
      }
    }
  }, [initialValue]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCommand = (command: string, value: string | null = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput(); // Ensure change is registered after command
  };

  useImperativeHandle(ref, () => ({
    insertHTML: (html: string) => {
      if (editorRef.current) {
        editorRef.current.focus();
        document.execCommand('insertHTML', false, html);
        handleInput();
      }
    },
    setContent: (html: string) => {
      if (editorRef.current) {
        editorRef.current.innerHTML = html;
        handleInput();
      }
    },
    // FIX: Implement getHTML to return the current content of the editor.
    getHTML: () => {
      return editorRef.current?.innerHTML || '';
    },
  }));

  const toolbarButtonClass = "p-2 rounded-md hover:bg-slate-200 transition-colors";

  return (
    <div className="border border-gray-300 rounded-md shadow-sm flex flex-col h-full bg-white">
      <div className="toolbar p-1 border-b bg-slate-50 flex items-center space-x-1 flex-shrink-0">
        <button type="button" onClick={() => execCommand('bold')} className={toolbarButtonClass} title="Gras">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m-4-10h4m4 0h-4m0 0v10m0-10L8 4m4 10l4-10" /></svg>
        </button>
        <button type="button" onClick={() => execCommand('italic')} className={toolbarButtonClass} title="Italique">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 4h8M8 20h8M12 4v16" /></svg>
        </button>
        <button type="button" onClick={() => execCommand('insertUnorderedList')} className={toolbarButtonClass} title="Liste à puces">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
            </svg>
        </button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="p-3 focus:outline-none flex-grow overflow-y-auto"
        style={{ minHeight: '100px' }}
      />
    </div>
  );
});

export default RichTextEditor;
