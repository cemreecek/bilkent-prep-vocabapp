'use client';

import React from 'react';

export default function ExportCSVButton({ roster }: { roster: any[] }) {
  const handleExport = () => {
    if (!roster || roster.length === 0) {
      alert("No students to export.");
      return;
    }

    const headers = ['Name', 'Email', 'Streak', 'Error Debt', 'Weekly Points', 'Last Login', 'Time Spent (Hrs)'];
    const rows = roster.map(s => [
      s.name,
      s.email,
      s.streak,
      s.debt,
      s.points,
      new Date(s.lastLogin).toLocaleDateString(),
      s.timeSpentHours
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'class_roster_export.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button 
      onClick={handleExport}
      className="inline-flex items-center justify-center bg-[color:var(--color-primary)] text-[color:var(--color-on-primary)] px-6 py-2 rounded-xl font-[family-name:var(--font-label-sm)] hover:opacity-90 active:scale-95 transition-all shadow-sm"
    >
      <span className="material-symbols-outlined mr-2 text-sm">download</span>
      Export to CSV
    </button>
  );
}
