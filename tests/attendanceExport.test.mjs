import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {attendanceExportValues, attendanceExportSummary, resolveScheduledAttendanceStatus, fetchAttendanceDay} from '../src/utils/attendanceExport.js';

const records = [
  {status: 'PRESENT', hasOvertimeApproved: true, overTime: '02:15:00', displayDate: '2026-11-12', user: {name: 'A "Kumar"', email: 'a@example.com'}},
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
  assert.equal(attendanceExportSummary(records).weekend, 1);
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
  const captured = {text: [], errors: []};
  const noop = () => {};
  const context = new Proxy({measureText: value => ({width: String(value).length * 6}),
    fillText: (...args) => captured.text.push(args)}, {get: (obj, key) => obj[key] || noop});
  const document = {createElement: tag => tag === 'canvas' ? {
    getContext: () => context, toBlob: callback => callback(new Blob(['image'])),
  } : {style: {}, click: noop, setAttribute: noop}, body: {appendChild: noop, removeChild: noop}};
  class Doc {
    constructor(options) {
      captured.pdfOptions = options;
      this.internal = {pageSize: {getWidth: () => 1190, getHeight: () => 842}, getNumberOfPages: () => 1};
    }
  }
  for (const method of ['setFillColor', 'rect', 'setTextColor', 'setFont', 'setFontSize', 'text', 'setDrawColor', 'roundedRect', 'line', 'save']) Doc.prototype[method] = noop;
  Doc.prototype.output = () => new Blob(['pdf']);
  const sandbox = {
    filteredRecords: records, exportStats: attendanceExportSummary(records),
    attendanceExportValues, setExportMenuOpen: noop, setLoading: noop,
    showSnackbar: (message, type) => {if (type === 'error') captured.errors.push(message);},
    selectedDepartment: 'all', selectedDate: '2026-11-12', dateRangeMode: false, statusFilter: 'all',
    getStatusFilterLabel: () => 'All Status', formatExportDate: value => value,
    formatTime: value => value || '-', getShiftLabel: () => 'Day', formatBreakLabel: () => '0m',
    formatDate: value => value, getClockOutModeLabel: () => '-', getDisplayEmployeeInfo: user => ({name: user.name, email: user.email || '-'}), departmentsMap: {},
    loadPdfModules: async () => ({jsPDF: Doc, autoTable: (_, options) => {captured.table = options;}}),
    loadXlsx: async () => ({utils: {json_to_sheet: data => {captured.excel = data; return {};}, book_new: () => ({}), book_append_sheet: noop}, writeFile: noop}),
    document, window: {open: () => null}, Blob, URL: {createObjectURL: blob => {captured.blob = blob; return 'blob:report';}, revokeObjectURL: noop},
    setTimeout: noop, console,
  };
  const start = page.indexOf(`  const ${name} =`);
  const end = page.indexOf(`  const ${nextName} =`, start);
  const run = vm.runInNewContext(`${page.slice(start, end)}\n${name}`, sandbox);
  return {run, captured};
}

test('PDF includes OT duration and approval columns inside the printable width', async () => {
  const {run, captured} = exportHarness('exportToPDF', 'exportToImage');
  await run();
  assert.deepEqual(captured.errors, []);
  const table = captured.table;
  assert.equal(table.head[0].at(-2), 'Overtime');
  assert.equal(table.body[0].at(-2), '02:15:00');
  assert.equal(table.body[2].at(-2), 'Full Day');
  assert.equal(table.body[1][12], 'WEEKLY OFF');
  assert.ok(Object.values(table.columnStyles).reduce((sum, col) => sum + col.cellWidth, 0) <= 1190 - 56);
});

test('image draws weekly off and OT without placing columns outside the canvas', async () => {
  const {run, captured} = exportHarness('exportToImage', 'exportToExcel');
  await run();
  assert.deepEqual(captured.errors, []);
  for (const value of ['Overtime', 'OT Approval', 'WEEKLY OFF', '02:15:00', 'Full Day']) {
    assert.ok(captured.text.some(([text]) => text === value), value);
  }
  assert.ok(captured.text.every(([, x]) => x >= 0 && x <= 2400));
});

test('Excel exports OT and weekly off with matching summary counts', async () => {
  const {run, captured} = exportHarness('exportToExcel', 'exportToCSV');
  await run();
  assert.equal(captured.excel[0].Overtime, '02:15:00');
  assert.equal(captured.excel[2].Overtime, 'Full Day');
  assert.equal(captured.excel[1].Status, 'WEEKLY OFF');
  assert.equal(captured.excel.find(row => row.Date === 'Weekly Off').Name, 1);
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
  assert.match(csv, /"Weekly Off","1"/);
});
