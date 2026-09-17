
/**
 * Exports an array of JS objects to an Excel file (.xlsx)
 * @param {Array<Object>} data - Array of row objects to export
 * @param {string} filename - Output filename (without extension)
 * @param {string} sheetName - Worksheet name
 */
export const exportToExcel = async (data, filename = 'report', sheetName = 'ReportData') => {
  try {
    if (!data || !data.length) {
      alert('No data available to export.');
      return;
    }
    const XLSX = await import('xlsx');
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  } catch (err) {
    console.error('Error exporting to Excel:', err);
    alert('Failed to export to Excel.');
  }
};

/**
 * Triggers standard browser print dialog
 */
export const handlePrintReport = () => {
  window.print();
};
