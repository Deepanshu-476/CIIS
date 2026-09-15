import React, { useState } from "react";
import { Phone, ThumbsUp, Calendar } from "lucide-react";
import { DEMO_DATE } from "./demoData";
import { useTelecaller } from "./useTelecaller";
import { DataTable, Filters, Stats, day } from "./CallComponents";
import { filterCalls } from "./filterCalls";

export default function TodaysCalls() {
  const { today, followups, enriched, can } = useTelecaller();
  const [filters, setFilters] = useState({});
  const allRows = today.map((row) => ({
    ...row,
    attempts: enriched.filter((call) => call.id === row.id).length,
  }));
  const rows = filterCalls(allRows, filters, "today");

  const statItems = [
    { label: "Total Calls Today", value: today.length, Icon: Phone, tone: "purple" },
    {
      label: "Connected Calls",
      value: today.filter((r) =>
        ["Connected", "Interested", "Converted", "Follow-up"].includes(r.outcome)
      ).length,
      Icon: Phone,
      tone: "teal"
    },
    {
      label: "Interested Leads",
      value: today.filter((r) => r.outcome === "Interested").length,
      Icon: ThumbsUp,
      tone: "cyan"
    },
    {
      label: "Follow Ups Today",
      value: followups.filter((r) => day(r.followUp) === DEMO_DATE).length,
      Icon: Calendar,
      tone: "orange"
    }
  ];

  return (
    <div className="tcl-views">
      <Stats items={statItems} />
      <Filters kind="today" rows={allRows} onApply={setFilters} />
      <DataTable
        rows={rows}
        kind="today"
        title="Today's Call Log"
        emptyTitle="No Calls Made Today"
        emptySubtitle="Your completed calls for today will appear here."
        can={can}
      />
    </div>
  );
}
