import { pb } from "../services/pocketbase";
import { currentUserName, getRole } from "../utils/auth";
import Avatar from "./Avatar";

const buttonClass =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3.5 text-[0.8rem] font-medium text-slate-600 transition hover:border-indigo-200 hover:bg-white hover:text-indigo-700 active:scale-[0.99]";

const TopBar = () => {
  const role = getRole();
  const name = currentUserName();

  const logout = () => {
    pb.authStore.clear();
    window.location.assign("/");
  };

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-slate-200 bg-white/90 px-5 py-3.5 backdrop-blur">
      <a className="text-base font-bold tracking-tight text-slate-900 no-underline" href="/">
        Hall Logger
      </a>
      <div className="flex items-center gap-2">
        {role === "admin" && (
          <>
            <a className={buttonClass} href="/admin/requests">
              Persetujuan
            </a>
            <a className={buttonClass} href="/admin/users">
              Pengguna
            </a>
          </>
        )}
        {role === "user" && (
          <a
            href="/profile"
            className={`${buttonClass} gap-2 pl-1.5 pr-3`}
            title="Edit profil"
          >
            <Avatar record={pb.authStore.record} size={24} />
            <span className="hidden max-w-36 truncate sm:block">{name}</span>
          </a>
        )}
        {role ? (
          <button className={buttonClass} onClick={logout}>
            Keluar
          </button>
        ) : (
          <a
            className={buttonClass}
            href={`/login?redirect=${encodeURIComponent(window.location.pathname)}`}
          >
            Masuk
          </a>
        )}
      </div>
    </header>
  );
};

export default TopBar;
