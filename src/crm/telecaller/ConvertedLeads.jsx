import React, { useState } from "react";
import { Calendar, Trophy, TrendingUp } from "lucide-react";
import { todayKey, conversionRate } from "./liveData";
import { useTelecaller } from "./useTelecaller";
import { DataTable, Filters, Stats, day } from "./CallComponents";
import { filterCalls } from "./filterCalls";

export default function ConvertedLeads() {
  const { assigned, converted, enriched, can } = useTelecaller();
  const [filters, setFilters] = useState({});
  const allRows = converted.map((row) => ({
    ...row,
    attempts: enriched.filter((call) => call.id === row.id || call.leadId === row.id).length,
  }));
  const rows = filterCalls(allRows, filters, "converted");

  return (
    <div className="tcl-views">
      <p className="tcl-page-subtitle">
        Leads successfully converted from your calling assignments.
      </p>
      <Stats
        items={[
          ["Total Converted", converted.length, Trophy, "teal"],
          [
            "Converted Today",
            converted.filter((r) => day(r.date) === todayKey()).length,
            Calendar,
            "purple",
          ],
          [
            "This Month",
            converted.filter((r) =>
              day(r.date).startsWith(todayKey().slice(0, 7)),
            ).length,
            Calendar,
            "cyan",
          ],
          [
            "Conversion Rate",
            `${conversionRate(assigned)}%`,
            TrendingUp,
            "orange",
          ],
        ]}
      />
      <Filters kind="converted" rows={allRows} onApply={setFilters} />
      <DataTable
        rows={rows}
        kind="converted"
        title="Converted Customer List"
        emptyTitle="No Converted Leads"
        emptySubtitle="No converted leads found."
        can={can}
      />
    </div>
  );
}
