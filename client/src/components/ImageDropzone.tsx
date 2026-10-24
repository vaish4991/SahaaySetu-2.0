import React, { useState, useRef, useEffect } from 'react';
import { Image as ImageIcon, X, AlertCircle, UploadCloud } from 'lucide-react';

interface Props {
  onImageSelected: (base64: string | undefined, mimeType: string | undefined, name: string | undefined) => void;
}

export const ImageDropzone: React.FC<Props> = ({ onImageSelected }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean up object URLs when component unmounts or preview changes
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFile = (file: File) => {
    setError(null);

    // Validate mime type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setError(`Invalid file type '${file.type}'. Allowed: JPEG, PNG, WEBP, GIF.`);
      return;
    }

    // Validate size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError(`File size exceeds 5MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB).`);
      return;
    }

    // Revoke previous blob url
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setFileName(file.name);

    // Read base64
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      onImageSelected(base64, file.type, file.name);
    };
    reader.onerror = () => {
      setError('Failed to read image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemove = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setFileName(null);
    setError(null);
    onImageSelected(undefined, undefined, undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-slate-800">
        Scene Photograph / Hazard Photo (Optional)
      </label>

      {!previewUrl ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 hover:border-brand-500 rounded-lg p-4 text-center cursor-pointer bg-slate-50 hover:bg-brand-50/40 transition group"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              fileInputRef.current?.click();
            }
          }}
          aria-label="Upload scene photo. Drag and drop or press enter to choose file."
        >
          <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-brand-600 mx-auto mb-2 transition" />
          <p className="text-sm font-medium text-slate-700">
            Drag and drop a photo here, or <span className="text-brand-600 font-semibold underline">browse</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Supports JPEG, PNG, WEBP up to 5MB. Analyzed with Gemini Multimodal Vision when configured.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFile(e.target.files[0]);
              }
            }}
          />
        </div>
      ) : (
        <div className="relative border border-slate-200 rounded-lg p-3 bg-white flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <img
              src={previewUrl}
              alt="Uploaded crisis scene thumbnail"
              className="w-16 h-16 object-cover rounded-md border border-slate-200"
            />
            <div>
              <p className="text-sm font-semibold text-slate-800 truncate max-w-xs">{fileName}</p>
              <p className="text-xs text-emerald-700 font-medium">Ready for AI multimodal analysis</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-red-600 transition"
            aria-label="Remove attached image"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
