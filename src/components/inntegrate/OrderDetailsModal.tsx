import React from 'react';
import { X, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { RestaurantOrder } from './types';

interface OrderDetailsModalProps {
  order: RestaurantOrder | null;
  onClose: () => void;
  onUpdateStatus?: (orderId: string, status: RestaurantOrder['status']) => void;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  order,
  onClose,
  onUpdateStatus,
}) => {
  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[28px] max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 flex flex-col justify-between max-h-[90vh] overflow-y-auto">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <img
                src={order.guestAvatar}
                alt={order.guestName}
                className="w-11 h-11 rounded-full object-cover ring-2 ring-purple-100"
              />
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg leading-tight">
                  {order.guestName}
                </h3>
                <span className="text-xs text-slate-400 font-medium">
                  Order {order.orderNumber} · Room {order.roomNumber}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Status Bar */}
          <div className="flex items-center justify-between bg-[#F8F9FA] rounded-2xl p-4 my-5">
            <div>
              <span className="text-[11px] text-slate-400 font-semibold block uppercase">
                Current Status
              </span>
              <span className="font-extrabold text-sm text-slate-900 capitalize mt-0.5 block">
                {order.status.replace('_', ' ')}
              </span>
            </div>
            <span className="text-xs text-slate-400 font-medium">{order.createdAt}</span>
          </div>

          {/* Items Breakdown */}
          <h4 className="font-bold text-slate-900 text-sm mb-3">Order Items</h4>
          <div className="space-y-2.5">
            {order.items.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md">
                    {item.quantity}x
                  </span>
                  <span className="font-semibold text-slate-800">{item.name}</span>
                </div>
                <span className="font-bold text-slate-900">
                  ${(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {/* Order Notes */}
          {order.orderNotes && (
            <div className="mt-5 p-4 rounded-2xl bg-amber-50/60 border border-amber-200/50">
              <span className="text-[10px] text-amber-700 font-bold uppercase tracking-wider block">
                Kitchen Notes & Instructions
              </span>
              <p className="text-xs text-amber-950 font-semibold mt-1">{order.orderNotes}</p>
            </div>
          )}

          {/* Total Payment */}
          <div className="flex items-center justify-between pt-5 mt-5 border-t border-slate-100">
            <span className="font-bold text-slate-900 text-sm">Total Payment</span>
            <span className="font-extrabold text-xl text-slate-900">
              ${order.totalPayment.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="grid grid-cols-2 gap-3 mt-6 pt-4 border-t border-slate-100">
          <button
            onClick={() => {
              if (onUpdateStatus) onUpdateStatus(order.id, 'ready_to_serve');
              onClose();
            }}
            className="py-3 px-4 rounded-xl bg-[#05CD99] hover:bg-[#04B788] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Mark Ready</span>
          </button>

          <button
            onClick={() => {
              if (onUpdateStatus) onUpdateStatus(order.id, 'on_progress');
              onClose();
            }}
            className="py-3 px-4 rounded-xl bg-[#0D111C] hover:bg-[#1E2536] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <Clock className="w-4 h-4" />
            <span>Set In Progress</span>
          </button>
        </div>
      </div>
    </div>
  );
};
