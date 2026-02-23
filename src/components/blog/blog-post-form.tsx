"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Save,
  Send,
  Loader2,
  ImageIcon,
  X,
  Megaphone,
  BookOpen,
  RefreshCw,
  FileText,
  CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileUpload } from "@/components/shared/file-upload";
import { getEventsForSelect } from "@/app/actions/expenses";

interface BlogPostFormProps {
  defaultValues?: {
    title: string;
    excerpt: string;
    content: string;
    coverImageUrl: string;
    category: "announcement" | "story" | "update" | "general";
    status: "draft" | "published";
    eventId?: string;
  };
  onSave: (data: {
    title: string;
    excerpt: string;
    content: string;
    coverImageUrl: string;
    category: "announcement" | "story" | "update" | "general";
    status: "draft" | "published";
    eventId?: string;
  }) => Promise<void>;
  submitLabel?: string;
}

type FormState = {
  title: string;
  excerpt: string;
  content: string;
  coverImageUrl: string;
  category: "announcement" | "story" | "update" | "general";
  status: "draft" | "published";
  eventId: string;
};

const EMPTY: FormState = {
  title: "",
  excerpt: "",
  content: "",
  coverImageUrl: "",
  category: "general",
  status: "draft",
  eventId: "",
};

const categories = [
  { value: "general", label: "General", icon: FileText, color: "#8B5CF6" },
  { value: "announcement", label: "Announcement", icon: Megaphone, color: "#0066FF" },
  { value: "story", label: "Story", icon: BookOpen, color: "#10B981" },
  { value: "update", label: "Update", icon: RefreshCw, color: "#EA580C" },
] as const;

export function BlogPostForm({ defaultValues, onSave, submitLabel }: BlogPostFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    ...EMPTY,
    ...defaultValues,
    eventId: defaultValues?.eventId || "",
  });
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [events, setEvents] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    getEventsForSelect()
      .then((data) => setEvents(data || []))
      .catch(() => {});
  }, []);

  const set = (field: keyof FormState, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const uploadCover = async (file: File): Promise<string> => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Upload failed");
    }
    const { url } = await res.json();
    return url;
  };

  const submit = async (status: "draft" | "published") => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    if (!form.content.trim()) { toast.error("Content is required"); return; }

    if (status === "published") setPublishing(true);
    else setSaving(true);

    try {
      let coverImageUrl = form.coverImageUrl;
      if (coverFile) {
        setUploading(true);
        coverImageUrl = await uploadCover(coverFile);
        setUploading(false);
      }

      await onSave({
        ...form,
        coverImageUrl,
        status,
        eventId: form.eventId || undefined,
      });
      toast.success(status === "published" ? "Post published!" : "Draft saved!");
      router.push("/posts");
    } catch (e: any) {
      toast.error(e.message || "Failed to save post");
    } finally {
      setSaving(false);
      setPublishing(false);
      setUploading(false);
    }
  };

  const isBusy = saving || publishing || uploading;

  return (
    <div className="space-y-6">
      {/* ── Title ── */}
      <div className="space-y-2">
        <Label htmlFor="title" className="text-sm font-bold text-gray-900 uppercase tracking-wide">
          Title <span className="text-red-500">*</span>
        </Label>
        <Input
          id="title"
          placeholder="Enter a compelling title..."
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          className="h-11 text-base font-medium border-2 border-gray-300 focus:border-[#0066FF] rounded-xl"
          disabled={isBusy}
        />
      </div>

      {/* ── Excerpt ── */}
      <div className="space-y-2">
        <Label htmlFor="excerpt" className="text-sm font-bold text-gray-900 uppercase tracking-wide">
          Excerpt <span className="text-xs text-gray-400 font-normal normal-case">(shown in listing)</span>
        </Label>
        <Textarea
          id="excerpt"
          placeholder="A brief summary of your post..."
          value={form.excerpt}
          onChange={(e) => set("excerpt", e.target.value)}
          rows={2}
          className="border-2 border-gray-300 focus:border-[#0066FF] rounded-xl resize-none"
          disabled={isBusy}
        />
      </div>

      {/* ── Category Pills ── */}
      <div className="space-y-2">
        <Label className="text-sm font-bold text-gray-900 uppercase tracking-wide">Category</Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = form.category === cat.value;
            return (
              <button
                key={cat.value}
                type="button"
                disabled={isBusy}
                onClick={() => set("category", cat.value)}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                  isActive
                    ? "shadow-md scale-[1.02]"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-400"
                }`}
                style={
                  isActive
                    ? { borderColor: cat.color, backgroundColor: cat.color + "12", color: cat.color }
                    : undefined
                }
              >
                <Icon className="h-4 w-4" />
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Event Selector ── */}
      <div className="space-y-2">
        <Label className="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-[#0066FF]" />
          Link to Event <span className="text-xs text-gray-400 font-normal normal-case">(optional)</span>
        </Label>
        <Select
          value={form.eventId || "none"}
          onValueChange={(v) => set("eventId", v === "none" ? "" : v)}
          disabled={isBusy}
        >
          <SelectTrigger className="h-11 border-2 border-gray-300 focus:border-[#0066FF] rounded-xl text-sm">
            <SelectValue placeholder="No event linked" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No event linked</SelectItem>
            {events.map((event) => (
              <SelectItem key={event.id} value={event.id}>
                {event.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.eventId && (
          <p className="text-xs text-[#0066FF] font-medium flex items-center gap-1">
            <CalendarDays className="h-3 w-3" />
            This post will appear under the selected event on the public blog
          </p>
        )}
      </div>

      {/* ── Content ── */}
      <div className="space-y-2">
        <Label htmlFor="content" className="text-sm font-bold text-gray-900 uppercase tracking-wide">
          Content <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="content"
          placeholder="Write your post content here...

Use blank lines to separate paragraphs."
          value={form.content}
          onChange={(e) => set("content", e.target.value)}
          rows={10}
          className="border-2 border-gray-300 focus:border-[#0066FF] rounded-xl font-mono text-sm resize-y min-h-[160px] sm:min-h-[280px]"
          disabled={isBusy}
        />
        <p className="text-xs text-gray-400">
          Tip: Separate paragraphs with blank lines. {form.content.length} characters
        </p>
      </div>

      {/* ── Cover Image ── */}
      <div className="space-y-2">
        <Label className="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-[#0066FF]" />
          Cover Image <span className="text-xs text-gray-400 font-normal normal-case">(optional)</span>
        </Label>
        {form.coverImageUrl && !coverFile && (
          <div className="relative">
            <img
              src={form.coverImageUrl}
              alt="Cover"
              className="w-full max-h-48 object-contain rounded-xl border-2 border-gray-200 bg-gray-50"
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="absolute top-2 right-2 h-8 w-8 p-0 bg-white shadow-md rounded-lg"
              onClick={() => set("coverImageUrl", "")}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        <FileUpload
          onFileSelect={(file) => setCoverFile(file)}
          onFileRemove={() => { setCoverFile(null); set("coverImageUrl", ""); }}
          accept="image/*"
          maxSizeMB={2}
          preview={form.coverImageUrl || undefined}
        />
      </div>

      {/* ── Action Buttons ── */}
      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 pt-4 border-t-2 border-gray-200">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/posts")}
          disabled={isBusy}
          className="border-2 border-gray-300 h-11 px-6 font-semibold rounded-xl w-full sm:w-auto"
        >
          Cancel
        </Button>
        <div className="hidden sm:block flex-1" />
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            onClick={() => submit("draft")}
            disabled={isBusy}
            className="gap-2 border-2 border-gray-300 h-11 px-4 sm:px-6 font-semibold rounded-xl flex-1 sm:flex-none"
          >
            {saving || (uploading && form.status === "draft") ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">Save</span> Draft
          </Button>
          <Button
            type="button"
            onClick={() => submit("published")}
            disabled={isBusy}
            className="bg-[#0066FF] hover:bg-[#0052CC] text-white gap-2 shadow-lg h-11 px-4 sm:px-8 font-semibold rounded-xl flex-1 sm:flex-none"
          >
            {publishing || (uploading && form.status === "published") ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {submitLabel || "Publish"}
          </Button>
        </div>
      </div>
    </div>
  );
}
