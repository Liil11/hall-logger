import { useEffect, useState, type FormEvent } from "react";
import { Building2, Eye, EyeOff } from "lucide-react";
import Spinner from "../components/Spinner";
import { pb } from "../services/pocketbase";
import { getRole } from "../utils/auth";
import { inputClass, primaryButtonClass } from "../utils/ui";

type Role = "user" | "admin";

const tabClass = (active: boolean) =>
  `rounded-lg px-3 py-2 text-[0.8rem] font-semibold transition ${
    active ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
  }`;

const redirectTarget = () => {
  const param = new URLSearchParams(window.location.search).get("redirect") ?? "";
  return param.startsWith("/") && !param.startsWith("//") ? param : "/";
};

const LoginPage = () => {
  const [role, setRole] = useState<Role>("user");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (getRole()) {
      window.location.replace(redirectTarget());
    }
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await pb
        .collection(role === "admin" ? "admins" : "users")
        .authWithPassword(email, password);
      window.location.assign(redirectTarget());
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

      <form
        className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-[0_20px_50px_-24px_rgba(49,46,129,0.25)]"
        onSubmit={handleSubmit}
      >
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            className={tabClass(role === "user")}
            onClick={() => {
              setRole("user");
              setError("");
            }}
          >
            Pengguna
          </button>
          <button
            type="button"
            className={tabClass(role === "admin")}
            onClick={() => {
              setRole("admin");
              setError("");
            }}
          >
            Admin
          </button>
        </div>

        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            {role === "admin" ? "Masuk sebagai admin" : "Masuk sebagai pengguna"}
          </h1>
          <p className="mt-1 text-[0.8rem] text-slate-500">
            {role === "admin"
              ? "Kelola tempat, jadwal, dan persetujuan."
              : "Masuk untuk booking tempat."}
          </p>
        </div>

        <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-700">
          {role === "admin" ? "Email" : "Username atau email"}
          <input
            className={inputClass}
            required
            type={role === "admin" ? "email" : "text"}
            autoFocus
            autoComplete="username"
            placeholder={role === "admin" ? "admin@email.com" : "username atau NIP"}
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
              autoComplete="current-password"
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
              <Spinner /> Masuk...
            </>
          ) : (
            "Masuk"
          )}
        </button>

        {role === "user" && (
          <p className="text-center text-[0.72rem] leading-relaxed text-slate-400">
            Pendaftaran pengguna hanya melalui link undangan dari admin.
          </p>
        )}
      </form>

      <a href="/" className="text-[0.8rem] text-slate-500 transition hover:text-indigo-700">
        Lihat jadwal tanpa login →
      </a>
    </div>
  );
};

export default LoginPage;
