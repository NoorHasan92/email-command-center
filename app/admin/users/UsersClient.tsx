"use client";

import { useState } from "react";
import { User } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Trash2, Mail, Activity, KeyRound, X, Users } from "lucide-react";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { deleteUser } from "@/server/actions/admin.actions";
import { UserAvatar } from "@/components/common/UserAvatar";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

type UserWithCounts = User & {
  aiUsage?: any;
  aiConnection?: any;
  _count: {
    emailAccounts: number;
    auditLogs: number;
  };
};

export function UsersClient({ initialUsers }: { initialUsers: UserWithCounts[] }) {
  const [users, setUsers] = useState<UserWithCounts[]>(initialUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const [planFilter, setPlanFilter] = useState("ALL");
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredUsers = users.filter((u) => {
    const matchesSearch = (u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || "") ||
                          (u.email.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesPlan = planFilter === "ALL" || u.plan === planFilter;
    return matchesSearch && matchesPlan;
  });

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      await deleteUser(userToDelete);
      setUsers(users.filter(u => u.id !== userToDelete));
      toast.success("User successfully deleted.");
    } catch (error) {
      toast.error("Failed to delete user.");
    } finally {
      setIsDeleting(false);
      setUserToDelete(null);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight flex items-center gap-3 text-white">
          <Users className="w-8 h-8 text-indigo-500" />
          User Management
        </h1>
        <p className="text-slate-400 mt-2 font-medium">Manage platform users, roles, and entitlements.</p>
      </div>

      <div className="flex flex-col gap-6">
        {/* Insights Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 w-full">
          <div className="flex items-center gap-4 bg-[#0f0f0f] p-4 rounded-2xl border border-border/10 shadow-inner">
            <div className="bg-white/5 p-3 rounded-xl text-slate-400">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Free Users</div>
              <div className="text-3xl font-bold text-white">{users.filter(u => u.plan === "FREE" || !u.plan).length}</div>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-[#0f0f0f] p-4 rounded-2xl border border-border/10 shadow-inner">
            <div className="bg-blue-500/20 p-3 rounded-xl text-blue-400">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Pro Users</div>
              <div className="text-3xl font-bold text-white">{users.filter(u => u.plan === "PRO").length}</div>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-[#0f0f0f] p-4 rounded-2xl border border-border/10 shadow-inner">
            <div className="bg-purple-500/20 p-3 rounded-xl text-purple-400">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Ultra Users</div>
              <div className="text-3xl font-bold text-white">{users.filter(u => u.plan === "ULTRA").length}</div>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-[#0f0f0f] p-4 rounded-2xl border border-border/10 shadow-inner">
            <div className="bg-indigo-500/20 p-3 rounded-xl text-indigo-400">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Admins</div>
              <div className="text-3xl font-bold text-white">{users.filter(u => u.plan === "ADMIN").length}</div>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-[#0f0f0f] p-4 rounded-2xl border border-border/10 shadow-inner">
            <div className="bg-emerald-500/20 p-3 rounded-xl text-emerald-400">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Users</div>
              <div className="text-3xl font-bold text-white">{users.length}</div>
            </div>
          </div>
        </div>

        {/* Search & Filter Row */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
          <div className="relative w-full sm:w-96 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              className="flex h-10 w-full border border-border/10 px-3 py-1 shadow-sm transition-colors placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 pl-10 bg-[#0f0f0f] rounded-xl text-sm text-white"
            />
          </div>

          <div className="shrink-0 w-full sm:w-auto flex items-center gap-2">
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="h-10 w-full sm:w-auto rounded-xl border border-border/10 bg-[#0f0f0f] pl-4 pr-10 py-1 text-sm font-medium focus:ring-2 focus:ring-indigo-500/50 outline-none text-white"
            >
              <option value="ALL">All Plans</option>
              <option value="FREE">Free</option>
              <option value="PRO">Pro</option>
              <option value="ULTRA">Ultra</option>
              <option value="ADMIN">Admin</option>
            </select>

            {(searchQuery || planFilter !== "ALL") && (
              <Button 
                variant="ghost" 
                size="icon"
                className="h-10 w-10 rounded-xl border border-border/10 bg-[#0f0f0f] hover:bg-white/10 transition-colors text-slate-400"
                onClick={() => {
                  setSearchQuery("");
                  setPlanFilter("ALL");
                }}
                title="Clear filters"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-[#0f0f0f] rounded-2xl border border-border/10 shadow-2xl overflow-x-auto">
        <div className="min-w-[800px] w-full">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-[#0a0a0a] text-slate-500 border-b border-border/10 sticky top-0 z-10">
              <tr>
                <th rowSpan={2} className="px-6 py-4 rounded-tl-xl font-bold tracking-wider text-center border-b border-border/10">User</th>
                <th rowSpan={2} className="px-6 py-4 font-bold tracking-wider text-center border-b border-border/10">Role & Status</th>
                <th rowSpan={2} className="px-6 py-4 font-bold tracking-wider text-center border-b border-border/10">Plan</th>
                <th rowSpan={2} className="px-6 py-4 font-bold tracking-wider text-center border-b border-border/10">Email Accounts</th>
                <th colSpan={2} className="px-6 py-2 font-bold tracking-wider text-center border-b border-border/10">Last Login</th>
                <th rowSpan={2} className="px-6 py-4 rounded-tr-xl font-bold tracking-wider text-center border-b border-border/10">Actions</th>
              </tr>
              <tr>
                <th className="px-6 py-2 font-bold tracking-wider text-center border-b border-border/10">Date</th>
                <th className="px-6 py-2 font-bold tracking-wider text-center border-b border-border/10">Time</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-500">
                      No users found matching "{searchQuery}"
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="border-b border-border/5 hover:bg-white/5 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <Link href={`/admin/users/${user.id}`} className="flex items-center gap-3">
                          <UserAvatar src={user.image} name={user.name} size="sm" />
                          <div>
                            <div className="font-semibold text-white group-hover:text-indigo-400 transition-colors">{user.name || "Unknown"}</div>
                            <div className="text-xs text-slate-500">{user.email}</div>
                          </div>
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col gap-1.5 items-center justify-center">
                          {user.role === "ADMIN" ? (
                            <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
                              <KeyRound className="w-3 h-3 mr-1" /> Admin
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-white/5 text-slate-400">User</Badge>
                          )}
                          {user.lockedUntil && new Date(user.lockedUntil) > new Date() && (
                            <Badge variant="destructive" className="bg-red-500/20 text-red-400 border-red-500/30">Locked</Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge variant="outline" className={`
                          ${user.plan === 'ADMIN' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : ''}
                          ${user.plan === 'ULTRA' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : ''}
                          ${user.plan === 'PRO' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : ''}
                          ${user.plan === 'FREE' || !user.plan ? 'bg-white/5 text-slate-400 border-border/10' : ''}
                        `}>
                          {user.plan || "FREE"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2 text-slate-500">
                          <Mail className="w-4 h-4" />
                          <span className="font-medium text-slate-300">{user._count.emailAccounts}</span> Connected
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {user.lastLoginAt ? (() => {
                          const d = new Date(user.lastLoginAt);
                          const pad = (n: number) => n.toString().padStart(2, '0');
                          return <span className="font-medium text-slate-300 whitespace-nowrap">{`${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`}</span>;
                        })() : <span className="text-slate-500 text-center block">Never</span>}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {user.lastLoginAt ? (() => {
                          const d = new Date(user.lastLoginAt);
                          const pad = (n: number) => n.toString().padStart(2, '0');
                          return <span className="font-medium text-slate-300 whitespace-nowrap">{`${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`}</span>;
                        })() : <span className="text-slate-500 text-center block">-</span>}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => setUserToDelete(user.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={handleDeleteUser}
        title="Permanently Delete User"
        description="Are you absolutely sure you want to delete this user? This action cannot be undone. All of their connected email accounts, rules, and analysis history will be permanently destroyed."
        confirmText="Delete Account"
        cancelText="Cancel"
        isDestructive={true}
        loading={isDeleting}
      />
    </div>
  );
}
