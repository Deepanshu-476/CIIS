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
  const displayPlace = resolvedPlace || (loadingPlace ? 'Fetching place...' : location.coordinates);

  return (
    <div style={{ display: "grid", gap: 3, marginTop: 3 }}>
      <a
        href={location.url}
        target="_blank"
        rel="noreferrer"
        style={{
          display: "inline-flex",
          alignItems: "flex-start",
          gap: 3,
          color: "#1d4ed8",
          textDecoration: "none",
          fontWeight: 600,
          lineHeight: 1.3
        }}
        title={`Open in Google Maps (${location.coordinates})`}
      >
        <span style={{ fontSize: "0.85rem", lineHeight: 1 }}>📍</span>
        <span style={{ textDecoration: "underline", wordBreak: "break-word" }}>{displayPlace}</span>
      </a>

      {distance != null && Number.isFinite(Number(distance)) ? (
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 3,
          fontSize: "0.72rem",
          fontWeight: 600,
          color: Number(distance) <= 100 ? "#15803d" : "#b45309",
          backgroundColor: Number(distance) <= 100 ? "#f0fdf4" : "#fffbeb",
          padding: "1px 5px",
          borderRadius: 4,
          border: `1px solid ${Number(distance) <= 100 ? "#bbf7d0" : "#fde68a"}`,
          width: "fit-content"
        }}>
          <span>📏</span>
          <span>
            {Number(distance) < 1000 ? `${Math.round(Number(distance))} m` : `${(Number(distance) / 1000).toFixed(2)} km`} from {branchName}
          </span>
        </div>
      ) : (
        <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>
          Branch distance: not configured
        </div>
      )}

      <div style={{ fontSize: "0.68rem", color: "#64748b" }}>
        ({location.coordinates})
        {location.accuracy != null && ` · ±${Math.round(location.accuracy)}m`}
      </div>
    </div>
  );
}

export function AttendancePunch({ record, direction, showTime = false }) {
  const label = direction === "in" ? "Clock in" : "Clock out";
  const rawLocation = record?.[`${direction}Location`];
  const location = attendanceLocation(rawLocation);
  const photo = attendancePhotoUrl(record?.[`${direction}SelfieUrl`], record?.attendancePhotoBaseUrl || axios.defaults.baseURL);
  const mode = attendanceModeLabel(record?.[`${direction}AttendanceMode`]);
  const time = showTime && attendanceReportTime(record?.[`${direction}Time`]);
  if (!location && !photo && !mode && !time) return null;

  const branchOfficeLoc = record?.user?.branch?.officeLocation || record?.user?.company?.officeLocation;
  const branchFallbackName = record?.user?.branch?.name || record?.user?.branchName || record?.user?.company?.companyName;

  return (
    <div style={{ display: "grid", justifyItems: "start", gap: 3, marginTop: 4, fontSize: "0.78rem", whiteSpace: "normal", overflowWrap: "anywhere" }}>
      {time && <strong>{label} · {time} IST</strong>}
      {mode && <span>{label} mode · {mode}</span>}
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
        <a href={photo} target="_blank" rel="noreferrer" style={{ marginTop: 2 }}>
          <img src={photo} alt={`${label} photo`} width={52} height={52} loading="lazy" referrerPolicy="no-referrer" style={{ objectFit: "cover", borderRadius: 6 }} />
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
    <>
      {mode && <div>Current attendance mode · {mode}</div>}
      <AttendancePunch record={record} direction="in" showTime />
      <AttendancePunch record={record} direction="out" showTime />
      <AttendanceBreaks record={record} />
    </>
  );
}
