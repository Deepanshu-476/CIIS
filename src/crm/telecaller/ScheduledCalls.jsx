import React, { useState } from "react";

import { useTelecaller } from "./useTelecaller";
import { DataTable, Filters } from "./CallComponents";
import { filterCalls } from "./filterCalls";

export default function ScheduledCalls() {
  const { followups, enriched, can } = useTelecaller();
  const [filters, setFilters] = useState({});
  const allRows = followups.map((row) => ({
    ...row,
    attempts: enriched.filter((call) => call.leadId === row.id || call.id === row.id).length,
  }));
  const rows = filterCalls(allRows, filters, "scheduled");
  return (
    <div className="tcl-views">
      <Filters kind="scheduled" rows={allRows} onApply={setFilters} />
      <DataTable
        rows={rows}
        kind="scheduled"
        title="Scheduled Callbacks"
        emptyTitle="No Scheduled Calls"
        emptySubtitle="No upcoming follow-up calls are scheduled."
        can={can}
      />
    </div>
  );
}
