import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {jsPDF} from 'jspdf';
import {autoTable} from 'jspdf-autotable';
import {attendanceExportValues, attendanceExportSummary, attendanceReportRows, attendanceReportFields, attendanceReportImage, attendanceCsvCell, formatAttendanceWorksheet, resolveScheduledAttendanceStatus, fetchAttendanceDay} from '../src/utils/attendanceExport.js';

const apiBase = 'https://attendance.example.com/api';
const records = [
  {
    status: 'PRESENT', hasOvertimeApproved: true, overTime: '02:15:00', displayDate: '2026-11-12',
    user: {name: 'A "Kumar"', email: 'a@example.com'}, isWeeklyOff: true,
    attendanceMode: 'both', inAttendanceMode: 'both', outAttendanceMode: 'both',
    inTime: '2026-11-12T03:30:00Z', outTime: '2026-11-12T12:30:00Z', totalTime: '08:15:00', breakMinutes: 45,
    breaks: [{start: '2026-11-12T08:30:00Z', end: '2026-11-12T08:45:00Z', label: 'Tea', minutes: 15}],
    autoBreaks: [{start: '2026-11-12T07:30:00Z', end: '2026-11-12T08:00:00Z', label: 'Lunch', minutes: 30}],
    inSelfieUrl: '/api/uploads/tasks/in.jpg', outSelfieUrl: '/api/uploads/tasks/out.jpg',
    notes: 'Long attendance note. '.repeat(20),
    inLocation: {latitude: 0, longitude: 0, accuracy: 12, distanceFromOfficeMeters: 0},
    outLocation: {latitude: 28.7, longitude: 77.1},
  },
  {status: 'WEEKEND', displayDate: '2026-11-12', user: {name: 'B'}},
  {status: 'PRESENT', hasOvertimeApproved: true, isFullDayOt: true, displayDate: '2026-11-12', user: {name: 'C'}},
];

test('approved hourly and full-day OT keep their duration and attendance label', () => {
  assert.equal(attendanceExportValues(records[0]).status, 'PRESENT + OVERTIME');
  assert.equal(attendanceExportValues(records[0]).overtime, '02:15:00');
  assert.equal(attendanceExportValues(records[2]).overtime, 'Full Day');
  assert.equal(attendanceExportValues({status: 'LATE', overTime: '02:00:00'}).hasOvertime, false);
  assert.equal(attendanceExportValues({status: 'LATE', overTime: '02:00:00'}).overtime, '00:00:00');
});

test('weekly off aliases and report totals follow the exported rows', () => {
  for (const status of ['WEEKEND', 'WEEKLY OFF', 'Week Off']) assert.equal(attendanceExportValues({status}).status, 'WEEKLY OFF');
  assert.equal(attendanceExportSummary(records).weekend, 2);
  assert.equal(attendanceExportSummary(records).overtime, 2);
  assert.equal(attendanceExportSummary(records.slice(1, 2)).total, 1);
  assert.equal(attendanceExportSummary(records.slice(1, 2)).overtime, 0);
});

test('schedule covers missing records and swaps without erasing work, holidays or leave', () => {
  const schedule = {weeklyOffUserIds: ['b']};
  assert.equal(resolveScheduledAttendanceStatus(null, 'b', schedule), 'weekend');
  assert.equal(resolveScheduledAttendanceStatus({status: 'WEEKEND'}, 'a', schedule), 'absent');
  for (const status of ['HOLIDAY', 'LEAVE', 'PRESENT']) {
    assert.equal(resolveScheduledAttendanceStatus({status}, 'b', schedule), status.toLowerCase());
  }
  assert.equal(resolveScheduledAttendanceStatus({status: 'LATE', inTime: '09:00'}, 'b', schedule), 'late');
  assert.equal(resolveScheduledAttendanceStatus({status: 'WEEKEND'}, 'b', {}), 'weekend');
});

test('all attendance pages load before constructing absent rows', async () => {
  const pages = [];
  const result = await fetchAttendanceDay({get: async (_, {params}) => {
    pages.push(params.page);
    return {data: {data: [{id: params.page}], weeklyOffUserIds: ['b'], pagination: {totalPages: 3}}};
  }}, '2026-11-12');
  assert.deepEqual(pages, [1, 2, 3]);
  assert.equal(result.data.length, 3);
  assert.deepEqual(result.weeklyOffUserIds, ['b']);
  await assert.rejects(fetchAttendanceDay({get: async () => {throw new Error('offline');}}, '2026-11-12'), /offline/);
});

const page = fs.readFileSync(new URL('../src/hrCds/pages/hr/EmppAttendence.jsx', import.meta.url), 'utf8');
function exportHarness(name, nextName) {
  const captured = {errors: [], links: []};
  const noop = () => {};
  const document = {createElement: () => ({click: noop, remove: noop}), body: {appendChild: noop}};
  class Doc {
    constructor(options) {
      captured.pdfOptions = options;
      this.internal = {pageSize: {getWidth: () => 1190, getHeight: () => 842}, getNumberOfPages: () => 1};
    }
  }
  for (const method of ['setFillColor', 'rect', 'setTextColor', 'setFont', 'setFontSize', 'text', 'setDrawColor', 'roundedRect', 'line', 'save']) Doc.prototype[method] = noop;
  Doc.prototype.output = () => new Blob(['pdf']);
  Doc.prototype.link = (x, y, width, height, options) => captured.links.push(options.url);
  const sandbox = {
    filteredRecords: name === 'exportToImage' ? Array.from({length: 24}, () => records).flat() : records, exportStats: attendanceExportSummary(records),
    attendanceExportSummary, attendanceReportRows, attendanceReportFields, attendanceReportImage, attendanceCsvCell, formatAttendanceWorksheet,
    axios: {defaults: {baseURL: apiBase}}, useMemo: fn => fn(), setExportMenuOpen: noop, setLoading: noop,
    showSnackbar: (message, type) => {if (type === 'error') captured.errors.push(message);},
    selectedDepartment: 'all', selectedDate: '2026-11-12', dateRangeMode: false, statusFilter: 'all',
    getStatusFilterLabel: () => 'All Status', formatExportDate: value => value,
    formatTime: value => value || '-', getShiftLabel: () => 'Day', formatBreakLabel: () => '0m',
    formatDate: value => value, getClockOutModeLabel: () => '-', getDisplayEmployeeInfo: user => ({name: user.name, email: user.email || '-'}), departmentsMap: {},
    loadPdfModules: async () => ({jsPDF: Doc, autoTable: (_, options) => {captured.table = options;}}),
    loadXlsx: async () => ({utils: {json_to_sheet: data => {captured.excel = data; return {};}, book_new: () => ({}), book_append_sheet: noop, encode_cell: () => 'A2'}, writeFile: noop}),
    document, window: {open: () => null}, Blob, URL: {createObjectURL: blob => {captured.blob = blob; return 'blob:report';}, revokeObjectURL: noop},
    setTimeout: noop, console,
  };
  const start = page.indexOf('  const exportStats =');
  const end = page.indexOf(`  const ${nextName} =`, start);
  const run = vm.runInNewContext(`${page.slice(start, end)}\n${name}`, sandbox);
  return {run, captured};
}

test('PDF includes OT duration and approval columns inside the printable width', async () => {
  const {run, captured} = exportHarness('exportToPDF', 'exportToImage');
  await run();
  assert.deepEqual(captured.errors, []);
  const table = captured.table;
  const column = header => table.head[0].indexOf(header);
  assert.equal(table.body[0][column('Overtime')], '02:15:00');
  assert.equal(table.body[2][column('Overtime')], 'Full Day');
  assert.equal(table.body[1][column('Status')], 'WEEKLY OFF');
  assert.equal(table.body[0][column('Weekly Off')], 'Yes');
  assert.match(table.body[0][column('Punched Breaks (IST)')], /14:00:00 – 14:15:00/);
  assert.equal(table.body[0][column('Check In Photo')], 'https://attendance.example.com/api/uploads/tasks/in.jpg');
  assert.equal(table.horizontalPageBreak, true);
  assert.equal(Array.from(table.horizontalPageBreakRepeat).join(','), '0,1,2');
  const doc = new jsPDF(captured.pdfOptions);
  const printed = new Set();
  const {didDrawPage, ...options} = table;
  autoTable(doc, {
    ...options,
    didDrawCell: cellData => {
      const {cell, column, section} = cellData;
      assert.ok(cell.x + cell.width <= doc.internal.pageSize.getWidth() - 27.99);
      if (section === 'head') printed.add(column.index);
      options.didDrawCell(cellData);
    },
  });
  assert.equal(printed.size, table.head[0].length);
  assert.ok(captured.links.includes('https://attendance.example.com/api/uploads/tasks/in.jpg'));
  assert.match(doc.output(), /^%PDF/);
});

test('image contains the full width of the report and preserves attendance details', async () => {
  const {run, captured} = exportHarness('exportToImage', 'exportToExcel');
  await run();
  assert.deepEqual(captured.errors, []);
  const svg = await captured.blob.text();
  for (const value of ['Overtime', 'OT Approval', 'WEEKLY OFF', '02:15:00', 'Full Day', 'Auto-Deducted Breaks (IST)', 'Check Out Photo']) {
    assert.ok(svg.includes(value), value);
  }
  const width = Number(svg.match(/viewBox="0 0 (\d+)/)[1]);
  assert.ok([...svg.matchAll(/<rect x="(\d+)" y="\d+" width="(\d+)"/g)]
    .every(([, x, cellWidth]) => Number(x) + Number(cellWidth) <= width));
});

test('Excel exports OT and weekly off with matching summary counts', async () => {
  const {run, captured} = exportHarness('exportToExcel', 'exportToCSV');
  await run();
  assert.equal(captured.excel[0].Overtime, '02:15:00');
  assert.equal(captured.excel[2].Overtime, 'Full Day');
  assert.equal(captured.excel[1].Status, 'WEEKLY OFF');
  assert.equal(captured.excel.find(row => row.Date === 'Weekly Off').Name, 2);
  assert.equal(captured.excel[0]['Hours Worked'], '08:15:00');
  assert.match(captured.excel[0]['Check In Location'], /Office distance 0 m/);
  assert.equal(captured.excel.find(row => row.Date === 'Overtime Records').Name, 2);
});

test('CSV includes OT, weekly off and valid escaped employee names', async () => {
  const {run, captured} = exportHarness('exportToCSV', 'normalizeRole');
  run();
  const csv = await captured.blob.text();
  assert.match(csv, /Overtime,OT Approval/);
  assert.match(csv, /"02:15:00","Approved"/);
  assert.match(csv, /"WEEKLY OFF"/);
  assert.match(csv, /"A ""Kumar"""/);
  assert.match(csv, /"Weekly Off","2"/);
});
