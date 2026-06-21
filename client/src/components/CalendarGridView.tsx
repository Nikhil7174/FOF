import type { CalendarGridEntry } from "@/types";

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function getWeekStart(date: Date): Date {
  const start = new Date(date);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

function parseLocalIsoDate(value: string): Date | null {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return isNaN(date.getTime()) ? null : date;
}

function getDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatCellDate(date: Date): string {
  return date.toLocaleDateString("en-US", { day: "numeric", month: "short" });
}

interface CalendarGridViewProps {
  entries: CalendarGridEntry[];
}

export function CalendarGridView({ entries }: CalendarGridViewProps) {
  const byDate = new Map(entries.map((entry) => [entry.date, entry]));
  const validDates = entries
    .map((entry) => parseLocalIsoDate(entry.date))
    .filter((date): date is Date => Boolean(date))
    .sort((a, b) => a.getTime() - b.getTime());

  if (validDates.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No calendar events available yet.</p>;
  }

  const firstWeekStart = getWeekStart(validDates[0]);
  const lastWeekStart = getWeekStart(validDates[validDates.length - 1]);
  const weeks: Date[][] = [];

  for (let weekStart = new Date(firstWeekStart); weekStart <= lastWeekStart; weekStart.setDate(weekStart.getDate() + 7)) {
    weeks.push(
      Array.from({ length: 7 }, (_, index) => {
        const day = new Date(weekStart);
        day.setDate(weekStart.getDate() + index);
        return day;
      })
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border bg-white">
      <div className="min-w-[920px]">
        <div className="grid grid-cols-7 bg-black text-white text-xs font-bold uppercase">
          {WEEKDAYS.map((day) => (
            <div key={day} className="px-3 py-2 border-r border-white/20 last:border-r-0">
              {day.slice(0, 3)}
            </div>
          ))}
        </div>
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 border-t">
            {week.map((date) => {
              const dateKey = getDateKey(date);
              const entry = byDate.get(dateKey);
              return (
                <div key={dateKey} className="min-h-[150px] border-r last:border-r-0 bg-white">
                  <div className="bg-amber-400 px-2 py-1 text-xs font-bold text-black">
                    {formatCellDate(date)}
                  </div>
                  <div className="p-2 space-y-1">
                    {entry?.events.map((event, index) => (
                      <div key={`${dateKey}-${event}-${index}`} className="text-xs font-medium uppercase leading-snug">
                        {event}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
