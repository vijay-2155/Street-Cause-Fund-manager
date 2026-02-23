"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { expenseSchema, type ExpenseFormData } from "@/lib/validations";
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
import { toast } from "sonner";
import { format } from "date-fns";

interface ExpenseFormProps {
  onSubmit: (data: ExpenseFormData, receipt?: File) => Promise<void>;
  initialData?: Partial<ExpenseFormData>;
}

const categoryLabels: Record<string, string> = {
  food: "Food & Refreshments",
  supplies: "Supplies & Materials",
  transport: "Transportation",
  venue: "Venue Rental",
  printing: "Printing & Stationery",
  medical: "Medical Supplies",
  donation_forward: "Donation Forward",
  other: "Other",
};

export function ExpenseForm({ onSubmit, initialData }: ExpenseFormProps) {
  const [loading, setLoading] = useState(false);
  const [receipt, setReceipt] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      category: "other",
      expense_date: format(new Date(), "yyyy-MM-dd"),
      ...initialData,
    },
  });

  const category = watch("category");

  const handleFormSubmit = async (data: ExpenseFormData) => {
    setLoading(true);
    try {
      await onSubmit(data, receipt || undefined);
      toast.success("Expense submitted successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to submit expense");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Expense Information</h3>

        <div className="space-y-2">
          <Label htmlFor="title">
            Title <span className="text-red-500">*</span>
          </Label>
          <Input
            id="title"
            {...register("title")}
            placeholder="e.g., Food supplies for street distribution"
            disabled={loading}
          />
          {errors.title && (
            <p className="text-sm text-red-500">{errors.title.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            {...register("description")}
            placeholder="Provide details about this expense..."
            rows={3}
            disabled={loading}
          />
        </div>
      </div>

      {/* Expense Details */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Expense Details</h3>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="amount">
              Amount (₹) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              {...register("amount", { valueAsNumber: true })}
              placeholder="1000"
              disabled={loading}
            />
            {errors.amount && (
              <p className="text-sm text-red-500">{errors.amount.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">
              Category <span className="text-red-500">*</span>
            </Label>
            <Select
              value={category}
              onValueChange={(value) => setValue("category", value as any)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="event_id">Campaign / Event</Label>
            <Select
              onValueChange={(value) => setValue("event_id", value)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select campaign (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Blood Donation Camp</SelectItem>
                <SelectItem value="2">Education Drive</SelectItem>
                <SelectItem value="3">Street Food Distribution</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expense_date">
              Date <span className="text-red-500">*</span>
            </Label>
            <Input
              id="expense_date"
              type="date"
              {...register("expense_date")}
              disabled={loading}
            />
          </div>
        </div>

        {/* Receipt Upload */}
        <div className="space-y-2">
          <Label>Receipt / Bill Photo</Label>
          <FileUpload
            onFileSelect={setReceipt}
            onFileRemove={() => setReceipt(null)}
            maxSizeMB={1}
          />
          <p className="text-xs text-muted-foreground">
            Upload a clear photo of the bill or receipt for verification
          </p>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Submitting..." : "Submit for Approval"}
        </Button>
      </div>
    </form>
  );
}
