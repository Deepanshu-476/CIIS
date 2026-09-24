import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Phone, Clock, Hourglass, PhoneCall, ArrowRight } from "lucide-react";
import {
  AreaChart,
  Area,
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
import { localDateTime, isTerminal, countCallOutcomes } from './liveData';


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
  const [timeframe, setTimeframe] = useState("7d");
  const daysCount = timeframe === "30d" ? 30 : 7;

  const trendChartData = useMemo(() => {
    return Array.from({ length: daysCount }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (daysCount - 1) + index);
      const dateStr = localDateTime(date).slice(0, 10);
      const rows = enriched.filter((call) => {
        if (!call?.date) return false;
        if (typeof call.date === "string") {
          return call.date.startsWith(dateStr) || localDateTime(call.date).startsWith(dateStr);
        }
        return localDateTime(call.date).startsWith(dateStr);
      });
      const connected = rows.filter((call) =>
        ['Connected', 'Interested', 'Not Interested', 'Follow-up', 'Need Callback', 'Call Later', 'Converted', 'Call Closed'].includes(call.outcome)
      ).length;
      return {
        day: daysCount <= 7
          ? date.toLocaleDateString('en-GB', { weekday: 'short' })
          : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        date: dateStr,
        calls: rows.length,
        connected,
      };
    });
  }, [enriched, daysCount]);

  const periodStats = useMemo(() => {
    const totalCalls = trendChartData.reduce((acc, d) => acc + d.calls, 0);
    const totalConnected = trendChartData.reduce((acc, d) => acc + d.connected, 0);
    const connectRate = totalCalls > 0 ? Math.round((totalConnected / totalCalls) * 100) : 0;
    const peak = trendChartData.reduce((max, d) => (d.calls > max.calls ? d : max), trendChartData[0] || { calls: 0, day: '—' });
    return {
      totalCalls,
      totalConnected,
      connectRate,
      peakDay: peak.calls > 0 ? `${peak.day} (${peak.calls})` : '—',
    };
  }, [trendChartData]);

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

  const metrics = useMemo(() => [
    {
      label: "Total Calls",
      value: enriched.length,
      Icon: Phone,
      tone: "purple",
      changeText: enriched.length > 0 ? "Recorded calls" : "No calls recorded",
      changeTone: enriched.length > 0 ? "green" : "gray"
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
      changeText: today.length > 0 ? "Recorded today" : "No calls today",
      changeTone: today.length > 0 ? "green" : "gray"
    },
    {
      label: "Pending",
      value: pending.length,
      Icon: Hourglass,
      tone: "pink",
      changeText: pending.length > 0 ? "Awaiting first call" : "Queue clear",
      changeTone: pending.length > 0 ? "pink" : "green"
    }
  ], [enriched, assigned, today, pending]);

  const outcomeCounts = useMemo(() => countCallOutcomes(enriched), [enriched]);

  const totalOutcomeCalls = useMemo(() => {
    return Object.values(outcomeCounts).reduce((a, b) => a + b, 0);
  }, [outcomeCounts]);

  const outcomeData = useMemo(() => [
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
  }), [outcomeCounts, totalOutcomeCalls]);

  const pieChartData = useMemo(() => outcomeData
    .filter((d) => d.count > 0)
    .map((d) => ({ name: d.name, value: d.count, color: d.color })), [outcomeData]);

  const primaryOutcome = outcomeData.reduce((largest, item) => item.count > largest.count ? item : largest, outcomeData[0]);
  const primaryRate = totalOutcomeCalls > 0 ? Math.round((primaryOutcome.count / totalOutcomeCalls) * 100) : 0;

  return (
    <div className="tcd-dashboard">
      <Metrics items={metrics} />

      <div className="haps-charts-grid">
        {/* Call Trends Analytics Card */}
        {/* Call Trends Analytics Card */}
        <Panel
          title="Call Trends"
          subtitle="Daily outbound calls vs connected conversations"
          action={
            <div className="modern-timeframe-tabs">
              <button
                type="button"
                className={`timeframe-tab ${timeframe === "7d" ? "active" : ""}`}
                onClick={() => setTimeframe("7d")}
              >
                7 Days
              </button>
              <button
                type="button"
                className={`timeframe-tab ${timeframe === "30d" ? "active" : ""}`}
                onClick={() => setTimeframe("30d")}
              >
                30 Days
              </button>
            </div>
          }
        >
          <div className="haps-linechart-body">
            {/* KPI Summary Strip */}
            <div className="tc-trend-kpis">
              <div className="tc-trend-kpi-item">
                <span className="tc-trend-kpi-dot purple" />
                <span className="tc-trend-kpi-val">{periodStats.totalCalls}</span>
                <span className="tc-trend-kpi-lbl">Total Calls</span>
              </div>
              <div className="tc-trend-kpi-item">
                <span className="tc-trend-kpi-dot teal" />
                <span className="tc-trend-kpi-val">{periodStats.totalConnected}</span>
                <span className="tc-trend-kpi-lbl">Connected</span>
              </div>
              <div className="tc-trend-kpi-item">
                <span className="tc-trend-kpi-dot emerald" />
                <span className="tc-trend-kpi-val">{periodStats.connectRate}%</span>
                <span className="tc-trend-kpi-lbl">Connect Rate</span>
              </div>
              <div className="tc-trend-kpi-item">
                <span className="tc-trend-kpi-dot amber" />
                <span className="tc-trend-kpi-val">{periodStats.peakDay}</span>
                <span className="tc-trend-kpi-lbl">Peak Day</span>
              </div>
            </div>

            {periodStats.totalCalls > 0 && (
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
            )}

            {periodStats.totalCalls === 0 ? (
              <div className="tc-trend-empty-state">
                <div className="tc-trend-empty-icon-wrap">
                  <PhoneCall size={26} className="tc-trend-empty-icon" />
                </div>
                <h4 className="tc-trend-empty-title">No Call Activity Recorded</h4>
                <p className="tc-trend-empty-desc">
                  No outbound or connected calls were logged in this {timeframe === "7d" ? "7-day" : "30-day"} timeframe. Call volume and connection trends will appear here as soon as calls are made.
                </p>
                <div className="tc-trend-empty-actions">
                  {timeframe === "7d" && (
                    <button
                      type="button"
                      className="tc-trend-empty-btn outline"
                      onClick={() => setTimeframe("30d")}
                    >
                      Check 30 Days
                    </button>
                  )}
                  <Link to={`${BASE}/assigned-calls`} className="tc-trend-empty-btn primary">
                    Start Calling Leads
                    <ArrowRight size={13} style={{ marginLeft: 6 }} />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="haps-chart-wrapper">
                <ResponsiveContainer
                  width="100%"
                  height={235}
                  minWidth={0}
                  initialDimension={{ width: 600, height: 235 }}
                >
                  <AreaChart
                    data={trendChartData}
                    margin={{ top: 12, right: 20, left: -15, bottom: 5 }}
                  >
                    <defs>
                      <linearGradient id="callsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6c5ffc" stopOpacity={0.28} />
                        <stop offset="95%" stopColor="#6c5ffc" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="connGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#05c3fb" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#05c3fb" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eaedf1" vertical={false} horizontal={true} />
                    <XAxis
                      dataKey="day"
                      stroke="#8c98a9"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: "#eaedf1" }}
                      dy={6}
                      interval={daysCount > 7 ? 4 : 0}
                    />
                    <YAxis
                      stroke="#8c98a9"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      domain={[0, (dataMax) => Math.max(4, Math.ceil(dataMax * 1.25))]}
                      allowDecimals={false}
                    />
                    <Tooltip
                      content={<CustomChartTooltip />}
                      cursor={{ stroke: "#cbd5e1", strokeWidth: 1, strokeDasharray: "3 3" }}
                    />
                    {activeSeries.calls && (
                      <Area
                        type="monotone"
                        dataKey="calls"
                        name="Calls Made"
                        stroke="#6c5ffc"
                        strokeWidth={2.5}
                        fill="url(#callsGradient)"
                        dot={{ r: 3.5, fill: "#ffffff", stroke: "#6c5ffc", strokeWidth: 2 }}
                        activeDot={{ r: 5.5, fill: "#6c5ffc", stroke: "#ffffff", strokeWidth: 2.5 }}
                      />
                    )}
                    {activeSeries.connected && (
                      <Area
                        type="monotone"
                        dataKey="connected"
                        name="Connected"
                        stroke="#05c3fb"
                        strokeWidth={2.5}
                        fill="url(#connGradient)"
                        dot={{ r: 3.5, fill: "#ffffff", stroke: "#05c3fb", strokeWidth: 2 }}
                        activeDot={{ r: 5.5, fill: "#05c3fb", stroke: "#ffffff", strokeWidth: 2.5 }}
                      />
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
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
                    <span>{item.pct}</span>
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
