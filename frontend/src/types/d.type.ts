export type Priority = "low" | "medium" | "high"; // Keeping for compatibility

export type HallColor = "purple" | "orange" | "blue" | "green";

export type BookingStatus = "pending" | "approved" | "rejected";

export interface Hall {
  id: string;
  name: string;
  color: HallColor;
}

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Booking {
  id: string;
  title: string;
  hall: string; // hall record id
  dateKey: string; // YYYY-MM-DD
  start: string; // HH:MM
  end: string; // HH:MM
  status: BookingStatus;
  user?: string; // requester user id, empty for admin-created bookings
  requesterName?: string;
  requesterUsername?: string;
  expand?: { hall?: Hall; user?: User };
}

export interface Task {
  id: string;
  title: string;
  dateKey: string; // YYYY-MM-DD
  priority: Priority;
  createdAt: number;
  completed: boolean;
}
