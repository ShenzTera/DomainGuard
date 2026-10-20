import { Reservation, RestaurantOrder, RoomItem, GuestProfile } from './types';

// Resilient inline SVG data URIs for guest avatars ensuring zero broken images and offline stability
const createAvatarSvg = (bgColor: string, accentColor: string, initials: string, hairColor: string = '#2D3748', skinTone: string = '#F6D8BD') => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <rect width="100" height="100" rx="50" fill="${bgColor}" />
    <!-- Subtle gradient rim -->
    <circle cx="50" cy="50" r="48" fill="none" stroke="${accentColor}" stroke-width="2" opacity="0.4" />
    <!-- Body / Shoulders -->
    <path d="M22 92 C24 74 36 66 50 66 C64 66 76 74 78 92 Z" fill="${accentColor}" />
    <!-- Neck -->
    <rect x="44" y="52" width="12" height="18" rx="4" fill="${skinTone}" />
    <!-- Head -->
    <ellipse cx="50" cy="42" rx="19" ry="21" fill="${skinTone}" />
    <!-- Hair -->
    <path d="M31 40 C31 24 40 18 50 18 C60 18 69 24 69 40 C63 32 57 32 50 32 C43 32 37 32 31 40 Z" fill="${hairColor}" />
    <!-- Subtle facial features -->
    <ellipse cx="44" cy="42" rx="2" ry="2.2" fill="#2D3748" />
    <ellipse cx="56" cy="42" rx="2" ry="2.2" fill="#2D3748" />
    <path d="M46 51 C48 54 52 54 54 51" stroke="#C58562" stroke-width="2" stroke-linecap="round" fill="none" />
    <!-- Text Badge/Initials in corner for precision recognition -->
    <rect x="70" y="70" width="26" height="26" rx="13" fill="#0D111C" opacity="0.9" />
    <text x="83" y="87" fill="#FFFFFF" font-family="Plus Jakarta Sans, sans-serif" font-weight="800" font-size="11" text-anchor="middle">${initials}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const AVATARS = {
  alexTrie: createAvatarSvg('#EEF2FF', '#4F46E5', 'AT', '#1E293B', '#FAD4C0'),
  annetteBlack: createAvatarSvg('#FEF3C7', '#D97706', 'AB', '#78350F', '#FBD0B2'),
  jeromeBell: createAvatarSvg('#ECFDF5', '#059669', 'JB', '#1F2937', '#E0A97E'),
  jennyWilson: createAvatarSvg('#F5F3FF', '#7C3AED', 'JW', '#4A044E', '#FCE7DF'),
  kristinWatson: createAvatarSvg('#FDF2F8', '#DB2777', 'KW', '#831843', '#FAD4C0'),
  krisBlack: createAvatarSvg('#F1F5F9', '#475569', 'KB', '#0F172A', '#E2A478'),
  hotelManager: createAvatarSvg('#F3E8FF', '#9333EA', 'HM', '#312E81', '#FAD4C0'),
};

export const INITIAL_ORDERS: RestaurantOrder[] = [
  {
    id: 'ord_1',
    orderNumber: '#299283',
    guestName: 'Alex Trie',
    guestAvatar: AVATARS.alexTrie,
    status: 'new',
    roomNumber: 'S-01',
    totalPayment: 27.50,
    items: [
      { name: 'Grilled salmon with vegetables', price: 18.50, quantity: 1 },
      { name: 'Garden salad', price: 6.00, quantity: 1 },
      { name: 'Mineral sparkling water', price: 3.00, quantity: 1 },
    ],
    additionalItemsCount: 2,
    orderNotes: 'No dressing on the salad.',
    createdAt: '12 mins ago',
  },
  {
    id: 'ord_2',
    orderNumber: '#299265',
    guestName: 'Jerome Bell',
    guestAvatar: AVATARS.jeromeBell,
    status: 'on_progress',
    roomNumber: 'D-08',
    totalPayment: 31.00,
    items: [
      { name: 'Beef steak', price: 22.50, quantity: 1 },
      { name: 'Mashed potatoes', price: 5.00, quantity: 1 },
      { name: 'Garlic butter toast', price: 3.50, quantity: 1 },
    ],
    additionalItemsCount: 2,
    orderNotes: 'Steak well-done, no gravy on potatoes.',
    createdAt: '24 mins ago',
  },
  {
    id: 'ord_3',
    orderNumber: '#299222',
    guestName: 'Annette Black',
    guestAvatar: AVATARS.annetteBlack,
    status: 'ready_to_serve',
    roomNumber: 'S-22',
    totalPayment: 36.50,
    items: [
      { name: 'Chicken curry with basmati rice', price: 16.50, quantity: 1 },
      { name: 'Garden salad', price: 6.00, quantity: 1 },
      { name: 'Mango lassi', price: 4.50, quantity: 2 },
    ],
    additionalItemsCount: 3,
    orderNotes: 'Mild spice level.',
    createdAt: '38 mins ago',
  },
  {
    id: 'ord_4',
    orderNumber: '#292332',
    guestName: 'Alex Trie',
    guestAvatar: AVATARS.alexTrie,
    status: 'on_progress',
    roomNumber: 'S-01',
    totalPayment: 19.00,
    items: [
      { name: 'Club sandwich with fries', price: 14.00, quantity: 1 },
      { name: 'Iced peach tea', price: 5.00, quantity: 1 },
    ],
    additionalItemsCount: 1,
    orderNotes: 'Extra ketchup packets.',
    createdAt: '45 mins ago',
  },
  {
    id: 'ord_5',
    orderNumber: '#291234',
    guestName: 'Kristin Watson',
    guestAvatar: AVATARS.kristinWatson,
    status: 'ready_to_serve',
    roomNumber: 'De-02',
    totalPayment: 42.00,
    items: [
      { name: 'Pan-seared sea bass', price: 28.00, quantity: 1 },
      { name: 'Truffle asparagus', price: 8.50, quantity: 1 },
      { name: 'Chardonnay glass', price: 5.50, quantity: 1 },
    ],
    additionalItemsCount: 2,
    orderNotes: 'Serve hot promptly.',
    createdAt: '52 mins ago',
  },
  {
    id: 'ord_6',
    orderNumber: '#2992444',
    guestName: 'Jenny Wilson',
    guestAvatar: AVATARS.jennyWilson,
    status: 'on_progress',
    roomNumber: 'D-05',
    totalPayment: 28.50,
    items: [
      { name: 'Wild mushroom risotto', price: 18.00, quantity: 1 },
      { name: 'Tiramisu dessert', price: 7.50, quantity: 1 },
      { name: 'Espresso double', price: 3.00, quantity: 1 },
    ],
    additionalItemsCount: 1,
    orderNotes: 'Gluten-sensitive preparation requested.',
    createdAt: '1 hour ago',
  },
];

export const INITIAL_RESERVATIONS: Reservation[] = [
  {
    id: 'res_1',
    bookingId: '#1223',
    guestName: 'Alex Trie',
    guestAvatar: AVATARS.alexTrie,
    email: 'Alex08@gmail.com',
    roomNumber: 'S-01',
    roomType: 'Single',
    checkedInDate: 'Jan 21, 2025',
    checkedOutDate: 'Jan 26, 2025',
    totalGuests: '1 Adult',
    status: 'new',
  },
  {
    id: 'res_2',
    bookingId: '#1224',
    guestName: 'Annette Black',
    guestAvatar: AVATARS.annetteBlack,
    email: 'Ann23@gmail.com',
    roomNumber: 'S-22',
    roomType: 'Single',
    checkedInDate: 'Jan 8, 2025',
    checkedOutDate: 'Jan 20, 2025',
    totalGuests: '1 Adult',
    status: 'checked_in',
  },
  {
    id: 'res_3',
    bookingId: '#1225',
    guestName: 'Jerome Bell',
    guestAvatar: AVATARS.jeromeBell,
    email: 'JB002@gmail.com',
    roomNumber: 'D-08',
    roomType: 'Double',
    checkedInDate: 'Jan 13, 2025',
    checkedOutDate: 'Jan 21, 2025',
    totalGuests: '2 Adults',
    status: 'confirmed',
  },
  {
    id: 'res_4',
    bookingId: '#1226',
    guestName: 'Jenny Wilson',
    guestAvatar: AVATARS.jennyWilson,
    email: 'Wilson77@gmail.com',
    roomNumber: 'D-05',
    roomType: 'Double',
    checkedInDate: 'Jan 27, 2025',
    checkedOutDate: 'Jan 28, 2025',
    totalGuests: '2 Adults',
    status: 'checked_out',
  },
  {
    id: 'res_5',
    bookingId: '#1227',
    guestName: 'Kristin Watson',
    guestAvatar: AVATARS.kristinWatson,
    email: 'Kris09@gmail.com',
    roomNumber: 'De-02',
    roomType: 'Deluxe',
    checkedInDate: 'Jan 7, 2025',
    checkedOutDate: 'Jan 20, 2025',
    totalGuests: '2 Adults, 1 Child',
    status: 'confirmed',
  },
];

export const INITIAL_ROOMS: RoomItem[] = [
  {
    id: 'rm_1',
    name: 'Velvet Sky',
    roomNumber: 'De-02',
    type: 'Delux',
    ratePerNight: 250,
    status: 'to_clean',
    lastMaintenance: 'Jan 3, 2025',
    amenities: ['Panoramic View', 'King Bed', 'Nespresso Machine', 'Marble Bath', 'Smart TV'],
    capacity: '2 Adults, 1 Child',
    floor: 4,
  },
  {
    id: 'rm_2',
    name: 'Sapphire Suite',
    roomNumber: 'S-01',
    type: 'Single',
    ratePerNight: 160,
    status: 'occupied',
    lastMaintenance: 'Dec 28, 2024',
    amenities: ['Work Desk', 'Queen Bed', 'City View', 'High-Speed Wi-Fi'],
    capacity: '1 Adult',
    floor: 2,
  },
  {
    id: 'rm_3',
    name: 'Amber Garden',
    roomNumber: 'S-22',
    type: 'Single',
    ratePerNight: 165,
    status: 'occupied',
    lastMaintenance: 'Jan 5, 2025',
    amenities: ['Courtyard View', 'Rain Shower', 'Complimentary Minibar'],
    capacity: '1 Adult',
    floor: 2,
  },
  {
    id: 'rm_4',
    name: 'Emerald Bay',
    roomNumber: 'D-08',
    type: 'Double',
    ratePerNight: 210,
    status: 'occupied',
    lastMaintenance: 'Jan 2, 2025',
    amenities: ['Balcony', '2 Queen Beds', 'Soaking Tub', 'Lounge Seating'],
    capacity: '2 Adults',
    floor: 3,
  },
  {
    id: 'rm_5',
    name: 'Crystal Harbor',
    roomNumber: 'D-05',
    type: 'Double',
    ratePerNight: 220,
    status: 'to_clean',
    lastMaintenance: 'Jan 4, 2025',
    amenities: ['Ocean View', 'King Bed', 'Soundproof Glass', 'Bose Audio'],
    capacity: '2 Adults',
    floor: 3,
  },
];

export const INITIAL_GUESTS: GuestProfile[] = [
  {
    id: 'gst_1',
    name: 'Alex Trie',
    avatar: AVATARS.alexTrie,
    email: 'Alex08@gmail.com',
    phone: '+1 (555) 234-8901',
    totalStays: 4,
    totalSpent: 1840,
    vipStatus: true,
    currentRoom: 'S-01',
    loyaltyPoints: 3420,
  },
  {
    id: 'gst_2',
    name: 'Annette Black',
    avatar: AVATARS.annetteBlack,
    email: 'Ann23@gmail.com',
    phone: '+1 (555) 489-2180',
    totalStays: 2,
    totalSpent: 960,
    vipStatus: false,
    currentRoom: 'S-22',
    loyaltyPoints: 1200,
  },
  {
    id: 'gst_3',
    name: 'Jerome Bell',
    avatar: AVATARS.jeromeBell,
    email: 'JB002@gmail.com',
    phone: '+1 (555) 781-9043',
    totalStays: 7,
    totalSpent: 4250,
    vipStatus: true,
    currentRoom: 'D-08',
    loyaltyPoints: 8900,
  },
  {
    id: 'gst_4',
    name: 'Jenny Wilson',
    avatar: AVATARS.jennyWilson,
    email: 'Wilson77@gmail.com',
    phone: '+1 (555) 912-4029',
    totalStays: 3,
    totalSpent: 1120,
    vipStatus: false,
    currentRoom: 'D-05',
    loyaltyPoints: 2150,
  },
  {
    id: 'gst_5',
    name: 'Kristin Watson',
    avatar: AVATARS.kristinWatson,
    email: 'Kris09@gmail.com',
    phone: '+1 (555) 604-1284',
    totalStays: 5,
    totalSpent: 3100,
    vipStatus: true,
    currentRoom: 'De-02',
    loyaltyPoints: 5400,
  },
];
