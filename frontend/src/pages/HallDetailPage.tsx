import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Plus, Trash2, X } from "lucide-react";
import Avatar from "../components/Avatar";
import MonthCalendar from "../components/MonthCalendar";
import Spinner from "../components/Spinner";
import TopBar from "../components/TopBar";
import type { Booking, Hall, HallColor } from "../types/d.type";
import { bookingsService, hallsService } from "../services/bookings";
import {
  currentUserIdentity,
  currentUserId,
  currentUserRecord,
  getRole,
} from "../utils/auth";
import {
  daysInMonth,
  formatDateKey,
  monthLabel,
  parseKey,
  parseTime24,
  startOfMonth,
  toKey,
} from "../utils/date";
import { chipClass, dotClass, inputClass, primaryButtonClass } from "../utils/ui";

// date disimpan sebagai dateKey YYYY-MM-DD di form.
const EMPTY_FORM = { title: "", date: "", start: "", end: "" };

const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const HallDetailPage = ({ hallId }: { hallId: string }) => {
  const [hall, setHall] = useState<Hall | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [busy, setBusy] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [selectedKey, setSelectedKey] = useState(() => toKey(new Date()));

  const role = getRole();
  const admin = role === "admin";
  const user = role === "user";
  const canCreate = admin || user;
  const userId = currentUserId();
  const identity = currentUserIdentity();
  const color: HallColor = hall?.color ?? "purple";

  useEffect(() => {
    Promise.all([hallsService.get(hallId), bookingsService.listByHall(hallId)])
      .then(([hallRecord, bookingList]) => {
        setHall(hallRecord);
        setBookings(bookingList);
      })
      .catch((err) => setError(err.message));
  }, [hallId]);

  const bookingsByDate = useMemo(() => {
    const map: Record<string, Booking[]> = {};
    bookings.forEach((b) => {
      (map[b.dateKey] ??= []).push(b);
    });
    return map;
  }, [bookings]);

  const selectedBookings = bookingsByDate[selectedKey] ?? [];

  const monthStats = useMemo(() => {
    const days = daysInMonth(cursor);
    const prefix = toKey(startOfMonth(cursor)).slice(0, 7);
    let filled = 0;
    let events = 0;
    for (let i = 1; i <= days; i++) {
      const key = `${prefix}-${String(i).padStart(2, "0")}`;
      const count = bookingsByDate[key]?.length ?? 0;
      if (count > 0) filled++;
      events += count;
    }
    return { filled, free: days - filled, events };
  }, [cursor, bookingsByDate]);

  const openForm = (dateKey: string = selectedKey) => {
    setError("");
    setNotice("");
    setForm({ ...EMPTY_FORM, date: dateKey });
    setFormOpen(true);
  };

  const startBooking = () => {
    if (canCreate) {
      openForm();
      return;
    }
    window.location.assign(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (user && (!identity.name.trim() || !identity.username.trim())) {
      setError("Profil akun belum lengkap. Hubungi admin.");
      return;
    }

    const dateKey = form.date;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
      setError("Pilih tanggal terlebih dahulu.");
      return;
    }
    const start = parseTime24(form.start);
    const end = parseTime24(form.end);
    if (!start || !end) {
      setError("Format jam harus HH:MM (24 jam).");
      return;
    }
    if (start >= end) {
      setError("Jam selesai harus setelah jam mulai.");
      return;
    }

    // Slot yang sudah dibooking (pending atau approved) tidak bisa dipakai lagi.
    const clash = bookings.find(
      (b) => b.dateKey === dateKey && start < b.end && end > b.start
    );
    if (clash) {
      setError(
        `Jam ${clash.start}–${clash.end} sudah dibooking (${clash.title}). Pilih jam lain.`
      );
      return;
    }

    setBusy(true);
    try {
      const created = await bookingsService.create({
        title: form.title,
        hall: hallId,
        dateKey,
        start,
        end,
        status: admin ? "approved" : "pending",
        user: admin ? undefined : userId,
        requesterName: admin ? undefined : identity.name.trim(),
        requesterUsername: admin ? undefined : identity.username.trim(),
      });
      setBookings((prev) =>
        [...prev, created].sort((a, b) =>
          (a.dateKey + a.start).localeCompare(b.dateKey + b.start)
        )
      );
      setSelectedKey(created.dateKey);
      setCursor(startOfMonth(parseKey(created.dateKey)));
      setFormOpen(false);
      if (!admin) {
        setNotice("Request booking terkirim. Menunggu persetujuan admin.");
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (booking: Booking) => {
    const label = admin ? "Hapus jadwal" : "Batalkan request";
    if (!window.confirm(`${label} "${booking.title}"?`)) return;
    setError("");
    setNotice("");
    setDeletingId(booking.id);
    try {
      await bookingsService.remove(booking.id);
      setBookings((prev) => prev.filter((b) => b.id !== booking.id));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setDeletingId(null);
    }
  };

  const selectedDate = form.date ? parseKey(form.date) : new Date();
  const formYear = selectedDate.getFullYear();
  const formMonth = selectedDate.getMonth() + 1;
  const formDay = selectedDate.getDate();
  const dayCount = daysInMonth(new Date(formYear, formMonth - 1, 1));

  const currentYear = new Date().getFullYear();
  const yearOptions = [
    ...new Set([
      ...Array.from({ length: 8 }, (_, i) => currentYear - 2 + i),
      formYear,
    ]),
  ].sort((a, b) => a - b);

  const updateDate = (year: number, month: number, day: number) => {
    const maxDay = daysInMonth(new Date(year, month - 1, 1));
    const safeDay = Math.min(day, maxDay);
    setForm((prev) => ({ ...prev, date: toKey(new Date(year, month - 1, safeDay)) }));
  };

  return (
    <>
      <TopBar />
      <main className="flex min-h-0 w-full flex-1 flex-col gap-3 px-4 py-4 pb-28 sm:gap-4 sm:px-8 sm:py-6 sm:pb-12">
        <a
          href="/"
          className="w-max text-[0.8rem] text-slate-500 transition hover:text-indigo-700"
        >
          ← Semua tempat
        </a>

        {hall && (
          <div className="flex flex-wrap items-center gap-2.5">
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dotClass[hall.color]}`} />
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              {hall.name}
            </h1>
            <span className="text-xs text-slate-400">· {bookings.length} jadwal</span>
          </div>
        )}

        {error && !formOpen && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-[0.8rem] text-red-700">
            {error}
          </p>
        )}

        {notice && (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-[0.8rem] text-emerald-700">
            {notice}
          </p>
        )}

        <div className="flex min-h-0 flex-1 flex-col gap-3 sm:gap-4 lg:flex-row">
          <aside className="order-2 flex w-full flex-col gap-3 lg:order-1 lg:w-80 lg:shrink-0">
            <div className="hidden lg:block">
              <button
                className={`${primaryButtonClass} w-full px-4 py-2.5 text-sm`}
                onClick={startBooking}
              >
                <Plus size={16} /> {admin ? "Buat Jadwal" : "Booking Tempat"}
              </button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-slate-400">
                    Tanggal dipilih
                  </p>
                  <h2 className="mt-1 truncate text-sm font-semibold text-slate-900">
                    {formatDateKey(selectedKey)}
                  </h2>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[0.65rem] font-semibold ${
                    selectedBookings.length
                      ? chipClass[color]
                      : "bg-emerald-50 text-emerald-600"
                  }`}
                >
                  {selectedBookings.length ? `${selectedBookings.length} jadwal` : "Kosong"}
                </span>
              </div>

              {selectedBookings.length > 0 ? (
                <ul className="mt-3 flex flex-col gap-2">
                  {selectedBookings.map((b) => (
                    <li
                      key={b.id}
                      className="flex items-start gap-2 rounded-xl border border-slate-100 bg-slate-50/70 px-2.5 py-2"
                    >
                      <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${dotClass[color]}`} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-sm font-medium text-slate-900">{b.title}</p>
                          {b.status === "pending" && (
                            <span className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[0.6rem] font-semibold text-amber-700">
                              Menunggu
                            </span>
                          )}
                        </div>
                        <p className="text-[0.72rem] tabular-nums text-slate-500">
                          {b.start} – {b.end}
                        </p>
                        {admin && b.requesterName && (
                          <p className="truncate text-[0.68rem] text-slate-400">
                            Pemohon: {b.requesterName} (@{b.requesterUsername})
                          </p>
                        )}
                      </div>
                      {(admin || (user && b.user === userId && b.status === "pending")) && (
                        <button
                          className="inline-flex shrink-0 rounded-md p-1 text-slate-400 transition hover:scale-105 hover:bg-red-50 hover:text-red-500 active:scale-95 disabled:pointer-events-none disabled:opacity-40"
                          title={admin ? "Hapus" : "Batalkan request"}
                          disabled={deletingId === b.id}
                          onClick={() => handleDelete(b)}
                        >
                          {deletingId === b.id ? <Spinner size={13} /> : <Trash2 size={13} />}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 rounded-xl bg-emerald-50/70 px-3 py-2.5 text-[0.75rem] text-emerald-700">
                  Tidak ada jadwal. Tanggal ini masih kosong.
                </p>
              )}

              <button
                className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-indigo-200 bg-indigo-50/50 px-3 py-2.5 text-[0.78rem] font-semibold text-indigo-700 transition hover:border-indigo-300 hover:bg-indigo-50 active:scale-[0.99]"
                onClick={() => {
                  if (canCreate) {
                    openForm(selectedKey);
                  } else {
                    startBooking();
                  }
                }}
              >
                <Plus size={14} />
                {admin
                  ? "Tambah di tanggal ini"
                  : canCreate
                    ? "Booking di tanggal ini"
                    : "Masuk untuk booking"}
              </button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-slate-400">
                Ringkasan bulan
              </p>
              <h3 className="mt-1 text-sm font-semibold capitalize text-slate-900">
                {monthLabel(cursor)}
              </h3>
              <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-slate-50 px-2 py-2">
                  <dd className="text-base font-bold tabular-nums text-slate-900">
                    {monthStats.events}
                  </dd>
                  <dt className="text-[0.65rem] font-medium text-slate-500">Jadwal</dt>
                </div>
                <div className="rounded-xl bg-slate-50 px-2 py-2">
                  <dd className="text-base font-bold tabular-nums text-slate-900">
                    {monthStats.filled}
                  </dd>
                  <dt className="text-[0.65rem] font-medium text-slate-500">Hari terisi</dt>
                </div>
                <div className="rounded-xl bg-emerald-50 px-2 py-2">
                  <dd className="text-base font-bold tabular-nums text-emerald-700">
                    {monthStats.free}
                  </dd>
                  <dt className="text-[0.65rem] font-medium text-emerald-600">Hari kosong</dt>
                </div>
              </dl>
              <p className="mt-3 text-[0.7rem] leading-relaxed text-slate-400">
                Klik atau ketuk tanggal di kalender untuk melihat jadwalnya.
              </p>
            </div>
          </aside>

          <MonthCalendar
            cursor={cursor}
            selectedKey={selectedKey}
            bookingsByDate={bookingsByDate}
            color={color}
            canCreate={canCreate}
            onSelect={setSelectedKey}
            onCreate={openForm}
            onCursorChange={setCursor}
          />
        </div>
      </main>

      <button
        className="fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom))] right-5 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-[0_16px_32px_-10px_rgba(79,70,229,0.8)] transition hover:brightness-105 active:scale-95 lg:hidden"
        aria-label={admin ? "Buat jadwal" : "Booking tempat"}
        title={admin ? "Buat jadwal" : "Booking tempat"}
        onClick={startBooking}
      >
        <Plus size={24} />
      </button>

      {formOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={() => setFormOpen(false)}
        >
          <form
            className="flex max-h-[92dvh] w-full flex-col gap-3.5 overflow-y-auto rounded-t-3xl bg-white p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] text-left shadow-2xl sm:max-w-md sm:rounded-3xl sm:pb-6"
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleCreate}
          >
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-base font-semibold text-slate-900">
                {admin ? "Buat Jadwal" : "Booking Tempat"} · {hall?.name}
              </h2>
              <button
                type="button"
                className="inline-flex rounded-md p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                onClick={() => setFormOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            {user && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3">
                <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-slate-400">
                  Pemohon
                </p>
                <div className="mt-2 flex items-center gap-2.5">
                  <Avatar record={currentUserRecord()} size={32} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {identity.name || "-"}
                    </p>
                    <p className="truncate text-[0.72rem] text-slate-500">
                      @{identity.username || "-"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-700">
              Kepentingan
              <input
                className={inputClass}
                required maxLength={200} autoFocus
                placeholder="Contoh: Rapat koordinasi"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </label>

            <div className="flex flex-col gap-1.5 text-xs font-semibold text-slate-700">
              <span>Tanggal</span>
              <div className="grid grid-cols-[5rem_minmax(0,1fr)_5.5rem] gap-2">
                <select
                  className={inputClass}
                  aria-label="Tanggal"
                  value={formDay}
                  onChange={(e) => updateDate(formYear, formMonth, Number(e.target.value))}
                >
                  {Array.from({ length: dayCount }, (_, i) => i + 1).map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
                <select
                  className={inputClass}
                  aria-label="Bulan"
                  value={formMonth}
                  onChange={(e) => updateDate(formYear, Number(e.target.value), formDay)}
                >
                  {MONTH_NAMES.map((month, i) => (
                    <option key={month} value={i + 1}>
                      {month}
                    </option>
                  ))}
                </select>
                <select
                  className={inputClass}
                  aria-label="Tahun"
                  value={formYear}
                  onChange={(e) => updateDate(Number(e.target.value), formMonth, formDay)}
                >
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <label className="flex flex-1 flex-col gap-1.5 text-xs font-semibold text-slate-700">
                Mulai
                <input
                  className={inputClass}
                  required
                  type="time"
                  lang="id-ID"
                  value={form.start}
                  onChange={(e) => setForm({ ...form, start: e.target.value })}
                />
              </label>
              <label className="flex flex-1 flex-col gap-1.5 text-xs font-semibold text-slate-700">
                Selesai
                <input
                  className={inputClass}
                  required
                  type="time"
                  lang="id-ID"
                  value={form.end}
                  onChange={(e) => setForm({ ...form, end: e.target.value })}
                />
              </label>
            </div>
            <p className="-mt-1 text-[0.7rem] text-slate-400">
              Jam memakai format 24 jam, contoh 08:00 atau 14:30.
            </p>

            {error && (
              <p className="rounded-lg bg-red-50 px-2.5 py-2 text-[0.78rem] text-red-600">{error}</p>
            )}

            <button
              className={`${primaryButtonClass} px-4 py-3 text-sm`}
              type="submit"
              disabled={busy}
            >
              {busy ? (
                <>
                  <Spinner /> {admin ? "Menyimpan..." : "Mengirim..."}
                </>
              ) : admin ? (
                "Simpan"
              ) : (
                "Kirim Request"
              )}
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default HallDetailPage;
