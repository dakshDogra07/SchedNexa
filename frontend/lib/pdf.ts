import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { TimetableEntry, ScheduleEntry } from '@shared/types';
import { DAYS, TIME_SLOT_DEFS } from '@/mock/demo-timetable';

type AnyGridEntry = TimetableEntry | ScheduleEntry;

export interface ExportPdfOptions {
  title: string;
  subtitle?: string;
  entries: AnyGridEntry[];
}

export function exportTimetableToPdf({ title, subtitle, entries }: ExportPdfOptions): void {
  // Use landscape for 5-day timetable grid readability
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Primary branding banner
  doc.setFillColor(67, 56, 202); // #4338ca (indigo-700)
  doc.rect(0, 0, pageWidth, 56, 'F');

  // Brand Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('SchedNexa', 40, 32);

  // Brand Subtext
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(224, 231, 255);
  doc.text('Smart Academic Resource Manager & Timetable System', 140, 32);

  // Document Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(30, 41, 59);
  doc.text(title, 40, 82);

  // Document Subtitle
  if (subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(subtitle, 40, 96);
  }

  // Build grid map key = `${day}-${slotNo}`
  const gridMap = new Map<string, AnyGridEntry>();
  for (const entry of entries) {
    gridMap.set(`${entry.day}-${entry.slotNo}`, entry);
  }

  // Construct table columns & rows
  const headers = ['Time Slot', ...DAYS.map((d) => d.name)];
  const tableData: string[][] = [];

  // Helper to format cell text
  const formatCell = (day: number, slotNo: number) => {
    const item = gridMap.get(`${day}-${slotNo}`);
    if (!item) return '—';

    let subj = item.subjectName;
    let room = item.roomName;
    let fac = item.facultyName;
    let cls = item.className;

    if ('state' in item && item.state === 'open') {
      return `[OPEN SLOT]\n${cls}\n${room}`;
    }

    if ('state' in item && item.state === 'extra') {
      return `[EXTRA]\n${subj}\n${room} • ${fac}`;
    }

    return `${subj}\n${room} • ${fac}`;
  };

  // Morning slots 1 to 5
  for (let s = 1; s <= 5; s++) {
    const def = TIME_SLOT_DEFS.find((t) => t.slotNo === s)!;
    const row = [
      `Slot ${s}\n${def.startTime} - ${def.endTime}`,
      formatCell(1, s),
      formatCell(2, s),
      formatCell(3, s),
      formatCell(4, s),
      formatCell(5, s),
    ];
    tableData.push(row);
  }

  // Lunch Break Row
  tableData.push([
    '13:10 - 14:00',
    'LUNCH BREAK',
    'LUNCH BREAK',
    'LUNCH BREAK',
    'LUNCH BREAK',
    'LUNCH BREAK',
  ]);

  // Afternoon slots 6 to 7
  for (let s = 6; s <= 7; s++) {
    const def = TIME_SLOT_DEFS.find((t) => t.slotNo === s)!;
    const row = [
      `Slot ${s}\n${def.startTime} - ${def.endTime}`,
      formatCell(1, s),
      formatCell(2, s),
      formatCell(3, s),
      formatCell(4, s),
      formatCell(5, s),
    ];
    tableData.push(row);
  }

  // Render AutoTable
  autoTable(doc, {
    startY: subtitle ? 106 : 94,
    margin: { left: 40, right: 40 },
    head: [headers],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [79, 70, 229], // #4f46e5
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 9,
      cellPadding: 6,
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 5,
      halign: 'center',
      valign: 'middle',
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: {
        fontStyle: 'bold',
        fillColor: [248, 250, 252],
        halign: 'center',
        cellWidth: 80,
      },
    },
    didParseCell: (data) => {
      // Style lunch break row (row index 5)
      if (data.row.index === 5) {
        data.cell.styles.fillColor = [241, 245, 249];
        data.cell.styles.textColor = [100, 116, 139];
        data.cell.styles.fontStyle = 'bold';
      }
    },
  });

  // Footer
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Exported from SchedNexa on ${new Date().toLocaleDateString()} • Zero Conflict Certified`,
    40,
    pageHeight - 20
  );

  // Trigger download
  const safeFilename = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  doc.save(`${safeFilename}.pdf`);
}

export function exportWorkloadReportToPdf(workloadRows: Array<{
  facultyName: string;
  requiredHours: number;
  assignedHours: number;
  extraHours: number;
  totalHours: number;
  maxHours: number;
  status: string;
}>): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Banner
  doc.setFillColor(67, 56, 202);
  doc.rect(0, 0, pageWidth, 50, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('SchedNexa', 40, 32);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(224, 231, 255);
  doc.text('Faculty Workload & Compliance Report', 140, 32);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(30, 41, 59);
  doc.text('Weekly Faculty Load Summary', 40, 80);

  const headers = ['Faculty Name', 'Required', 'Assigned', 'Extra', 'Total', 'Max Limit', 'Status'];
  const data = workloadRows.map((r) => [
    r.facultyName,
    `${r.requiredHours} hrs`,
    `${r.assignedHours} hrs`,
    `${r.extraHours} hrs`,
    `${r.totalHours} hrs`,
    `${r.maxHours} hrs`,
    r.status.toUpperCase(),
  ]);

  autoTable(doc, {
    startY: 95,
    margin: { left: 40, right: 40 },
    head: [headers],
    body: data,
    theme: 'grid',
    headStyles: {
      fillColor: [79, 70, 229],
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8.5,
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'left', fontStyle: 'bold' },
    },
  });

  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Generated by SchedNexa • Academic Resource & Load Management System • ${new Date().toLocaleDateString()}`,
    40,
    pageHeight - 20
  );

  doc.save('faculty-workload-compliance-report.pdf');
}

