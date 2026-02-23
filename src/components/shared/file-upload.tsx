"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Clipboard, Loader2, ZoomIn, ImageIcon } from "lucide-react";
import imageCompression from "browser-image-compression";
import { toast } from "sonner";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
  accept?: string;
  maxSizeMB?: number;
  preview?: string;
}

export function FileUpload({
  onFileSelect,
  onFileRemove,
  accept = "image/*",
  maxSizeMB = 1,
  preview,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [showPasteHint, setShowPasteHint] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    const originalSizeKB = (file.size / 1024).toFixed(1);

    try {
      setIsCompressing(true);

      const options = {
        maxSizeMB,
        maxWidthOrHeight: 2400,
        useWebWorker: true,
        fileType: file.type,
        initialQuality: 0.9,
        alwaysKeepResolution: false,
        preserveExif: false,
      };

      const compressedFile = await imageCompression(file, options);
      const compressedSizeKB = (compressedFile.size / 1024).toFixed(1);
      const savedPercent = (((file.size - compressedFile.size) / file.size) * 100).toFixed(0);

      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalPreview(reader.result as string);
      };
      reader.readAsDataURL(compressedFile);

      onFileSelect(compressedFile);

      toast.success(
        `Image optimized: ${originalSizeKB}KB → ${compressedSizeKB}KB (${savedPercent}% smaller)`,
        { duration: 3000 }
      );
    } catch (error) {
      console.error("Error compressing image:", error);
      toast.error("Failed to process image");
    } finally {
      setIsCompressing(false);
    }
  };

  const handlePaste = async (e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          toast.success("Screenshot pasted! Processing...");
          await handleFile(file);
        }
        break;
      }
    }
  };

  useEffect(() => {
    const handleDocumentPaste = (e: ClipboardEvent) => {
      if (containerRef.current && !localPreview && !preview) {
        handlePaste(e);
      }
    };

    document.addEventListener("paste", handleDocumentPaste);

    const handleFocus = () => setShowPasteHint(true);
    const handleBlur = () => setShowPasteHint(false);

    const container = containerRef.current;
    container?.addEventListener("mouseenter", handleFocus);
    container?.addEventListener("mouseleave", handleBlur);

    return () => {
      document.removeEventListener("paste", handleDocumentPaste);
      container?.removeEventListener("mouseenter", handleFocus);
      container?.removeEventListener("mouseleave", handleBlur);
    };
  }, [localPreview, preview]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleRemove = () => {
    setLocalPreview(null);
    setIsZoomed(false);
    onFileRemove();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const displayPreview = preview || localPreview;

  return (
    <>
      <div className="space-y-2" ref={containerRef}>
        {!displayPreview ? (
          /* ── Drop Zone ────────────────────────────────────── */
          <div
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            className={`
              relative group border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer
              transition-all duration-200
              ${isDragging
                ? "border-[#0066FF] bg-[#E6F2FF] scale-[1.01]"
                : "border-gray-300 hover:border-[#0066FF] hover:bg-[#E6F2FF]/30"
              }
            `}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={accept}
              onChange={handleFileInput}
              className="hidden"
            />

            <div className="flex flex-col items-center gap-3">
              {/* Icon */}
              <div className={`
                flex items-center justify-center w-14 h-14 rounded-2xl transition-all duration-200
                ${isCompressing
                  ? "bg-[#E6F2FF]"
                  : "bg-gray-100 group-hover:bg-[#E6F2FF]"
                }
              `}>
                {isCompressing ? (
                  <Loader2 className="h-7 w-7 text-[#0066FF] animate-spin" />
                ) : (
                  <Upload className="h-7 w-7 text-gray-400 group-hover:text-[#0066FF] transition-colors" />
                )}
              </div>

              {/* Text */}
              <div>
                <p className="text-sm font-semibold text-gray-700">
                  {isCompressing
                    ? "Optimizing image for clarity..."
                    : "Tap to upload or drag & drop"}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PNG, JPG up to {maxSizeMB}MB · Auto-optimized for text clarity
                </p>
              </div>

              {/* Paste hint */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full group-hover:bg-[#E6F2FF] transition-colors">
                <Clipboard className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-xs text-gray-500 font-medium">
                  or paste screenshot from clipboard
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* ── Preview ──────────────────────────────────────── */
          <div className="relative rounded-2xl border-2 border-gray-200 bg-gray-50 overflow-hidden group">
            {/* Success badge */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-[#D1FAE5] border-b border-[#10B981]/20">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-[#10B981]" />
                <span className="text-xs font-bold text-[#10B981]">Image uploaded successfully</span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs font-semibold text-[#0066FF] hover:bg-[#E6F2FF]"
                  onClick={() => setIsZoomed(true)}
                >
                  <ZoomIn className="h-3.5 w-3.5 mr-1" />
                  View full
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs font-semibold text-[#EF4444] hover:bg-[#FEF2F2]"
                  onClick={handleRemove}
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  Remove
                </Button>
              </div>
            </div>

            {/* Thumbnail preview — not cramped, shows full image with aspect ratio */}
            <div
              className="p-3 cursor-pointer"
              onClick={() => setIsZoomed(true)}
            >
              <img
                src={displayPreview}
                alt="Uploaded preview"
                className="w-full max-h-64 object-contain rounded-xl bg-white border border-gray-100 shadow-sm"
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Full-screen zoom overlay ─────────────────────────── */}
      {isZoomed && displayPreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-8"
          onClick={() => setIsZoomed(false)}
        >
          {/* Close button */}
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-4 right-4 z-10 rounded-full shadow-xl"
            onClick={() => setIsZoomed(false)}
          >
            <X className="h-5 w-5" />
          </Button>

          {/* Full-size image */}
          <img
            src={displayPreview}
            alt="Full size preview"
            className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
