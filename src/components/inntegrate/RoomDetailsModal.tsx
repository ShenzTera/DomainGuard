import React from 'react';
import { X, Sparkles, ShieldCheck, Check } from 'lucide-react';
import { RoomItem } from './types';

interface RoomDetailsModalProps {
  room: RoomItem | null;
  onClose: () => void;
  onUpdateStatus?: (roomId: string, status: RoomItem['status']) => void;
}

export const RoomDetailsModal: React.FC<RoomDetailsModalProps> = ({
  room,
  onClose,
  onUpdateStatus,
}) => {
  if (!room) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[28px] max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 flex flex-col justify-between max-h-[90vh] overflow-y-auto">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-slate-900 text-xl leading-tight">
                {room.name}
              </h3>
              <span className="text-xs text-slate-400 font-medium">
                Room {room.roomNumber} · Type: {room.type} · Floor {room.floor}
              </span>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Visual Showcase */}
          <div className="w-full h-44 rounded-2xl overflow-hidden relative shadow-inner bg-slate-900 my-5">
            <div className="w-full h-full bg-gradient-to-tr from-slate-900 via-slate-800 to-amber-950/40 relative flex items-center justify-center">
              <svg className="w-full h-full object-cover" viewBox="0 0 400 220" fill="none">
                <rect width="400" height="220" fill="#1E2333" />
                <rect x="20" y="20" width="360" height="130" rx="12" fill="#E8EDF5" />
                <path d="M40 120 L70 90 L100 120 L140 80 L180 120 L230 70 L280 120 L320 85 L360 120 V150 H40 Z" fill="#CBD5E1" opacity="0.6" />
                <rect x="50" y="110" width="160" height="70" rx="16" fill="#8C7E72" />
                <rect x="65" y="100" width="60" height="40" rx="8" fill="#A89B8F" />
                <rect x="135" y="100" width="60" height="40" rx="8" fill="#A89B8F" />
                <ellipse cx="130" cy="180" rx="45" ry="14" fill="#38BDF8" opacity="0.4" />
              </svg>
            </div>
            <div className="absolute bottom-3 left-3 px-3 py-1 rounded-xl bg-black/60 backdrop-blur-md text-white text-xs font-bold">
              ${room.ratePerNight}/night
            </div>
          </div>

          {/* Two Key Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#F8F9FA] rounded-2xl p-3">
              <span className="text-[11px] text-slate-400 font-medium block">Housekeeping</span>
              <span className="font-bold text-slate-900 text-sm mt-0.5 block capitalize">
                {room.status.replace('_', ' ')}
              </span>
            </div>
            <div className="bg-[#F8F9FA] rounded-2xl p-3">
              <span className="text-[11px] text-slate-400 font-medium block">Last Inspection</span>
              <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                {room.lastMaintenance}
              </span>
            </div>
          </div>

          {/* Amenities List */}
          <div className="mt-5">
            <span className="text-xs font-bold text-slate-800 block mb-2">Room Amenities</span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {room.amenities.map((amenity, idx) => (
                <div key={idx} className="flex items-center gap-1.5 text-slate-600">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>{amenity}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="grid grid-cols-2 gap-3 mt-6 pt-4 border-t border-slate-100">
          <button
            onClick={() => {
              if (onUpdateStatus) onUpdateStatus(room.id, 'available');
              onClose();
            }}
            className="py-3 px-4 rounded-xl bg-[#05CD99] hover:bg-[#04B788] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            <span>Mark Cleaned</span>
          </button>

          <button
            onClick={() => {
              if (onUpdateStatus) onUpdateStatus(room.id, 'to_clean');
              onClose();
            }}
            className="py-3 px-4 rounded-xl bg-[#0D111C] hover:bg-[#1E2536] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Request Service</span>
          </button>
        </div>
      </div>
    </div>
  );
};
