import axios from "../../utils/axiosConfig";
import { attendanceBreakDetails, attendanceLocation, attendanceModeLabel, attendancePhotoUrl, attendanceReportTime } from "../../utils/attendanceExport";

export function AttendancePunch({ record, direction, showTime = false }) {
  const label = direction === "in" ? "Clock in" : "Clock out";
  const location = attendanceLocation(record?.[`${direction}Location`]);
  const photo = attendancePhotoUrl(record?.[`${direction}SelfieUrl`], record?.attendancePhotoBaseUrl || axios.defaults.baseURL);
  const mode = attendanceModeLabel(record?.[`${direction}AttendanceMode`]);
  const time = showTime && attendanceReportTime(record?.[`${direction}Time`]);
  if (!location && !photo && !mode && !time) return null;
  return (
    <div style={{ display: "grid", justifyItems: "start", gap: 4, marginTop: 6, fontSize: "0.78rem", whiteSpace: "normal", overflowWrap: "anywhere" }}>
      {time && <strong>{label} · {time} IST</strong>}
      {mode && <span>{label} mode · {mode}</span>}
      {location && <a href={location.url} target="_blank" rel="noreferrer">{label} location · {location.text}</a>}
      {photo && (
        <a href={photo} target="_blank" rel="noreferrer">
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
