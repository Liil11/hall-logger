import { useEffect, useState } from "react";
import { Copy, Plus, Trash2, UserRound } from "lucide-react";
import Spinner from "../components/Spinner";
import TopBar from "../components/TopBar";
import { bookingsService } from "../services/bookings";
import type { InviteRecord } from "../services/invites";
import { invitesService } from "../services/invites";
import type { UserRecord } from "../services/users";
import { usersService } from "../services/users";
import { getRole } from "../utils/auth";
import { formatDateTime, parsePbDate } from "../utils/date";
import { primaryButtonClass } from "../utils/ui";

const linkFor = (invite: InviteRecord) =>
  `${window.location.origin}/register?token=${invite.token}`;

const UsersPage = () => {
  const [invites, setInvites] = useState<InviteRecord[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingInviteId, setDeletingInviteId] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [now] = useState(() => Date.now());

  const admin = getRole() === "admin";

  useEffect(() => {
    if (!admin) {
      window.location.replace("/login");
      return;
    }
    Promise.all([invitesService.list(), usersService.list()])
      .then(([inviteList, userList]) => {
        setInvites(inviteList);
        setUsers(userList);
      })
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, [admin]);

  const copyLink = async (invite: InviteRecord) => {
    setError("");
    try {
      await navigator.clipboard.writeText(linkFor(invite));
      setCopiedId(invite.id);
      window.setTimeout(() => {
        setCopiedId((prev) => (prev === invite.id ? null : prev));
      }, 2000);
    } catch {
      setError("Gagal menyalin link. Salin manual dari teks link di bawah.");
    }
  };

  const handleCreateInvite = async () => {
    setError("");
    setNotice("");
    setCreating(true);
    try {
      const invite = await invitesService.create();
      setInvites((prev) => [invite, ...prev]);
      await copyLink(invite);
      setNotice("Link undangan dibuat. Berlaku 24 jam dan hanya bisa dipakai sekali.");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteInvite = async (invite: InviteRecord) => {
    if (!window.confirm("Hapus link undangan ini? Link tidak bisa dipakai lagi.")) return;
    setError("");
    setNotice("");
    setDeletingInviteId(invite.id);
    try {
      await invitesService.remove(invite.id);
      setInvites((prev) => prev.filter((i) => i.id !== invite.id));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setDeletingInviteId(null);
    }
  };

  const handleDeleteUser = async (user: UserRecord) => {
    const label = user.name || user.email;
    if (!window.confirm(`Hapus pengguna "${label}"? Request pending miliknya ikut dihapus.`))
      return;
    setError("");
    setNotice("");
    setDeletingUserId(user.id);
    try {
      const pending = await bookingsService.listPendingByUser(user.id);
      await Promise.all(pending.map((b) => bookingsService.remove(b.id)));
      await usersService.remove(user.id);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setDeletingUserId(null);
    }
  };

  return (
    <>
      <TopBar />
      <main className="flex w-full flex-1 flex-col gap-4 px-4 py-4 pb-12 sm:px-8 sm:py-6">
        <div>
          <a href="/" className="text-[0.8rem] text-slate-500 transition hover:text-indigo-700">
            ← Semua tempat
          </a>
          <h1 className="mt-2 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Kelola Pengguna
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Buat link undangan pendaftaran dan kelola akun pengguna.
          </p>
        </div>

        {error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-[0.8rem] text-red-700">
            {error}
          </p>
        )}
        {notice && (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-[0.8rem] text-emerald-700">
            {notice}
          </p>
        )}

        {loading ? (
          <p className="flex items-center gap-2 text-sm text-slate-400">
            <Spinner size={15} /> Memuat data...
          </p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            <section className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 p-4">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Link Undangan</h2>
                  <p className="mt-0.5 text-[0.75rem] text-slate-500">
                    Berlaku 24 jam, sekali pakai.
                  </p>
                </div>
                <button
                  className={`${primaryButtonClass} px-3.5 py-2 text-[0.78rem]`}
                  disabled={creating}
                  onClick={handleCreateInvite}
                >
                  {creating ? <Spinner size={14} /> : <Plus size={14} />}
                  Buat Link
                </button>
              </div>

              {invites.length === 0 ? (
                <p className="px-4 py-8 text-center text-[0.8rem] text-slate-400">
                  Belum ada link undangan.
                </p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {invites.map((invite) => {
                    const usedBy = invite.expand?.usedBy;
                    const used = Boolean(invite.usedBy);
                    const expired = !used && parsePbDate(invite.expiresAt).getTime() <= now;
                    const active = !used && !expired;
                    const statusLabel = used ? "Dipakai" : expired ? "Kedaluwarsa" : "Aktif";
                    const statusClass = used
                      ? "bg-slate-100 text-slate-500"
                      : expired
                        ? "bg-amber-100 text-amber-700"
                        : "bg-emerald-50 text-emerald-700";

                    return (
                      <li key={invite.id} className="flex flex-col gap-1.5 px-4 py-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-2">
                            <span
                              className={`shrink-0 rounded-full px-1.5 py-0.5 text-[0.62rem] font-semibold ${statusClass}`}
                            >
                              {statusLabel}
                            </span>
                            <span className="truncate text-[0.72rem] text-slate-500">
                              {used
                                ? `Dipakai oleh ${usedBy?.name || usedBy?.username || usedBy?.email || "-"}`
                                : expired
                                  ? `Kedaluwarsa ${formatDateTime(invite.expiresAt)}`
                                  : `Sampai ${formatDateTime(invite.expiresAt)}`}
                            </span>
                          </div>
                          <div className="flex shrink-0 items-center gap-1">
                            <button
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-[0.68rem] font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 active:scale-95 disabled:pointer-events-none disabled:opacity-40"
                              disabled={!active}
                              title="Salin link pendaftaran"
                              onClick={() => copyLink(invite)}
                            >
                              <Copy size={11} />
                              {copiedId === invite.id ? "Tersalin" : "Salin"}
                            </button>
                            <button
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-[0.68rem] font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 active:scale-95 disabled:pointer-events-none disabled:opacity-40"
                              disabled={deletingInviteId === invite.id}
                              title="Hapus link undangan"
                              onClick={() => handleDeleteInvite(invite)}
                            >
                              {deletingInviteId === invite.id ? (
                                <Spinner size={11} />
                              ) : (
                                <Trash2 size={11} />
                              )}
                              Hapus
                            </button>
                          </div>
                        </div>
                        <code className="truncate rounded-lg bg-slate-50 px-2 py-1 text-[0.65rem] text-slate-500">
                          {linkFor(invite)}
                        </code>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <section className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-4">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Pengguna</h2>
                  <p className="mt-0.5 text-[0.75rem] text-slate-500">
                    {users.length} akun terdaftar.
                  </p>
                </div>
              </div>

              {users.length === 0 ? (
                <p className="px-4 py-8 text-center text-[0.8rem] text-slate-400">
                  Belum ada pengguna terdaftar.
                </p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {users.map((user) => (
                    <li key={user.id} className="flex items-center justify-between gap-3 px-4 py-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                          <UserRound size={15} />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900">
                            {user.name || "-"}
                          </p>
                          <p className="truncate text-[0.72rem] text-slate-500">
                            @{user.username}
                            {user.email ? ` · ${user.email}` : ""}
                          </p>
                        </div>
                      </div>
                      <button
                        className="inline-flex shrink-0 rounded-md p-1.5 text-slate-400 transition hover:scale-105 hover:bg-red-50 hover:text-red-500 active:scale-95 disabled:pointer-events-none disabled:opacity-40"
                        title="Hapus pengguna"
                        disabled={deletingUserId === user.id}
                        onClick={() => handleDeleteUser(user)}
                      >
                        {deletingUserId === user.id ? (
                          <Spinner size={14} />
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </main>
    </>
  );
};

export default UsersPage;
