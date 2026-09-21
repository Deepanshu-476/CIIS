import { todayKey } from "./liveData.js";

const day = (value) => String(value || "").slice(0, 10);
const followStatus = (row) =>
  day(row.followUp) < todayKey()
    ? "Overdue"
    : day(row.followUp) === todayKey()
      ? "Today"
      : "Upcoming";
export function filterCalls(allRows, filters, kind) {
  return allRows.filter((row) => {
    if (  
      kind === "scheduled" &&
      !filters.scheduleStatus &&
      !filters.scheduledDate &&
      day(row.followUp) < todayKey()
    ) 
      return false;
    return Object.entries(filters).every(([key, value]) => {
      if (!value || value === "All" || value === "Any" || String(value).startsWith("All ") || String(value).startsWith("Select ")) return true;
      const date = day(
        kind === "assigned"
          ? row.assigned
          : kind === "scheduled"
            ? row.followUp
            : row.date,
      );
      if (key === "from") return date >= value;
      if (key === "to") return date <= value;
      if (key === "scheduledDate" || key === "completedDate")
        return date === value;
      if (key === "scheduleStatus") return followStatus(row) === value;
      if (key === "timeFrom")
        return String(row.date || "").slice(11, 16) >= value;
      if (key === "timeTo")
        return String(row.date || "").slice(11, 16) <= value;
      if (key === "search")
        return `${row.name} ${row.id} ${row.phone} ${row.email}`
          .toLowerCase()
          .includes(value.trim().toLowerCase());
      if (key === "attempts")
        return value === "Never Called"
          ? row.attempts === 0
          : value === "1–3 Calls"
            ? row.attempts >= 1 && row.attempts <= 3
            : row.attempts >= 4;
      return row[key] === value;
    });
  });
}
