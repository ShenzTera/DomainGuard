import React, { useState } from 'react';
import { Search, X, ArrowUpRight } from 'lucide-react';
import { Reservation, RestaurantOrder, RoomItem, TabType } from './types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservations: Reservation[];
  orders: RestaurantOrder[];
  rooms: RoomItem[];
  onSelectTab: (tab: TabType) => void;
  onSelectOrder: (orderId: string) => void;
  onSelectRoom: (roomId: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  reservations,
  orders,
  rooms,
  onSelectTab,
  onSelectOrder,
  onSelectRoom,
}) => {
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const matchedReservations = query
    ? reservations.filter(
        (r) =>
          r.guestName.toLowerCase().includes(query.toLowerCase()) ||
          r.bookingId.toLowerCase().includes(query.toLowerCase()) ||
          r.roomNumber.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const matchedOrders = query
    ? orders.filter(
        (o) =>
          o.guestName.toLowerCase().includes(query.toLowerCase()) ||
          o.orderNumber.toLowerCase().includes(query.toLowerCase()) ||
          o.roomNumber.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const matchedRooms = query
    ? rooms.filter(
        (rm) =>
          rm.name.toLowerCase().includes(query.toLowerCase()) ||
          rm.roomNumber.toLowerCase().includes(query.toLowerCase()) ||
          rm.type.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[28px] max-w-xl w-full p-6 shadow-2xl border border-slate-100 flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <Search className="w-5 h-5 text-purple-600 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Search guests, bookings (#1223), orders, or rooms (De-02)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results Area */}
        <div className="overflow-y-auto mt-4 space-y-4 no-scrollbar">
          {!query && (
            <div className="py-8 text-center text-slate-400 text-xs">
              <p>Type to search across reservations, restaurant tickets, and hotel rooms.</p>
              <div className="flex justify-center gap-2 mt-3">
                {['Alex Trie', 'Velvet Sky', '#1223', 'S-01'].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setQuery(suggestion)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 font-semibold hover:bg-purple-50 hover:text-purple-600 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Matched Reservations */}
          {matchedReservations.length > 0 && (
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Reservations ({matchedReservations.length})
              </span>
              <div className="space-y-1.5">
                {matchedReservations.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => {
                      onSelectTab('reservations');
                      onClose();
                    }}
                    className="p-3 rounded-xl bg-slate-50 hover:bg-purple-50 transition-colors cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2.5">
                      <img src={r.guestAvatar} alt={r.guestName} className="w-7 h-7 rounded-full object-cover" />
                      <div>
                        <span className="font-bold text-slate-900 text-xs group-hover:text-purple-600">
                          {r.guestName}
                        </span>
                        <span className="text-[11px] text-slate-400 ml-2">
                          {r.bookingId} · Room {r.roomNumber} ({r.roomType})
                        </span>
                      </div>
                    </div>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-600" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Matched Orders */}
          {matchedOrders.length > 0 && (
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Restaurant Orders ({matchedOrders.length})
              </span>
              <div className="space-y-1.5">
                {matchedOrders.map((o) => (
                  <div
                    key={o.id}
                    onClick={() => {
                      onSelectOrder(o.id);
                      onClose();
                    }}
                    className="p-3 rounded-xl bg-slate-50 hover:bg-purple-50 transition-colors cursor-pointer flex items-center justify-between group"
                  >
                    <div>
                      <span className="font-bold text-slate-900 text-xs group-hover:text-purple-600">
                        {o.guestName} · Order {o.orderNumber}
                      </span>
                      <span className="text-[11px] text-slate-400 ml-2">
                        Room {o.roomNumber} · ${o.totalPayment.toFixed(2)}
                      </span>
                    </div>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-600" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Matched Rooms */}
          {matchedRooms.length > 0 && (
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Rooms ({matchedRooms.length})
              </span>
              <div className="space-y-1.5">
                {matchedRooms.map((rm) => (
                  <div
                    key={rm.id}
                    onClick={() => {
                      onSelectRoom(rm.id);
                      onClose();
                    }}
                    className="p-3 rounded-xl bg-slate-50 hover:bg-purple-50 transition-colors cursor-pointer flex items-center justify-between group"
                  >
                    <div>
                      <span className="font-bold text-slate-900 text-xs group-hover:text-purple-600">
                        {rm.name} ({rm.roomNumber})
                      </span>
                      <span className="text-[11px] text-slate-400 ml-2">
                        {rm.type} · ${rm.ratePerNight}/night
                      </span>
                    </div>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-600" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {query && matchedReservations.length === 0 && matchedOrders.length === 0 && matchedRooms.length === 0 && (
            <div className="py-8 text-center text-slate-400 text-xs">
              No results found for "{query}".
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
