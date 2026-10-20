import React, { useState } from 'react';
import {
  UtensilsCrossed,
  Soup,
  BellRing,
  XCircle,
  ArrowUpRight,
  Check,
} from 'lucide-react';
import { RestaurantOrder, TabType } from './types';
import { TopNavigation } from './TopNavigation';

interface RestaurantViewProps {
  orders: RestaurantOrder[];
  onOpenOrderModal: (orderId: string) => void;
  onSelectTab: (tab: TabType) => void;
}

export const RestaurantView: React.FC<RestaurantViewProps> = ({
  orders,
  onOpenOrderModal,
  onSelectTab,
}) => {
  // Filter states matching Screenshot 3
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([
    'new',
    'on_progress',
    'ready_to_serve',
  ]);
  const [filterByTime, setFilterByTime] = useState<string>('recent');
  const [isCardView, setIsCardView] = useState<boolean>(true);

  const toggleStatus = (status: string) => {
    if (selectedStatuses.includes(status)) {
      setSelectedStatuses(selectedStatuses.filter((s) => s !== status));
    } else {
      setSelectedStatuses([...selectedStatuses, status]);
    }
  };

  const filteredOrders = orders.filter((o) => selectedStatuses.includes(o.status));

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return (
          <span className="px-3 py-1 rounded-xl bg-[#F0EDFF] text-[#7C5CFC] font-bold text-xs inline-flex items-center">
            New
          </span>
        );
      case 'on_progress':
        return (
          <span className="px-3 py-1 rounded-xl bg-[#FEF6E6] text-[#F59E0B] font-bold text-xs inline-flex items-center">
            On progress
          </span>
        );
      case 'ready_to_serve':
        return (
          <span className="px-3 py-1 rounded-xl bg-[#E7F9F2] text-[#05CD99] font-bold text-xs inline-flex items-center">
            Ready to serve
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-3 py-1 rounded-xl bg-[#FFEAEA] text-[#FF4B8B] font-bold text-xs inline-flex items-center">
            Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-300">
      {/* ============================================================ */}
      {/* TOP DARK HEADER CARD WITH METRICS (Matching Screenshot 3)    */}
      {/* ============================================================ */}
      <div className="bg-[#0B0C10] text-white rounded-[28px] p-6 lg:p-8 shadow-2xl border border-white/5">
        {/* Integrated Top Navigation */}
        <TopNavigation
          currentTab="restaurant"
          onSelectTab={onSelectTab}
          variant="dark"
        />

        {/* Title */}
        <h2 className="text-3xl font-extrabold tracking-tight text-white mt-6">
          Restaurant
        </h2>

        {/* 4 KPI Order Metric Tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {/* Tile 1: New orders */}
          <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center justify-between transition-colors hover:bg-white/10">
            <div>
              <span className="text-xs text-slate-400 font-medium block">New orders</span>
              <span className="text-3xl font-extrabold text-white mt-1 block">18</span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#2E1F5E] text-[#A78BFA] flex items-center justify-center shadow-md">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
          </div>

          {/* Tile 2: On progress */}
          <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center justify-between transition-colors hover:bg-white/10">
            <div>
              <span className="text-xs text-slate-400 font-medium block">On progress</span>
              <span className="text-3xl font-extrabold text-white mt-1 block">2</span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#443217] text-[#FBBF24] flex items-center justify-center shadow-md">
              <Soup className="w-4 h-4" />
            </div>
          </div>

          {/* Tile 3: Ready to serve */}
          <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center justify-between transition-colors hover:bg-white/10">
            <div>
              <span className="text-xs text-slate-400 font-medium block">Ready to serve</span>
              <span className="text-3xl font-extrabold text-white mt-1 block">7</span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#143B2A] text-[#34D399] flex items-center justify-center shadow-md">
              <BellRing className="w-4 h-4" />
            </div>
          </div>

          {/* Tile 4: Cancelled orders */}
          <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center justify-between transition-colors hover:bg-white/10">
            <div>
              <span className="text-xs text-slate-400 font-medium block">Cancelled orders</span>
              <span className="text-3xl font-extrabold text-white mt-1 block">3</span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#4A1D2F] text-[#F472B6] flex items-center justify-center shadow-md">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* BOTTOM SECTION: Filters Sidebar + Orders Grid                */}
      {/* ============================================================ */}
      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        {/* Left Filter Sidebar Card */}
        <div className="bg-white rounded-[28px] p-6 shadow-xl shadow-black/5 border border-slate-100 w-full lg:w-64 shrink-0">
          <h3 className="font-extrabold text-slate-900 text-base tracking-tight">Filters</h3>

          {/* Order Status Section */}
          <div className="mt-5">
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block mb-3">
              Order status
            </span>
            <div className="space-y-2.5">
              {[
                { id: 'new', label: 'New' },
                { id: 'on_progress', label: 'On progress' },
                { id: 'ready_to_serve', label: 'Ready to serve' },
                { id: 'cancelled', label: 'Cancelled' },
              ].map((status) => {
                const isChecked = selectedStatuses.includes(status.id);
                return (
                  <label
                    key={status.id}
                    onClick={() => toggleStatus(status.id)}
                    className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 cursor-pointer select-none group"
                  >
                    <div
                      className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                        isChecked
                          ? 'bg-[#0D111C] border-[#0D111C] text-white'
                          : 'border-slate-300 bg-white group-hover:border-slate-400'
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span>{status.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Filter by Section */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block mb-3">
              Filter by
            </span>
            <div className="space-y-2.5">
              {[
                { id: 'recent', label: 'Recent orders' },
                { id: 'last_hour', label: 'Last hour' },
                { id: 'today', label: 'Today' },
                { id: 'custom', label: 'Custom date' },
              ].map((timeOption) => {
                const isSelected = filterByTime === timeOption.id;
                return (
                  <label
                    key={timeOption.id}
                    onClick={() => setFilterByTime(timeOption.id)}
                    className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 cursor-pointer select-none group"
                  >
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                        isSelected
                          ? 'border-[#0D111C] bg-white'
                          : 'border-slate-300 bg-white group-hover:border-slate-400'
                      }`}
                    >
                      {isSelected && <div className="w-2 h-2 rounded-full bg-[#0D111C]"></div>}
                    </div>
                    <span>{timeOption.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Card View Toggle */}
          <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">Card view</span>
            <button
              onClick={() => setIsCardView(!isCardView)}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                isCardView ? 'bg-[#7C5CFC]' : 'bg-slate-200'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                  isCardView ? 'translate-x-5' : 'translate-x-0'
                }`}
              ></div>
            </button>
          </div>
        </div>

        {/* Right Order Cards Grid */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 w-full">
          {filteredOrders.map((order, idx) => (
            <div
              key={order.id}
              className={`bg-white rounded-[28px] p-6 shadow-xl shadow-black/5 border border-slate-100 flex flex-col justify-between transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-500/10 ${
                idx === 0 ? 'ring-2 ring-purple-500/30 shadow-2xl shadow-purple-500/15' : ''
              }`}
            >
              <div>
                {/* Header with Guest Avatar & Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={order.guestAvatar}
                      alt={order.guestName}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-purple-100"
                    />
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm leading-tight">
                        {order.guestName}
                      </h4>
                      <span className="text-[11px] text-slate-400 font-medium">
                        Order {order.orderNumber}
                      </span>
                    </div>
                  </div>
                  {getStatusBadge(order.status)}
                </div>

                {/* Room Number & Total Payment Boxes */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="bg-[#F8F9FA] rounded-2xl p-3">
                    <span className="text-[11px] text-slate-400 font-medium block">Room number</span>
                    <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                      {order.roomNumber}
                    </span>
                  </div>
                  <div className="bg-[#F8F9FA] rounded-2xl p-3">
                    <span className="text-[11px] text-slate-400 font-medium block">Total payment</span>
                    <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                      ${order.totalPayment.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Items List */}
                <div className="space-y-3 mt-4">
                  {order.items.slice(0, 2).map((item, itemIdx) => (
                    <div key={itemIdx} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                          <span className="text-sm">
                            {item.name.toLowerCase().includes('salmon')
                              ? '🐟'
                              : item.name.toLowerCase().includes('steak')
                              ? '🥩'
                              : item.name.toLowerCase().includes('curry')
                              ? '🍛'
                              : item.name.toLowerCase().includes('salad')
                              ? '🥗'
                              : '🍽️'}
                          </span>
                        </div>
                        <div>
                          <span className="font-semibold text-slate-800 block leading-tight">
                            {item.name}
                          </span>
                          <span className="text-slate-400 text-[11px]">${item.price.toFixed(2)}</span>
                        </div>
                      </div>
                      <span className="font-bold text-slate-900 text-xs shrink-0">
                        {item.quantity}x
                      </span>
                    </div>
                  ))}

                  {order.additionalItemsCount ? (
                    <div className="text-right">
                      <button
                        onClick={() => onOpenOrderModal(order.id)}
                        className="text-[11px] font-semibold text-slate-400 hover:text-slate-700 transition-colors"
                      >
                        +{order.additionalItemsCount} more items
                      </button>
                    </div>
                  ) : null}
                </div>

                {/* Order Notes Box */}
                {order.orderNotes && (
                  <div className="bg-[#F8F9FA] rounded-2xl p-3 mt-3">
                    <span className="text-[10px] text-slate-400 font-medium block uppercase tracking-wider">
                      Order Notes
                    </span>
                    <p className="text-xs text-slate-800 font-medium mt-0.5 truncate">
                      {order.orderNotes}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <button
                onClick={() => onOpenOrderModal(order.id)}
                className="w-full mt-4 py-3 px-4 rounded-xl bg-[#0D111C] hover:bg-[#1E2638] text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-black/10 active:scale-[0.99]"
              >
                <span>Order details</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          {filteredOrders.length === 0 && (
            <div className="col-span-full py-16 text-center bg-white rounded-[28px] border border-slate-100 p-8">
              <p className="text-sm font-semibold text-slate-500">No orders match the selected filters.</p>
              <button
                onClick={() => setSelectedStatuses(['new', 'on_progress', 'ready_to_serve', 'cancelled'])}
                className="mt-2 text-xs font-bold text-[#7C5CFC] hover:underline"
              >
                Reset filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
