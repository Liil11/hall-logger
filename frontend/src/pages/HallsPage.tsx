import { useEffect, useState, type FormEvent } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import Spinner from "../components/Spinner";
import TopBar from "../components/TopBar";
import type { Hall, HallColor } from "../types/d.type";
import { bookingsService, hallsService } from "../services/bookings";
import { getRole } from "../utils/auth";
import { dotClass, HALL_COLORS, inputClass, primaryButtonClass } from "../utils/ui";

const EMPTY_FORM: { name: string; color: HallColor } = { name: "", color: "purple" };

const HallsPage = () => {
  const [halls, setHalls] = useState<Hall[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Hall | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [busy, setBusy] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const admin = getRole() === "admin";

  useEffect(() => {
    Promise.all([hallsService.list(), bookingsService.list()])
      .then(([hallList, bookingList]) => {
        setHalls(hallList);
        const perHall: Record<string, number> = {};
        bookingList.forEach((b) => {
          perHall[b.hall] = (perHall[b.hall] ?? 0) + 1;
        });
        setCounts(perHall);
      })
      .catch((err) => setError(err.message));
  }, []);

  const openCreate = () => {
    setError("");
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };

  const openEdit = (hall: Hall) => {
    setError("");
    setEditing(hall);
    setForm({ name: hall.name, color: hall.color });
    setFormOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const saved = editing
        ? await hallsService.update(editing.id, form)
        : await hallsService.create(form);
      setHalls((prev) =>
        (editing ? prev.map((h) => (h.id === saved.id ? saved : h)) : [...prev, saved]).sort(
          (a, b) => a.name.localeCompare(b.name)
        )
      );
      setFormOpen(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (hall: Hall) => {
    if (!window.confirm(`Hapus tempat "${hall.name}"? Semua jadwal di tempat ini ikut terhapus.`))
      return;
    setError("");
    setDeletingId(hall.id);
    try {
      await hallsService.remove(hall.id);
      setHalls((prev) => prev.filter((h) => h.id !== hall.id));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <TopBar />
      <main className="flex w-full flex-1 flex-col gap-5 px-5 py-6 pb-12 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Tempat</h1>
            <p className="mt-1 text-sm text-slate-500">Pilih tempat untuk melihat jadwalnya.</p>
          </div>
          {admin && (
            <button
              className={`${primaryButtonClass} w-max px-4 py-2.5 text-sm`}
              onClick={openCreate}
            >
              <Plus size={16} /> Tambah Tempat
            </button>
          )}
        </div>

        {error && !formOpen && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-[0.8rem] text-red-700">
            {error}
          </p>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(220px,1fr))] lg:grid-cols-[repeat(auto-fill,minmax(260px,1fr))]">
          {halls.map((hall) => (
            <div
              key={hall.id}
              className="flex flex-col rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-[0_14px_30px_-18px_rgba(49,46,129,0.35)]"
            >
              <a href={`/halls/${hall.id}`} className="flex flex-1 flex-col gap-2.5 p-4">
                <div className="flex items-center gap-2.5">
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dotClass[hall.color]}`} />
                  <h2 className="text-base font-semibold text-slate-900">{hall.name}</h2>
                </div>
                <span className="text-xs text-slate-500">{counts[hall.id] ?? 0} jadwal</span>
              </a>
              {admin && (
                <div className="flex justify-end gap-1 px-3 pb-3">
                  <button
                    className="inline-flex rounded-md p-1.5 text-slate-400 transition hover:scale-105 hover:bg-indigo-50 hover:text-indigo-600 active:scale-95"
                    title="Edit tempat"
                    onClick={() => openEdit(hall)}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    className="inline-flex rounded-md p-1.5 text-slate-400 transition hover:scale-105 hover:bg-red-50 hover:text-red-500 active:scale-95 disabled:pointer-events-none disabled:opacity-40"
                    title="Hapus tempat"
                    disabled={deletingId === hall.id}
                    onClick={() => handleDelete(hall)}
                  >
                    {deletingId === hall.id ? <Spinner size={14} /> : <Trash2 size={14} />}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {!error && halls.length === 0 && (
          <p className="text-sm text-slate-400">Belum ada tempat.</p>
        )}
      </main>

      {formOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={() => setFormOpen(false)}
        >
          <form
            className="flex w-full flex-col gap-3.5 rounded-t-3xl bg-white p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] text-left shadow-2xl sm:max-w-md sm:rounded-3xl sm:pb-6"
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSubmit}
          >
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-base font-semibold text-slate-900">
                {editing ? "Edit Tempat" : "Tambah Tempat"}
              </h2>
              <button
                type="button"
                className="inline-flex rounded-md p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                onClick={() => setFormOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-700">
              Nama
              <input
                className={inputClass}
                required maxLength={100} autoFocus
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </label>

            <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-700">
              Warna
              <select
                className={inputClass}
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value as HallColor })}
              >
                {HALL_COLORS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </label>

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
                  <Spinner /> Menyimpan...
                </>
              ) : (
                "Simpan"
              )}
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default HallsPage;
