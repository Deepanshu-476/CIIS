import React from "react";
import AddLead from "../admin/AddLead";
import { useTelecaller } from "./useTelecaller";
import { TELECALLER_BASE } from "./telecallerPages";

// A telecaller adds a lead of their own. The server assigns it to them, so it shows up in
// "My Assigned Calls" and opens in Lead Detail / Call Workspace like any assigned lead.
export default function AddOwnLead() {
  const { refresh, can } = useTelecaller();
  return (
    <AddLead
      optionsUrl="/crm/telecaller/lead-options"
      submitUrl="/crm/telecaller/leads"
      listPath={`${TELECALLER_BASE}/assigned-calls`}
      listLabel="My Assigned Calls"
      savedLeadPath={id => (id && can("lead-detail") ? `${TELECALLER_BASE}/lead-detail/${id}` : `${TELECALLER_BASE}/assigned-calls`)}
      showPageHeader={false}
      setupHint="No active Lead Type or Lead Source yet. Ask your admin to add them before you save a lead."
      onSaved={refresh}
    />
  );
}
