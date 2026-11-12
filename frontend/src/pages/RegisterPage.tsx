import { useEffect, useState, type FormEvent } from "react";
import { Building2, Eye, EyeOff, Link2Off } from "lucide-react";
import Spinner from "../components/Spinner";
import { invitesService } from "../services/invites";
import { pb } from "../services/pocketbase";
import { formatDateTime } from "../utils/date";
import { inputClass, primaryButtonClass } from "../utils/ui";

const RegisterPage = () => {
  const [token] = useState(
    () => new URLSearchParams(window.location.search).get("token") ?? ""
  );
  const [checking, setChecking] = useState(Boolean(token));
  const [inviteError, setInviteError] = useState(
    token ? "" : "Link undangan tidak valid. Minta link baru ke admin."
  );
  const [expiresAt, setExpiresAt] = useState("");
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) return;
    invitesService
      .check(token)
      .then((res) => {
        if (res.valid) {
          setExpiresAt(res.expiresAt ?? "");
        } else {
          setInviteError(res.reason ?? "Token undangan tidak valid.");
        }
      })
      .catch((err) => setInviteError((err as Error).message))
      .finally(() => setChecking(false));
  }, [token]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Password dan konfirmasi password tidak sama.");
      return;
    }
    setBusy(true);
    try {
      await pb.send("/api/hall-logger/register", {
        method: "POST",
        body: { token, username, name, email, password },
      });
      await pb.collection("users").authWithPassword(email, password);
      window.location.assign("/");
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-slate-50 px-5 py-10">
      <div className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-slate-900">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-[0_8px_20px_-6px_rgba(99,102,241,0.6)]">
          <Building2 size={18} />
        </span>
        Hall Logger
      </div>

      {checking ? (
        <div className="flex w-full max-w-sm items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-10 text-sm text-slate-500">
          <Spinner size={16} /> Memeriksa link undangan...
        </div>
      ) : inviteError ? (
        <div className="flex w-full max-w-sm flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-8 text-center shadow-[0_20px_50px_-24px_rgba(49,46,129,0.25)]">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-500">
            <Link2Off size={20} />
          </span>
          <h1 className="text-base font-semibold text-slate-900">Undangan tidak valid</h1>
          <p className="text-[0.8rem] leading-relaxed text-slate-500">{inviteError}</p>
          <a
            href="/login"
            className="mt-1 text-[0.8rem] font-semibold text-indigo-600 transition hover:text-indigo-800"
          >
            Ke halaman masuk
          </a>
        </div>
      ) : (
        <form
          className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-[0_20px_50px_-24px_rgba(49,46,129,0.25)]"
          onSubmit={handleSubmit}
        >
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Daftar akun pengguna</h1>
            <p className="mt-1 text-[0.8rem] text-slate-500">
              Undangan aktif sampai {expiresAt ? formatDateTime(expiresAt) : "-"}.
            </p>
          </div>

          <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-700">
            Username
            <input
              className={inputClass}
              required type="text" autoFocus autoComplete="username"
              minLength={3} maxLength={30}
              pattern="[A-Za-z0-9._-]+"
              title="3-30 karakter: huruf, angka, titik, garis bawah, atau tanda hubung. NIP diperbolehkan."
              placeholder="Username atau NIP"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <span className="text-[0.68rem] font-normal text-slate-400">
              Boleh username biasa atau NIP (18 digit).
            </span>
          </label>

          <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-700">
            Nama
            <input
              className={inputClass}
              required type="text" autoComplete="name"
              maxLength={100}
              placeholder="Nama lengkap"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-700">
            Email
            <input
              className={inputClass}
              required type="email" autoComplete="username"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-700">
            Password
            <div className="relative">
              <input
                className={`${inputClass} w-full pr-10`}
                required
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                minLength={8}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 flex -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>

          <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-700">
            Konfirmasi password
            <input
              className={inputClass}
              required type="password" autoComplete="new-password"
              minLength={8}
              placeholder="••••••••"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
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
                <Spinner /> Mendaftar...
              </>
            ) : (
              "Daftar"
            )}
          </button>
        </form>
      )}

      <a href="/login" className="text-[0.8rem] text-slate-500 transition hover:text-indigo-700">
        Sudah punya akun? Masuk →
      </a>
    </div>
  );
};

export default RegisterPage;
