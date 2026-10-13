export type RoomCode = 'R1' | 'R2' | 'R3' | 'R4';

export interface MeetingRoom {
  id: string;
  room_code: RoomCode;
  room_name: string;
  capacity: number;
  description: string;
  facilities: string[];
  is_active: boolean;
  created_at: string;
}

export type BookingStatus = 'Confirmed' | 'Cancelled';

export interface Booking {
  id: string;
  booking_reference: string;
  room_id: string;
  room_code?: RoomCode;
  room_name?: string;
  employee_name: string;
  department: string;
  meeting_title: string;
  meeting_date: string; // YYYY-MM-DD
  start_time: string;   // HH:mm or HH:mm:ss
  end_time: string;     // HH:mm or HH:mm:ss
  participant_count: number;
  notes?: string | null;
  status: BookingStatus;
  cancellation_token: string;
  created_at: string;
  updated_at: string;
  cancelled_at?: string | null;
}

export interface BookingAuditLog {
  id: string;
  booking_id: string;
  action: 'CREATED' | 'UPDATED' | 'CANCELLED';
  performed_by: string;
  previous_values?: Record<string, unknown> | null;
  new_values?: Record<string, unknown> | null;
  created_at: string;
}

export type RoomOperationalStatus = 'available' | 'occupied' | 'upcoming';

export interface RoomWithStatus extends MeetingRoom {
  currentStatus: RoomOperationalStatus;
  currentBooking: Booking | null;
  upcomingBooking: Booking | null;
  nextAvailableTime: string;
  bookingsToday: Booking[];
}

export interface BookingFilter {
  date?: string;
  startDate?: string;
  endDate?: string;
  roomId?: string;
  roomCode?: string;
  status?: BookingStatus | 'all';
  search?: string;
  department?: string;
}

export interface DashboardStats {
  totalBookingsToday: number;
  availableRoomsCount: number;
  occupiedRoomsCount: number;
  upcomingMeetingsCount: number;
  totalMeetingHoursToday: number;
  mostUsedRoom: {
    room_code: string;
    room_name: string;
    totalHours: number;
    bookingCount: number;
  } | null;
}

export interface AlternativeSlot {
  room_code: RoomCode;
  room_name: string;
  available_start: string;
  available_end: string;
}
