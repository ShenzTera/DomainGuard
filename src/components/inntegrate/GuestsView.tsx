import React, { useState } from 'react';
import { Search, Plus, Star, ArrowUpRight } from 'lucide-react';
import { GuestProfile, TabType } from './types';
import { TopNavigation } from './TopNavigation';

interface GuestsViewProps {
  guests: GuestProfile[];
  onSelectTab: (tab: TabType) => void;
}

export const GuestsView: React.FC<GuestsViewProps> = ({ guests, onSelectTab }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredGuests = guests.filter(
    (g) =>
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.currentRoom && g.currentRoom.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Top Header Card */}
      <div className="bg-[#0B0C10] text-white rounded-[28px] p-6 lg:p-8 shadow-2xl border border-white/5">
        <TopNavigation currentTab="guests" onSelectTab={onSelectTab} variant="dark" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-6">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white">Guests Directory</h2>
            <p className="text-xs text-slate-400 mt-1">Manage guest profiles, loyalty points, and stay records</p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search guest by name or room..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/10 text-white placeholder-slate-400 text-xs rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500 border border-white/10"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#7C5CFC] hover:bg-[#6C47FF] text-white font-bold text-xs shadow-md shrink-0">
              <Plus className="w-4 h-4" />
              <span>Add Guest</span>
            </button>
          </div>
        </div>
      </div>

      {/* Guests Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGuests.map((guest) => (
          <div
            key={guest.id}
            className="bg-white rounded-[28px] p-6 shadow-xl shadow-black/5 border border-slate-100 flex flex-col justify-between group hover:-translate-y-1 transition-all"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={guest.avatar}
                    alt={guest.name}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-purple-100"
                  />
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">{guest.name}</h4>
                    <span className="text-xs text-slate-400">{guest.email}</span>
                  </div>
                </div>

                {guest.vipStatus && (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 text-amber-600 text-xs font-bold border border-amber-200/50">
                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                    VIP
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 mt-6">
                <div className="bg-[#F8F9FA] rounded-2xl p-3">
                  <span className="text-[11px] text-slate-400 font-medium block">Current Room</span>
                  <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                    {guest.currentRoom || 'None'}
                  </span>
                </div>
                <div className="bg-[#F8F9FA] rounded-2xl p-3">
                  <span className="text-[11px] text-slate-400 font-medium block">Total Stays</span>
                  <span className="font-bold text-slate-900 text-sm mt-0.5 block">{guest.totalStays} trips</span>
                </div>
              </div>

              <div className="bg-[#F8F9FA] rounded-2xl p-3.5 mt-3 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 font-medium block">Total Spend</span>
                  <span className="font-extrabold text-slate-900 text-sm">${guest.totalSpent.toLocaleString()}</span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-400 font-medium block">Loyalty Points</span>
                  <span className="font-bold text-[#7C5CFC] text-sm">{guest.loyaltyPoints} pts</span>
                </div>
              </div>
            </div>

            <button className="w-full mt-5 py-3 px-4 rounded-xl bg-[#0D111C] hover:bg-[#1E2638] text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all">
              <span>View Guest Profile</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
