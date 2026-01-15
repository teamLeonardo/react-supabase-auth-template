import { useState } from 'react';

interface MessageEditorProps {
  value: string;
  onChange: (value: string) => void;
  variables?: string[];
}

const MessageEditor = ({ value, onChange, variables = ['@value1'] }: MessageEditorProps) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById('message-textarea') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = value.substring(0, start) + variable + value.substring(end);
      onChange(newValue);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    } else {
      onChange(value + variable);
    }
  };

  const applyFormat = (tag: string, closingTag: string) => {
    const textarea = document.getElementById('message-textarea') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = value.substring(start, end);
      const newValue = value.substring(0, start) + tag + selectedText + closingTag + value.substring(end);
      onChange(newValue);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + tag.length, end + tag.length);
      }, 0);
    }
  };

  const emojis = ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾'];

  const insertEmoji = (emoji: string) => {
    const textarea = document.getElementById('message-textarea') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const newValue = value.substring(0, start) + emoji + value.substring(start);
      onChange(newValue);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + emoji.length, start + emoji.length);
      }, 0);
    } else {
      onChange(value + emoji);
    }
    setShowEmojiPicker(false);
  };

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-green-600 px-4 py-3 flex items-center gap-2">
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        <span className="text-white font-semibold">Mensaje</span>
      </div>

      {/* Toolbar */}
      <div className="px-4 py-3 bg-gray-700/50 border-b border-gray-700 flex items-center gap-2 flex-wrap">
        {/* Variables */}
        {variables.map((variable) => (
          <button
            key={variable}
            type="button"
            onClick={() => insertVariable(variable)}
            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded flex items-center gap-1 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            {variable}
          </button>
        ))}

        {/* Formatting buttons */}
        <div className="flex items-center gap-1 border-l border-gray-600 pl-2 ml-2">
          <button
            type="button"
            onClick={() => applyFormat('*', '*')}
            className="px-2 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm font-bold rounded transition"
            title="Negrita"
          >
            B
          </button>
          <button
            type="button"
            onClick={() => applyFormat('_', '_')}
            className="px-2 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm italic rounded transition"
            title="Cursiva"
          >
            I
          </button>
          <button
            type="button"
            onClick={() => applyFormat('~', '~')}
            className="px-2 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm line-through rounded transition"
            title="Tachado"
          >
            S
          </button>
          <button
            type="button"
            className="px-2 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition"
            title="Color de texto"
          >
            T
          </button>
          <button
            type="button"
            className="px-2 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition"
            title="Párrafo"
          >
            ¶
          </button>
        </div>

        {/* Emoji button */}
        <div className="relative ml-auto">
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="px-2 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-lg rounded transition"
            title="Emoji"
          >
            😀
          </button>

          {/* Emoji Picker */}
          {showEmojiPicker && (
            <div className="absolute right-0 top-full mt-2 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 w-80 max-h-96 overflow-y-auto">
              <div className="p-3 border-b border-gray-700">
                <input
                  type="text"
                  placeholder="Buscar emoji..."
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm"
                />
              </div>
              <div className="p-3 grid grid-cols-8 gap-2">
                {emojis.map((emoji, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => insertEmoji(emoji)}
                    className="text-2xl hover:bg-gray-700 rounded p-1 transition"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Textarea */}
      <div className="relative">
        <textarea
          id="message-textarea"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={8}
          className="w-full px-4 py-3 bg-gray-700 border-0 text-white placeholder-gray-400 focus:outline-none resize-none"
          placeholder="Escribe tu mensaje aquí..."
        />
        {value.length > 0 && (
          <div className="absolute bottom-2 right-2">
            <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-gray-700/50 border-t border-gray-700 flex justify-between items-center">
        <span className="text-xs text-gray-400">{value.length} caracteres</span>
      </div>
    </div>
  );
};

export default MessageEditor;
