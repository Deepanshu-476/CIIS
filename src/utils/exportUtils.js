import axiosInstance from './axiosConfig';

/**
 * Universal export to Excel (.xlsx) using dynamic import of xlsx
 */
export const exportToExcel = async (data, filename = 'report', sheetName = 'Sheet1') => {
  try {
    if (!data || !data.length) {
      alert('No data available to export.');
      return;
    }
    const XLSX = await import('xlsx');
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    const dateStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `${filename}_${dateStr}.xlsx`);
  } catch (err) {
    console.error('[exportUtils] exportToExcel error:', err);
    alert('Failed to export to Excel.');
  }
};

/**
 * Universal export to PDF using dynamic import of jsPDF & jspdf-autotable
 */
export const exportToPdf = async ({
  title = 'Report',
  subtitle = '',
  headers = [],
  rows = [],
  filename = 'report',
  orientation = 'landscape'
}) => {
  try {
    if (!rows || !rows.length) {
      alert('No data available to export.');
      return;
    }

    const { default: jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;

    const doc = new jsPDF({
      orientation,
      unit: 'pt',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();

    // Brand Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(30, 58, 138); // Deep Navy
    doc.text(title, pageWidth / 2, 40, { align: 'center' });

    // Subtitle
    if (subtitle) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(subtitle, pageWidth / 2, 58, { align: 'center' });
    }

    // AutoTable
    autoTable(doc, {
      startY: subtitle ? 75 : 55,
      head: [headers],
      body: rows,
      theme: 'grid',
      headStyles: {
        fillColor: [37, 99, 235], // Primary Blue
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 9,
        halign: 'center'
      },
      styles: {
        fontSize: 8,
        cellPadding: 6,
        overflow: 'linebreak',
        font: 'helvetica'
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      margin: { top: 40, left: 20, right: 20, bottom: 30 }
    });

    const dateStr = new Date().toISOString().slice(0, 10);
    doc.save(`${filename}_${dateStr}.pdf`);
  } catch (err) {
    console.error('[exportUtils] exportToPdf error:', err);
    alert('Failed to export to PDF.');
  }
};

/**
 * Downloads a pre-aggregated report from CIISBackend /api/export-reports/...
 */
export const downloadBackendReport = async (endpoint, filename) => {
  try {
    const response = await axiosInstance.get(endpoint, {
      responseType: 'blob'
    });
    const blob = new Blob([response.data]);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('[exportUtils] downloadBackendReport error:', err);
    alert('Failed to download report. Please try again.');
  }
};
