import React, { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { RoomItem, TabType } from './types';
import { TopNavigation } from './TopNavigation';

interface RoomsViewProps {
  rooms: RoomItem[];
  onOpenRoomModal: (roomId: string) => void;
  onSelectTab: (tab: TabType) => void;
}

export const RoomsView: React.FC<RoomsViewProps> = ({
  rooms,
  onOpenRoomModal,
  onSelectTab,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredRooms = rooms.filter((r) => {
    if (filterStatus === 'all') return true;
    return r.status === filterStatus;
  });

  const getStatusBadge = (status: RoomItem['status']) => {
    switch (status) {
      case 'to_clean':
        return (
          <span className="px-3 py-1 rounded-xl bg-[#EDF5FF] text-[#2F80ED] font-bold text-xs">
            To clean
          </span>
        );
      case 'occupied':
        return (
          <span className="px-3 py-1 rounded-xl bg-[#FEF6E6] text-[#F59E0B] font-bold text-xs">
            Occupied
          </span>
        );
      case 'available':
        return (
          <span className="px-3 py-1 rounded-xl bg-[#E7F9F2] text-[#05CD99] font-bold text-xs">
            Available
          </span>
        );
      case 'maintenance':
        return (
          <span className="px-3 py-1 rounded-xl bg-[#FFEAEA] text-[#FF4B8B] font-bold text-xs">
            Maintenance
          </span>
        );
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Top Header Card */}
      <div className="bg-[#0B0C10] text-white rounded-[28px] p-6 lg:p-8 shadow-2xl border border-white/5">
        <TopNavigation currentTab="rooms" onSelectTab={onSelectTab} variant="dark" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-6">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white">Rooms & Suites</h2>
            <p className="text-xs text-slate-400 mt-1">Live room availability, housekeeping statuses, and tariffs</p>
          </div>

          <div className="flex items-center gap-2">
            {[
              { id: 'all', label: 'All' },
              { id: 'occupied', label: 'Occupied' },
              { id: 'to_clean', label: 'To Clean' },
              { id: 'available', label: 'Available' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterStatus(f.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  filterStatus === f.id
                    ? 'bg-white/20 text-white'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRooms.map((room) => (
          <div
            key={room.id}
            className="bg-white rounded-[28px] p-6 shadow-xl shadow-black/5 border border-slate-100 flex flex-col justify-between group hover:-translate-y-1 transition-all"
          >
            <div>
              {/* Room Illustration / Preview Card */}
              <div className="w-full h-40 rounded-2xl overflow-hidden relative shadow-inner bg-slate-900 mb-4">
                <div className="w-full h-full bg-gradient-to-tr from-slate-900 via-slate-800 to-indigo-950/50 flex items-center justify-center">
                  <svg className="w-full h-full object-cover" viewBox="0 0 400 220" fill="none">
                    <rect width="400" height="220" fill="#1A1F2C" />
                    <rect x="25" y="20" width="350" height="120" rx="10" fill="#E2E8F0" />
                    <rect x="60" y="100" width="150" height="65" rx="12" fill="#718096" />
                    <rect x="75" y="90" width="55" height="35" rx="6" fill="#A0AEC0" />
                    <rect x="140" y="90" width="55" height="35" rx="6" fill="#A0AEC0" />
                    <ellipse cx="135" cy="170" rx="40" ry="12" fill="#38BDF8" opacity="0.3" />
                    <rect x="240" y="120" width="100" height="8" rx="2" fill="#2D3748" />
                  </svg>
                </div>
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white text-[10px] font-bold">
                  Floor {room.floor}
                </div>
              </div>

              {/* Title & Status */}
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-base">{room.name}</h4>
                  <span className="text-xs text-slate-400">Type: {room.type}</span>
                </div>
                {getStatusBadge(room.status)}
              </div>

              {/* Sub-boxes */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-[#F8F9FA] rounded-2xl p-3">
                  <span className="text-[11px] text-slate-400 font-medium block">Room number</span>
                  <span className="font-bold text-slate-900 text-sm mt-0.5 block">{room.roomNumber}</span>
                </div>
                <div className="bg-[#F8F9FA] rounded-2xl p-3">
                  <span className="text-[11px] text-slate-400 font-medium block">Room rate</span>
                  <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                    ${room.ratePerNight}
                    <span className="text-xs text-slate-400 font-normal">/night</span>
                  </span>
                </div>
              </div>

              {/* Amenities tags */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {room.amenities.map((amenity, i) => (
                  <span key={i} className="text-[10px] font-semibold text-slate-600 bg-slate-100 rounded-lg px-2 py-0.5">
                    {amenity}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={() => onOpenRoomModal(room.id)}
              className="w-full mt-5 py-3 px-4 rounded-xl bg-[#0D111C] hover:bg-[#1E2638] text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <span>Room details</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
