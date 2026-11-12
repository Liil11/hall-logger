export const toKey = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;

// Tanggal tampil sebagai DD/MM/YYYY.
export const formatDateKey = (key: string): string => {
  const [year, month, day] = key.split("-");
  return `${day}/${month}/${year}`;
};

// Terima DD/MM/YYYY atau D/M/YYYY, kembalikan YYYY-MM-DD bila tanggal valid.
export const parseDateText = (value: string): string | null => {
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value.trim());
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
};

// Terima HH:MM, H:MM, atau HHMM (24 jam), kembalikan HH:MM ternormalisasi.
export const parseTime24 = (value: string): string | null => {
  const match = /^(\d{1,2}):?(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return `${String(hour).padStart(2, "0")}:${match[2]}`;
};

export const maskDateInput = (raw: string): string => {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};

export const parseKey = (key: string): Date => new Date(`${key}T00:00:00`);

export const addDays = (d: Date, n: number): Date =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

export const startOfMonth = (d: Date): Date => new Date(d.getFullYear(), d.getMonth(), 1);

export const addMonths = (d: Date, n: number): Date => startOfMonth(new Date(d.getFullYear(), d.getMonth() + n, 1));

export const startOfWeekMonday = (d: Date): Date => addDays(d, -((d.getDay() + 6) % 7));

export const monthLabel = (d: Date): string =>
  d.toLocaleDateString("id-ID", { month: "long", year: "numeric" });

// PocketBase date fields use "YYYY-MM-DD HH:mm:ss.sssZ"; normalize for parsing.
export const parsePbDate = (value: string): Date => new Date(value.replace(" ", "T"));

export const formatDateTime = (iso: string): string => {
  const d = parsePbDate(iso);
  if (Number.isNaN(d.getTime())) return "-";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const hour = String(d.getHours()).padStart(2, "0");
  const minute = String(d.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${d.getFullYear()} ${hour}:${minute}`;
};

export const daysInMonth = (d: Date): number =>
  new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
