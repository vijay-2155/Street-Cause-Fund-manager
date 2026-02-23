"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Mail, Loader2, Users, Shield, UserCog, UserCheck } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { toast } from "sonner";
import { getTeamMembers, inviteMember } from "@/app/actions/team";
import type { Member } from "@/db/schema";

export default function TeamPage() {
  const [members, setMembers] = useState<typeof Member.$inferSelect[]>([]);
  const [currentMember, setCurrentMember] = useState<typeof Member.$inferSelect | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<string>("coordinator");
  const [submitting, setSubmitting] = useState(false);

  const roleColors: Record<string, string> = {
    admin: "bg-[#F5F3FF] text-[#8B5CF6] border-[#8B5CF6]",
    treasurer: "bg-[#E6F2FF] text-[#0066FF] border-[#0066FF]",
    coordinator: "bg-[#D1FAE5] text-[#10B981] border-[#10B981]",
  };

  const roleIcons: Record<string, any> = {
    admin: Shield,
    treasurer: UserCog,
    coordinator: UserCheck,
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const data = await getTeamMembers();
      setMembers(data.members);
      setCurrentMember(data.currentMember);
    } catch (error: any) {
      console.error("Error fetching members:", error);
      toast.error(error.message || "Failed to load team members");
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const result = await inviteMember(inviteEmail, inviteRole);
      toast.success(`Invitation sent to ${result.email}!`);
      handleCloseDialog();
    } catch (error: any) {
      toast.error(error.message || "Failed to send invitation");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setInviteEmail("");
    setInviteRole("coordinator");
  };

  const stats = useMemo(() => {
    const adminCount = members.filter((m) => m.role === "admin").length;
    const treasurerCount = members.filter((m) => m.role === "treasurer").length;
    const coordinatorCount = members.filter((m) => m.role === "coordinator").length;
    const activeCount = members.filter((m) => m.isActive).length;

    return { adminCount, treasurerCount, coordinatorCount, activeCount, total: members.length };
  }, [members]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-[#0066FF]" />
        <p className="text-gray-600 font-medium">Loading team members...</p>
      </div>
    );
  }

  const canInvite = currentMember?.role === "admin" || currentMember?.role === "treasurer";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="bg-[#E6F2FF] p-3 rounded-xl border-2 border-[#0066FF]">
          <Users className="h-6 w-6 text-[#0066FF]" />
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Team Members</h1>
          <p className="text-gray-600 mt-1 font-medium">
            {canInvite ? "Manage your club members and their roles" : "View your club members"}
          </p>
        </div>
        {canInvite && (
          <Dialog open={open} onOpenChange={(o) => o ? setOpen(true) : handleCloseDialog()}>
            <DialogTrigger asChild>
              <Button className="bg-[#0066FF] hover:bg-[#0052CC] text-white shadow-lg h-11 px-6 font-semibold">
                <Plus className="mr-2 h-4 w-4" />
                Invite Member
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#E6F2FF] rounded-lg">
                    <Mail className="h-5 w-5 text-[#0066FF]" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl">Invite New Member</DialogTitle>
                    <DialogDescription className="mt-1">
                      Send an invitation to join your club team
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <form onSubmit={handleInvite} className="space-y-5 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                      Email Address *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="member@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      disabled={submitting}
                      required
                      className="border-2 border-gray-300 focus:border-[#0066FF] h-11"
                    />
                    <p className="text-xs text-gray-400">They'll receive an invite email to sign in with Google</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-sm font-semibold text-gray-700">
                      Role *
                    </Label>
                    <Select value={inviteRole} onValueChange={setInviteRole} disabled={submitting}>
                      <SelectTrigger className="border-2 border-gray-300 focus:border-[#0066FF] h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-[#8B5CF6]" />
                            <div>
                              <div className="font-semibold">Admin</div>
                              <div className="text-xs text-gray-500">Full access & member management</div>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="treasurer">
                          <div className="flex items-center gap-2">
                            <UserCog className="h-4 w-4 text-[#0066FF]" />
                            <div>
                              <div className="font-semibold">Treasurer</div>
                              <div className="text-xs text-gray-500">Approve expenses & invite members</div>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="coordinator">
                          <div className="flex items-center gap-2">
                            <UserCheck className="h-4 w-4 text-[#10B981]" />
                            <div>
                              <div className="font-semibold">Coordinator</div>
                              <div className="text-xs text-gray-500">Add donations & submit expenses</div>
                            </div>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-3 pt-4 border-t-2 border-gray-200">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCloseDialog}
                      disabled={submitting}
                      className="border-2 border-gray-300"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={submitting || !inviteEmail}
                      className="bg-[#0066FF] hover:bg-[#0052CC] text-white shadow-lg"
                    >
                      {submitting ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</>
                      ) : (
                        <><Mail className="mr-2 h-4 w-4" />Send Invitation</>
                      )}
                    </Button>
                  </div>
                </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-2 border-gray-200 shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Total Members</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
                <p className="text-xs text-gray-500 mt-1 font-medium">{stats.activeCount} active</p>
              </div>
              <div className="p-3 bg-gray-100 rounded-xl">
                <Users className="h-7 w-7 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-[#8B5CF6] shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Admins</p>
                <p className="text-3xl font-bold text-[#8B5CF6] mt-2">{stats.adminCount}</p>
                <p className="text-xs text-gray-500 mt-1 font-medium">Full access</p>
              </div>
              <div className="p-3 bg-[#F5F3FF] rounded-xl">
                <Shield className="h-7 w-7 text-[#8B5CF6]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-[#0066FF] shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Treasurers</p>
                <p className="text-3xl font-bold text-[#0066FF] mt-2">{stats.treasurerCount}</p>
                <p className="text-xs text-gray-500 mt-1 font-medium">Approvers</p>
              </div>
              <div className="p-3 bg-[#E6F2FF] rounded-xl">
                <UserCog className="h-7 w-7 text-[#0066FF]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-[#10B981] shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Coordinators</p>
                <p className="text-3xl font-bold text-[#10B981] mt-2">{stats.coordinatorCount}</p>
                <p className="text-xs text-gray-500 mt-1 font-medium">Contributors</p>
              </div>
              <div className="p-3 bg-[#D1FAE5] rounded-xl">
                <UserCheck className="h-7 w-7 text-[#10B981]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Members Grid */}
      {members.length === 0 ? (
        <Card className="border-2 border-gray-200">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="bg-[#E6F2FF] rounded-full w-24 h-24 flex items-center justify-center mb-6 ring-4 ring-[#E6F2FF]/50">
              <Users className="h-12 w-12 text-[#0066FF]" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No team members yet</h3>
            <p className="text-sm text-gray-600 mb-6 max-w-md text-center">
              {canInvite ? "Start building your team by inviting your first member" : "Contact your admin to add team members"}
            </p>
            {canInvite && (
              <Button onClick={() => setOpen(true)} className="bg-[#0066FF] hover:bg-[#0052CC] text-white shadow-lg">
                <Plus className="mr-2 h-4 w-4" />
                Invite First Member
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => {
            const RoleIcon = roleIcons[member.role];
            return (
              <Card
                key={member.id}
                className="border-2 border-gray-200 hover:border-[#0066FF] hover:shadow-lg transition-all"
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16 ring-4 ring-gray-100">
                      <AvatarImage src={member.avatarUrl || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-[#0066FF] to-[#0052CC] text-white text-lg font-bold">
                        {getInitials(member.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-base text-gray-900 truncate">{member.fullName}</h3>
                      <p className="text-sm text-gray-600 truncate">{member.email}</p>
                      {member.phone && (
                        <p className="text-xs text-gray-500 mt-1">{member.phone}</p>
                      )}
                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        <Badge className={`${roleColors[member.role]} border-2 text-xs font-bold`}>
                          <RoleIcon className="h-3 w-3 mr-1" />
                          {member.role.toUpperCase()}
                        </Badge>
                        {member.isActive ? (
                          <Badge className="bg-[#D1FAE5] text-[#10B981] border-2 border-[#10B981] text-xs font-bold">
                            Active
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-700 border-2 border-gray-300 text-xs font-bold">
                            Inactive
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
