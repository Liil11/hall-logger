import { useMemo } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import type { Booking, HallColor } from "../types/d.type";
import {
  addDays,
  addMonths,
  monthLabel,
  startOfMonth,
  startOfWeekMonday,
  toKey,
} from "../utils/date";
import { chipClass, dayTintClass, dotClass } from "../utils/ui";

const WEEKDAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

interface MonthCalendarProps {
  cursor: Date;
  selectedKey: string;
  bookingsByDate: Record<string, Booking[]>;
  color: HallColor;
  canCreate: boolean;
  onSelect: (key: string) => void;
  onCreate: (key: string) => void;
  onCursorChange: (month: Date) => void;
}

const MonthCalendar = ({
  cursor,
  selectedKey,
  bookingsByDate,
  color,
  canCreate,
  onSelect,
  onCreate,
  onCursorChange,
}: MonthCalendarProps) => {
  const todayKey = toKey(new Date());

  const cells = useMemo(() => {
    const start = startOfWeekMonday(startOfMonth(cursor));
    return Array.from({ length: 42 }, (_, i) => addDays(start, i));
  }, [cursor]);

  const goToday = () => {
    onCursorChange(startOfMonth(new Date()));
    onSelect(todayKey);
  };

  return (
    <section className="order-1 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_40px_-30px_rgba(49,46,129,0.35)] lg:order-2">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Bulan sebelumnya"
              title="Bulan sebelumnya"
              className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1.5 text-slate-500 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 active:scale-95"
              onClick={() => onCursorChange(addMonths(cursor, -1))}
            >
              <ChevronLeft size={15} />
            </button>
            <button
              type="button"
              aria-label="Bulan berikutnya"
              title="Bulan berikutnya"
              className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1.5 text-slate-500 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 active:scale-95"
              onClick={() => onCursorChange(addMonths(cursor, 1))}
            >
              <ChevronRight size={15} />
            </button>
          </div>
          <h2 className="min-w-32 text-base font-bold capitalize tracking-tight text-slate-900 sm:min-w-40 sm:text-lg">
            {monthLabel(cursor)}
          </h2>
          <button
            type="button"
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[0.72rem] font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 active:scale-95"
            onClick={goToday}
          >
            Hari ini
          </button>
        </div>

        <div className="hidden items-center gap-3 text-[0.7rem] text-slate-500 sm:flex">
          <span className="inline-flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${dotClass[color]}`} /> Ada jadwal
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full border border-slate-300 bg-white" /> Kosong
          </span>
        </div>
      </header>

      <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/60">
        {WEEKDAYS.map((day) => (
          <span
            key={day}
            className="px-1 py-1.5 text-center text-[0.6rem] font-semibold uppercase tracking-wide text-slate-400 sm:px-2 sm:py-2 sm:text-[0.68rem]"
          >
            {day}
          </span>
        ))}
      </div>

      <div className="grid flex-1 grid-cols-7 grid-rows-[repeat(6,minmax(3.5rem,1fr))] lg:grid-rows-6">
        {cells.map((day) => {
          const key = toKey(day);
          const items = bookingsByDate[key] ?? [];
          const inMonth = day.getMonth() === cursor.getMonth();
          const isToday = key === todayKey;
          const isSelected = key === selectedKey;

          const cellTone = !inMonth
            ? "bg-slate-50/50"
            : items.length > 0
              ? dayTintClass[color]
              : "bg-white";

          return (
            <div
              key={key}
              role="gridcell"
              tabIndex={0}
              aria-selected={isSelected}
              aria-label={`${key}, ${items.length} jadwal`}
              className={`group relative flex cursor-pointer flex-col gap-1 overflow-hidden border-b border-r border-slate-100 p-1 text-left transition hover:bg-indigo-50/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500 sm:p-1.5 ${cellTone} ${
                isSelected ? "ring-2 ring-inset ring-indigo-500" : ""
              }`}
              onClick={() => onSelect(key)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(key);
                }
              }}
            >
              <div className="flex items-center justify-between gap-1">
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[0.65rem] font-semibold tabular-nums sm:h-6 sm:w-6 sm:text-[0.72rem] ${
                    isToday
                      ? "bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-[0_6px_14px_-8px_rgba(99,102,241,0.9)]"
                      : !inMonth
                        ? "text-slate-300"
                        : isSelected
                          ? "bg-indigo-100 text-indigo-700"
                          : "text-slate-700"
                  }`}
                >
                  {day.getDate()}
                </span>
                {canCreate && (
                  <button
                    type="button"
                    title={`Tambah jadwal ${key}`}
                    aria-label={`Tambah jadwal ${key}`}
                    className="hidden rounded-md p-0.5 text-slate-400 opacity-0 transition hover:bg-indigo-100 hover:text-indigo-700 group-hover:opacity-100 focus:opacity-100 active:scale-95 sm:inline-flex"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCreate(key);
                    }}
                  >
                    <Plus size={13} />
                  </button>
                )}
              </div>

              <div className="mt-auto hidden w-full min-w-0 flex-col gap-0.5 sm:flex">
                {items.slice(0, 2).map((b) => (
                  <span
                    key={b.id}
                    className={`truncate rounded px-1 py-[0.1rem] text-[0.62rem] font-medium ${
                      b.status === "pending"
                        ? "border border-dashed border-amber-400/80 bg-amber-50 text-amber-800"
                        : chipClass[color]
                    }`}
                  >
                    <span className="tabular-nums">{b.start}</span> {b.title}
                  </span>
                ))}
                {items.length > 2 && (
                  <span className="pl-1 text-[0.62rem] font-medium text-slate-400">
                    +{items.length - 2} lagi
                  </span>
                )}
              </div>

              <div className="mt-auto flex flex-wrap gap-1 sm:hidden">
                {items.slice(0, 3).map((b) => (
                  <span
                    key={b.id}
                    className={`h-1.5 w-1.5 rounded-full ${dotClass[color]} ${
                      b.status === "pending" ? "ring-1 ring-amber-400" : ""
                    }`}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default MonthCalendar;
