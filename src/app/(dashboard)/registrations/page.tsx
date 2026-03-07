"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Trophy,
  RefreshCw,
  Plus,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  IndianRupee,
  User,
  Phone,
  Mail,
  Link as LinkIcon,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  Settings,
  AlertCircle,
  Users,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  getRegistrations,
  getRegistrationStats,
  getRegistrationConfigs,
  createRegistrationConfig,
  updateRegistrationConfig,
  syncRegistrations,
  approveRegistration,
  rejectRegistration,
  deleteRegistration,
  resetConfigSyncedRow,
} from "@/app/actions/registrations";
import { getEvents } from "@/app/actions/events";

type Registration = {
  id: string;
  participantName: string;
  participantAge: string | null;
  respondentEmail: string | null;
  contactNumber: string | null;
  gender: string | null;
  category: string | null;
  participant2Name: string | null;
  participant2Age: string | null;
  transactionId: string | null;
  screenshotUrl: string | null;
  screenshotDriveUrl: string | null;
  ticketAmount: string;
  status: "pending" | "approved" | "rejected";
  rejectionReason: string | null;
  importedAt: string | null;
  reviewer?: { fullName: string } | null;
  config?: { configName: string } | null;
};

type Config = {
  id: string;
  configName: string;
  googleSheetId: string;
  sheetName: string;
  isActive: boolean | null;
  lastSyncedRow: number;
  event?: { name: string } | null;
  registrations?: { id: string }[];
};

type Stats = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  revenue: number;
};

const CATEGORY_LABELS: Record<string, string> = {
  mens_singles: "Men's Singles",
  womens_singles: "Women's Singles",
  mens_doubles: "Men's Doubles",
  mixed_doubles: "Mixed Doubles",
};

const CATEGORY_COLORS: Record<string, string> = {
  mens_singles: "bg-[#E6F2FF] text-[#0066FF] border-[#0066FF]",
  womens_singles: "bg-[#FDF4FF] text-[#8B5CF6] border-[#8B5CF6]",
  mens_doubles: "bg-[#FFF7ED] text-[#FF6B35] border-[#FF6B35]",
  mixed_doubles: "bg-[#D1FAE5] text-[#10B981] border-[#10B981]",
};

export default function RegistrationsPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [configs, setConfigs] = useState<Config[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, approved: 0, rejected: 0, revenue: 0 });
  const [events, setEvents] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [selectedConfig, setSelectedConfig] = useState<string>("all");
  const [syncing, setSyncing] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [detailReg, setDetailReg] = useState<Registration | null>(null);
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; id: string; name: string }>({
    open: false, id: "", name: "",
  });
  const [rejectReason, setRejectReason] = useState("");

  // New config form
  const [configForm, setConfigForm] = useState({
    configName: "",
    googleSheetId: "",
    sheetName: "Form Responses 1",
    eventId: "",
  });
  const [addingConfig, setAddingConfig] = useState(false);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);

  useEffect(() => {
    fetchAll();
    getEvents().then((e) => setEvents(e.map((ev: any) => ({ id: ev.id, name: ev.name })))).catch(() => {});
  }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [regs, cfgs, st] = await Promise.all([
        getRegistrations(),
        getRegistrationConfigs(),
        getRegistrationStats(),
      ]);
      setRegistrations((regs as Registration[]) || []);
      setConfigs((cfgs as Config[]) || []);
      setStats(st);
    } catch (e: any) {
      toast.error(e.message || "Failed to load registrations");
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    let list = registrations;
    if (selectedConfig !== "all") list = list.filter((r) => (r as any).configId === selectedConfig);
    if (activeTab !== "all") list = list.filter((r) => r.status === activeTab);
    return list;
  }, [registrations, selectedConfig, activeTab]);

  const handleSync = async (configId: string) => {
    setSyncing(configId);
    try {
      const result = await syncRegistrations(configId);
      if (result.imported > 0) {
        toast.success(`Imported ${result.imported} new registration${result.imported !== 1 ? "s" : ""}`);
      } else {
        toast.success("Up to date — no new registrations");
      }
      if (result.errors.length > 0) {
        toast.warning(`${result.errors.length} rows had errors`);
      }
      await fetchAll();
    } catch (e: any) {
      toast.error(e.message || "Sync failed");
    } finally {
      setSyncing(null);
    }
  };

  const handleReset = async (configId: string) => {
    if (!confirm("Reset sync pointer to 0? Next sync will re-import ALL rows (duplicates are skipped automatically).")) return;
    try {
      await resetConfigSyncedRow(configId);
      toast.success("Sync pointer reset — run Sync Now to re-import");
      await fetchAll();
    } catch (e: any) {
      toast.error(e.message || "Reset failed");
    }
  };

  const handleDelete = async (id: string) => {
    setProcessing(id);
    try {
      await deleteRegistration(id);
      toast.success("Registration deleted");
      setDetailReg(null);
      await fetchAll();
    } catch (e: any) {
      toast.error(e.message || "Delete failed");
    } finally {
      setProcessing(null);
    }
  };

  const handleSyncAll = async () => {
    if (configs.length === 0) {
      toast.error("No registration sources configured");
      return;
    }
    setSyncing("all");
    let totalImported = 0;
    let hadError = false;
    for (const cfg of configs.filter((c) => c.isActive)) {
      try {
        const result = await syncRegistrations(cfg.id);
        totalImported += result.imported;
        if (result.errors.length > 0) hadError = true;
      } catch {
        hadError = true;
      }
    }
    if (totalImported > 0) {
      toast.success(`Synced — ${totalImported} new registration${totalImported !== 1 ? "s" : ""} imported`);
    } else {
      toast.success("All sources up to date");
    }
    if (hadError) toast.warning("Some rows had errors — check sources panel");
    await fetchAll();
    setSyncing(null);
  };

  const handleApprove = async (id: string) => {
    setProcessing(id);
    try {
      await approveRegistration(id);
      toast.success("Registration approved!");
      setDetailReg(null);
      await fetchAll();
    } catch (e: any) {
      toast.error(e.message || "Failed to approve");
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error("Please enter a rejection reason");
      return;
    }
    setProcessing(rejectDialog.id);
    try {
      await rejectRegistration(rejectDialog.id, rejectReason);
      toast.success("Registration rejected");
      setRejectDialog({ open: false, id: "", name: "" });
      setRejectReason("");
      setDetailReg(null);
      await fetchAll();
    } catch (e: any) {
      toast.error(e.message || "Failed to reject");
    } finally {
      setProcessing(null);
    }
  };

  const handleAddConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configForm.configName.trim() || !configForm.googleSheetId.trim()) {
      toast.error("Config name and Sheet ID/URL are required");
      return;
    }
    setAddingConfig(true);
    try {
      await createRegistrationConfig({
        configName: configForm.configName,
        googleSheetId: configForm.googleSheetId,
        sheetName: configForm.sheetName,
        eventId: configForm.eventId || undefined,
      });
      toast.success("Registration source added!");
      setConfigForm({ configName: "", googleSheetId: "", sheetName: "Form Responses 1", eventId: "" });
      setConfigDialogOpen(false);
      await fetchAll();
    } catch (e: any) {
      toast.error(e.message || "Failed to add config");
    } finally {
      setAddingConfig(false);
    }
  };

  const getStatusStyle = (status: string) => {
    if (status === "approved") return "bg-[#D1FAE5] text-[#10B981] border-[#10B981]";
    if (status === "rejected") return "bg-[#FEF2F2] text-[#EF4444] border-[#EF4444]";
    return "bg-[#FFF7ED] text-[#FF6B35] border-[#FF6B35]";
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-[#FF6B35]" />
        <p className="text-gray-600 font-medium">Loading registrations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="bg-[#FF6B35] p-3 rounded-xl shadow-lg ring-4 ring-[#FF6B35]/20">
          <Trophy className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Event Registrations</h1>
          <p className="text-gray-600 mt-1 font-medium">
            Verify payments and manage tournament registrations
          </p>
        </div>
        <div className="flex gap-2">
          {configs.length > 0 && (
            <Button
              onClick={handleSyncAll}
              disabled={syncing !== null}
              className="bg-[#FF6B35] hover:bg-[#e55a25] text-white h-10 px-4"
            >
              {syncing === "all" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Sync All
            </Button>
          )}
          <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-2 border-gray-300 h-10">
                <Plus className="mr-2 h-4 w-4" />
                Add Source
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[520px]">
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#FFF7ED] rounded-lg">
                    <LinkIcon className="h-5 w-5 text-[#FF6B35]" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl">Add Registration Source</DialogTitle>
                    <DialogDescription className="mt-1">
                      Connect a Google Form response sheet to import registrations automatically.
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <form onSubmit={handleAddConfig} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">Config Name *</Label>
                  <Input
                    placeholder="e.g., Shuttle Storm 2.0 Registrations"
                    value={configForm.configName}
                    onChange={(e) => setConfigForm({ ...configForm, configName: e.target.value })}
                    className="border-2 border-gray-300 focus:border-[#FF6B35] h-11"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">Google Sheet URL or ID *</Label>
                  <Input
                    placeholder="Paste full URL or just the Sheet ID"
                    value={configForm.googleSheetId}
                    onChange={(e) => setConfigForm({ ...configForm, googleSheetId: e.target.value })}
                    className="border-2 border-gray-300 focus:border-[#FF6B35] h-11"
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Open your Form → Responses → Spreadsheet icon. Copy the URL from the browser.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">Sheet Tab Name</Label>
                  <Input
                    placeholder="Form Responses 1"
                    value={configForm.sheetName}
                    onChange={(e) => setConfigForm({ ...configForm, sheetName: e.target.value })}
                    className="border-2 border-gray-300 focus:border-[#FF6B35] h-11"
                  />
                  <p className="text-xs text-gray-500">Default is "Form Responses 1"</p>
                </div>
                {events.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Link to Event (Optional)</Label>
                    <Select
                      value={configForm.eventId}
                      onValueChange={(v) => setConfigForm({ ...configForm, eventId: v === "none" ? "" : v })}
                    >
                      <SelectTrigger className="border-2 border-gray-300 h-11">
                        <SelectValue placeholder="No event linked" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No event linked</SelectItem>
                        {events.map((ev) => (
                          <SelectItem key={ev.id} value={ev.id}>{ev.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="p-3 bg-[#FFF7ED] border border-[#FF6B35]/30 rounded-lg">
                  <p className="text-xs text-[#FF6B35] font-semibold flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    Required: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in environment variables.
                    Sign out and sign in again after adding these to grant Drive access.
                  </p>
                </div>
                <div className="flex justify-end gap-3 pt-2 border-t-2 border-gray-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setConfigDialogOpen(false)}
                    className="border-2 border-gray-300"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={addingConfig}
                    className="bg-[#FF6B35] hover:bg-[#e55a25] text-white shadow-lg"
                  >
                    {addingConfig ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                    Add Source
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: "Total", value: stats.total, color: "text-gray-900", border: "border-gray-200", bg: "bg-gray-100", icon: Users },
          { label: "Pending", value: stats.pending, color: "text-[#FF6B35]", border: "border-[#FF6B35]", bg: "bg-[#FFF7ED]", icon: Clock },
          { label: "Approved", value: stats.approved, color: "text-[#10B981]", border: "border-[#10B981]", bg: "bg-[#D1FAE5]", icon: CheckCircle },
          { label: "Rejected", value: stats.rejected, color: "text-[#EF4444]", border: "border-[#EF4444]", bg: "bg-[#FEF2F2]", icon: XCircle },
        ].map((s) => (
          <Card key={s.label} className={`border-2 ${s.border} shadow-sm`}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${s.bg}`}>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
        <Card className="border-2 border-[#10B981] shadow-sm sm:col-span-2 lg:col-span-1">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#D1FAE5]">
              <IndianRupee className="h-5 w-5 text-[#10B981]" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Revenue</p>
              <p className="text-2xl font-bold text-[#10B981]">₹{stats.revenue.toLocaleString("en-IN")}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Registration Sources */}
      {configs.length > 0 && (
        <Card className="border-2 border-gray-200">
          <CardHeader className="pb-3 cursor-pointer" onClick={() => setShowConfig(!showConfig)}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-gray-500" />
                <CardTitle className="text-sm font-semibold text-gray-700">
                  Registration Sources ({configs.length})
                </CardTitle>
              </div>
              {showConfig ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
            </div>
          </CardHeader>
          {showConfig && (
            <CardContent className="pt-0 space-y-3">
              {configs.map((cfg) => (
                <div
                  key={cfg.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 gap-4 flex-wrap"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{cfg.configName}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {cfg.event?.name ? `Linked to: ${cfg.event.name} · ` : ""}
                      {cfg.lastSyncedRow} rows synced · Sheet: {cfg.sheetName}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge className={cfg.isActive ? "bg-[#D1FAE5] text-[#10B981] border-[#10B981] border" : "bg-gray-100 text-gray-500 border border-gray-300"}>
                      {cfg.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReset(cfg.id)}
                      disabled={syncing !== null}
                      className="h-8 px-2 border-gray-300 text-gray-500 hover:text-red-600 hover:border-red-300"
                      title="Reset sync pointer (re-import all rows)"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleSync(cfg.id)}
                      disabled={syncing === cfg.id}
                      className="bg-[#FF6B35] hover:bg-[#e55a25] text-white h-8 px-3"
                    >
                      {syncing === cfg.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                      ) : (
                        <RefreshCw className="h-3.5 w-3.5 mr-1" />
                      )}
                      Sync Now
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          )}
        </Card>
      )}

      {/* No config yet */}
      {configs.length === 0 && (
        <Card className="border-2 border-dashed border-[#FF6B35]/40">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="bg-[#FFF7ED] rounded-full w-20 h-20 flex items-center justify-center mb-4 ring-4 ring-[#FF6B35]/20">
              <Trophy className="h-10 w-10 text-[#FF6B35]" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No registration sources yet</h3>
            <p className="text-sm text-gray-600 mb-5 text-center max-w-sm">
              Connect your Google Form response sheet to start importing and verifying registrations.
            </p>
            <Button
              onClick={() => setConfigDialogOpen(true)}
              className="bg-[#FF6B35] hover:bg-[#e55a25] text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Registration Source
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Filter Bar */}
      {registrations.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
            {(["pending", "all", "approved", "rejected"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                  activeTab === tab
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {tab === "pending" && stats.pending > 0 && (
                  <span className="ml-1.5 bg-[#FF6B35] text-white text-xs rounded-full px-1.5 py-0.5">
                    {stats.pending}
                  </span>
                )}
              </button>
            ))}
          </div>
          {configs.length > 1 && (
            <Select value={selectedConfig} onValueChange={setSelectedConfig}>
              <SelectTrigger className="w-48 border-2 border-gray-300 h-10">
                <SelectValue placeholder="All sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sources</SelectItem>
                {configs.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.configName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <span className="text-sm text-gray-500 font-medium ml-auto">
            {filtered.length} registration{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>
      )}

      {/* Registrations List */}
      {filtered.length === 0 && registrations.length > 0 ? (
        <Card className="border-2 border-gray-200">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <CheckCircle className="h-12 w-12 text-[#10B981] mb-3" />
            <p className="text-gray-700 font-semibold">No {activeTab !== "all" ? activeTab : ""} registrations</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((reg) => (
            <Card
              key={reg.id}
              className="border-2 border-gray-200 hover:border-[#FF6B35] hover:shadow-md transition-all cursor-pointer"
              onClick={() => setDetailReg(reg)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4 flex-wrap">
                  {/* Left: participant info */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-gray-900">
                        {reg.participantName}
                        {reg.participantAge ? `, ${reg.participantAge}` : ""}
                      </span>
                      {reg.category && (
                        <Badge className={`${CATEGORY_COLORS[reg.category] || "bg-gray-100 text-gray-700"} border text-xs font-semibold`}>
                          {CATEGORY_LABELS[reg.category] || reg.category}
                        </Badge>
                      )}
                    </div>
                    {reg.participant2Name && reg.participant2Name.trim() && (
                      <p className="text-sm text-gray-600">
                        + {reg.participant2Name}
                        {reg.participant2Age ? `, ${reg.participant2Age}` : ""}
                      </p>
                    )}
                    <div className="flex items-center gap-4 flex-wrap text-xs text-gray-500">
                      {reg.contactNumber && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {reg.contactNumber}
                        </span>
                      )}
                      {reg.transactionId && (
                        <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-700">
                          TXN: {reg.transactionId}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: amount + status */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">
                        ₹{Number(reg.ticketAmount).toLocaleString("en-IN")}
                      </p>
                      {reg.screenshotUrl && (
                        <p className="text-xs text-[#0066FF] flex items-center justify-end gap-1">
                          <ImageIcon className="h-3 w-3" />
                          Screenshot
                        </p>
                      )}
                    </div>
                    <Badge className={`${getStatusStyle(reg.status)} border-2 text-xs font-bold uppercase`}>
                      {reg.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── Detail Dialog ─────────────────────────────────────────────────── */}
      <Dialog open={!!detailReg} onOpenChange={(open) => !open && setDetailReg(null)}>
        <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
          {detailReg && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#FFF7ED] rounded-lg">
                    <User className="h-5 w-5 text-[#FF6B35]" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl">
                      {detailReg.participantName}
                      {detailReg.participantAge ? `, ${detailReg.participantAge}` : ""}
                    </DialogTitle>
                    <DialogDescription className="mt-1 flex items-center gap-2">
                      {detailReg.category && (
                        <Badge className={`${CATEGORY_COLORS[detailReg.category] || ""} border text-xs`}>
                          {CATEGORY_LABELS[detailReg.category] || detailReg.category}
                        </Badge>
                      )}
                      <Badge className={`${getStatusStyle(detailReg.status)} border text-xs uppercase`}>
                        {detailReg.status}
                      </Badge>
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-5 pt-2">
                {/* Participant info grid */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Email", value: detailReg.respondentEmail, icon: Mail },
                    { label: "Phone", value: detailReg.contactNumber, icon: Phone },
                    { label: "Gender", value: detailReg.gender ? (detailReg.gender === "male" ? "Male" : "Female") : null, icon: User },
                    { label: "Transaction ID", value: detailReg.transactionId, icon: null },
                  ].map(({ label, value, icon: Icon }) =>
                    value ? (
                      <div key={label} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">{label}</p>
                        <p className="text-sm font-semibold text-gray-900 mt-0.5 break-all">
                          {Icon && <span className="inline-block mr-1"><Icon className="h-3.5 w-3.5 inline text-gray-400" /></span>}
                          {value}
                        </p>
                      </div>
                    ) : null
                  )}
                </div>

                {/* 2nd participant */}
                {detailReg.participant2Name && detailReg.participant2Name.trim() && (
                  <div className="bg-[#E6F2FF] rounded-lg p-3 border border-[#0066FF]/20">
                    <p className="text-xs text-[#0066FF] font-semibold uppercase tracking-wide mb-1">2nd Participant</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {detailReg.participant2Name}
                      {detailReg.participant2Age ? `, ${detailReg.participant2Age}` : ""}
                    </p>
                  </div>
                )}

                {/* Ticket amount */}
                <div className="flex items-center justify-between bg-[#D1FAE5] rounded-lg p-4 border border-[#10B981]/30">
                  <span className="text-sm font-semibold text-gray-700">Ticket Amount</span>
                  <span className="text-2xl font-bold text-[#10B981]">
                    ₹{Number(detailReg.ticketAmount).toLocaleString("en-IN")}
                  </span>
                </div>

                {/* Screenshot */}
                {detailReg.screenshotUrl ? (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-gray-700">Payment Screenshot</p>
                    <div className="rounded-xl overflow-hidden border-2 border-gray-200 bg-gray-50">
                      <img
                        src={detailReg.screenshotUrl}
                        alt="Payment screenshot"
                        className="w-full object-contain max-h-64"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                    <a
                      href={detailReg.screenshotUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#0066FF] underline"
                    >
                      Open full size
                    </a>
                  </div>
                ) : detailReg.screenshotDriveUrl ? (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-gray-700">Payment Screenshot</p>
                    <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200 flex flex-col items-center gap-2">
                      <ImageIcon className="h-8 w-8 text-gray-400" />
                      <p className="text-xs text-gray-500">Screenshot stored on Google Drive</p>
                      <a
                        href={detailReg.screenshotDriveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-[#0066FF] font-semibold underline"
                      >
                        Open in Drive
                      </a>
                    </div>
                  </div>
                ) : null}

                {/* Rejection reason */}
                {detailReg.status === "rejected" && detailReg.rejectionReason && (
                  <div className="bg-[#FEF2F2] rounded-lg p-3 border border-[#EF4444]/30">
                    <p className="text-xs text-[#EF4444] font-semibold uppercase tracking-wide mb-1">Rejection Reason</p>
                    <p className="text-sm text-gray-900">{detailReg.rejectionReason}</p>
                  </div>
                )}

                {/* Reviewed by */}
                {detailReg.reviewer && (
                  <p className="text-xs text-gray-400">
                    Reviewed by {detailReg.reviewer.fullName}
                  </p>
                )}

                {/* Action buttons for pending */}
                {detailReg.status === "pending" && (
                  <div className="flex gap-3 pt-2 border-t-2 border-gray-200">
                    <Button
                      className="flex-1 bg-[#10B981] hover:bg-[#059669] text-white"
                      onClick={() => handleApprove(detailReg.id)}
                      disabled={processing === detailReg.id}
                    >
                      {processing === detailReg.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="mr-2 h-4 w-4" />
                      )}
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 border-2 border-[#EF4444] text-[#EF4444] hover:bg-[#FEF2F2]"
                      onClick={() => {
                        setDetailReg(null);
                        setRejectDialog({ open: true, id: detailReg.id, name: detailReg.participantName });
                      }}
                      disabled={processing === detailReg.id}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                )}

                {/* Delete button (always visible) */}
                <div className="pt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-gray-400 hover:text-red-600 hover:bg-red-50 text-xs"
                    onClick={() => {
                      if (confirm(`Delete registration for ${detailReg.participantName}? This cannot be undone.`)) {
                        handleDelete(detailReg.id);
                      }
                    }}
                    disabled={processing === detailReg.id}
                  >
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                    Delete this registration
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Reject Dialog ─────────────────────────────────────────────────── */}
      <Dialog open={rejectDialog.open} onOpenChange={(open) => !open && setRejectDialog({ open: false, id: "", name: "" })}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#FEF2F2] rounded-lg">
                <XCircle className="h-5 w-5 text-[#EF4444]" />
              </div>
              <div>
                <DialogTitle>Reject Registration</DialogTitle>
                <DialogDescription className="mt-1">
                  Rejecting registration for <strong>{rejectDialog.name}</strong>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Reason for rejection *</Label>
              <Textarea
                placeholder="e.g., Transaction ID not found, payment not received..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                className="border-2 border-gray-300 focus:border-[#EF4444] resize-none"
              />
            </div>
            <div className="flex gap-3 pt-2 border-t-2 border-gray-200">
              <Button
                variant="outline"
                className="flex-1 border-2 border-gray-300"
                onClick={() => {
                  setRejectDialog({ open: false, id: "", name: "" });
                  setRejectReason("");
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-[#EF4444] hover:bg-[#DC2626] text-white"
                onClick={handleReject}
                disabled={!!processing}
              >
                {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                Confirm Reject
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
