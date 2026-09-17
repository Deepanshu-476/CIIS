import React, { useState } from "react";

import { useTelecaller } from "./useTelecaller";
import { DataTable, Filters } from "./CallComponents";
import { filterCalls } from "./filterCalls";

export default function CallHistory() { 
  const { enriched, can } = useTelecaller();
  const [filters, setFilters] = useState({});
  const allRows = enriched.map((row) => ({
    ...row,
    attempts: enriched.filter((call) => call.id === row.id || call.leadId === row.id).length,
  }));
  const rows = filterCalls(allRows, filters, "history");
  return (
    <div className="tcl-views">
      <Filters kind="history" rows={allRows} onApply={setFilters} />
      <DataTable
        rows={rows}
        kind="history"
        title="Complete Call Log"
        emptyTitle="No Call History"
        emptySubtitle="No calls have been logged yet."
        can={can}
      />
    </div>
  );
}
