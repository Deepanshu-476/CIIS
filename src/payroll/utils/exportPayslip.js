export async function createPayslipPdf(element, logoData) {
  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([import('html2canvas'), import('jspdf')]);
  const canvas = await html2canvas(element, {
    scale: 3, windowWidth: 1280, useCORS: true, allowTaint: false, backgroundColor: '#fff', logging: false,
    onclone: async doc => {
      const sheet = doc.querySelector('.ps2-document');
      sheet.classList.add('ps2-pdf-sheet');
      Object.assign(sheet.style, { width: '794px', minWidth: '0', maxWidth: 'none', boxSizing: 'border-box' });
      sheet.querySelectorAll('.ps2-screen-only').forEach(el => el.remove());
      // Lead with company branding, followed by the statement title and period.
      const company = sheet.querySelector('.ps2-company');
      sheet.prepend(company);
      const emptyDeductions = sheet.querySelector('.deduction tbody');
      if (emptyDeductions?.children.length === 1) {
        const row = doc.createElement('tr');
        row.className = 'ps2-empty-deductions';
        const cell = doc.createElement('td');
        cell.colSpan = 2;
        cell.textContent = 'No deductions for this period';
        row.append(cell);
        emptyDeductions.prepend(row);
      }
      await doc.fonts.ready;
      const logo = sheet.querySelector('.ps2-company-name img');
      if (logo) {
        if (logoData) logo.src = logoData;
        await logo.decode();
        const ratio = Math.min(210 / logo.naturalWidth, 84 / logo.naturalHeight);
        const frame = doc.createElement('div');
        frame.className = 'ps2-pdf-logo-frame';
        logo.replaceWith(frame);
        frame.append(logo);
        Object.assign(logo.style, { width: `${logo.naturalWidth * ratio}px`, height: `${logo.naturalHeight * ratio}px`, margin: '0', padding: '0', border: '0', borderRadius: '0', boxShadow: 'none' });
      }
      const title = sheet.querySelector('.ps2-company-name h3');
      if (title.scrollWidth > title.clientWidth) title.style.fontSize = `${19 * title.clientWidth / title.scrollWidth}px`;
    }
  });
  const pdf = new jsPDF('portrait', 'mm', 'a4');
  pdf.setDisplayMode('fullpage', 'single', 'UseNone');
  let width = 196, height = canvas.height * width / canvas.width;
  if (height > 263) { height = 263; width = canvas.width * height / canvas.height; }
  pdf.addImage(canvas.toDataURL('image/png'), 'PNG', (210-width)/2, 12, width, height, undefined, 'FAST');
  pdf.setDrawColor(220,226,234);
  pdf.line(14,282,196,282);
  pdf.setFont('helvetica','normal');
  pdf.setFontSize(8);
  pdf.setTextColor(100,116,139);
  pdf.text('This is a computer-generated payslip and does not require a signature or stamp.',105,288,{align:'center'});
  return pdf;
}

export async function exportPayslip(element, filename, logoData) {
  const pdf = await createPayslipPdf(element, logoData);
  pdf.save(`${filename}.pdf`);
}
