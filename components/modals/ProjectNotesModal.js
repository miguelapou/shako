'use client';
import React, { useState, useRef, useEffect } from 'react';
import { X, Bold, Italic, Underline, Strikethrough, List, ListOrdered, Heading1, Heading2, Minus } from 'lucide-react';

const ToolbarButton = ({ onClick, title, active, darkMode, children }) => (
  <button
    onMouseDown={(e) => {
      e.preventDefault();
      onClick();
    }}
    title={title}
    className={`w-8 h-8 flex items-center justify-center rounded transition-colors text-sm font-medium ${
      active
        ? darkMode
          ? 'bg-gray-600 text-gray-100'
          : 'bg-gray-300 text-gray-900'
        : darkMode
          ? 'text-gray-300 hover:bg-gray-700 hover:text-gray-100'
          : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
    }`}
  >
    {children}
  </button>
);

const Divider = ({ darkMode }) => (
  <div className={`w-px h-5 mx-1 ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`} />
);

const ProjectNotesModal = ({ isOpen, onClose, project, onSave, darkMode }) => {
  const editorRef = useRef(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeFormats, setActiveFormats] = useState({});

  // Load notes content when modal opens or project changes
  useEffect(() => {
    if (isOpen && editorRef.current) {
      editorRef.current.innerHTML = project?.notes || '';
      editorRef.current.focus();
    }
  }, [isOpen, project?.id]);

  // Update active format state on selection change
  const updateActiveFormats = () => {
    setActiveFormats({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      strikeThrough: document.queryCommandState('strikeThrough'),
      insertUnorderedList: document.queryCommandState('insertUnorderedList'),
      insertOrderedList: document.queryCommandState('insertOrderedList'),
    });
  };

  const execCmd = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    updateActiveFormats();
  };

  const handleHeading = (tag) => {
    document.execCommand('formatBlock', false, tag);
    editorRef.current?.focus();
  };

  const handleHorizontalRule = () => {
    document.execCommand('insertHorizontalRule', false, null);
    editorRef.current?.focus();
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const content = editorRef.current?.innerHTML || '';
      await onSave(content);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  // Keyboard shortcut handler inside editor
  const handleKeyDown = (e) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          execCmd('bold');
          break;
        case 'i':
          e.preventDefault();
          execCmd('italic');
          break;
        case 'u':
          e.preventDefault();
          execCmd('underline');
          break;
        case 's':
          e.preventDefault();
          handleSave();
          break;
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div
        className={`relative w-full max-w-2xl rounded-xl shadow-2xl flex flex-col ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        }`}
        style={{ maxHeight: '85vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-4 border-b flex-shrink-0 ${
          darkMode ? 'border-gray-700' : 'border-slate-200'
        }`}>
          <h2 className={`text-base font-semibold truncate pr-4 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
            Notes — {project?.name}
          </h2>
          <button
            onClick={onClose}
            className={`flex-shrink-0 p-1.5 rounded-lg transition-colors ${
              darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className={`flex items-center flex-wrap gap-0.5 px-3 py-2 border-b flex-shrink-0 ${
          darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-slate-200 bg-slate-50'
        }`}>
          <ToolbarButton onClick={() => execCmd('bold')} title="Bold (Ctrl+B)" active={activeFormats.bold} darkMode={darkMode}>
            <Bold className="w-3.5 h-3.5" />
          </ToolbarButton>
          <ToolbarButton onClick={() => execCmd('italic')} title="Italic (Ctrl+I)" active={activeFormats.italic} darkMode={darkMode}>
            <Italic className="w-3.5 h-3.5" />
          </ToolbarButton>
          <ToolbarButton onClick={() => execCmd('underline')} title="Underline (Ctrl+U)" active={activeFormats.underline} darkMode={darkMode}>
            <Underline className="w-3.5 h-3.5" />
          </ToolbarButton>
          <ToolbarButton onClick={() => execCmd('strikeThrough')} title="Strikethrough" active={activeFormats.strikeThrough} darkMode={darkMode}>
            <Strikethrough className="w-3.5 h-3.5" />
          </ToolbarButton>

          <Divider darkMode={darkMode} />

          <ToolbarButton onClick={() => handleHeading('h1')} title="Heading 1" darkMode={darkMode}>
            <Heading1 className="w-3.5 h-3.5" />
          </ToolbarButton>
          <ToolbarButton onClick={() => handleHeading('h2')} title="Heading 2" darkMode={darkMode}>
            <Heading2 className="w-3.5 h-3.5" />
          </ToolbarButton>

          <Divider darkMode={darkMode} />

          <ToolbarButton onClick={() => execCmd('insertUnorderedList')} title="Bullet List" active={activeFormats.insertUnorderedList} darkMode={darkMode}>
            <List className="w-3.5 h-3.5" />
          </ToolbarButton>
          <ToolbarButton onClick={() => execCmd('insertOrderedList')} title="Numbered List" active={activeFormats.insertOrderedList} darkMode={darkMode}>
            <ListOrdered className="w-3.5 h-3.5" />
          </ToolbarButton>

          <Divider darkMode={darkMode} />

          <ToolbarButton onClick={handleHorizontalRule} title="Horizontal Rule" darkMode={darkMode}>
            <Minus className="w-3.5 h-3.5" />
          </ToolbarButton>
        </div>

        {/* Editor */}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onKeyDown={handleKeyDown}
          onKeyUp={updateActiveFormats}
          onMouseUp={updateActiveFormats}
          onSelect={updateActiveFormats}
          className={`flex-1 p-5 overflow-y-auto outline-none notes-editor ${
            darkMode ? 'text-gray-100' : 'text-gray-900'
          }`}
          style={{ minHeight: '280px' }}
          data-placeholder="Start writing your notes..."
        />

        {/* Footer */}
        <div className={`flex items-center justify-between px-5 py-4 border-t flex-shrink-0 ${
          darkMode ? 'border-gray-700 bg-gray-800' : 'border-slate-200 bg-slate-100'
        }`}>
          <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            Ctrl+S to save
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors border ${
                darkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-100 border-gray-600'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-800 border-gray-300'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-60"
            >
              {isSaving ? 'Saving...' : 'Save Notes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectNotesModal;
