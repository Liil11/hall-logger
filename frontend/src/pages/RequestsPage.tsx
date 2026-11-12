import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import Spinner from "../components/Spinner";
import TopBar from "../components/TopBar";
import type { BookingRecord } from "../services/bookings";
import { bookingsService } from "../services/bookings";
import type { BookingStatus } from "../types/d.type";
import { getRole } from "../utils/auth";
import { formatDateKey } from "../utils/date";
import { dotClass, primaryButtonClass } from "../utils/ui";

const RequestsPage = () => {
  const [requests, setRequests] = useState<BookingRecord[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<{ id: string; action: BookingStatus } | null>(null);

  const admin = getRole() === "admin";

  useEffect(() => {
    if (!admin) {
      window.location.replace("/login");
      return;
    }
    bookingsService
      .listPending()
      .then(setRequests)
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, [admin]);

  const handleStatus = async (booking: BookingRecord, status: "approved" | "rejected") => {
    if (status === "rejected" && !window.confirm(`Tolak request "${booking.title}"?`)) return;
    setError("");
    setWorking({ id: booking.id, action: status });
    try {
      await bookingsService.setStatus(booking.id, status);
      setRequests((prev) => prev.filter((b) => b.id !== booking.id));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setWorking(null);
    }
  };

  return (
    <>
      <TopBar />
      <main className="flex w-full flex-1 flex-col gap-4 px-4 py-4 pb-12 sm:px-8 sm:py-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <a href="/" className="text-[0.8rem] text-slate-500 transition hover:text-indigo-700">
              ← Semua tempat
            </a>
            <h1 className="mt-2 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              Persetujuan Booking
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Request pengguna yang menunggu persetujuan.
            </p>
          </div>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
            {requests.length} menunggu
          </span>
        </div>

        {error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-[0.8rem] text-red-700">
            {error}
          </p>
        )}

        {loading ? (
          <p className="flex items-center gap-2 text-sm text-slate-400">
            <Spinner size={15} /> Memuat request...
          </p>
        ) : requests.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-10 text-center">
            <p className="text-sm font-medium text-slate-600">Tidak ada request menunggu.</p>
            <p className="mt-1 text-[0.8rem] text-slate-400">
              Request baru dari pengguna akan muncul di sini.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {requests.map((b) => {
              const hall = b.expand?.hall;
              const requester = b.expand?.user;
              const workingAction = working?.id === b.id ? working.action : null;
              return (
                <div
                  key={b.id}
                  className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`h-2.5 w-2.5 shrink-0 rounded-full ${dotClass[hall?.color ?? "purple"]}`}
                      />
                      <h2 className="truncate text-sm font-semibold text-slate-900">{b.title}</h2>
                      <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[0.6rem] font-semibold text-amber-700">
                        Menunggu
                      </span>
                    </div>
                    <p className="mt-1 text-[0.8rem] text-slate-500">
                      {hall?.name ?? "Tempat dihapus"} · {formatDateKey(b.dateKey)} · {b.start}–
                      {b.end}
                    </p>
                    <p className="mt-0.5 text-[0.75rem] text-slate-400">
                      Pemohon: {b.requesterName || requester?.name || "-"} (
                      {b.requesterUsername || requester?.username || "-"})
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <button
                      className={`${primaryButtonClass} px-3.5 py-2 text-[0.78rem]`}
                      disabled={working !== null}
                      onClick={() => handleStatus(b, "approved")}
                    >
                      {workingAction === "approved" ? <Spinner size={14} /> : <Check size={14} />}
                      Setujui
                    </button>
                    <button
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-[0.78rem] font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 active:scale-95 disabled:cursor-default disabled:opacity-60"
                      disabled={working !== null}
                      onClick={() => handleStatus(b, "rejected")}
                    >
                      {workingAction === "rejected" ? <Spinner size={14} /> : <X size={14} />}
                      Tolak
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
};

export default RequestsPage;
