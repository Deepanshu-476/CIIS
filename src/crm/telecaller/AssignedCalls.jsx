import React, { useState } from "react";

import { useTelecaller } from "./useTelecaller";
import { DataTable, Filters } from "./CallComponents";
import { filterCalls } from "./filterCalls";

export default function AssignedCalls() {
  const { assigned, enriched, can } = useTelecaller();
  const [filters, setFilters] = useState({});
  const allRows = assigned
    .filter((row) => row.status !== "Converted")
    .map((row) => ({
      ...row,
      attempts: enriched.filter((call) => call.id === row.id).length,
    }));
  const rows = filterCalls(allRows, filters, "assigned");
  return (
    <div className="tcl-views">
      <Filters kind="assigned" rows={allRows} onApply={setFilters} />
      <DataTable
        rows={rows}
        kind="assigned"
        title={"Assigned Calls"}
        can={can}
      />
    </div>
  );
}
