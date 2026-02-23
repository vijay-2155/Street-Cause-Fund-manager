"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileSpreadsheet, FileText, Eye } from "lucide-react";
import { exportToPDF, exportToExcel } from "@/lib/export-utils";

interface ExportPreviewDialogProps {
  open: boolean;
  onClose: () => void;
  data: {
    headers: string[];
    rows: any[][];
    title: string;
    subtitle?: string;
    clubName?: string;
    summary?: { label: string; value: string }[];
  };
}

export function ExportPreviewDialog({
  open,
  onClose,
  data,
}: ExportPreviewDialogProps) {
  const [selectedFormat, setSelectedFormat] = useState<"excel" | "pdf">("excel");

  const previewRows = data.rows.slice(0, 10);
  const totalRows = data.rows.length;

  const handleDownload = () => {
    if (selectedFormat === "excel") {
      exportToExcel(data);
    } else {
      exportToPDF(data);
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <DialogHeader className="border-b-2 border-gray-200 pb-5">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-[#0066FF] to-[#0052CC] p-3 rounded-xl shadow-lg">
              <Eye className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-gray-900">
                Export Preview
              </DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                <div className="h-1 w-6 bg-gradient-to-r from-[#0066FF] to-[#0052CC] rounded-full"></div>
                <p className="text-sm text-gray-600 font-semibold">
                  {data.title}
                </p>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Summary Cards */}
        {data.summary && data.summary.length > 0 && (
          <div className="bg-[#F9FAFB] border-2 border-gray-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-1 w-8 bg-gradient-to-r from-[#0066FF] to-[#0052CC] rounded-full"></div>
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                Summary
              </h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {data.summary.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-[#0066FF] transition-colors relative overflow-hidden"
                >
                  {/* Blue accent bar */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0066FF] to-[#0052CC]"></div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 mt-1">
                    {item.label}
                  </p>
                  <p className="text-xl font-bold text-[#0066FF]">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Preview Table */}
        <div className="flex-1 overflow-auto border-2 border-gray-200 rounded-xl">
          <div className="bg-[#F9FAFB] border-b-2 border-gray-200 px-5 py-3">
            <div className="flex items-center gap-2">
              <div className="h-1 w-8 bg-gradient-to-r from-[#0066FF] to-[#0052CC] rounded-full"></div>
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                Records Preview
              </h3>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#1A1A1F] sticky top-0 z-10">
                <tr>
                  {data.headers.map((header, idx) => (
                    <th
                      key={idx}
                      className="px-4 py-3.5 text-left text-[10px] font-bold text-white uppercase tracking-wider border-r border-white/10 last:border-r-0"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {previewRows.map((row, rowIdx) => (
                  <tr
                    key={rowIdx}
                    className={`transition-colors hover:bg-[#E6F2FF]/40 ${
                      rowIdx % 2 === 0 ? "bg-white" : "bg-[#F9FAFB]"
                    }`}
                  >
                    {row.map((cell, cellIdx) => (
                      <td
                        key={cellIdx}
                        className={`px-4 py-3 text-sm border-r border-gray-100 last:border-r-0 ${
                          cellIdx === 0 ? "font-semibold text-gray-900" : "text-gray-700"
                        }`}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Row Count & Format Selection */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t-2 border-gray-200 pt-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-[#0066FF] rounded-full animate-pulse"></div>
            <Badge
              variant="outline"
              className="border-2 border-[#0066FF] text-[#0066FF] font-bold px-4 py-1.5 text-xs uppercase tracking-wider"
            >
              Previewing {previewRows.length} of {totalRows} records
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Format:
            </p>
            <div className="flex items-center gap-2 bg-white border-2 border-gray-200 rounded-lg p-1">
              <Button
                variant={selectedFormat === "excel" ? "default" : "ghost"}
                onClick={() => setSelectedFormat("excel")}
                className={
                  selectedFormat === "excel"
                    ? "bg-[#0066FF] hover:bg-[#0052CC] text-white h-9 px-4 shadow-md transition-all"
                    : "hover:bg-gray-50 h-9 px-4 text-gray-700 transition-all"
                }
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Excel
              </Button>
              <Button
                variant={selectedFormat === "pdf" ? "default" : "ghost"}
                onClick={() => setSelectedFormat("pdf")}
                className={
                  selectedFormat === "pdf"
                    ? "bg-[#0066FF] hover:bg-[#0052CC] text-white h-9 px-4 shadow-md transition-all"
                    : "hover:bg-gray-50 h-9 px-4 text-gray-700 transition-all"
                }
              >
                <FileText className="h-4 w-4 mr-2" />
                PDF
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t-2 border-gray-200 pt-5">
          <div className="flex items-center gap-3 w-full justify-end">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-2 border-gray-300 hover:bg-gray-50 h-11 px-8 font-semibold"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDownload}
              className="bg-[#0066FF] hover:bg-[#0052CC] text-white shadow-lg h-11 px-8 font-semibold"
            >
              <Download className="mr-2 h-5 w-5" />
              Download {selectedFormat === "excel" ? "Excel" : "PDF"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
