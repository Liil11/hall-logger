import type { RecordModel } from "pocketbase";
import type { Booking, BookingStatus, Hall } from "../types/d.type";
import { pb } from "./pocketbase";

export type BookingRecord = RecordModel & Booking;
export type BookingInput = Pick<
  Booking,
  "title" | "hall" | "dateKey" | "start" | "end" | "status"
> & { user?: string; requesterName?: string; requesterUsername?: string };
export type HallInput = Pick<Hall, "name" | "color">;

// requestKey: null disables SDK auto-cancellation, which aborts duplicate
// requests fired twice by React StrictMode in development.
export const hallsService = {
  list: () =>
    pb.collection("halls").getFullList<RecordModel & Hall>({ sort: "name", requestKey: null }),
  get: (id: string) =>
    pb.collection("halls").getOne<RecordModel & Hall>(id, { requestKey: null }),
  create: (data: HallInput) => pb.collection("halls").create<RecordModel & Hall>(data),
  update: (id: string, data: Partial<HallInput>) =>
    pb.collection("halls").update<RecordModel & Hall>(id, data),
  remove: (id: string) => pb.collection("halls").delete(id),
};

export const bookingsService = {
  list: () =>
    pb.collection("bookings").getFullList<BookingRecord>({
      filter: 'status != "rejected"',
      sort: "dateKey,start",
      expand: "hall",
      requestKey: null,
    }),
  listByHall: (hallId: string) =>
    pb.collection("bookings").getFullList<BookingRecord>({
      filter: pb.filter('hall = {:hall} && status != "rejected"', { hall: hallId }),
      sort: "dateKey,start",
      expand: "hall",
      requestKey: null,
    }),
  listPending: () =>
    pb.collection("bookings").getFullList<BookingRecord>({
      filter: 'status = "pending"',
      sort: "dateKey,start",
      expand: "hall,user",
      requestKey: null,
    }),
  listPendingByUser: (userId: string) =>
    pb.collection("bookings").getFullList<BookingRecord>({
      filter: pb.filter('status = "pending" && user = {:user}', { user: userId }),
      requestKey: null,
    }),
  create: (data: BookingInput) =>
    pb.collection("bookings").create<BookingRecord>(data, { expand: "hall" }),
  setStatus: (id: string, status: BookingStatus) =>
    pb.collection("bookings").update<BookingRecord>(id, { status }, { expand: "hall,user" }),
  remove: (id: string) => pb.collection("bookings").delete(id),
};
