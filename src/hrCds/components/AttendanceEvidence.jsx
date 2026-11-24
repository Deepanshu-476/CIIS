import React, { useState, useEffect } from "react";
import axios from "../../utils/axiosConfig";
import { attendanceBreakDetails, attendanceLocation, attendanceModeLabel, attendancePhotoUrl, attendanceReportTime } from "../../utils/attendanceExport";
import { getPlaceNameFromCoords, calculateDistanceMeters } from "../../utils/geocoding";

function PunchLocationDisplay({ rawLocation, location, label, branchOfficeLoc, branchFallbackName }) {
  const [resolvedPlace, setResolvedPlace] = useState(
    rawLocation?.placeName || rawLocation?.address || location?.placeName || location?.address || ''
  );
  const [loadingPlace, setLoadingPlace] = useState(
    !rawLocation?.placeName && !rawLocation?.address && !location?.placeName && !location?.address && Boolean(location?.latitude != null && location?.longitude != null)
  );

  useEffect(() => {
    const existing = rawLocation?.placeName || rawLocation?.address || location?.placeName || location?.address;
    if (existing) {
      setResolvedPlace(existing);
      setLoadingPlace(false);
      return;
    }
    if (location?.latitude != null && location?.longitude != null) {
      let isMounted = true;
      setLoadingPlace(true);
      getPlaceNameFromCoords(location.latitude, location.longitude)
        .then(name => {
          if (isMounted) {
            if (name) setResolvedPlace(name);
            setLoadingPlace(false);
          }
        })
        .catch(() => {
          if (isMounted) setLoadingPlace(false);
        });
      return () => { isMounted = false; };
    }
  }, [location?.latitude, location?.longitude, rawLocation?.placeName, rawLocation?.address, location?.placeName, location?.address]);

  let distance = location.distanceFromOfficeMeters;
  if (distance == null && branchOfficeLoc && branchOfficeLoc.latitude != null && branchOfficeLoc.longitude != null && location.latitude != null && location.longitude != null) {
    distance = calculateDistanceMeters(branchOfficeLoc.latitude, branchOfficeLoc.longitude, location.latitude, location.longitude);
  }

  const branchName = rawLocation?.branchName || location.branchName || branchFallbackName || 'Branch';
  const displayPlace = resolvedPlace || (loadingPlace ? 'Locating...' : location.coordinates || 'Location');

  const tooltipParts = [
    displayPlace,
    location.coordinates ? `Coordinates: ${location.coordinates}` : null,
    location.accuracy != null ? `Accuracy: ±${Math.round(location.accuracy)}m` : null,
    distance != null && Number.isFinite(Number(distance)) ? `Distance: ${Number(distance) < 1000 ? `${Math.round(Number(distance))}m` : `${(Number(distance) / 1000).toFixed(2)}km`} from ${branchName}` : null
  ].filter(Boolean).join('\n');

  const isNear = distance != null && Number.isFinite(Number(distance)) && Number(distance) <= 100;
  const distanceLabel = distance != null && Number.isFinite(Number(distance))
    ? (Number(distance) < 1000 ? `${Math.round(Number(distance))}m` : `${(Number(distance) / 1000).toFixed(1)}km`)
    : null;

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 3, maxWidth: "100%", lineHeight: 1.2 }}>
      <a
        href={location.url}
        target="_blank"
        rel="noreferrer"
        title={tooltipParts}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 3,
          padding: "1px 6px",
          background: "#eff6ff",
          border: "1px solid #bfdbfe",
          borderRadius: 4,
          color: "#1d4ed8",
          textDecoration: "none",
          fontSize: "0.72rem",
          fontWeight: 500,
          lineHeight: 1.2,
          maxWidth: "100%",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          cursor: "pointer"
        }}
      >
        <span style={{ fontSize: "0.74rem", flexShrink: 0 }}>📍</span>
        <span style={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          maxWidth: 160
        }}>
          {displayPlace}
        </span>
        {distanceLabel && (
          <span
            style={{
              fontSize: "0.65rem",
              fontWeight: 700,
              color: isNear ? "#15803d" : "#b45309",
              backgroundColor: isNear ? "#dcfce7" : "#fef3c7",
              padding: "0 3px",
              borderRadius: 3,
              marginLeft: 2,
              flexShrink: 0
            }}
          >
            {distanceLabel}
          </span>
        )}
      </a>
    </div>
  );
}

export function AttendancePunch({ record, direction, showTime = false }) {
  const label = direction === "in" ? "Clock in" : "Clock out";
  const rawLocation = record?.[`${direction}Location`];
  const location = attendanceLocation(rawLocation);
  const photo = attendancePhotoUrl(record?.[`${direction}SelfieUrl`], record?.attendancePhotoBaseUrl || axios.defaults.baseURL);
  const rawMode = record?.[`${direction}AttendanceMode`];
  const mode = attendanceModeLabel(rawMode);
  const time = showTime && attendanceReportTime(record?.[`${direction}Time`]);
  if (!location && !photo && !mode && !time) return null;

  const branchOfficeLoc = record?.user?.branch?.officeLocation || record?.user?.company?.officeLocation;
  const branchFallbackName = record?.user?.branch?.name || record?.user?.branchName || record?.user?.company?.companyName;

  // Don't show redundant "LOCATION" or "WEB" text pill when location badge is already shown
  const isRedundantMode = location && (rawMode === 'location' || rawMode === 'web' || !rawMode);

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 3, marginTop: 2, maxWidth: "100%", flexWrap: "nowrap" }}>
      {time && <strong style={{ fontSize: "0.75rem", whiteSpace: "nowrap" }}>{label} · {time}</strong>}
      {mode && !isRedundantMode && (
        <span
          title={`${label} mode: ${mode}`}
          style={{
            fontSize: "0.60rem",
            fontWeight: 600,
            color: "#475569",
            background: "#f1f5f9",
            border: "1px solid #cbd5e1",
            padding: "0 3px",
            borderRadius: 3,
            textTransform: "uppercase",
            whiteSpace: "nowrap",
            flexShrink: 0
          }}
        >
          {mode}
        </span>
      )}
      {location && (
        <PunchLocationDisplay
          rawLocation={rawLocation}
          location={location}
          label={label}
          branchOfficeLoc={branchOfficeLoc}
          branchFallbackName={branchFallbackName}
        />
      )}
      {photo && (
        <a href={photo} target="_blank" rel="noreferrer" title="View punch selfie" style={{ display: "inline-flex", alignItems: "center", flexShrink: 0 }}>
          <img src={photo} alt={`${label} photo`} width={20} height={20} loading="lazy" referrerPolicy="no-referrer" style={{ objectFit: "cover", borderRadius: 3, border: "1px solid #cbd5e1" }} />
        </a>
      )}
    </div>
  );
}

export function AttendanceBreaks({ record }) {
  const { punched, automatic, scheduled } = attendanceBreakDetails(record);
  if (!punched.length && !automatic.length && !scheduled.length) return null;
  return (
    <ul style={{ margin: "6px 0", paddingLeft: 18, fontSize: "0.8rem" }}>
      {punched.map((line, index) => <li key={`punch-${index}`}>{line}</li>)}
      {automatic.map((line, index) => <li key={`auto-${index}`}>Auto-deducted · {line}</li>)}
      {scheduled.map((line, index) => <li key={`schedule-${index}`}>{record.scheduledBreaksFromCurrentPolicy ? 'Current fixed schedule' : 'Fixed schedule'} · {line}</li>)}
    </ul>
  );
}

export function AttendancePunchDetails({ record }) {
  const mode = attendanceModeLabel(record.attendanceMode);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px", padding: "4px 0" }}>
      {mode && <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Attendance mode · <strong>{mode}</strong></div>}
      <AttendancePunch record={record} direction="in" showTime />
      <AttendancePunch record={record} direction="out" showTime />
      <AttendanceBreaks record={record} />
    </div>
  );
}
