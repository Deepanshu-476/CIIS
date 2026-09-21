import React, { useState } from "react";
import { Phone, Calendar, ShoppingBag, ThumbsUp } from "lucide-react";

import { useTelecaller } from "./useTelecaller";
import { DataTable, Filters, Stats } from "./CallComponents";
import { filterCalls } from "./filterCalls";

export default function CompletedCalls() {
  const { today, converted, enriched, can } = useTelecaller();
  const [filters, setFilters] = useState({});
  const allRows = enriched.map((row) => ({
    ...row,
    attempts: enriched.filter((call) => call.id === row.id || call.leadId === row.id).length,
  }));
  const rows = filterCalls(allRows, filters, "completed");

  return (
    <div className="tcl-views">
      <Stats
        items={[
          ["Total Completed", enriched.length, Phone, "teal"],
          [
            "Interested",
            enriched.filter((r) => r.outcome === "Interested").length,
            ThumbsUp,
            "purple",
          ],
          ["Today Completed", today.length, Calendar, "cyan"],
          ["Purchased", converted.length, ShoppingBag, "teal"],
        ]}
      />
      <Filters kind="completed" rows={allRows} onApply={setFilters} />
      <DataTable
        rows={rows}
        kind="completed"
        title="Completed Call Log"
        emptyTitle="No Completed Calls"
        emptySubtitle="No completed calls found matching your filters."
        can={can}
      />
    </div>
  );
}
