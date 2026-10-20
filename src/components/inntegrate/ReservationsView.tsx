import React, { useState } from 'react';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ArrowUpRight,
  List,
  LayoutGrid,
} from 'lucide-react';
import { Reservation, ReservationStatus, TabType } from './types';
import { TopNavigation } from './TopNavigation';

interface ReservationsViewProps {
  reservations: Reservation[];
  onOpenNewReservation: () => void;
  onSelectTab: (tab: TabType) => void;
  onSelectReservation?: (reservation: Reservation) => void;
}

export const ReservationsView: React.FC<ReservationsViewProps> = ({
  reservations,
  onOpenNewReservation,
  onSelectTab,
  onSelectReservation,
}) => {
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [currentDateIndex, setCurrentDateIndex] = useState('January 9, 2025');

  // Filter reservations based on selected pill
  const filteredReservations = reservations.filter((r) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'new') return r.status === 'new';
    if (activeFilter === 'confirmed') return r.status === 'confirmed';
    if (activeFilter === 'checked_in') return r.status === 'checked_in';
    if (activeFilter === 'checked_out') return r.status === 'checked_out';
    if (activeFilter === 'completed') return r.status === 'completed';
    if (activeFilter === 'cancelled') return r.status === 'cancelled';
    return true;
  });

  const getStatusBadge = (status: ReservationStatus) => {
    switch (status) {
      case 'new':
        return (
          <span className="px-3 py-1 rounded-xl bg-[#F0EDFF] text-[#7C5CFC] font-bold text-xs inline-flex items-center">
            New
          </span>
        );
      case 'checked_in':
        return (
          <span className="px-3 py-1 rounded-xl bg-[#FEF6E6] text-[#F59E0B] font-bold text-xs inline-flex items-center">
            Checked In
          </span>
        );
      case 'confirmed':
        return (
          <span className="px-3 py-1 rounded-xl bg-[#E7F9F2] text-[#05CD99] font-bold text-xs inline-flex items-center">
            Confirmed
          </span>
        );
      case 'checked_out':
        return (
          <span className="px-3 py-1 rounded-xl bg-[#EDF5FF] text-[#2F80ED] font-bold text-xs inline-flex items-center">
            Checked Out
          </span>
        );
      case 'completed':
        return (
          <span className="px-3 py-1 rounded-xl bg-[#F1F5F9] text-[#64748B] font-bold text-xs inline-flex items-center">
            Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-3 py-1 rounded-xl bg-[#FFEAEA] text-[#FF4B8B] font-bold text-xs inline-flex items-center">
            Cancelled
          </span>
        );
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-300">
      {/* ============================================================ */}
      {/* TOP DARK HEADER CARD (Matching Screenshot 2)                 */}
      {/* ============================================================ */}
      <div className="bg-[#0B0C10] text-white rounded-[28px] p-6 lg:p-8 shadow-2xl border border-white/5">
        {/* Integrated Top Navigation */}
        <TopNavigation
          currentTab="reservations"
          onSelectTab={onSelectTab}
          variant="dark"
        />

        {/* Title and Action Button Row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-6">
          <h2 className="text-3xl font-extrabold tracking-tight text-white">
            Reservations
          </h2>

          <button
            onClick={onOpenNewReservation}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7C5CFC] hover:bg-[#6C47FF] text-white font-bold text-xs shadow-lg shadow-purple-500/25 transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>New reservation</span>
          </button>
        </div>

        {/* Filter Pills Bar & View Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-4 mt-8 pt-4 border-t border-white/10">
          {/* Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {/* All */}
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeFilter === 'all'
                  ? 'bg-white/20 text-white shadow-sm'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              All
            </button>

            {/* New */}
            <button
              onClick={() => setActiveFilter('new')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeFilter === 'new'
                  ? 'bg-white/20 text-white shadow-sm'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#7C5CFC]"></span>
              <span>New</span>
            </button>

            {/* Confirmed */}
            <button
              onClick={() => setActiveFilter('confirmed')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeFilter === 'confirmed'
                  ? 'bg-white/20 text-white shadow-sm'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#05CD99]"></span>
              <span>Confirmed</span>
            </button>

            {/* Checked In */}
            <button
              onClick={() => setActiveFilter('checked_in')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeFilter === 'checked_in'
                  ? 'bg-white/20 text-white shadow-sm'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#FFA500]"></span>
              <span>Checked In</span>
            </button>

            {/* Checked Out */}
            <button
              onClick={() => setActiveFilter('checked_out')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeFilter === 'checked_out'
                  ? 'bg-white/20 text-white shadow-sm'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#2F80ED]"></span>
              <span>Checked Out</span>
            </button>

            {/* Completed */}
            <button
              onClick={() => setActiveFilter('completed')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeFilter === 'completed'
                  ? 'bg-white/20 text-white shadow-sm'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
              <span>Completed</span>
            </button>

            {/* Cancelled */}
            <button
              onClick={() => setActiveFilter('cancelled')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeFilter === 'cancelled'
                  ? 'bg-white/20 text-white shadow-sm'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#FF4B8B]"></span>
              <span>Cancelled</span>
            </button>
          </div>

          {/* View Toggles (List vs Grid) */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-white/20 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white/20 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* BOTTOM TABLE CARD (Reservation List)                         */}
      {/* ============================================================ */}
      <div className="bg-white rounded-[28px] p-6 lg:p-8 shadow-xl shadow-black/5 border border-slate-100">
        {/* Table Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="font-extrabold text-slate-900 text-lg tracking-tight">
              Reservation List
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">
              An overview of all active reservations
            </p>
          </div>

          {/* Date Selector Navigation (< January 9, 2025 >) */}
          <div className="flex items-center gap-1 bg-[#F8F9FA] rounded-xl px-2 py-1.5 text-xs font-semibold text-slate-700">
            <button
              onClick={() => setCurrentDateIndex('January 8, 2025')}
              className="p-1 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-bold select-none">{currentDateIndex}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 mr-1" />
            <button
              onClick={() => setCurrentDateIndex('January 10, 2025')}
              className="p-1 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-medium">
                <th className="pb-4 font-semibold">Booking ID</th>
                <th className="pb-4 font-semibold">Guest name</th>
                <th className="pb-4 font-semibold">Email</th>
                <th className="pb-4 font-semibold">Room number</th>
                <th className="pb-4 font-semibold">Room type</th>
                <th className="pb-4 font-semibold">Checked In</th>
                <th className="pb-4 font-semibold">Checked Out</th>
                <th className="pb-4 font-semibold">Total Guests</th>
                <th className="pb-4 font-semibold">Status</th>
                <th className="pb-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredReservations.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => onSelectReservation && onSelectReservation(item)}
                  className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                >
                  {/* Booking ID */}
                  <td className="py-4 font-semibold text-slate-800">
                    {item.bookingId}
                  </td>

                  {/* Guest Name & Avatar */}
                  <td className="py-4">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={item.guestAvatar}
                        alt={item.guestName}
                        className="w-7 h-7 rounded-full object-cover shrink-0 ring-1 ring-slate-100"
                      />
                      <span className="font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
                        {item.guestName}
                      </span>
                    </div>
                  </td>

                  {/* Email */}
                  <td className="py-4 text-slate-500">
                    {item.email}
                  </td>

                  {/* Room Number */}
                  <td className="py-4 font-bold text-slate-800">
                    {item.roomNumber}
                  </td>

                  {/* Room Type */}
                  <td className="py-4 text-slate-600 font-medium">
                    {item.roomType}
                  </td>

                  {/* Checked In */}
                  <td className="py-4 text-slate-600">
                    {item.checkedInDate}
                  </td>

                  {/* Checked Out */}
                  <td className="py-4 text-slate-600">
                    {item.checkedOutDate}
                  </td>

                  {/* Total Guests */}
                  <td className="py-4 text-slate-600 font-medium">
                    {item.totalGuests}
                  </td>

                  {/* Status Badge */}
                  <td className="py-4">
                    {getStatusBadge(item.status)}
                  </td>

                  {/* Action Arrow */}
                  <td className="py-4 text-right">
                    <div className="w-8 h-8 rounded-xl bg-[#F8F9FA] group-hover:bg-[#0D111C] group-hover:text-white text-slate-600 flex items-center justify-center transition-all ml-auto">
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredReservations.length === 0 && (
            <div className="py-12 text-center text-slate-400">
              <p className="text-sm font-medium">No reservations match this filter.</p>
              <button
                onClick={() => setActiveFilter('all')}
                className="mt-2 text-xs font-semibold text-[#7C5CFC] hover:underline"
              >
                Clear filter
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
