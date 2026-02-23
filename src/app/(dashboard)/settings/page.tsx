"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, Settings, Users, Shield, Archive, UserCheck, Lock } from "lucide-react";
import { toast } from "sonner";
import {
  getClubSettings,
  updateClubSettings,
  getAllMembersForManagement,
  updateMemberRole,
  toggleMemberStatus,
} from "@/app/actions/settings";
import { getTeamMembers } from "@/app/actions/team";


export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [clubData, setClubData] = useState({
    name: "",
    description: "",
    logoUrl: "",
    upiId: "",
    bankDetails: "",
  });
  const [members, setMembers] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // All members can load club settings
      const club = await getClubSettings();
      setClubData({
        name: club.name || "",
        description: club.description || "",
        logoUrl: club.logoUrl || "",
        upiId: club.upiId || "",
        bankDetails: club.bankDetails || "",
      });

      // Check role via team members (doesn't throw for non-admins)
      const { currentMember } = await getTeamMembers();
      const adminUser = currentMember.role === "admin";
      setIsAdmin(adminUser);

      // Only load member management for admins
      if (adminUser) {
        const membersList = await getAllMembersForManagement();
        setMembers(membersList || []);
      }
    } catch (error: any) {
      console.error("Error fetching settings:", error);
      toast.error(error.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveClubSettings = async () => {
    if (!clubData.name.trim()) {
      toast.error("Club name is required");
      return;
    }

    setSaving(true);
    try {
      await updateClubSettings(clubData);
      toast.success("Club settings updated successfully!");
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast.error(error.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateRole = async (memberId: string, role: any) => {
    try {
      await updateMemberRole(memberId, role);
      toast.success("Member role updated");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to update role");
    }
  };

  const handleToggleStatus = async (memberId: string, currentStatus: boolean) => {
    try {
      await toggleMemberStatus(memberId, !currentStatus);
      toast.success(currentStatus ? "Member archived — access revoked" : "Member restored — access granted");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to update status");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-[#0066FF]" />
        <p className="text-gray-600 font-medium">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="bg-[#F5F3FF] p-3 rounded-xl border-2 border-[#8B5CF6]">
          <Settings className="h-6 w-6 text-[#8B5CF6]" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1 font-medium">
            {isAdmin ? "Manage your club configuration and members" : "View your club information"}
          </p>
        </div>
      </div>

      {/* Club Settings */}
      <Card className="border-2 border-gray-200 shadow-lg">
        <CardHeader className="border-b-2 border-gray-200 bg-gray-50">
          <CardTitle className="text-gray-900">Club Settings</CardTitle>
          <CardDescription className="text-gray-600 font-medium">
            {isAdmin ? "Update your club information and payment details" : "Your club information"}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Club Name *</Label>
                <Input
                  id="name"
                  value={clubData.name}
                  onChange={(e) => setClubData({ ...clubData, name: e.target.value })}
                  placeholder="Street Cause"
                  disabled={saving || !isAdmin}
                  className="border-slate-300"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="logoUrl">Logo URL</Label>
                <Input
                  id="logoUrl"
                  value={clubData.logoUrl}
                  onChange={(e) => setClubData({ ...clubData, logoUrl: e.target.value })}
                  placeholder="https://example.com/logo.png"
                  disabled={saving || !isAdmin}
                  className="border-slate-300"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="upiId">UPI ID</Label>
                <Input
                  id="upiId"
                  value={clubData.upiId}
                  onChange={(e) => setClubData({ ...clubData, upiId: e.target.value })}
                  placeholder="streetcause@upi"
                  disabled={saving || !isAdmin}
                  className="border-slate-300"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bankDetails">Bank Details</Label>
                <Input
                  id="bankDetails"
                  value={clubData.bankDetails}
                  onChange={(e) => setClubData({ ...clubData, bankDetails: e.target.value })}
                  placeholder="Account number, IFSC, etc."
                  disabled={saving || !isAdmin}
                  className="border-slate-300"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={clubData.description}
                onChange={(e) => setClubData({ ...clubData, description: e.target.value })}
                placeholder="About your club..."
                rows={4}
                disabled={saving || !isAdmin}
                className="border-slate-300"
              />
            </div>

            {isAdmin ? (
              <div className="flex justify-end pt-4 border-t-2 border-gray-200">
                <Button
                  onClick={handleSaveClubSettings}
                  disabled={saving}
                  className="bg-[#0066FF] hover:bg-[#0052CC] text-white shadow-lg h-11 px-6"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 pt-4 border-t-2 border-gray-200 text-sm text-gray-500">
                <Lock className="h-4 w-4" />
                <span>Only Admins can edit club settings.</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Member Management — admin only */}
      {isAdmin && (
        <Card className="border-2 border-gray-200 shadow-lg">
          <CardHeader className="border-b-2 border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <Users className="h-5 w-5 text-[#0066FF]" />
                  Member Management
                </CardTitle>
                <CardDescription className="text-gray-600 font-medium">Manage member roles and access</CardDescription>
              </div>
              <Badge className="bg-[#E6F2FF] text-[#0066FF] border-2 border-[#0066FF] text-sm font-bold">
                {members.length} members
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Member
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {members.map((member) => (
                    <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">
                            {member.fullName}
                          </div>
                          <div className="text-xs text-slate-500">{member.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Select
                          value={member.role}
                          onValueChange={(value) => handleUpdateRole(member.id, value)}
                        >
                          <SelectTrigger className="w-40 border-slate-300">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">
                              <div className="flex items-center gap-2">
                                <Shield className="h-3 w-3 text-purple-600" />
                                Admin
                              </div>
                            </SelectItem>
                            <SelectItem value="treasurer">Treasurer</SelectItem>
                            <SelectItem value="coordinator">Coordinator</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          className={`${
                            member.isActive
                              ? "bg-[#D1FAE5] text-[#10B981] border-[#10B981]"
                              : "bg-gray-100 text-gray-700 border-gray-300"
                          } border-2 text-xs font-bold`}
                        >
                          {member.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-600">
                          {new Date(member.joinedAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleStatus(member.id, member.isActive)}
                          className={member.isActive
                            ? "border-2 border-[#FF6B35] text-[#FF6B35] hover:bg-[#FFF3EE] font-semibold"
                            : "border-2 border-[#10B981] text-[#10B981] hover:bg-[#D1FAE5] font-semibold"
                          }
                        >
                          {member.isActive ? (
                            <><Archive className="mr-1.5 h-3.5 w-3.5" /> Archive</>
                          ) : (
                            <><UserCheck className="mr-1.5 h-3.5 w-3.5" /> Restore</>
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
