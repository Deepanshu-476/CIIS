import React, { useState } from "react";
import { Phone, Users, Clock, Calendar } from "lucide-react";
import { useTelecaller } from "./useTelecaller";
import { DataTable, Filters, Stats } from "./CallComponents";
import { filterCalls } from "./filterCalls";

export default function AssignedCalls() {
  const { assigned, enriched, can } = useTelecaller();
  const [filters, setFilters] = useState({});
  const allRows = assigned
    .filter((row) => !["Converted", "Closed"].includes(row.status))
    .map((row) => ({
      ...row,
      attempts: enriched.filter((call) => call.id === row.id).length,
    }));
  const rows = filterCalls(allRows, filters, "assigned");

  const statItems = [
    { label: "Total Assigned", value: allRows.length, Icon: Users, tone: "purple" },
    {
      label: "Pending Calls",
      value: allRows.filter((r) => !r.attempts || r.attempts === 0).length,
      Icon: Phone,
      tone: "orange"
    },
    {
      label: "Contacted Leads",
      value: allRows.filter((r) => (r.attempts || 0) > 0).length,
      Icon: Clock,
      tone: "teal"
    },
    {
      label: "Matching Filters",
      value: rows.length,
      Icon: Calendar,
      tone: "cyan"
    }
  ];

  return (
    <div className="tcl-views">
      <Stats items={statItems} />
      <Filters kind="assigned" rows={allRows} onApply={setFilters} />
      <DataTable
        rows={rows}
        kind="assigned"
        title="My Assigned Calls"
        emptyTitle="No Assigned Calls Found"
        emptySubtitle="New leads assigned to you will appear here."
        can={can}
      />
    </div>
  );
}
