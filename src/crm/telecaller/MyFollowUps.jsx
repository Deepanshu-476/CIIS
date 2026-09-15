import React, { useState } from "react";
import {
  Calendar,
  CalendarCheck,
  Bell,
  List,
  AlertTriangle,
} from "lucide-react";
import { DEMO_DATE } from "./demoData";
import { useTelecaller } from "./useTelecaller";
import {  
  DataTable,
  Stats,
  FollowupCalendar,
  day,
} from "./CallComponents";
export default function MyFollowUps() {
  const { followups, enriched, can } = useTelecaller();
  const [tab, setTab] = useState("List View");
  const tomorrow = new Date(`${DEMO_DATE}T12:00:00`);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowKey = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;
  const overdue = followups.filter((r) => day(r.followUp) < DEMO_DATE);

  const allRows = followups.map((row) => ({
    ...row,
    attempts: enriched.filter((call) => call.id === row.id || call.leadId === row.id).length,
  }));
  const overdueRows = allRows.filter((r) => day(r.followUp) < DEMO_DATE);

  return (
    <div className="tcl-views">
      <Stats
        items={[
          [
            "Today's Follow-ups",
            followups.filter((r) => day(r.followUp) === DEMO_DATE).length,
            Calendar,
            "purple",
          ],
          [
            "Tomorrow",
            followups.filter((r) => day(r.followUp) === tomorrowKey).length,
            Calendar,
            "cyan",
          ],
          [
            "Upcoming",
            followups.filter((r) => day(r.followUp) > DEMO_DATE).length,
            Calendar,
            "teal",
          ],
          ["Overdue", overdue.length, AlertTriangle, "pink"],
        ]}
      />
      <div className="tcl-followup-panel">
        <div
          className="tcl-tabs"
          role="tablist"
          aria-label="Follow-up views"
        >
          {[
            ["List View", List],
            ["Calendar", Calendar],
            ["Reminder Center", Bell],
          ].map(([name, Icon]) => (
            <button
              id={`tcl-tab-${name.replaceAll(" ", "-")}`}
              aria-controls="tcl-followup-content"
              role="tab"
              aria-selected={tab === name}
              className={tab === name ? "active" : ""}
              onClick={() => setTab(name)}
              key={name}
            >
              <Icon size={13} />
              {name}
              {name === "Reminder Center" && overdue.length > 0 && (
                <span className="tcl-count">{overdue.length}</span>
              )}
            </button>
          ))}
        </div>
        <div
          role="tabpanel"
          id="tcl-followup-content"
          aria-labelledby={`tcl-tab-${tab.replaceAll(" ", "-")}`}
        >
          {tab === "Calendar" ? (
            <FollowupCalendar rows={followups} can={can} />
          ) : (
            <>
              {tab === "Reminder Center" && (
                <div className="tcl-reminder">
                  <Bell size={16} />
                  <div>
                    <strong>
                      {overdue.length
                        ? `${overdue.length} overdue follow-up${overdue.length === 1 ? "" : "s"} need attention`
                        : "You are all caught up"}
                    </strong>
                    <p>
                      Open a call to contact the lead and schedule their next
                      follow-up.
                    </p>
                  </div>
                </div>
              )}
              <DataTable
                rows={tab === "Reminder Center" ? overdueRows : allRows}
                kind="follow-ups"
                title=""
                emptyTitle="No Follow-Ups"
                emptySubtitle="No scheduled follow-up calls found."
                can={can}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
