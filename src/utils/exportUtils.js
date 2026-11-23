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
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 24;
    const usableWidth = pageWidth - (margin * 2);

    // Top Header Banner
    doc.setFillColor(15, 23, 42); // Dark Slate #0f172a
    doc.rect(margin, 16, usableWidth, 46, 'F');

    // Royal Blue Accent Line
    doc.setFillColor(37, 99, 235); // #2563eb
    doc.rect(margin, 60, usableWidth, 2.5, 'F');

    // Branding & Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(56, 189, 248); // Sky Blue #38bdf8
    doc.text('CIIS NETWORK • ATTENDANCE & REPORTING SYSTEM', margin + 12, 30);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text(String(title || 'REPORT').toUpperCase(), margin + 12, 48);

    // Subtitle on Right
    if (subtitle) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184); // Slate #94a3b8
      doc.text(String(subtitle), margin + usableWidth - 12, 48, { align: 'right' });
    }

    // AutoTable
    autoTable(doc, {
      startY: 72,
      head: [headers],
      body: rows,
      theme: 'grid',
      headStyles: {
        fillColor: [37, 99, 235], // Primary Blue
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 8.5,
        halign: 'center',
        valign: 'middle',
        cellPadding: 5
      },
      styles: {
        fontSize: 8,
        cellPadding: 4.5,
        valign: 'middle',
        overflow: 'linebreak',
        font: 'helvetica',
        lineColor: [226, 232, 240],
        lineWidth: 0.5
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      margin: { top: 72, left: margin, right: margin, bottom: 28 },
      didDrawCell: (data) => {
        if (data.section === 'body') {
          const val = String(data.cell.raw || '').toUpperCase();
          if (val === 'PRESENT') {
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(22, 101, 52); // Green #166534
          } else if (val === 'ABSENT') {
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(185, 28, 28); // Red #b91c1c
          } else if (val === 'LATE' || val.includes('HALF')) {
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(180, 83, 9); // Amber #b45309
          } else if (val.includes('WEEKLY') || val.includes('HOLIDAY')) {
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 116, 139); // Slate
          }
        }
      },
      didDrawPage: (data) => {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184);
        doc.text('CIIS Network • Confidential Attendance Report', margin, pageHeight - 12);
        doc.text(`Page ${data.pageNumber}`, pageWidth - margin, pageHeight - 12, { align: 'right' });
      }
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
    const cleanEndpoint = String(endpoint || '').replace(/^\/?api\/?/, '/');
    const response = await axiosInstance.get(cleanEndpoint, {
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
    let errorMsg = 'Failed to download report. Please try again.';
    try {
      if (err.response?.data instanceof Blob) {
        const text = await err.response.data.text();
        const json = JSON.parse(text);
        if (json.message) errorMsg = json.message;
      } else if (err.message) {
        errorMsg = err.message;
      }
    } catch {}
    console.error('[exportUtils] downloadBackendReport error:', err);
    alert(errorMsg);
  }
};
