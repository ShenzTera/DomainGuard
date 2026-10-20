import React, { useState } from 'react';
import { X, Calendar } from 'lucide-react';
import { Reservation } from './types';
import { AVATARS } from './mockData';

interface NewReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddReservation: (reservation: Reservation) => void;
}

export const NewReservationModal: React.FC<NewReservationModalProps> = ({
  isOpen,
  onClose,
  onAddReservation,
}) => {
  const [guestName, setGuestName] = useState('');
  const [email, setEmail] = useState('');
  const [roomNumber, setRoomNumber] = useState('S-05');
  const [roomType, setRoomType] = useState<Reservation['roomType']>('Single');
  const [checkedInDate, setCheckedInDate] = useState('Jan 25, 2025');
  const [checkedOutDate, setCheckedOutDate] = useState('Jan 30, 2025');
  const [totalGuests, setTotalGuests] = useState('1 Adult');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName || !email) return;

    const newRes: Reservation = {
      id: `res_${Date.now()}`,
      bookingId: `#${Math.floor(1000 + Math.random() * 9000)}`,
      guestName,
      guestAvatar: AVATARS.alexTrie,
      email,
      roomNumber,
      roomType,
      checkedInDate,
      checkedOutDate,
      totalGuests,
      status: 'new',
    };

    onAddReservation(newRes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[28px] max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 flex flex-col justify-between max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-slate-900 text-xl leading-tight">
                New Reservation
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Book a guest room and record arrival details
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Fields */}
          <div className="space-y-4 my-6">
            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1.5">
                Guest Full Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Marcus Vance"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full bg-[#F8F9FA] border border-slate-200/80 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1.5">
                Contact Email
              </label>
              <input
                type="email"
                required
                placeholder="e.g. marcus@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#F8F9FA] border border-slate-200/80 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1.5">
                  Room Number
                </label>
                <input
                  type="text"
                  required
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  className="w-full bg-[#F8F9FA] border border-slate-200/80 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1.5">
                  Room Type
                </label>
                <select
                  value={roomType}
                  onChange={(e) => setRoomType(e.target.value as any)}
                  className="w-full bg-[#F8F9FA] border border-slate-200/80 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold"
                >
                  <option value="Single">Single</option>
                  <option value="Double">Double</option>
                  <option value="Deluxe">Deluxe</option>
                  <option value="Suite">Suite</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1.5">
                  Check-in Date
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={checkedInDate}
                    onChange={(e) => setCheckedInDate(e.target.value)}
                    className="w-full bg-[#F8F9FA] border border-slate-200/80 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                  />
                  <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1.5">
                  Check-out Date
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={checkedOutDate}
                    onChange={(e) => setCheckedOutDate(e.target.value)}
                    className="w-full bg-[#F8F9FA] border border-slate-200/80 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                  />
                  <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1.5">
                Total Guests
              </label>
              <select
                value={totalGuests}
                onChange={(e) => setTotalGuests(e.target.value)}
                className="w-full bg-[#F8F9FA] border border-slate-200/80 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold"
              >
                <option value="1 Adult">1 Adult</option>
                <option value="2 Adults">2 Adults</option>
                <option value="2 Adults, 1 Child">2 Adults, 1 Child</option>
                <option value="3 Adults">3 Adults</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="py-3 px-4 rounded-xl bg-[#7C5CFC] hover:bg-[#6C47FF] text-white font-bold text-xs shadow-lg shadow-purple-500/25 transition-all"
            >
              Confirm Booking
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
