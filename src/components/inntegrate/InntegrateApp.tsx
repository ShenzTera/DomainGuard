import React, { useState } from 'react';
import {
  TabType,
  Reservation,
  RestaurantOrder,
  RoomItem,
  GuestProfile,
} from './types';
import {
  INITIAL_RESERVATIONS,
  INITIAL_ORDERS,
  INITIAL_ROOMS,
  INITIAL_GUESTS,
} from './mockData';
import { TopNavigation } from './TopNavigation';
import { DashboardView } from './DashboardView';
import { ReservationsView } from './ReservationsView';
import { RoomsView } from './RoomsView';
import { RestaurantView } from './RestaurantView';
import { GuestsView } from './GuestsView';
import { OrderDetailsModal } from './OrderDetailsModal';
import { RoomDetailsModal } from './RoomDetailsModal';
import { NewReservationModal } from './NewReservationModal';
import { SearchModal } from './SearchModal';
import { Plus, Sparkles, Building2, Calendar, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const InntegrateApp: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [reservations, setReservations] = useState<Reservation[]>(INITIAL_RESERVATIONS);
  const [orders, setOrders] = useState<RestaurantOrder[]>(INITIAL_ORDERS);
  const [rooms, setRooms] = useState<RoomItem[]>(INITIAL_ROOMS);
  const [guests, setGuests] = useState<GuestProfile[]>(INITIAL_GUESTS);

  // Modal states
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [isNewReservationOpen, setIsNewReservationOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);

  // Handlers
  const handleAddReservation = (newRes: Reservation) => {
    setReservations((prev) => [newRes, ...prev]);
  };

  const handleUpdateOrderStatus = (orderId: string, newStatus: RestaurantOrder['status']) => {
    setOrders((prev) =>
      prev.map((ord) => (ord.id === orderId ? { ...ord, status: newStatus } : ord))
    );
  };

  const handleUpdateRoomStatus = (roomId: string, newStatus: RoomItem['status']) => {
    setRooms((prev) =>
      prev.map((rm) => (rm.id === roomId ? { ...rm, status: newStatus } : rm))
    );
  };

  const activeOrder = orders.find((o) => o.id === selectedOrderId) || null;
  const activeRoom = rooms.find((r) => r.id === selectedRoomId) || null;

  return (
    <div className="min-h-screen bg-[#F4F5F8] text-slate-900 font-sans antialiased selection:bg-[#7C5CFC] selection:text-white pb-16">
      {/* ============================================================ */}
      {/* TOP DARK HEADER CONTAINER                                    */}
      {/* ============================================================ */}
      <header className="w-full bg-[#0B0C10] text-white border-b border-white/5 shadow-2xl relative z-30">
        <div className="max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-6">
          {/* Main Top Navigation Row */}
          <TopNavigation
            currentTab={currentTab}
            onSelectTab={setCurrentTab}
            variant="dark"
            onOpenSearch={() => setIsSearchOpen(true)}
            unreadCount={unreadCount}
          />

          {/* Sub-Header Context & Action Bar for Dashboard view */}
          {currentTab === 'dashboard' && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6 pt-5 border-t border-white/10 animate-in fade-in duration-300">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white">
                    Operations Dashboard
                  </h1>
                  <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Live Systems</span>
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 font-medium">
                  The Grand Horizon Luxury Suites · Tuesday, January 9, 2025
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Metric Strip */}
                <div className="hidden md:flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl py-2 px-3.5 text-xs text-slate-300">
                  <span className="flex items-center gap-1.5 font-bold text-white">
                    <span className="w-2 h-2 rounded-full bg-[#05CD99]"></span>
                    <span>85% Occupancy</span>
                  </span>
                  <span className="text-slate-500">·</span>
                  <span className="text-slate-400">14 Check-ins Today</span>
                  <span className="text-slate-500">·</span>
                  <span className="text-amber-400 font-medium">3 To Clean</span>
                </div>

                <button
                  onClick={() => setIsNewReservationOpen(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#7C5CFC] hover:bg-[#6C47FF] text-white font-bold text-xs shadow-lg shadow-purple-500/25 transition-all active:scale-[0.98] whitespace-nowrap shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>New reservation</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ============================================================ */}
      {/* MAIN VIEWPORT CANVAS (LIGHT BENTO GRID LAYOUT)               */}
      {/* ============================================================ */}
      <main className="max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {currentTab === 'dashboard' && (
          <DashboardView
            onOpenOrderModal={(orderId) => setSelectedOrderId(orderId)}
            onOpenRoomModal={(roomId) => setSelectedRoomId(roomId)}
            onOpenNewReservation={() => setIsNewReservationOpen(true)}
            onSelectReservation={(res) => setSelectedReservation(res)}
            reservations={reservations}
          />
        )}

        {currentTab === 'reservations' && (
          <ReservationsView
            reservations={reservations}
            onOpenNewReservation={() => setIsNewReservationOpen(true)}
            onSelectTab={setCurrentTab}
            onSelectReservation={(res) => setSelectedReservation(res)}
          />
        )}

        {currentTab === 'rooms' && (
          <RoomsView
            rooms={rooms}
            onOpenRoomModal={(roomId) => setSelectedRoomId(roomId)}
            onSelectTab={setCurrentTab}
          />
        )}

        {currentTab === 'restaurant' && (
          <RestaurantView
            orders={orders}
            onOpenOrderModal={(orderId) => setSelectedOrderId(orderId)}
            onSelectTab={setCurrentTab}
          />
        )}

        {currentTab === 'guests' && (
          <GuestsView
            guests={guests}
            onSelectTab={setCurrentTab}
          />
        )}
      </main>

      {/* ============================================================ */}
      {/* INTERACTIVE MODALS                                           */}
      {/* ============================================================ */}
      <OrderDetailsModal
        order={activeOrder}
        onClose={() => setSelectedOrderId(null)}
        onUpdateStatus={handleUpdateOrderStatus}
      />

      <RoomDetailsModal
        room={activeRoom}
        onClose={() => setSelectedRoomId(null)}
        onUpdateStatus={handleUpdateRoomStatus}
      />

      <NewReservationModal
        isOpen={isNewReservationOpen}
        onClose={() => setIsNewReservationOpen(false)}
        onAddReservation={handleAddReservation}
      />

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        reservations={reservations}
        rooms={rooms}
        orders={orders}
        onSelectTab={setCurrentTab}
        onSelectRoom={(roomId: string) => setSelectedRoomId(roomId)}
        onSelectOrder={(orderId: string) => setSelectedOrderId(orderId)}
      />

      {/* Reservation Quick Preview Modal */}
      {selectedReservation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[28px] max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedReservation.guestAvatar}
                    alt={selectedReservation.guestName}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-purple-100"
                  />
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-lg leading-tight">
                      {selectedReservation.guestName}
                    </h3>
                    <span className="text-xs text-slate-400 font-medium font-mono">
                      {selectedReservation.bookingId} · {selectedReservation.email}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedReservation(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 my-5">
                <div className="bg-[#F8F9FA] rounded-2xl p-3.5">
                  <span className="text-[11px] text-slate-400 font-medium block">Room number</span>
                  <span className="font-bold text-slate-900 text-sm mt-0.5 block font-mono">
                    {selectedReservation.roomNumber} ({selectedReservation.roomType})
                  </span>
                </div>
                <div className="bg-[#F8F9FA] rounded-2xl p-3.5">
                  <span className="text-[11px] text-slate-400 font-medium block">Party size</span>
                  <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                    {selectedReservation.totalGuests}
                  </span>
                </div>
              </div>

              <div className="bg-[#F8F9FA] rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Check-In</span>
                  <span className="font-bold text-slate-900 font-mono">{selectedReservation.checkedInDate}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Check-Out</span>
                  <span className="font-bold text-slate-900 font-mono">{selectedReservation.checkedOutDate}</span>
                </div>
                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200/60">
                  <span className="text-slate-400 font-medium">Booking Status</span>
                  <span className="font-bold text-[#7C5CFC] capitalize">{selectedReservation.status.replace('_', ' ')}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setSelectedReservation(null)}
                className="w-full py-3 rounded-xl bg-[#0D111C] hover:bg-[#1E2638] text-white font-bold text-xs transition-all shadow-md shadow-black/10"
              >
                Close details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
