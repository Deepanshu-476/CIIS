import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Phone, Clock, Hourglass } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { TELECALLER_BASE as BASE } from "./telecallerPages";
import { Panel, Metrics } from "./DashboardComponents";
import { DataTable } from "./CallComponents";
import { useTelecaller } from "./useTelecaller";
import { localDateTime, isTerminal } from './liveData';


function CustomChartTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const calls = payload.find((p) => p.dataKey === "calls")?.value || 0;
    const connected = payload.find((p) => p.dataKey === "connected")?.value || 0;
    const rate = calls > 0 ? Math.round((connected / calls) * 100) : 0;

    return (
      <div className="modern-chart-tooltip">
        <div className="tooltip-header">{label} Call Analytics</div>
        <div className="tooltip-row">
          <span className="tooltip-dot purple" />
          <span className="tooltip-label">Calls Made:</span>
          <span className="tooltip-value">{calls}</span>
        </div>
        <div className="tooltip-row">
          <span className="tooltip-dot teal" />
          <span className="tooltip-label">Connected:</span>
          <span className="tooltip-value">{connected}</span>
        </div>
        <div className="tooltip-footer">
          <span>Success Rate:</span>
          <span className="tooltip-badge">{rate}%</span>
        </div>
      </div>
    );
  }
  return null;
}

export default function Dashboard() {
  const { calls, enriched, assigned, today, pending, can } = useTelecaller();
  const trendChartData = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(); date.setDate(date.getDate() - 6 + index);
    const rows = enriched.filter(call => call.date.startsWith(localDateTime(date).slice(0, 10)));
    return { day: date.toLocaleDateString('en-GB', { weekday: 'short' }), calls: rows.length, connected: rows.filter(call => ['Connected', 'Interested', 'Not Interested', 'Follow-up', 'Need Callback', 'Call Later', 'Converted', 'Call Closed'].includes(call.outcome)).length };
  });
  const [activeSeries, setActiveSeries] = useState({ calls: true, connected: true });

  const toggleSeries = (key) => {
    setActiveSeries((prev) => {
      if (prev.calls && prev.connected) {
        return { calls: key === "calls", connected: key === "connected" };
      }
      if (prev[key]) {
        return { calls: true, connected: true };
      }
      return { ...prev, [key]: true };
    });
  };

  const metrics = [
    {
      label: "Total Calls",
      value: enriched.length,
      Icon: Phone,
      tone: "purple",
      changeText: "Recorded calls",
      changeTone: "green"
    },
    {
      label: "In Queue",
      value: assigned.filter(lead => !isTerminal(lead)).length,
      Icon: Clock,
      tone: "orange",
      changeText: "Active leads",
      changeTone: "pink"
    },
    {
      label: "Today's Calls",
      value: today.length,
      Icon: Phone,
      tone: "teal",
      changeText: "Recorded today",
      changeTone: "green"
    },
    {
      label: "Pending",
      value: pending.length,
      Icon: Hourglass,
      tone: "pink",
      changeText: "Awaiting first call",
      changeTone: "pink"
    }
  ];

  const outcomeCounts = useMemo(() => {
    const counts = { Converted: 0, Connected: 0, Interested: 0, "Not Interested": 0, "Need Callback": 0, Other: 0 };
    (enriched || []).forEach((c) => {
      const outcome = c.outcome || "Converted";
      if (counts[outcome] !== undefined) {
        counts[outcome]++;
      } else if (outcome.includes("Follow")) {
        counts["Need Callback"]++;
      } else {
        counts.Other++;
      }
    });
    return counts;
  }, [enriched]);

  const totalOutcomeCalls = useMemo(() => {
    return Object.values(outcomeCounts).reduce((a, b) => a + b, 0);
  }, [outcomeCounts]);

  const outcomeData = [
    { name: 'Other', count: outcomeCounts.Other, color: '#64748b' },
    { name: "Converted", count: outcomeCounts.Converted, color: "#14b8a6" },
    { name: "Connected", count: outcomeCounts.Connected, color: "#6366f1" },
    { name: "Interested", count: outcomeCounts.Interested, color: "#f43f5e" },
    { name: "Not Interested", count: outcomeCounts["Not Interested"], color: "#f59e0b" },
    { name: "Need Callback", count: outcomeCounts["Need Callback"], color: "#06b6d4" }
  ].map((item) => {
    const pctVal = totalOutcomeCalls > 0 ? (item.count / totalOutcomeCalls) * 100 : 0;
    return {
      ...item,
      pct: `${pctVal.toFixed(1)}% of calls`,
      barWidth: Math.max(pctVal, item.count > 0 ? 6 : 0)
    };
  });

  const pieChartData = outcomeData
    .filter((d) => d.count > 0)
    .map((d) => ({ name: d.name, value: d.count, color: d.color }));

  const primaryOutcome = outcomeData.find((d) => d.count > 0) || outcomeData[0];
  const primaryRate = totalOutcomeCalls > 0 ? Math.round((primaryOutcome.count / totalOutcomeCalls) * 100) : 0;

  return (
    <div className="tcd-dashboard">
      <Metrics items={metrics} />

      <div className="haps-charts-grid">
        {/* Call Trends Analytics Card */}
        <Panel title="Call Trends">
          <div className="haps-linechart-body">
            <div className="haps-chart-legend-center">
              <span
                className={`haps-legend-item ${!activeSeries.calls ? "dimmed" : ""}`}
                onClick={() => toggleSeries("calls")}
                title="Click to toggle Calls Made"
              >
                <span className="haps-legend-box calls-made" />
                <span className="haps-legend-text">Calls Made</span>
              </span>
              <span
                className={`haps-legend-item ${!activeSeries.connected ? "dimmed" : ""}`}
                onClick={() => toggleSeries("connected")}
                title="Click to toggle Connected"
              >
                <span className="haps-legend-box connected" />
                <span className="haps-legend-text">Connected</span>
              </span>
            </div>
            <ResponsiveContainer width="100%" height={235}>
              <LineChart
                data={trendChartData}
                margin={{ top: 12, right: 20, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#eaedf1" vertical={true} horizontal={true} />
                <XAxis
                  dataKey="day"
                  stroke="#8c98a9"
                  fontSize={11.5}
                  tickLine={false}
                  axisLine={{ stroke: "#eaedf1" }}
                  dy={6}
                />
                <YAxis
                  stroke="#8c98a9"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 40]}
                  ticks={[0, 10, 20, 30, 40]}
                />
                <Tooltip
                  content={<CustomChartTooltip />}
                  cursor={{ stroke: "#cbd5e1", strokeWidth: 1, strokeDasharray: "3 3" }}
                />
                {activeSeries.calls && (
                  <Line
                    type="monotone"
                    dataKey="calls"
                    stroke="#6c5ffc"
                    strokeWidth={2.5}
                    dot={{ r: 3.5, fill: "#ffffff", stroke: "#6c5ffc", strokeWidth: 2 }}
                    activeDot={{ r: 5.5, fill: "#6c5ffc", stroke: "#ffffff", strokeWidth: 2.5 }}
                  />
                )}
                {activeSeries.connected && (
                  <Line
                    type="monotone"
                    dataKey="connected"
                    stroke="#05c3fb"
                    strokeWidth={2.5}
                    dot={{ r: 3.5, fill: "#ffffff", stroke: "#05c3fb", strokeWidth: 2 }}
                    activeDot={{ r: 5.5, fill: "#05c3fb", stroke: "#ffffff", strokeWidth: 2.5 }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        {/* Call Outcomes Card */}
        <Panel title="Call Outcomes">
          <div className="haps-outcomes-body">
            {/* Center Label Donut */}
            <div className="haps-donut-col">
              <div className="donut-relative-wrapper">
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={52}
                      outerRadius={72}
                      strokeWidth={0}
                    >
                      {pieChartData.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={entry.color || "#14b8a6"} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "#1e293b",
                        color: "#ffffff",
                        borderRadius: 4,
                        fontSize: 11,
                        border: "none",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)"
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="donut-center-content">
                  <span className="donut-center-rate">{primaryRate}%</span>
                  <span className="donut-center-sub">{primaryOutcome.name}</span>
                </div>
              </div>
            </div>

            {/* Outcome List with Progress Lines */}
            <div className="modern-outcomes-list">
              {outcomeData.map((item) => (
                <div className="modern-outcome-item" key={item.name}>
                  <div className="outcome-item-top">
                    <span className="outcome-item-dot" style={{ backgroundColor: item.color }} />
                    <span className="outcome-item-name">{item.name}</span>
                    <span className="outcome-item-count">{item.count}</span>
                  </div>
                  <div className="outcome-item-progress-track">
                    <div
                      className="outcome-item-progress-fill"
                      style={{
                        width: `${item.barWidth}%`,
                        backgroundColor: item.color
                      }}
                    />
                  </div>
                  <div className="outcome-item-bottom">
                    <span>{item.pct} of calls</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </div>

      <DataTable
        rows={enriched}
        title="Recent Calls"
        can={can}
        showViewAll={true}
      />
    </div>
  );
}
