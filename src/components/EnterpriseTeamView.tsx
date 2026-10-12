import React, { useState } from 'react';
import { TeamMember, PortfolioTag, DomainItem, UserRole } from '../types/domain';
import { Users, UserPlus, Shield, FolderGit2, Mail, MessageSquare, Trash2, CheckCircle2, Building2, Plus, X } from 'lucide-react';

interface EnterpriseTeamViewProps {
  teamMembers: TeamMember[];
  onAddTeamMember: (member: TeamMember) => void;
  onRemoveTeamMember: (id: string) => void;
  domains: DomainItem[];
}

const ALL_PORTFOLIOS: PortfolioTag[] = [
  'Core Infrastructure',
  'Brand & Trademarks',
  'Marketing Campaigns',
  'SaaS Apps',
  'Regional',
];

export const EnterpriseTeamView: React.FC<EnterpriseTeamViewProps> = ({
  teamMembers,
  onAddTeamMember,
  onRemoveTeamMember,
  domains,
}) => {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('monitor');
  const [selectedPortfolios, setSelectedPortfolios] = useState<PortfolioTag[]>(['Core Infrastructure']);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [telegramAlerts, setTelegramAlerts] = useState(true);

  const togglePortfolio = (tag: PortfolioTag) => {
    setSelectedPortfolios((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.includes('@') || !newName.trim()) return;

    const newMember: TeamMember = {
      id: `team_${Date.now()}`,
      email: newEmail.trim().toLowerCase(),
      name: newName.trim(),
      role: newRole,
      assignedPortfolios: selectedPortfolios.length > 0 ? selectedPortfolios : ['Core Infrastructure'],
      receiveEmailAlerts: emailAlerts,
      receiveTelegramAlerts: telegramAlerts,
      addedAt: new Date().toISOString().split('T')[0],
    };

    onAddTeamMember(newMember);
    setShowInviteModal(false);
    setNewEmail('');
    setNewName('');
    setSelectedPortfolios(['Core Infrastructure']);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5 sm:space-y-6">
      {/* Enterprise Organization Banner */}
      <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded p-4 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="p-2.5 sm:p-3 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 shrink-0">
            <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
                Enterprise Central Dashboard
              </h1>
              <span className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-mono text-xs rounded font-medium">
                Multi-Tenant Access
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-xl">
              Grant scoped access to internal engineering, security, and brand teams to manage designated domain portfolios and monitor high-priority expiration alerts.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowInviteModal(true)}
          className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-semibold rounded flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap self-stretch sm:self-start md:self-auto cursor-pointer"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Grant Employee Access</span>
        </button>
      </div>

      {/* Portfolio Distribution Matrix */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
        {ALL_PORTFOLIOS.map((tag) => {
          const count = domains.filter((d) => d.portfolio === tag).length;
          const assignedMembers = teamMembers.filter((m) => m.assignedPortfolios.includes(tag)).length;
          return (
            <div
              key={tag}
              className="p-3 sm:p-3.5 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded text-xs"
            >
              <div className="font-semibold text-neutral-900 dark:text-white truncate">
                {tag}
              </div>
              <div className="mt-2 flex items-baseline justify-between font-mono">
                <span className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
                  {count}
                </span>
                <span className="text-[11px] text-neutral-400">domains</span>
              </div>
              <div className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                {assignedMembers} lead{assignedMembers === 1 ? '' : 's'} assigned
              </div>
            </div>
          );
        })}
      </div>

      {/* Employee & Access Roster */}
      <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded shadow-xs overflow-hidden">
        <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-neutral-500 shrink-0" />
            <h2 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white">
              Authorized Team Members &amp; Roles ({teamMembers.length})
            </h2>
          </div>
          <span className="text-[11px] sm:text-xs text-neutral-400">Role-based Access Control (RBAC)</span>
        </div>

        <div className="overflow-x-auto touch-pan-x">
          <table className="w-full text-left text-xs min-w-[640px]">
            <thead className="bg-neutral-50 dark:bg-neutral-950 text-neutral-500 dark:text-neutral-400 font-semibold border-b border-neutral-200 dark:border-neutral-800">
              <tr>
                <th className="px-4 sm:px-5 py-3">Employee</th>
                <th className="px-4 sm:px-5 py-3">Enterprise Role</th>
                <th className="px-4 sm:px-5 py-3">Managed Portfolios</th>
                <th className="px-4 sm:px-5 py-3">Active Alerts</th>
                <th className="px-4 sm:px-5 py-3">Joined</th>
                <th className="px-4 sm:px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {teamMembers.map((member) => (
                <tr key={member.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40">
                  <td className="px-5 py-3.5">
                    <div className="font-semibold text-neutral-900 dark:text-white">
                      {member.name}
                    </div>
                    <div className="text-neutral-500 dark:text-neutral-400 font-mono text-[11px]">
                      {member.email}
                    </div>
                  </td>

                  <td className="px-5 py-3.5">
                    <span
                      className={`px-2 py-0.5 rounded font-mono text-[11px] font-semibold uppercase ${
                        member.role === 'owner'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300'
                          : member.role === 'admin'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300'
                          : member.role === 'monitor'
                          ? 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200'
                          : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                      }`}
                    >
                      {member.role}
                    </span>
                  </td>

                  <td className="px-5 py-3.5">
                    <div className="flex flex-wrap gap-1">
                      {member.assignedPortfolios.map((p) => (
                        <span
                          key={p}
                          className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded text-[11px]"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </td>

                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                      {member.receiveEmailAlerts && (
                        <span title="Receives Email Alerts" className="flex items-center gap-1 text-[11px]">
                          <Mail className="w-3 h-3 text-neutral-500" /> Email
                        </span>
                      )}
                      {member.receiveTelegramAlerts && (
                        <span title="Receives Telegram Bot Alerts" className="flex items-center gap-1 text-[11px]">
                          <MessageSquare className="w-3 h-3 text-sky-500" /> Telegram
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-5 py-3.5 font-mono text-neutral-500 dark:text-neutral-400 text-[11px]">
                    {member.addedAt}
                  </td>

                  <td className="px-5 py-3.5 text-right">
                    {member.role !== 'owner' ? (
                      <button
                        onClick={() => onRemoveTeamMember(member.id)}
                        className="p-1 text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                        title="Revoke Access"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <span className="text-[11px] text-neutral-400 font-mono">Primary</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 max-w-md w-full max-h-[90vh] overflow-y-auto rounded p-4 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                Grant Portfolio Access
              </h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Morgan"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded text-neutral-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Company Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="alex@enterprise.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded text-neutral-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Role
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded text-neutral-900 dark:text-white"
                >
                  <option value="admin">Admin (Can add/edit domains & renewal settings)</option>
                  <option value="monitor">Domain Monitor (Views & receives alert notifications)</option>
                  <option value="viewer">Auditor / Viewer (Read-only)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Assigned Portfolios
                </label>
                <div className="space-y-1.5 pt-1">
                  {ALL_PORTFOLIOS.map((tag) => (
                    <label key={tag} className="flex items-center gap-2 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedPortfolios.includes(tag)}
                        onChange={() => togglePortfolio(tag)}
                        className="rounded border-neutral-300 dark:border-neutral-700 text-neutral-900 focus:ring-0"
                      />
                      <span className="text-neutral-700 dark:text-neutral-300">{tag}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 space-y-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailAlerts}
                    onChange={(e) => setEmailAlerts(e.target.checked)}
                    className="rounded border-neutral-300 dark:border-neutral-700 text-neutral-900 focus:ring-0"
                  />
                  <span className="text-neutral-700 dark:text-neutral-300">
                    Send 30-day and 48-hour email renewal reminders
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={telegramAlerts}
                    onChange={(e) => setTelegramAlerts(e.target.checked)}
                    className="rounded border-neutral-300 dark:border-neutral-700 text-neutral-900 focus:ring-0"
                  />
                  <span className="text-neutral-700 dark:text-neutral-300">
                    Forward critical alerts to Telegram Bot
                  </span>
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-3.5 py-1.5 text-xs text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 rounded transition-colors"
                >
                  Add Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
