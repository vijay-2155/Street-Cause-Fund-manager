"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  Plus,
  Loader2,
  Calendar as CalendarIcon,
  TrendingUp,
  CheckCircle,
  Clock,
  Target,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { getEvents, createEvent } from "@/app/actions/events";
import { getCurrentUserRole } from "@/app/actions/donations";

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [userRole, setUserRole] = useState<string>("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    target_amount: "",
    start_date: "",
    end_date: "",
    status: "upcoming" as const,
  });

  const canCreateEvent = ["admin", "treasurer"].includes(userRole);

  useEffect(() => {
    fetchEvents();
    getCurrentUserRole().then(setUserRole).catch(() => {});
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const data = await getEvents();
      setEvents(data || []);
    } catch (error: any) {
      console.error("Error fetching events:", error);
      toast.error(error.message || "Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Event name is required");
      return;
    }

    const amount = parseFloat(formData.target_amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid target amount");
      return;
    }

    setSubmitting(true);
    try {
      await createEvent(formData);
      toast.success("🎉 Event created successfully!");
      setFormData({
        name: "",
        description: "",
        target_amount: "",
        start_date: "",
        end_date: "",
        status: "upcoming",
      });
      setOpen(false);
      fetchEvents();
    } catch (error: any) {
      console.error("Error creating event:", error);
      toast.error(error.message || "Failed to create event");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-[#D1FAE5] text-[#10B981] border-[#10B981]";
      case "upcoming":
        return "bg-[#E6F2FF] text-[#0066FF] border-[#0066FF]";
      case "completed":
        return "bg-gray-100 text-gray-700 border-gray-300";
      case "cancelled":
        return "bg-[#FEF2F2] text-[#EF4444] border-[#EF4444]";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const stats = useMemo(() => {
    const activeCount = events.filter((e) => e.status === "active").length;
    const upcomingCount = events.filter((e) => e.status === "upcoming").length;
    const completedCount = events.filter((e) => e.status === "completed").length;
    const totalRaised = events.reduce((sum, e) => {
      const raised = e.donations?.reduce((s: number, d: any) => s + Number(d.amount), 0) || 0;
      return sum + raised;
    }, 0);

    return { activeCount, upcomingCount, completedCount, totalRaised, total: events.length };
  }, [events]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-[#10B981]" />
        <p className="text-gray-600 font-medium">Loading events...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="bg-gradient-to-br from-[#10B981] to-[#059669] p-3 rounded-xl shadow-lg ring-4 ring-[#D1FAE5]">
          <CalendarIcon className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Events & Campaigns</h1>
          <p className="text-gray-600 mt-1 font-medium">
            Manage fundraising campaigns and track progress
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          {canCreateEvent && (
            <DialogTrigger asChild>
              <Button className="bg-[#10B981] hover:bg-[#059669] text-white shadow-lg h-11 px-6 font-semibold">
                <Plus className="mr-2 h-4 w-4" />
                New Event
              </Button>
            </DialogTrigger>
          )}
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#D1FAE5] rounded-lg">
                  <CalendarIcon className="h-5 w-5 text-[#10B981]" />
                </div>
                <div>
                  <DialogTitle className="text-xl">Create New Event</DialogTitle>
                  <DialogDescription className="mt-1">
                    Add a new fundraising campaign or event to track donations
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-5 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-semibold text-gray-700">
                  Event Name *
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., Winter Food Drive 2026"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={submitting}
                  required
                  className="border-2 border-gray-300 focus:border-[#10B981] h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-semibold text-gray-700">
                  Description (Optional)
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe the event purpose and goals..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  disabled={submitting}
                  rows={3}
                  className="border-2 border-gray-300 focus:border-[#10B981] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="target_amount" className="text-sm font-semibold text-gray-700">
                    Target Amount (₹) *
                  </Label>
                  <Input
                    id="target_amount"
                    type="number"
                    placeholder="100000"
                    value={formData.target_amount}
                    onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                    disabled={submitting}
                    required
                    className="border-2 border-gray-300 focus:border-[#10B981] h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status" className="text-sm font-semibold text-gray-700">
                    Status *
                  </Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value as any })}
                    disabled={submitting}
                  >
                    <SelectTrigger className="border-2 border-gray-300 focus:border-[#10B981] h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="upcoming">Upcoming</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date" className="text-sm font-semibold text-gray-700">
                    Start Date (Optional)
                  </Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    disabled={submitting}
                    className="border-2 border-gray-300 focus:border-[#10B981] h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_date" className="text-sm font-semibold text-gray-700">
                    End Date (Optional)
                  </Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    disabled={submitting}
                    className="border-2 border-gray-300 focus:border-[#10B981] h-11"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t-2 border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={submitting}
                  className="border-2 border-gray-300"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#10B981] hover:bg-[#059669] text-white shadow-lg"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Create Event
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-2 border-gray-200 shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                  Total Events
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
                <p className="text-xs text-gray-500 mt-1 font-medium">All campaigns</p>
              </div>
              <div className="p-3 bg-gray-100 rounded-xl">
                <CalendarIcon className="h-7 w-7 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-[#10B981] shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                  Active
                </p>
                <p className="text-3xl font-bold text-[#10B981] mt-2">{stats.activeCount}</p>
                <p className="text-xs text-gray-500 mt-1 font-medium">Currently running</p>
              </div>
              <div className="p-3 bg-[#D1FAE5] rounded-xl">
                <TrendingUp className="h-7 w-7 text-[#10B981]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-[#0066FF] shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                  Upcoming
                </p>
                <p className="text-3xl font-bold text-[#0066FF] mt-2">{stats.upcomingCount}</p>
                <p className="text-xs text-gray-500 mt-1 font-medium">Scheduled</p>
              </div>
              <div className="p-3 bg-[#E6F2FF] rounded-xl">
                <Clock className="h-7 w-7 text-[#0066FF]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-[#059669] shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                  Total Raised
                </p>
                <p className="text-3xl font-bold text-[#059669] mt-2">
                  ₹{stats.totalRaised.toLocaleString("en-IN")}
                </p>
                <p className="text-xs text-gray-500 mt-1 font-medium">All events</p>
              </div>
              <div className="p-3 bg-[#D1FAE5] rounded-xl">
                <Target className="h-7 w-7 text-[#059669]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Events Grid */}
      {events.length === 0 ? (
        <Card className="border-2 border-gray-200">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="bg-gradient-to-br from-[#D1FAE5] to-[#ECFEFF] rounded-full w-24 h-24 flex items-center justify-center mb-6 ring-4 ring-[#D1FAE5]/50">
              <CalendarIcon className="h-12 w-12 text-[#10B981]" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No events yet</h3>
            <p className="text-sm text-gray-600 mb-6 max-w-md text-center">
              {canCreateEvent
                ? "Create your first fundraising event to start tracking donations"
                : "No events have been created yet. Contact an admin or treasurer to set one up."}
            </p>
            {canCreateEvent && (
              <Button
                onClick={() => setOpen(true)}
                className="bg-[#10B981] hover:bg-[#059669] text-white shadow-lg"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create First Event
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => {
            const raised = event.donations?.reduce((sum: number, d: any) => sum + Number(d.amount), 0) || 0;
            const target = Number(event.targetAmount) || 1;
            const percentage = Math.min(Math.round((raised / target) * 100), 100);

            return (
              <Card
                key={event.id}
                className="border-2 border-gray-200 hover:border-[#10B981] hover:shadow-xl transition-all"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-lg font-bold text-gray-900 line-clamp-2 flex-1">
                      {event.name}
                    </CardTitle>
                    <Badge className={`${getStatusColor(event.status)} border-2 text-xs font-bold shrink-0`}>
                      {event.status.toUpperCase()}
                    </Badge>
                  </div>
                  {event.description && (
                    <p className="text-sm text-gray-600 line-clamp-2 mt-2">{event.description}</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Progress Bar */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-gray-700">Progress</span>
                      <div className="bg-white px-3 py-1 rounded-full border-2 border-[#10B981]">
                        <span className="text-sm font-bold text-[#10B981]">{percentage}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4 border-2 border-gray-300 shadow-inner overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-[#10B981] to-[#059669] h-full rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <div className="bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm flex-1">
                        <span className="text-xs font-semibold text-gray-600">Raised: </span>
                        <span className="text-sm font-bold text-[#10B981]">
                          ₹{raised.toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm flex-1">
                        <span className="text-xs font-semibold text-gray-600">Target: </span>
                        <span className="text-sm font-bold text-gray-900">
                          ₹{target.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Date Range */}
                  {(event.startDate || event.endDate) && (
                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                      <CalendarIcon className="h-4 w-4 text-gray-400 shrink-0" />
                      <span className="text-xs text-gray-600 font-medium">
                        {event.startDate && new Date(event.startDate).toLocaleDateString()}
                        {event.startDate && event.endDate && " - "}
                        {event.endDate && new Date(event.endDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
