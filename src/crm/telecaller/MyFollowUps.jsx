import React, { useState, useEffect } from "react";
import {
  Calendar,
  CalendarCheck,
  Bell,
  List,
  AlertTriangle,
} from "lucide-react";
import { todayKey } from "./liveData";
import { useTelecaller } from "./useTelecaller";
import api from "../../utils/axiosConfig";
import {
  DataTable,
  Stats,
  FollowupCalendar,
  day,
} from "./CallComponents";

export default function MyFollowUps() {
  const { followups: leadFollowups, enriched, can, refresh } = useTelecaller();
  const [tab, setTab] = useState("List View");
  const [apiFollowUps, setApiFollowUps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const fetchFollowUps = async () => {
    setLoading(true);
    try {
      const res = await api.get("/followups");
      const list = Array.isArray(res.data) ? res.data : [];
      setApiFollowUps(list);
    } catch {
      // Fallback gracefully to lead-based followups
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowUps();
  }, []);

  const handleCompleteFollowUp = async (row) => {
    const followId = row.followUpId || row._id;
    if (followId) {
      try {
        await api.patch(`/followups/${followId}/complete`);
        setMessage("✅ Follow-up marked as completed!");
        setTimeout(() => setMessage(""), 3000);
        await fetchFollowUps();
        if (typeof refresh === "function") {
          refresh();
        }
      } catch (err) {
        setMessage(err.response?.data?.msg || err.message || "Failed to complete follow-up");
      }
    } else {
      setMessage("✅ Follow-up noted as completed");
      setTimeout(() => setMessage(""), 3000);
      if (typeof refresh === "function") {
        refresh();
      }
    }
  };

  const tomorrow = new Date(`${todayKey()}T12:00:00`);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowKey = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;

  // Merge lead-derived followups and API followups
  const apiRows = apiFollowUps.map((f) => ({
    id: String(f.lead?._id || f.lead || ""),
    followUpId: String(f._id),
    name: f.lead?.name || "Lead Follow-up",
    phone: f.lead?.phone || "",
    source: f.lead?.source || "Follow-up",
    type: f.lead?.type || "General",
    status: f.status === "done" ? "Completed" : "Pending",
    followUp: f.date ? new Date(f.date).toISOString().slice(0, 16) : "",
    notes: f.note || "",
    priority: "Normal",
  }));

  const combinedFollowups = [
    ...leadFollowups.filter((lf) => !apiRows.some((af) => af.id === lf.id)),
    ...apiRows,
  ];

  const overdue = combinedFollowups.filter((r) => day(r.followUp) < todayKey() && r.status !== "Completed");

  const allRows = combinedFollowups.map((row) => ({
    ...row,
    attempts: enriched.filter((call) => call.id === row.id || call.leadId === row.id).length,
  }));

  const overdueRows = allRows.filter((r) => day(r.followUp) < todayKey() && r.status !== "Completed");

  return (
    <div className="tcl-views">
      {message && (
        <div style={{
          padding: "10px 16px",
          background: message.startsWith("✅") ? "#ecfdf5" : "#fef2f2",
          border: `1px solid ${message.startsWith("✅") ? "#a7f3d0" : "#fecaca"}`,
          color: message.startsWith("✅") ? "#065f46" : "#991b1b",
          borderRadius: 8,
          marginBottom: 16,
          fontSize: "13px",
          fontWeight: 500,
        }}>
          {message}
        </div>
      )}

      <Stats
        items={[
          [
            "Today's Follow-ups",
            combinedFollowups.filter((r) => day(r.followUp) === todayKey() && r.status !== "Completed").length,
            Calendar,
            "purple",
          ],
          [
            "Tomorrow",
            combinedFollowups.filter((r) => day(r.followUp) === tomorrowKey && r.status !== "Completed").length,
            Calendar,
            "cyan",
          ],
          [
            "Upcoming",
            combinedFollowups.filter((r) => day(r.followUp) > todayKey() && r.status !== "Completed").length,
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
            <FollowupCalendar rows={combinedFollowups} can={can} />
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
                onCompleteFollowUp={handleCompleteFollowUp}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
