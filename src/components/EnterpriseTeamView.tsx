import React, { useState } from 'react';
import { TeamMember, PortfolioTag, DomainItem, UserRole } from '../types/domain';
import {
  Users,
  UserPlus,
  Shield,
  Building2,
  Trash2,
  Mail,
  MessageSquare,
  X,
} from 'lucide-react';

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
  const [newRole, setNewRole] = useState<UserRole>('admin');
  const [selectedPortfolios, setSelectedPortfolios] = useState<PortfolioTag[]>([
    'Core Infrastructure',
  ]);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [telegramAlerts, setTelegramAlerts] = useState(false);

  const togglePortfolio = (tag: PortfolioTag) => {
    if (selectedPortfolios.includes(tag)) {
      if (selectedPortfolios.length > 1) {
        setSelectedPortfolios(selectedPortfolios.filter((t) => t !== tag));
      }
    } else {
      setSelectedPortfolios([...selectedPortfolios, tag]);
    }
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newName) return;

    const newMember: TeamMember = {
      id: `usr_${Date.now()}`,
      name: newName,
      email: newEmail,
      role: newRole,
      assignedPortfolios: selectedPortfolios,
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
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Enterprise Organization Banner */}
      <div className="border border-[#E2E4EE] dark:border-[#1F2756] bg-white dark:bg-[#101432] rounded-[14px] p-6 sm:p-7 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-start gap-4">
          <div className="p-3.5 rounded-[10px] bg-[#101432] text-[#D6F24B] shrink-0 font-bold border border-[#1B2050]">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="font-display text-[26px] font-extrabold text-[#101432] dark:text-white leading-tight tracking-[-0.025em]">
                Enterprise Portfolio &amp; Access Roster
              </h1>
              <span className="px-3 py-0.5 bg-[#E6E8FF] text-[#2A3AF0] rounded-full font-mono text-[11px] font-semibold">
                Multi-Tenant Scopes
              </span>
            </div>
            <p className="text-[14px] text-[#5B6178] mt-1.5 max-w-xl leading-relaxed">
              Grant scoped access to internal engineering, security, and brand teams to manage designated domain portfolios and monitor high-priority expiration alerts.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowInviteModal(true)}
          className="btn-ultramarine flex items-center justify-center gap-2 whitespace-nowrap self-stretch sm:self-start md:self-auto cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Grant Member Access</span>
        </button>
      </div>

      {/* Portfolio Distribution Matrix */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {ALL_PORTFOLIOS.map((tag) => {
          const count = domains.filter((d) => d.portfolio === tag).length;
          const assignedMembers = teamMembers.filter((m) => m.assignedPortfolios.includes(tag)).length;
          return (
            <div
              key={tag}
              className="p-4 border border-[#E2E4EE] dark:border-[#1F2756] bg-white dark:bg-[#101432] rounded-[14px] text-xs shadow-xs hover:border-[#2A3AF0]/40 transition-colors"
            >
              <div className="font-medium text-[#101432] dark:text-white truncate">
                {tag}
              </div>
              <div className="mt-2.5 flex items-baseline justify-between font-mono">
                <span className="font-display text-2xl font-bold text-[#101432] dark:text-white tabular-nums">
                  {count}
                </span>
                <span className="eyebrow-label text-[#5B6178]">domains</span>
              </div>
              <div className="mt-1 text-[11px] text-[#5B6178] truncate font-mono">
                {assignedMembers} lead{assignedMembers === 1 ? '' : 's'} assigned
              </div>
            </div>
          );
        })}
      </div>

      {/* Employee & Access Roster */}
      <div className="border border-[#E2E4EE] dark:border-[#1F2756] bg-white dark:bg-[#101432] rounded-[14px] shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E2E4EE] dark:border-[#1F2756] flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <Users className="w-4 h-4 text-[#2A3AF0] shrink-0" />
            <h2 className="text-[15px] font-semibold text-[#101432] dark:text-white">
              Authorized Team Members &amp; Roles ({teamMembers.length})
            </h2>
          </div>
          <span className="eyebrow-label text-[#5B6178]">Role-based Access Control (RBAC)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] min-w-[640px]">
            <thead className="bg-[#101432] text-white font-mono text-[11px] uppercase tracking-[0.05em] border-b border-[#1B2050]">
              <tr>
                <th className="px-6 py-3.5">EMPLOYEE</th>
                <th className="px-6 py-3.5">ROLE</th>
                <th className="px-6 py-3.5">PORTFOLIOS</th>
                <th className="px-6 py-3.5">ALERTS</th>
                <th className="px-6 py-3.5">JOINED</th>
                <th className="px-6 py-3.5 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E4EE] dark:divide-[#1F2756]">
              {teamMembers.map((member) => (
                <tr key={member.id} className="hover:bg-[#F3F4F8]/70 dark:hover:bg-[#1B2050]/40 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-[#101432] dark:text-white">
                      {member.name}
                    </div>
                    <div className="text-[#5B6178] font-mono text-[11px] mt-0.5">
                      {member.email}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-mono text-[11px] font-bold uppercase ${
                        member.role === 'owner'
                          ? 'bg-[#FFF0C2] text-[#3D2800] border border-[#F5D56B]'
                          : member.role === 'admin'
                          ? 'bg-[#E6E8FF] text-[#2A3AF0]'
                          : member.role === 'monitor'
                          ? 'bg-[#D7F4E6] text-[#0B7A57]'
                          : 'bg-[#F3F4F8] dark:bg-[#1B2050] text-[#5B6178]'
                      }`}
                    >
                      {member.role}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      {member.assignedPortfolios.map((p) => (
                        <span
                          key={p}
                          className="px-2.5 py-0.5 bg-[#F3F4F8] dark:bg-[#1B2050] text-[#101432] dark:text-white border border-[#E2E4EE] dark:border-[#1F2756] rounded-full text-[11px] font-medium"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {member.receiveEmailAlerts && (
                        <span className="p-1.5 rounded-[6px] bg-[#E6E8FF] text-[#2A3AF0]" title="Email notifications active">
                          <Mail className="w-3.5 h-3.5" />
                        </span>
                      )}
                      {member.receiveTelegramAlerts && (
                        <span className="p-1.5 rounded-[6px] bg-[#D7F4E6] text-[#0B7A57]" title="Telegram alerts active">
                          <MessageSquare className="w-3.5 h-3.5" />
                        </span>
                      )}
                      {!member.receiveEmailAlerts && !member.receiveTelegramAlerts && (
                        <span className="text-[#5B6178] text-[11px] font-mono">Muted</span>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4 font-mono text-[#5B6178] text-[11px]">
                    {member.addedAt}
                  </td>

                  <td className="px-6 py-4 text-right">
                    {member.role !== 'owner' ? (
                      <button
                        onClick={() => onRemoveTeamMember(member.id)}
                        className="p-1.5 text-[#5B6178] hover:text-[#D63A2C] hover:bg-[#FFF4F2] dark:hover:bg-[#2A141A] rounded-[8px] transition-colors cursor-pointer"
                        title="Revoke Access"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <span className="text-[11px] font-mono text-[#5B6178]">Owner</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#101432] rounded-[14px] border border-[#E2E4EE] dark:border-[#1F2756] max-w-lg w-full p-6 sm:p-7 shadow-lg space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-[#E2E4EE] dark:border-[#1F2756]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-[10px] bg-[#E6E8FF] text-[#2A3AF0]">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-base text-[#101432] dark:text-white">
                    Grant Employee Scoped Access
                  </h3>
                  <p className="text-xs text-[#5B6178]">Assign roles and scoped domain portfolios.</p>
                </div>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className="p-1.5 rounded-[8px] text-[#5B6178] hover:text-[#101432] dark:hover:text-white hover:bg-[#F3F4F8] dark:hover:bg-[#1B2050] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleInvite} className="space-y-4 text-[13px]">
              <div>
                <label className="block font-semibold text-[#101432] dark:text-white mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Henderson"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-[10px] bg-[#F3F4F8] dark:bg-[#0E122B] border border-[#E2E4EE] dark:border-[#1F2756] text-[#101432] dark:text-white focus:outline-none focus:border-[#2A3AF0] focus:ring-1 focus:ring-[#2A3AF0]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#101432] dark:text-white mb-1.5">
                  Corporate Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="alex.h@company.internal"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-[10px] bg-[#F3F4F8] dark:bg-[#0E122B] border border-[#E2E4EE] dark:border-[#1F2756] text-[#101432] dark:text-white focus:outline-none focus:border-[#2A3AF0] focus:ring-1 focus:ring-[#2A3AF0] font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#101432] dark:text-white mb-1.5">
                  Role Permission
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full px-3.5 py-2 rounded-[10px] bg-[#F3F4F8] dark:bg-[#0E122B] border border-[#E2E4EE] dark:border-[#1F2756] text-[#101432] dark:text-white focus:outline-none focus:border-[#2A3AF0] focus:ring-1 focus:ring-[#2A3AF0]"
                >
                  <option value="admin">Admin (Add, modify, and delete domains)</option>
                  <option value="monitor">Monitor (Manage alert thresholds &amp; view logs)</option>
                  <option value="viewer">Viewer (Read-only status dashboard)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#101432] dark:text-white mb-1.5">
                  Assigned Domain Portfolios
                </label>
                <div className="flex flex-wrap gap-2">
                  {ALL_PORTFOLIOS.map((tag) => {
                    const isSelected = selectedPortfolios.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => togglePortfolio(tag)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#101432] text-white dark:bg-white dark:text-[#101432]'
                            : 'bg-[#F3F4F8] dark:bg-[#0E122B] text-[#5B6178] border border-[#E2E4EE] dark:border-[#1F2756]'
                        }`}
                      >
                        {tag} {isSelected ? '✓' : '+'}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="btn-neutral-surface cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-ultramarine cursor-pointer"
                >
                  Confirm Authorization
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
