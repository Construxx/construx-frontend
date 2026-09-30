import { jsPDF } from 'jspdf';
import { Project, Task, Milestone, AIAlert } from '../types';

interface GenerateReportOptions {
  project: Project;
  tasks: Task[];
  milestones: Milestone[];
  alerts: AIAlert[];
}

export function generateProjectPDFReport({
  project,
  tasks,
  milestones,
  alerts,
}: GenerateReportOptions): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // 1. Header Banner
  doc.setFillColor(11, 15, 23); // #0b0f17 dark background
  doc.rect(0, 0, pageWidth, 36, 'F');

  // Accent line
  doc.setFillColor(245, 158, 11); // Amber accent
  doc.rect(0, 35, pageWidth, 1.5, 'F');

  // Company Brand / Title
  doc.setTextColor(245, 158, 11);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('CONSTRUX', margin, 15);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('CONSTRUCTION OPERATING SYSTEM // EXECUTIVE REPORT', margin + 34, 14.5);

  // Snapshot Date & Ref
  const now = new Date();
  const timestampStr = now.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }) + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text(`Generated: ${timestampStr}`, pageWidth - margin, 14, { align: 'right' });
  doc.text(`Reference: ${project.code}-SNAP`, pageWidth - margin, 19, { align: 'right' });

  // Subtitle / Status in Header
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(`${project.name} (${project.code})`, margin, 27);

  // Status Badge in Header
  const statusColor = project.status === 'at_risk' ? [225, 29, 72] : [16, 185, 129];
  doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.roundedRect(pageWidth - margin - 38, 23, 38, 6.5, 1.5, 1.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(
    project.status === 'at_risk' ? 'STATUS: AT RISK' : project.status === 'handed_over' ? 'HANDED OVER' : 'STATUS: ON TRACK',
    pageWidth - margin - 19,
    27.5,
    { align: 'center' }
  );

  y = 44;

  // 2. Project Executive Overview
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text('1. Project Overview & Meta Parameters', margin, y);
  y += 5;

  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setFillColor(248, 250, 252); // slate-50
  doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105); // slate-600

  // Left Col
  doc.text(`Type: ${project.type}`, margin + 4, y + 6);
  doc.text(`Location: ${project.location}`, margin + 4, y + 12);
  doc.text(`Floors Profile: ${project.floorsTotal} Levels`, margin + 4, y + 18);

  // Right Col
  doc.text(`Contractor: ${project.contractor}`, margin + 95, y + 6);
  doc.text(`Schedule: ${project.startDate} to ${project.endDate}`, margin + 95, y + 12);
  doc.text(`Active Building Twin: ${project.activeBuildingId || 'Pending Handover Phase 5'}`, margin + 95, y + 18);

  y += 31;

  // 3. Current Progress Snapshot
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('2. Physical Progress & Milestone Delivery', margin, y);
  y += 5;

  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length;
  const criticalPathTasks = tasks.filter((t) => t.criticalPath).length;

  // Metric Cards
  const cardWidth = (contentWidth - 6) / 3;

  // Card 1: Physical Progress
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, cardWidth, 22, 2, 2, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('PHYSICAL COMPLETION', margin + 4, y + 5.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(217, 119, 6); // amber-600
  doc.text(`${project.progressPercent}%`, margin + 4, y + 14);
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`${completedTasks} of ${tasks.length} total tasks done`, margin + 4, y + 19);

  // Progress Bar under Card 1
  const barWidth = cardWidth - 8;
  doc.setFillColor(226, 232, 240);
  doc.rect(margin + 4, y + 15, barWidth, 1.8, 'F');
  doc.setFillColor(217, 119, 6);
  doc.rect(margin + 4, y + 15, (barWidth * project.progressPercent) / 100, 1.8, 'F');

  // Card 2: Tasks Execution
  const c2X = margin + cardWidth + 3;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(c2X, y, cardWidth, 22, 2, 2, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('TASK BREAKDOWN', c2X + 4, y + 5.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text(`${completedTasks} Completed`, c2X + 4, y + 13);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`${inProgressTasks} In Progress • ${criticalPathTasks} on Critical Path`, c2X + 4, y + 18.5);

  // Card 3: Active Milestone
  const activeMilestone = milestones.find((m) => m.status === 'in_progress') || milestones[0];
  const c3X = margin + (cardWidth + 3) * 2;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(c3X, y, cardWidth, 22, 2, 2, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('CURRENT PHASE GATE', c3X + 4, y + 5.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  const milestoneTitle = doc.splitTextToSize(activeMilestone ? activeMilestone.title : 'Phase 5 Handover', cardWidth - 8);
  doc.text(milestoneTitle, c3X + 4, y + 11);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Due: ${activeMilestone ? activeMilestone.dueDate : '2026-11-30'}`, c3X + 4, y + 19);

  y += 28;

  // 4. Budget & Financial Health
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('3. Capital Budget & Financial Absorption', margin, y);
  y += 5;

  const budgetAbsorption = Math.round((project.budgetSpent / project.budgetTotal) * 100);
  const budgetRemaining = project.budgetTotal - project.budgetSpent;

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, contentWidth, 22, 2, 2, 'FD');

  const bColWidth = contentWidth / 4;
  // Col 1: Authorized Budget
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL AUTHORIZED BUDGET', margin + 4, y + 6);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`NGN ${(project.budgetTotal / 1e6).toFixed(1)}M`, margin + 4, y + 13);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`N${project.budgetTotal.toLocaleString()}`, margin + 4, y + 18);

  // Col 2: Spent
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('CAPITAL ABSORBED', margin + bColWidth + 4, y + 6);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(217, 119, 6);
  doc.text(`NGN ${(project.budgetSpent / 1e6).toFixed(1)}M`, margin + bColWidth + 4, y + 13);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`N${project.budgetSpent.toLocaleString()}`, margin + bColWidth + 4, y + 18);

  // Col 3: Variance
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('REMAINING CONTINGENCY', margin + bColWidth * 2 + 4, y + 6);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(16, 185, 129); // green
  doc.text(`NGN ${(budgetRemaining / 1e6).toFixed(1)}M`, margin + bColWidth * 2 + 4, y + 13);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`N${budgetRemaining.toLocaleString()}`, margin + bColWidth * 2 + 4, y + 18);

  // Col 4: Burn Rate
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('ABSORPTION RATE', margin + bColWidth * 3 + 4, y + 6);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(`${budgetAbsorption}%`, margin + bColWidth * 3 + 4, y + 13);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(16, 185, 129);
  doc.text('Aligned with S-Curve', margin + bColWidth * 3 + 4, y + 18);

  y += 28;

  // 5. Active Risks & AI Alerts
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('4. Predictive AI Risk Intelligence & Active Exposures', margin, y);
  y += 5;

  const activeAlerts = alerts.filter((a) => !a.resolved);

  if (activeAlerts.length === 0) {
    doc.setFillColor(240, 253, 244); // emerald-50
    doc.setDrawColor(187, 247, 208); // emerald-200
    doc.roundedRect(margin, y, contentWidth, 14, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(22, 101, 52); // emerald-800
    doc.text('OK - Zero Critical Schedule or Material Deficits Detected', margin + 6, y + 9);
    y += 20;
  } else {
    for (const alert of activeAlerts.slice(0, 3)) {
      const isCritical = alert.severity === 'critical';
      const bgColor = isCritical ? [255, 241, 242] : [254, 243, 199];
      const borderColor = isCritical ? [253, 164, 175] : [252, 211, 77];
      const tagColor = isCritical ? [225, 29, 72] : [217, 119, 6];

      doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
      doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);

      const msgLines = doc.splitTextToSize(alert.message, contentWidth - 12);
      const recLines = alert.recommendation ? doc.splitTextToSize(`Action Plan: ${alert.recommendation}`, contentWidth - 12) : [];
      const boxHeight = 14 + msgLines.length * 4 + (recLines.length > 0 ? recLines.length * 3.5 + 4 : 0);

      doc.roundedRect(margin, y, contentWidth, boxHeight, 2, 2, 'FD');

      // Tag
      doc.setFillColor(tagColor[0], tagColor[1], tagColor[2]);
      doc.roundedRect(margin + 4, y + 4, 30, 4.5, 1, 1, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(255, 255, 255);
      doc.text(isCritical ? 'CRITICAL RISK' : 'WARNING', margin + 19, y + 7.2, { align: 'center' });

      // Alert Title
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(alert.title, margin + 38, y + 7.5);

      // Alert Message
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      doc.text(msgLines, margin + 4, y + 13);

      if (recLines.length > 0) {
        const recY = y + 14 + msgLines.length * 4;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(tagColor[0], tagColor[1], tagColor[2]);
        doc.text(recLines, margin + 4, recY);
      }

      y += boxHeight + 4;
    }
  }

  // 6. Critical Path Tasks Snapshot Table
  if (y < 235) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('5. Critical Path Tasks Execution Register', margin, y);
    y += 5;

    // Table Header
    doc.setFillColor(241, 245, 249); // slate-100
    doc.rect(margin, y, contentWidth, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text('TASK / LOCATION', margin + 3, y + 4.2);
    doc.text('ASSIGNED TO', margin + 85, y + 4.2);
    doc.text('DUE DATE', margin + 130, y + 4.2);
    doc.text('PROGRESS', margin + 155, y + 4.2);
    doc.text('STATUS', margin + 175, y + 4.2);
    y += 6;

    const keyTasks = tasks.slice(0, 5);
    for (const t of keyTasks) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);

      const taskTitle = t.title.length > 40 ? t.title.substring(0, 38) + '...' : t.title;
      doc.text(taskTitle, margin + 3, y + 4.5);
      doc.setTextColor(100, 116, 139);
      doc.text(t.assignedTo.length > 22 ? t.assignedTo.substring(0, 20) + '..' : t.assignedTo, margin + 85, y + 4.5);
      doc.text(t.dueDate, margin + 130, y + 4.5);

      // Progress
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(t.progress === 100 ? 16 : 217, t.progress === 100 ? 185 : 119, t.progress === 100 ? 129 : 6);
      doc.text(`${t.progress}%`, margin + 155, y + 4.5);

      // Status
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(t.status.toUpperCase(), margin + 175, y + 4.5);

      // Separator line
      doc.setDrawColor(241, 245, 249);
      doc.line(margin, y + 6, margin + contentWidth, y + 6);
      y += 6.5;
    }
  }

  // 7. Footer on Page Bottom
  doc.setFillColor(241, 245, 249);
  doc.rect(0, pageHeight - 12, pageWidth, 12, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'CONFIDENTIAL // CONSTRUX Construction Operating System — Automated Executive Intelligence Snapshot',
    margin,
    pageHeight - 5
  );
  doc.text(
    'Page 1 of 1',
    pageWidth - margin,
    pageHeight - 5,
    { align: 'right' }
  );

  // Save PDF
  const filename = `${project.code || 'CONSTRUX'}_Executive_Report_${now.toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}
