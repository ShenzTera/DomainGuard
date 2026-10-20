import React, { useState, useMemo } from 'react';
import {
  ChevronDown,
  ArrowUpRight,
  Search,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Filter,
  Eye,
  Plus,
  ArrowUpDown,
  CheckCircle2,
} from 'lucide-react';
import { AVATARS, INITIAL_RESERVATIONS } from './mockData';
import { Reservation, ReservationStatus } from './types';

interface DashboardViewProps {
  onOpenOrderModal: (orderId: string) => void;
  onOpenRoomModal: (roomId: string) => void;
  onOpenNewReservation?: () => void;
  onSelectReservation?: (reservation: Reservation) => void;
  reservations?: Reservation[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenOrderModal,
  onOpenRoomModal,
  onOpenNewReservation,
  onSelectReservation,
  reservations = INITIAL_RESERVATIONS,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<'Weekly' | 'Monthly' | 'Annual'>('Weekly');
  const [bookingFilter, setBookingFilter] = useState<'Quantity' | 'Revenue' | 'Occupancy'>('Quantity');
  const [selectedMonth, setSelectedMonth] = useState('January 2025');
  const [tableSearch, setTableSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tableDate, setTableDate] = useState('January 9, 2025');
  const [selectedVennRoom, setSelectedVennRoom] = useState<string | null>(null);

  // Dynamic bar chart figures depending on filter
  const barChartData = useMemo(() => {
    switch (bookingFilter) {
      case 'Revenue':
        return {
          jan: { val: '$113.7k', height: '140px', label: 'January' },
          feb: { val: '$102.2k', height: '125px', label: 'February', badge: '-10%' },
          mar: { val: '$55.5k', height: '75px', label: 'March' },
        };
      case 'Occupancy':
        return {
          jan: { val: '88%', height: '140px', label: 'January' },
          feb: { val: '79%', height: '125px', label: 'February', badge: '-9%' },
          mar: { val: '43%', height: '75px', label: 'March' },
        };
      case 'Quantity':
      default:
        return {
          jan: { val: '455', height: '140px', label: 'January' },
          feb: { val: '409', height: '125px', label: 'February', badge: '-10%' },
          mar: { val: '222', height: '75px', label: 'March' },
        };
    }
  }, [bookingFilter]);

  // Filter reservations for the clean data table
  const filteredReservations = useMemo(() => {
    return reservations.filter((r) => {
      const matchesSearch =
        !tableSearch ||
        r.guestName.toLowerCase().includes(tableSearch.toLowerCase()) ||
        r.bookingId.toLowerCase().includes(tableSearch.toLowerCase()) ||
        r.roomNumber.toLowerCase().includes(tableSearch.toLowerCase()) ||
        r.email.toLowerCase().includes(tableSearch.toLowerCase());

      const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [reservations, tableSearch, statusFilter]);

  const getStatusBadge = (status: ReservationStatus) => {
    switch (status) {
      case 'new':
        return (
          <span className="px-3 py-1 rounded-xl bg-[#F0EDFF] text-[#7C5CFC] font-bold text-xs inline-flex items-center gap-1.5 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#7C5CFC]"></span>
            <span>New</span>
          </span>
        );
      case 'checked_in':
        return (
          <span className="px-3 py-1 rounded-xl bg-[#FEF6E6] text-[#F59E0B] font-bold text-xs inline-flex items-center gap-1.5 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]"></span>
            <span>Checked In</span>
          </span>
        );
      case 'confirmed':
        return (
          <span className="px-3 py-1 rounded-xl bg-[#E7F9F2] text-[#05CD99] font-bold text-xs inline-flex items-center gap-1.5 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#05CD99]"></span>
            <span>Confirmed</span>
          </span>
        );
      case 'checked_out':
        return (
          <span className="px-3 py-1 rounded-xl bg-[#EDF5FF] text-[#2F80ED] font-bold text-xs inline-flex items-center gap-1.5 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2F80ED]"></span>
            <span>Checked Out</span>
          </span>
        );
      case 'completed':
        return (
          <span className="px-3 py-1 rounded-xl bg-[#F1F5F9] text-[#64748B] font-bold text-xs inline-flex items-center gap-1.5 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#64748B]"></span>
            <span>Completed</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-3 py-1 rounded-xl bg-[#FFEAEA] text-[#FF4B8B] font-bold text-xs inline-flex items-center gap-1.5 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF4B8B]"></span>
            <span>Cancelled</span>
          </span>
        );
    }
  };

  const openGuestReservation = (guestName: string) => {
    if (!onSelectReservation) return;
    const match = reservations.find((r) => r.guestName.toLowerCase().includes(guestName.toLowerCase()));
    if (match) {
      onSelectReservation(match);
    } else {
      onSelectReservation({
        id: `res_${guestName.toLowerCase().replace(/\s+/g, '_')}`,
        bookingId: `#${Math.floor(1000 + Math.random() * 9000)}`,
        guestName,
        guestAvatar: AVATARS.alexTrie,
        email: `${guestName.toLowerCase().replace(/\s+/g, '')}@grandhorizon.com`,
        roomNumber: 'D-08',
        roomType: 'Double',
        checkedInDate: 'Jan 9, 2025',
        checkedOutDate: 'Jan 16, 2025',
        totalGuests: '2 Adults',
        status: 'confirmed',
      });
    }
  };

  return (
    <div className="w-full flex flex-col gap-8 animate-in fade-in duration-300">
      {/* ============================================================ */}
      {/* TOP 3-COLUMN BENTO GRID LAYOUT                               */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
      {/* ============================================================ */}
      {/* LEFT COLUMN: Top Category (Venn) & Guest Food Order Card      */}
      {/* ============================================================ */}
      <div className="lg:col-span-3 flex flex-col gap-6">
        {/* Card 1: Top Category (Triple Overlapping Venn Diagram) */}
        <div className="bg-white rounded-[28px] p-6 shadow-xl shadow-black/5 border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-base tracking-tight">Top category</h3>
            <div className="relative group">
              <button
                onClick={() =>
                  setCategoryFilter(
                    categoryFilter === 'Weekly' ? 'Monthly' : categoryFilter === 'Monthly' ? 'Annual' : 'Weekly'
                  )
                }
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F8F9FA] hover:bg-[#F0F1F5] text-xs font-semibold text-slate-700 transition-colors"
              >
                <span>{categoryFilter}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Triple Venn Diagram */}
          <div className="relative w-full h-[220px] my-3 flex items-center justify-center">
            {/* Top Navy Circle (Double room - 56%) */}
            <div
              onClick={() => {
                const next = selectedVennRoom === 'Double' ? null : 'Double';
                setSelectedVennRoom(next);
                setTableSearch(next || '');
              }}
              title="Click to filter Double rooms"
              className={`absolute top-1 left-1/2 -translate-x-1/2 w-[130px] h-[130px] rounded-full bg-[#0D111C] text-white flex flex-col items-center justify-center shadow-lg shadow-black/20 z-10 transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                selectedVennRoom === 'Double' ? 'ring-4 ring-purple-400 ring-offset-2' : ''
              }`}
            >
              <span className="font-extrabold text-2xl tracking-tight leading-none">56%</span>
              <span className="text-[10px] text-slate-300 font-medium mt-1">Double room</span>
            </div>

            {/* Bottom Left Purple Circle (Single room - 30%) */}
            <div
              onClick={() => {
                const next = selectedVennRoom === 'Single' ? null : 'Single';
                setSelectedVennRoom(next);
                setTableSearch(next || '');
              }}
              title="Click to filter Single rooms"
              className={`absolute bottom-1 left-4 w-[116px] h-[116px] rounded-full bg-[#7C5CFC] text-white flex flex-col items-center justify-center shadow-lg shadow-purple-500/25 z-20 transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                selectedVennRoom === 'Single' ? 'ring-4 ring-black ring-offset-2' : ''
              }`}
            >
              <span className="font-extrabold text-xl tracking-tight leading-none">30%</span>
              <span className="text-[10px] text-purple-100 font-medium mt-1">Single room</span>
            </div>

            {/* Bottom Right Soft Lilac Circle (Deluxe room - 14%) */}
            <div
              onClick={() => {
                const next = selectedVennRoom === 'Deluxe' ? null : 'Deluxe';
                setSelectedVennRoom(next);
                setTableSearch(next || '');
              }}
              title="Click to filter Deluxe rooms"
              className={`absolute bottom-2 right-4 w-[100px] h-[100px] rounded-full bg-[#EAE8FE] text-slate-900 flex flex-col items-center justify-center shadow-md z-20 transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                selectedVennRoom === 'Deluxe' ? 'ring-4 ring-purple-600 ring-offset-2' : ''
              }`}
            >
              <span className="font-extrabold text-lg tracking-tight leading-none text-slate-900">14%</span>
              <span className="text-[9px] text-slate-600 font-medium mt-0.5">Deluxe room</span>
            </div>
          </div>
        </div>

        {/* Card 2: Food Order Ticket Card (Alex Trie #299283) */}
        <div className="bg-white rounded-[28px] p-6 shadow-xl shadow-black/5 border border-slate-100 flex flex-col justify-between">
          <div>
            {/* Header with Avatar & New Badge */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={AVATARS.alexTrie}
                  alt="Alex Trie"
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-purple-100"
                />
                <div>
                  <h4 className="font-bold text-slate-900 text-sm leading-tight">Alex Trie</h4>
                  <span className="text-[11px] text-slate-400 font-medium">Order #299283</span>
                </div>
              </div>
              <span className="px-3 py-1 rounded-xl bg-[#F0EDFF] text-[#7C5CFC] font-bold text-xs">
                New
              </span>
            </div>

            {/* Room & Total payment sub-boxes */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-[#F8F9FA] rounded-2xl p-3">
                <span className="text-[11px] text-slate-400 font-medium block">Room number</span>
                <span className="font-bold text-slate-900 text-sm mt-0.5 block">S-01</span>
              </div>
              <div className="bg-[#F8F9FA] rounded-2xl p-3">
                <span className="text-[11px] text-slate-400 font-medium block">Total payment</span>
                <span className="font-bold text-slate-900 text-sm mt-0.5 block">$27.50</span>
              </div>
            </div>

            {/* Food Items Breakdown */}
            <div className="space-y-3 mt-4">
              {/* Item 1 */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center overflow-hidden shrink-0">
                    <span className="text-base">🥗</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800 block leading-tight">
                      Grilled salmon with vegetables
                    </span>
                    <span className="text-slate-400 text-[11px]">$18.50</span>
                  </div>
                </div>
                <span className="font-bold text-slate-900 text-xs shrink-0">1x</span>
              </div>

              {/* Item 2 */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center overflow-hidden shrink-0">
                    <span className="text-base">🍲</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800 block leading-tight">
                      Garden salad
                    </span>
                    <span className="text-slate-400 text-[11px]">$6.00</span>
                  </div>
                </div>
                <span className="font-bold text-slate-900 text-xs shrink-0">1x</span>
              </div>

              {/* +2 more items label */}
              <div className="text-right">
                <button
                  onClick={() => onOpenOrderModal('ord_1')}
                  className="text-[11px] font-semibold text-slate-400 hover:text-slate-700 transition-colors"
                >
                  +2 more items
                </button>
              </div>
            </div>

            {/* Order Notes Box */}
            <div className="bg-[#F8F9FA] rounded-2xl p-3 mt-3">
              <span className="text-[10px] text-slate-400 font-medium block uppercase tracking-wider">
                Order Notes
              </span>
              <p className="text-xs text-slate-800 font-medium mt-0.5">
                No dressing on the salad.
              </p>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={() => onOpenOrderModal('ord_1')}
            className="w-full mt-4 py-3 px-4 rounded-xl bg-[#0D111C] hover:bg-[#1E2638] text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-black/10 active:scale-[0.99]"
          >
            <span>Order details</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* CENTER COLUMN: January 2025 Booking Timeline & Metric Cards  */}
      {/* ============================================================ */}
      <div className="lg:col-span-6 flex flex-col gap-6">
        {/* Main Schedule / Booking Timeline Gantt Chart */}
        <div className="bg-white rounded-[28px] p-6 shadow-xl shadow-black/5 border border-slate-100 flex-1 flex flex-col justify-between">
          <div>
            {/* Header with Month Dropdown */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-1.5 cursor-pointer group">
                <h3 className="font-bold text-slate-900 text-lg tracking-tight group-hover:text-purple-600 transition-colors">
                  {selectedMonth}
                </h3>
                <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-purple-600 transition-colors" />
              </div>
            </div>

            {/* Timeline Header Row (Days: Mon 1 to Mon 15) */}
            <div className="grid grid-cols-15 gap-1 text-center border-b border-slate-100 pb-3 select-none">
              {[
                { day: 'Mon', num: 1 },
                { day: 'Tue', num: 2 },
                { day: 'Wed', num: 3 },
                { day: 'Thu', num: 4 },
                { day: 'Fri', num: 5 },
                { day: 'Sat', num: 6 },
                { day: 'Sun', num: 7 },
                { day: 'Mon', num: 8 },
                { day: 'Tue', num: 9, isCurrent: true },
                { day: 'Wed', num: 10 },
                { day: 'Thu', num: 11 },
                { day: 'Fri', num: 12 },
                { day: 'Sat', num: 13 },
                { day: 'Sun', num: 14 },
                { day: 'Mon', num: 15 },
              ].map((item) => (
                <div key={item.num} className="flex flex-col items-center">
                  <span className="text-[10px] text-slate-400 font-medium">{item.day}</span>
                  <span
                    className={`text-xs mt-1 font-bold w-6 h-6 flex items-center justify-center rounded-lg transition-colors ${
                      item.isCurrent
                        ? 'bg-[#7C5CFC] text-white shadow-md shadow-purple-500/30'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {item.num}
                  </span>
                </div>
              ))}
            </div>

            {/* Gantt Booking Schedule Rows */}
            <div className="relative mt-6 space-y-4 min-h-[300px]">
              {/* Subtle Vertical Day 9 Current Indicator Line */}
              <div className="absolute top-0 bottom-0 left-[56.6%] w-px bg-purple-200/80 pointer-events-none z-0"></div>

              {/* Row 1: Kris Black (Gray Bar) */}
              <div className="relative h-10 flex items-center">
                <div
                  onClick={() => openGuestReservation('Kris Black')}
                  className="absolute left-[36%] w-[28%] h-9 rounded-full bg-[#EAECEF] hover:bg-[#DFE2E7] transition-all hover:scale-[1.02] flex items-center gap-2 px-1.5 shadow-sm cursor-pointer z-10"
                  title="Click to view reservation for Kris Black"
                >
                  <img
                    src={AVATARS.krisBlack}
                    alt="Kris Black"
                    className="w-6 h-6 rounded-full object-cover shrink-0"
                  />
                  <span className="text-xs font-semibold text-slate-800 truncate">Kris Black</span>
                </div>
              </div>

              {/* Row 2: Alex Trie (Light Gray) & Annette Black (Orange) */}
              <div className="relative h-10 flex items-center">
                {/* Alex Trie Bar */}
                <div
                  onClick={() => openGuestReservation('Alex Trie')}
                  className="absolute left-[5%] w-[42%] h-9 rounded-full bg-[#EAECEF] hover:bg-[#DFE2E7] transition-all hover:scale-[1.02] flex items-center gap-2 px-1.5 shadow-sm cursor-pointer z-10"
                  title="Click to view reservation for Alex Trie"
                >
                  <img
                    src={AVATARS.alexTrie}
                    alt="Alex Trie"
                    className="w-6 h-6 rounded-full object-cover shrink-0"
                  />
                  <span className="text-xs font-semibold text-slate-800 truncate">Alex Trie</span>
                </div>

                {/* Annette Black Bar */}
                <div
                  onClick={() => openGuestReservation('Annette Black')}
                  className="absolute left-[50%] w-[48%] h-9 rounded-full bg-[#FFA500] hover:bg-[#F59E0B] transition-all hover:scale-[1.02] flex items-center gap-2 px-1.5 shadow-md shadow-amber-500/20 cursor-pointer z-10 text-white"
                  title="Click to view reservation for Annette Black"
                >
                  <img
                    src={AVATARS.annetteBlack}
                    alt="Annette Black"
                    className="w-6 h-6 rounded-full object-cover shrink-0"
                  />
                  <span className="text-xs font-semibold truncate">Annette Black</span>
                </div>
              </div>

              {/* Row 3: Jerome Bell (Emerald Green) */}
              <div className="relative h-10 flex items-center">
                <div
                  onClick={() => openGuestReservation('Jerome Bell')}
                  className="absolute left-[78%] w-[22%] h-9 rounded-full bg-[#05CD99] hover:bg-[#04B788] transition-all hover:scale-[1.02] flex items-center gap-2 px-1.5 shadow-md shadow-emerald-500/20 cursor-pointer z-10 text-white"
                  title="Click to view reservation for Jerome Bell"
                >
                  <img
                    src={AVATARS.jeromeBell}
                    alt="Jerome Bell"
                    className="w-6 h-6 rounded-full object-cover shrink-0"
                  />
                  <span className="text-xs font-semibold truncate">Jerome Bell</span>
                </div>
              </div>

              {/* Row 4: Kris Black (Purple Gradient Bar) */}
              <div className="relative h-10 flex items-center">
                <div
                  onClick={() => openGuestReservation('Kris Black')}
                  className="absolute left-[58%] w-[38%] h-9 rounded-full bg-gradient-to-r from-[#7C5CFC] to-[#9B82FE] hover:opacity-95 transition-all hover:scale-[1.02] flex items-center gap-2 px-1.5 shadow-md shadow-purple-500/20 cursor-pointer z-10 text-white"
                  title="Click to view reservation for Kris Black"
                >
                  <img
                    src={AVATARS.krisBlack}
                    alt="Kris Black"
                    className="w-6 h-6 rounded-full object-cover shrink-0"
                  />
                  <span className="text-xs font-semibold truncate">Kris Black</span>
                </div>
              </div>

              {/* Row 5: Jerome Bell (Blue Bar) & Jenny Wilson (Green Bar) */}
              <div className="relative h-10 flex items-center">
                {/* Jerome Bell */}
                <div
                  onClick={() => openGuestReservation('Jerome Bell')}
                  className="absolute left-[3%] w-[54%] h-9 rounded-full bg-[#2F80ED] hover:bg-[#256FD2] transition-all hover:scale-[1.02] flex items-center gap-2 px-1.5 shadow-md shadow-blue-500/20 cursor-pointer z-10 text-white"
                  title="Click to view reservation for Jerome Bell"
                >
                  <img
                    src={AVATARS.jeromeBell}
                    alt="Jerome Bell"
                    className="w-6 h-6 rounded-full object-cover shrink-0"
                  />
                  <span className="text-xs font-semibold truncate">Jerome Bell</span>
                </div>

                {/* Jenny Wilson */}
                <div
                  onClick={() => openGuestReservation('Jenny Wilson')}
                  className="absolute left-[60%] w-[28%] h-9 rounded-full bg-[#05CD99] hover:bg-[#04B788] transition-all hover:scale-[1.02] flex items-center gap-2 px-1.5 shadow-md shadow-emerald-500/20 cursor-pointer z-10 text-white"
                  title="Click to view reservation for Jenny Wilson"
                >
                  <img
                    src={AVATARS.jennyWilson}
                    alt="Jenny Wilson"
                    className="w-6 h-6 rounded-full object-cover shrink-0"
                  />
                  <span className="text-xs font-semibold truncate">Jenny Wilson</span>
                </div>
              </div>

              {/* Row 6: Kristin Watson (Gray & Orange Bars) */}
              <div className="relative h-10 flex items-center">
                {/* Left Kristin Watson */}
                <div
                  onClick={() => openGuestReservation('Kristin Watson')}
                  className="absolute left-[3%] w-[38%] h-9 rounded-full bg-[#EAECEF] hover:bg-[#DFE2E7] transition-all hover:scale-[1.02] flex items-center gap-2 px-1.5 shadow-sm cursor-pointer z-10"
                  title="Click to view reservation for Kristin Watson"
                >
                  <img
                    src={AVATARS.kristinWatson}
                    alt="Kristin Watson"
                    className="w-6 h-6 rounded-full object-cover shrink-0"
                  />
                  <span className="text-xs font-semibold text-slate-800 truncate">Kristin Watson</span>
                </div>

                {/* Right Kristin Watson (Orange Bar) */}
                <div
                  onClick={() => openGuestReservation('Kristin Watson')}
                  className="absolute left-[60%] w-[35%] h-9 rounded-full bg-[#FFA500] hover:bg-[#F59E0B] transition-all hover:scale-[1.02] flex items-center gap-2 px-1.5 shadow-md shadow-amber-500/20 cursor-pointer z-10 text-white"
                  title="Click to view reservation for Kristin Watson"
                >
                  <img
                    src={AVATARS.kristinWatson}
                    alt="Kristin Watson"
                    className="w-6 h-6 rounded-full object-cover shrink-0"
                  />
                  <span className="text-xs font-semibold truncate">Kristin Watson</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Two Metric KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Card 1: Active Bookings */}
          <div className="bg-white rounded-[28px] p-6 shadow-xl shadow-black/5 border border-slate-100 flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-slate-900 text-sm tracking-tight">Active bookings</h4>
              <p className="text-xs text-slate-400 mt-1">Compared to (114 last month)</p>
            </div>
            <div className="flex items-baseline gap-3 mt-6">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight">85%</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-[#E7F9F2] text-[#05CD99]">
                +5%
              </span>
            </div>
          </div>

          {/* Card 2: Room Occupancy */}
          <div className="bg-white rounded-[28px] p-6 shadow-xl shadow-black/5 border border-slate-100 flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-slate-900 text-sm tracking-tight">Room occupancy</h4>
              <p className="text-xs text-slate-400 mt-1">Compared to (75% last month)</p>
            </div>
            <div className="flex items-baseline gap-3 mt-6">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight">65%</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-[#FFEAEA] text-[#FF4B8B]">
                -10%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* RIGHT COLUMN: Room Showcase Card & Booking Bar Chart         */}
      {/* ============================================================ */}
      <div className="lg:col-span-3 flex flex-col gap-6">
        {/* Card 1: Room Showcase (Velvet Sky) */}
        <div className="bg-white rounded-[28px] p-6 shadow-xl shadow-black/5 border border-slate-100 flex flex-col justify-between">
          <div>
            {/* Room Image Showcase */}
            <div className="w-full h-40 rounded-2xl overflow-hidden relative shadow-inner bg-slate-900">
              {/* Stylized Luxury Hotel Room Interior */}
              <div className="w-full h-full bg-gradient-to-tr from-slate-900 via-slate-800 to-amber-950/40 relative flex items-center justify-center">
                <svg className="w-full h-full object-cover" viewBox="0 0 400 220" fill="none">
                  {/* Panoramic Window Background */}
                  <rect x="0" y="0" width="400" height="220" fill="#1E2333" />
                  <rect x="20" y="20" width="360" height="130" rx="12" fill="#E8EDF5" />
                  {/* City Skyline Outline through window */}
                  <path d="M40 120 L70 90 L100 120 L140 80 L180 120 L230 70 L280 120 L320 85 L360 120 V150 H40 Z" fill="#CBD5E1" opacity="0.6" />
                  {/* Modern Luxury Sofa & Living Room Setup */}
                  <rect x="50" y="110" width="160" height="70" rx="16" fill="#8C7E72" />
                  <rect x="65" y="100" width="60" height="40" rx="8" fill="#A89B8F" />
                  <rect x="135" y="100" width="60" height="40" rx="8" fill="#A89B8F" />
                  {/* Glass Coffee Table */}
                  <ellipse cx="130" cy="180" rx="45" ry="14" fill="#38BDF8" opacity="0.4" />
                  {/* Minimalist Desk & Lamp */}
                  <rect x="250" y="125" width="110" height="10" rx="2" fill="#292524" />
                  <line x1="260" y1="135" x2="260" y2="190" stroke="#292524" strokeWidth="4" />
                  <line x1="350" y1="135" x2="350" y2="190" stroke="#292524" strokeWidth="4" />
                  <circle cx="330" cy="100" r="14" fill="#FDE047" opacity="0.7" />
                </svg>
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
              </div>
            </div>

            {/* Title & Status */}
            <div className="flex items-start justify-between mt-4">
              <div>
                <h4 className="font-bold text-slate-900 text-base leading-tight">Velvet Sky</h4>
                <span className="text-xs text-slate-400 mt-0.5 block">Type: Delux</span>
              </div>
              <button
                onClick={() => onOpenRoomModal('rm_1')}
                className="px-3 py-1 rounded-xl bg-[#EDF5FF] hover:bg-blue-100 text-[#2F80ED] font-bold text-xs transition-colors"
              >
                To clean
              </button>
            </div>

            {/* Room Number & Rate Boxes */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-[#F8F9FA] rounded-2xl p-3">
                <span className="text-[11px] text-slate-400 font-medium block">Room number</span>
                <span className="font-bold text-slate-900 text-sm mt-0.5 block">De-02</span>
              </div>
              <div className="bg-[#F8F9FA] rounded-2xl p-3">
                <span className="text-[11px] text-slate-400 font-medium block">Room rate</span>
                <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                  $250<span className="text-slate-400 text-xs font-normal">/night</span>
                </span>
              </div>
            </div>

            {/* Last Maintenance Box */}
            <div className="bg-[#F8F9FA] rounded-2xl p-3.5 mt-3">
              <span className="text-[11px] text-slate-400 font-medium block">Last maintenance</span>
              <span className="font-bold text-slate-900 text-xs mt-0.5 block">Jan 3, 2025</span>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={() => onOpenRoomModal('rm_1')}
            className="w-full mt-4 py-3 px-4 rounded-xl bg-[#0D111C] hover:bg-[#1E2638] text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-black/10 active:scale-[0.99]"
          >
            <span>Room details</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 2: Booking Bar Chart Card */}
        <div className="bg-white rounded-[28px] p-6 shadow-xl shadow-black/5 border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-slate-900 text-base tracking-tight">Booking</h3>
            <button
              onClick={() =>
                setBookingFilter(
                  bookingFilter === 'Quantity' ? 'Revenue' : bookingFilter === 'Revenue' ? 'Occupancy' : 'Quantity'
                )
              }
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F8F9FA] hover:bg-[#F0F1F5] text-xs font-semibold text-slate-700 transition-colors"
            >
              <span>{bookingFilter}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>

          {/* 3-Bar Chart Visualization */}
          <div className="grid grid-cols-3 gap-5 items-end h-[190px] pt-4 pb-2 px-1">
            {/* January: Dark Navy */}
            <div className="flex flex-col items-center h-full justify-end group cursor-pointer">
              <span className="text-xs font-bold text-slate-700 mb-2 group-hover:text-purple-600 transition-colors font-mono tabular-nums">
                {barChartData.jan.val}
              </span>
              <div
                style={{ height: barChartData.jan.height }}
                className="w-full bg-[#0D111C] rounded-2xl transition-all group-hover:opacity-90 shadow-sm"
              ></div>
              <span className="text-[11px] text-slate-400 font-medium mt-2">January</span>
            </div>

            {/* February: Pink with floating badge */}
            <div className="flex flex-col items-center h-full justify-end group cursor-pointer">
              <span className="text-xs font-bold text-slate-700 mb-2 group-hover:text-pink-600 transition-colors font-mono tabular-nums">
                {barChartData.feb.val}
              </span>
              <div
                style={{ height: barChartData.feb.height }}
                className="w-full bg-[#FF4B8B] rounded-2xl relative flex items-start justify-center pt-2 transition-all group-hover:opacity-90 shadow-sm shadow-pink-500/20"
              >
                {/* Floating Badge inside Bar */}
                {barChartData.feb.badge && (
                  <span className="px-1.5 py-0.5 rounded-full bg-white text-[#FF4B8B] text-[10px] font-extrabold shadow-sm">
                    {barChartData.feb.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-400 font-medium mt-2">February</span>
            </div>

            {/* March: Soft Lavender Diagonal Stripe */}
            <div className="flex flex-col items-center h-full justify-end group cursor-pointer">
              <span className="text-xs font-bold text-slate-700 mb-2 group-hover:text-purple-600 transition-colors font-mono tabular-nums">
                {barChartData.mar.val}
              </span>
              <div
                style={{ height: barChartData.mar.height }}
                className="w-full bg-[#E5E2FD] rounded-2xl relative overflow-hidden transition-all group-hover:opacity-90 shadow-sm"
              >
                {/* Diagonal subtle rounded stripe pattern */}
                <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="diagonal-stripes" width="12" height="12" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                      <line x1="0" y1="0" x2="0" y2="12" stroke="#D1CBFC" strokeWidth="4" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#diagonal-stripes)" opacity="0.6" />
                </svg>
              </div>
              <span className="text-[11px] text-slate-400 font-medium mt-2">March</span>
            </div>
          </div>
        </div>
      </div>
    </div>

      {/* ============================================================ */}
      {/* BOTTOM SECTION: CLEAN DATA TABLE (Reservation List & Ledger) */}
      {/* ============================================================ */}
      <div className="bg-white rounded-[28px] p-6 lg:p-8 shadow-xl shadow-slate-900/[0.04] border border-slate-200/70 flex flex-col gap-6">
        {/* Header & Controls Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="font-extrabold text-slate-900 text-lg tracking-tight">
                Reservation List & Active Ledger
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-[#7C5CFC] font-bold text-xs">
                {filteredReservations.length} records
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              Real-time room occupancy, guest check-ins, and booking status across all suites
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Live Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search guest or room..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-xl bg-[#F8F9FA] border border-slate-200/80 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 w-48 lg:w-60 transition-all"
              />
            </div>

            {/* Date Navigator */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F8F9FA] border border-slate-200/80 text-xs font-semibold text-slate-700 select-none">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{tableDate}</span>
            </div>

            {/* Primary Action Button */}
            {onOpenNewReservation && (
              <button
                onClick={onOpenNewReservation}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0D111C] hover:bg-[#1E2638] text-white text-xs font-bold transition-all shadow-md shadow-black/10 active:scale-[0.98]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New booking</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Badge Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          {[
            { id: 'all', label: 'All' },
            { id: 'new', label: 'New', color: 'bg-[#7C5CFC]' },
            { id: 'confirmed', label: 'Confirmed', color: 'bg-[#05CD99]' },
            { id: 'checked_in', label: 'Checked In', color: 'bg-[#F59E0B]' },
            { id: 'checked_out', label: 'Checked Out', color: 'bg-[#2F80ED]' },
            { id: 'completed', label: 'Completed', color: 'bg-slate-400' },
            { id: 'cancelled', label: 'Cancelled', color: 'bg-[#FF4B8B]' },
          ].map((tab) => {
            const count = reservations.filter((r) => tab.id === 'all' || r.status === tab.id).length;
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
                  isActive
                    ? 'bg-[#0D111C] text-white shadow-sm'
                    : 'bg-[#F8F9FA] hover:bg-[#F0F1F5] text-slate-600'
                }`}
              >
                {tab.color && <span className={`w-2 h-2 rounded-full ${tab.color}`}></span>}
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* The Clean Data Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8F9FA] border-b border-slate-200/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider select-none">
                <th className="py-3.5 px-4 font-semibold">Booking ID</th>
                <th className="py-3.5 px-4 font-semibold">Guest</th>
                <th className="py-3.5 px-4 font-semibold">Room</th>
                <th className="py-3.5 px-4 font-semibold">Check-In / Out</th>
                <th className="py-3.5 px-4 font-semibold">Party</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredReservations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No reservations match your criteria.
                  </td>
                </tr>
              ) : (
                filteredReservations.map((res) => (
                  <tr
                    key={res.id}
                    className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                    onClick={() => onSelectReservation && onSelectReservation(res)}
                  >
                    <td className="py-4 px-4 font-bold text-slate-900 font-mono tabular-nums">
                      {res.bookingId}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={res.guestAvatar}
                          alt={res.guestName}
                          className="w-9 h-9 rounded-full object-cover ring-2 ring-slate-100 shrink-0"
                        />
                        <div>
                          <span className="font-bold text-slate-900 block leading-tight group-hover:text-purple-600 transition-colors">
                            {res.guestName}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium font-mono">
                            {res.email}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <span className="font-bold text-slate-900 font-mono tabular-nums">
                          {res.roomNumber}
                        </span>
                        <span className="text-[11px] text-slate-400 block font-medium">
                          {res.roomType} Room
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-medium text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-slate-900 font-semibold">{res.checkedInDate}</span>
                          <span className="text-slate-400">→</span>
                          <span className="font-mono text-slate-900 font-semibold">{res.checkedOutDate}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Jan 2025</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-slate-700 font-medium">
                      {res.totalGuests}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      {getStatusBadge(res.status)}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectReservation) onSelectReservation(res);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#F8F9FA] hover:bg-[#0D111C] hover:text-white text-slate-700 font-semibold text-xs transition-all shadow-sm"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Details</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Summary Footer */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100">
          <span className="font-medium">
            Showing <span className="font-bold text-slate-700 font-mono tabular-nums">{filteredReservations.length}</span> of{' '}
            <span className="font-bold text-slate-700 font-mono tabular-nums">{reservations.length}</span> active reservations
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Real-time sync active</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
