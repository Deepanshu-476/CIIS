import React, { useState } from "react";

import { useTelecaller } from "./useTelecaller";
import { DataTable, Filters } from "./CallComponents";
import { filterCalls } from "./filterCalls";

export default function PendingCalls() {
  const { pending, enriched, can } = useTelecaller();
  const [filters, setFilters] = useState({});
  const allRows = pending.map((row) => ({
    ...row,
    attempts: enriched.filter((call) => call.id === row.id).length,
  }));
  const rows = filterCalls(allRows, filters, "pending");
  return (
    <div className="tcl-views">
      <Filters kind="pending" rows={allRows} onApply={setFilters} />
      <DataTable
        rows={rows}
        kind="pending"
        title={"Calls Pending Action"}
        can={can}
      />
    </div>
  );
}
