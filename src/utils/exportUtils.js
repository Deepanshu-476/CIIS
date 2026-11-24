import axiosInstance from './axiosConfig';

/**
 * Universal export to Excel (.xlsx) using dynamic import of xlsx
 */
export const exportToExcel = async (data, filename = 'report', sheetName = 'Sheet1') => {
  try {
    if (!data || !data.length) {
      throw new Error('No data available to export.');
    }
    const XLSX = await import('xlsx');
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Auto-calculate clean column widths with safe minimums and padding
    const headers = Object.keys(data[0] || {});
    worksheet['!cols'] = headers.map(header => {
      let maxLen = header.length;
      for (let i = 0; i < Math.min(data.length, 500); i++) {
        const val = data[i][header];
        const str = val != null ? String(val) : '';
        if (str.length > maxLen) maxLen = str.length;
      }
      return { wch: Math.min(Math.max(maxLen + 3, 11), 45) };
    });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    const dateStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `${filename}_${dateStr}.xlsx`);
    return true;
  } catch (err) {
    console.error('[exportUtils] exportToExcel error:', err);
    throw err;
  }
};

/**
 * Universal export to PDF using dynamic import of jsPDF & jspdf-autotable
 */
export const exportToPdf = async ({
  title = 'Report',
  subtitle = '',
  summaryLine = '',
  headers = [],
  rows = [],
  filename = 'report',
  orientation = 'landscape'
}) => {
  try {
    if (!rows || !rows.length) {
      throw new Error('No data available to export.');
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

    // Brand Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(30, 58, 138); // Deep Navy
    doc.text(title, pageWidth / 2, 32, { align: 'center' });

    let currentY = 46;

    // Subtitle (Employee & Period details)
    if (subtitle) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105); // Slate 600
      doc.text(subtitle, pageWidth / 2, currentY, { align: 'center' });
      currentY += 14;
    }

    // Summary Line (Key stats banner)
    if (summaryLine) {
      doc.setFillColor(241, 245, 249); // Slate 100
      doc.setDrawColor(203, 213, 225); // Slate 300
      doc.roundedRect(20, currentY - 8, pageWidth - 40, 18, 3, 3, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59); // Slate 800
      doc.text(summaryLine, pageWidth / 2, currentY + 4, { align: 'center' });
      currentY += 18;
    }

    // AutoTable
    autoTable(doc, {
      startY: currentY + 6,
      head: [headers],
      body: rows,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 58, 138], // Deep Navy Blue
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'center',
        valign: 'middle',
        cellPadding: 5
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 4,
        overflow: 'linebreak',
        font: 'helvetica',
        valign: 'middle',
        lineColor: [226, 232, 240],
        lineWidth: 0.5
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      margin: { top: 35, left: 20, right: 20, bottom: 25 },
      didParseCell: (data) => {
        const header = headers[data.column.index];
        const val = String(data.cell.raw || '');

        if (header === 'Status' && data.section === 'body') {
          if (val.includes('+ OVERTIME')) {
            data.cell.styles.textColor = [37, 99, 235];
            data.cell.styles.fontStyle = 'bold';
          } else if (val.includes('PRESENT')) {
            data.cell.styles.textColor = [22, 101, 52];
            data.cell.styles.fontStyle = 'bold';
          } else if (val.includes('LATE')) {
            data.cell.styles.textColor = [194, 65, 12];
            data.cell.styles.fontStyle = 'bold';
          } else if (val.includes('ABSENT')) {
            data.cell.styles.textColor = [185, 28, 28];
            data.cell.styles.fontStyle = 'bold';
          } else if (val.includes('WEEKLY') || val.includes('HOLIDAY') || val.includes('LEAVE')) {
            data.cell.styles.textColor = [100, 116, 139];
          }
        }

        // Highlight Break when recorded
        if (header === 'Break' && data.section === 'body' && val !== '--' && val !== '-') {
          data.cell.styles.textColor = [14, 116, 144];
          data.cell.styles.fontStyle = 'bold';
        }

        // Highlight Overtime when recorded
        if (header?.includes('Overtime') && data.section === 'body' && val !== '--' && val !== '-') {
          data.cell.styles.textColor = [37, 99, 235];
          data.cell.styles.fontStyle = 'bold';
        }

        // OT Status
        if (header === 'OT Status' && data.section === 'body') {
          if (val === 'Approved') {
            data.cell.styles.textColor = [22, 101, 52];
            data.cell.styles.fontStyle = 'bold';
          } else if (val === 'Pending') {
            data.cell.styles.textColor = [194, 65, 12];
          }
        }
      }
    });

    // Add page numbers and generation timestamp to all pages
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184); // Slate 400
      doc.text(
        `Generated on ${new Date().toLocaleDateString('en-GB')} at ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}  |  CIIS Portal`,
        20,
        pageHeight - 10
      );
      doc.text(
        `Page ${i} of ${totalPages}`,
        pageWidth - 20,
        pageHeight - 10,
        { align: 'right' }
      );
    }

    const dateStr = new Date().toISOString().slice(0, 10);
    doc.save(`${filename}_${dateStr}.pdf`);
    return true;
  } catch (err) {
    console.error('[exportUtils] exportToPdf error:', err);
    throw err;
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
