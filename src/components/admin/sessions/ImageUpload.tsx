import { useEffect, useState } from "react";

export default function ImageUpload({
  onFile,
  currentUrl,
}: {
  onFile: (file: File | null) => void;
  currentUrl?: string | null;
}) {
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);

  useEffect(() => {
    setPreview(currentUrl ?? null);
  }, [currentUrl]);

  return (
    <div className="flex items-center gap-4">
      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0] || null;
          onFile(file);
          if (file) setPreview(URL.createObjectURL(file));
        }}
      />
      {preview && (
        <img
          src={preview}
          alt="preview"
          className="h-16 rounded border border-base-300"
        />
      )}
    </div>
  );
}
