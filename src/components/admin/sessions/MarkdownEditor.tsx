import { useRef } from 'react';
import PlayerCharacterReference from '@/components/PlayerCharacterReference';

export default function MarkdownEditor({
    value,
    onChange,
    placeholder = "Markdown content",
  }: {
    value: string;
    onChange: (next: string) => void;
    placeholder?: string;
  }) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    
    const handleInsertCharacter = (characterName: string) => {
      if (!textareaRef.current) return;
      
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      // Insert the character name at cursor position
      const newValue = value.substring(0, start) + characterName + value.substring(end);
      onChange(newValue);
      
      // Set cursor position after the inserted text
      setTimeout(() => {
        textarea.focus();
        textarea.selectionStart = start + characterName.length;
        textarea.selectionEnd = start + characterName.length;
      }, 0);
    };
    
    return (
      <div className="flex flex-col gap-2">
        <textarea
          ref={textareaRef}
          className="textarea textarea-bordered h-64 w-full"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <PlayerCharacterReference onInsert={handleInsertCharacter} />
      </div>
    );
  }