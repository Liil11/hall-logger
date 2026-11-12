import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { ImagePlus } from "lucide-react";
import Avatar from "../components/Avatar";
import Spinner from "../components/Spinner";
import TopBar from "../components/TopBar";
import { pb } from "../services/pocketbase";
import type { UserRecord } from "../services/users";
import { getRole } from "../utils/auth";
import { inputClass, primaryButtonClass } from "../utils/ui";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

const ProfilePage = () => {
  const record = pb.authStore.record;
  const role = getRole();

  const [name, setName] = useState((record?.name as string | undefined) ?? "");
  const [username, setUsername] = useState(
    (record?.username as string | undefined) ?? ""
  );
  const [email, setEmail] = useState(record?.email ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (role !== "user") {
      window.location.replace("/");
    }
  }, [role]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    setError("");
    setNotice("");
    const file = e.target.files?.[0] ?? null;
    if (!file) {
      setAvatarFile(null);
      setPreview("");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("Avatar harus berupa file gambar.");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setError("Ukuran avatar maksimal 5 MB.");
      e.target.value = "";
      return;
    }
    setAvatarFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setNotice("");

    if (!name.trim() || !username.trim()) {
      setError("Nama dan username wajib diisi.");
      return;
    }
    if (!/^[A-Za-z0-9._-]{3,30}$/.test(username.trim())) {
      setError(
        "Username 3-30 karakter, hanya huruf, angka, titik, garis bawah, atau tanda hubung."
      );
      return;
    }

    const changingPassword = Boolean(currentPassword || newPassword || confirmPassword);
    if (changingPassword) {
      if (!currentPassword || !newPassword) {
        setError("Isi password saat ini dan password baru.");
        return;
      }
      if (newPassword.length < 8) {
        setError("Password baru minimal 8 karakter.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setError("Konfirmasi password baru tidak sama.");
        return;
      }
    }

    if (!record?.id) {
      setError("Sesi login tidak valid. Masuk ulang.");
      return;
    }

    setBusy(true);
    try {
      const body = new FormData();
      body.append("name", name.trim());
      body.append("username", username.trim());
      body.append("email", email.trim());
      if (avatarFile) body.append("avatar", avatarFile);
      if (changingPassword) {
        body.append("oldPassword", currentPassword);
        body.append("password", newPassword);
        body.append("passwordConfirm", confirmPassword);
      }

      const updated = await pb.collection("users").update<UserRecord>(record.id, body);

      if (changingPassword) {
        // Password changes rotate the auth token; sign in again with the new one.
        await pb.collection("users").authWithPassword(updated.username, newPassword);
      } else {
        pb.authStore.save(pb.authStore.token, updated);
      }

      setName(updated.name);
      setUsername(updated.username);
      setEmail(updated.email);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setAvatarFile(null);
      setPreview("");
      setNotice(
        changingPassword
          ? "Profil dan password berhasil diperbarui."
          : "Profil berhasil diperbarui."
      );
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (role !== "user") return null;

  return (
    <>
      <TopBar />
      <main className="flex w-full flex-1 flex-col items-center px-4 py-4 pb-12 sm:px-8 sm:py-6">
        <div className="flex w-full max-w-xl flex-col gap-4">
          <div>
            <a href="/" className="text-[0.8rem] text-slate-500 transition hover:text-indigo-700">
              ← Semua tempat
            </a>
            <h1 className="mt-2 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              Profil Saya
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Ubah data akun, avatar, dan password.
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

          <form
            className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"
            onSubmit={handleSubmit}
          >
            <div className="flex flex-wrap items-center gap-4">
              <Avatar record={record} src={preview} size={88} className="rounded-2xl" />
              <div className="flex flex-col gap-1.5">
                <label className="inline-flex w-max cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[0.78rem] font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700">
                  <ImagePlus size={14} /> Ganti avatar
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </label>
                <p className="text-[0.7rem] text-slate-400">Gambar, maksimal 5 MB.</p>
              </div>
            </div>

            <div className="grid gap-3.5 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-700">
                Nama
                <input
                  className={inputClass}
                  required type="text" autoComplete="name"
                  maxLength={100}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>

              <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-700">
                Username
                <input
                  className={inputClass}
                  required type="text" autoComplete="username"
                  minLength={3} maxLength={30}
                  pattern="[A-Za-z0-9._-]+"
                  title="3-30 karakter: huruf, angka, titik, garis bawah, atau tanda hubung. NIP diperbolehkan."
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </label>

              <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-700 sm:col-span-2">
                Email
                <input
                  className={inputClass}
                  required type="email" autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
              <h2 className="text-sm font-semibold text-slate-900">Ganti Password</h2>
              <p className="mt-0.5 text-[0.72rem] text-slate-400">
                Kosongkan jika tidak ingin mengubah password.
              </p>
              <div className="mt-3 flex flex-col gap-3">
                <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-700">
                  Password saat ini
                  <input
                    className={inputClass}
                    type="password" autoComplete="current-password"
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-700">
                    Password baru
                    <input
                      className={inputClass}
                      type="password" autoComplete="new-password"
                      minLength={8}
                      placeholder="Minimal 8 karakter"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </label>
                  <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-700">
                    Konfirmasi password baru
                    <input
                      className={inputClass}
                      type="password" autoComplete="new-password"
                      minLength={8}
                      placeholder="Ulangi password baru"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </label>
                </div>
              </div>
            </div>

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
                "Simpan Perubahan"
              )}
            </button>
          </form>
        </div>
      </main>
    </>
  );
};

export default ProfilePage;
