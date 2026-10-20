export type TabType = 'dashboard' | 'guests' | 'reservations' | 'rooms' | 'restaurant';

export type ReservationStatus = 'new' | 'confirmed' | 'checked_in' | 'checked_out' | 'completed' | 'cancelled';

export type OrderStatus = 'new' | 'on_progress' | 'ready_to_serve' | 'cancelled';

export interface FoodOrderItem {
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface RestaurantOrder {
  id: string;
  orderNumber: string;
  guestName: string;
  guestAvatar: string;
  status: OrderStatus;
  roomNumber: string;
  totalPayment: number;
  items: FoodOrderItem[];
  additionalItemsCount?: number;
  orderNotes?: string;
  createdAt: string;
}

export interface Reservation {
  id: string;
  bookingId: string;
  guestName: string;
  guestAvatar: string;
  email: string;
  roomNumber: string;
  roomType: 'Single' | 'Double' | 'Deluxe' | 'Suite' | 'Presidential';
  checkedInDate: string;
  checkedOutDate: string;
  totalGuests: string;
  status: ReservationStatus;
}

export interface RoomItem {
  id: string;
  name: string;
  roomNumber: string;
  type: string;
  ratePerNight: number;
  status: 'to_clean' | 'occupied' | 'available' | 'maintenance';
  lastMaintenance: string;
  imageUrl?: string;
  amenities: string[];
  capacity: string;
  floor: number;
}

export interface GuestProfile {
  id: string;
  name: string;
  avatar: string;
  email: string;
  phone: string;
  totalStays: number;
  totalSpent: number;
  vipStatus: boolean;
  currentRoom?: string;
  loyaltyPoints: number;
}
