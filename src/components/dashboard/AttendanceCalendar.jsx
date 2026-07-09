import React from 'react';
import { FiCalendar, FiChevronLeft, FiChevronRight, FiClock } from 'react-icons/fi';

const CalendarLoader = () => (
  <div className="calendar-loader">
    <div className="calendar-spinner"></div>
    <p>Loading calendar data...</p>
  </div>
);

const AttendanceCalendar = ({
  loading,
  holidaysLoading,
  calendarMonth,
  calendarYear,
  monthNames,
  handlePrevMonth,
  resetToCurrentMonth,
  handleNextMonth,
  isMonthBeforeJoin,
  formattedJoinDate,
  calendarDays,
  getDayStatus,
  getDayIcon,
  isToday,
  holidayTitles,
  daysOfWeek,
  isBeforeJoinDate
}) => {
  if (loading.attendance || holidaysLoading) {
    return <CalendarLoader />;
  }

  return (
    <div className="dashboard-calendar-card" style={{ flex: 1, minWidth: '320px' }}>
      <div className="calendar-header">
        <div className="calendar-title-section">
          <div className="calendar-icon-container"><FiCalendar className="calendar-icon" /></div>
          <div>
            <h2 className="calendar-title">{monthNames[calendarMonth]} {calendarYear}</h2>
            <p className="calendar-subtitle">Attendance Calendar</p>
          </div>
        </div>
        <div className="calendar-controls">
          <button onClick={handlePrevMonth} className="calendar-nav-btn" disabled={isMonthBeforeJoin(calendarYear, calendarMonth)}>
            <FiChevronLeft className="nav-icon" />
          </button>
          <button onClick={resetToCurrentMonth} className="calendar-today-btn">Today</button>
          <button onClick={handleNextMonth} className="calendar-nav-btn">
            <FiChevronRight className="nav-icon" />
          </button>
        </div>
      </div>

      {isMonthBeforeJoin(calendarYear, calendarMonth) && (
        <div className="calendar-before-join-message">
          <FiClock size={16} />
          <span>You joined on {formattedJoinDate}. No attendance records before this date.</span>
        </div>
      )}

      <div className="calendar-body">
        <div className="calendar-week-header">
          {daysOfWeek.map(day => <div key={day} className="calendar-day-header">{day}</div>)}
        </div>
        <div className="calendar-grid">
          {calendarDays.map((week, weekIndex) => (
            <div key={weekIndex} className="calendar-week">
              {week.map((day, dayIndex) => (
                <div key={dayIndex} className="calendar-day-wrapper">
                  {day ? (
                    <div className="calendar-day-container">
                      <div
                        className={`calendar-day ${getDayStatus(day) || 'empty'} ${isToday(day) ? 'day-today' : ''}`}
                        title={
                          getDayStatus(day) === 'holiday' 
                            ? `🎉 Holiday: ${holidayTitles[`${calendarYear}-${calendarMonth}-${day}`] || 'Holiday'}`
                            : isBeforeJoinDate(new Date(calendarYear, calendarMonth, day)) 
                              ? 'Before joining date' 
                              : getDayStatus(day)?.charAt(0).toUpperCase() + getDayStatus(day)?.slice(1) || 'No Record'
                        }
                        data-holiday-title={getDayStatus(day) === 'holiday' ? holidayTitles[`${calendarYear}-${calendarMonth}-${day}`] : ''}
                      >
                        <span className="day-number">{day}</span>
                        {getDayIcon(day) && (
                          <span className={`day-status-icon ${getDayStatus(day) === 'holiday' ? 'holiday-icon' : ''}`}>
                            {getDayIcon(day)}
                          </span>
                        )}
                      </div>
                      {isToday(day) && <div className="today-indicator"></div>}
                    </div>
                  ) : <div className="calendar-empty-day"></div>}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="calendar-legend">
        <div className="legend-item"><div className="legend-color color-present"></div><span>Present</span></div>
        <div className="legend-item"><div className="legend-color color-late"></div><span>Late</span></div>
        <div className="legend-item"><div className="legend-color color-halfday"></div><span>Half Day</span></div>
        <div className="legend-item"><div className="legend-color color-leave"></div><span>Leave</span></div>
        <div className="legend-item"><div className="legend-color color-absent"></div><span>Absent</span></div>
        <div className="legend-item"><div className="legend-color color-weekend"></div><span>Weekend</span></div>
        <div className="legend-item"><div className="legend-color color-holiday"></div><span>Holiday 🎉</span></div>
        <div className="legend-item"><div className="legend-color color-before-join"></div><span>Before Joining</span></div>
      </div>
    </div>
  );
};

export default AttendanceCalendar;
