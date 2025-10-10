export default function TldrEditor({
    value,
    onChange,
    placeholder = "Write a longer summary of the session...",
  }: {
    value: string;
    onChange: (next: string) => void;
    placeholder?: string;
  }) {
    return (
      <div className="grid gap-2">
        <label className="text-sm opacity-80">TL;DR (longer summary)</label>
        <textarea
          className="textarea textarea-bordered h-40 w-full"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    );
  }
  