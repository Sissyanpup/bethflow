import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api.js';
import { IconDownload, IconX, IconKanban, IconCalendar, IconGrid } from '../ui/icons.js';
import { format, subMonths } from 'date-fns';

type ExportType = 'boards' | 'projects' | 'all';

interface ExportChecklist { text: string; isChecked: boolean; createdAt: string; }
interface ExportCard {
  id: string; title: string; description: string | null; color: string | null;
  isArchived: boolean; mediaUrl: string | null;
  catalogName: string | null; taskStatus: string | null;
  startDate: string | null; endDate: string | null;
  createdAt: string; updatedAt: string;
  checklist: ExportChecklist[];
}
interface ExportList { id: string; title: string; isArchived: boolean; cards: ExportCard[]; }
interface ExportBoard {
  id: string; title: string; description: string | null; color: string | null;
  isPublic: boolean; createdAt: string; lists: ExportList[];
}
interface ExportTask {
  id: string; title: string; description: string | null; status: string;
  startDate: string | null; endDate: string | null; createdAt: string;
  linkedCard: { title: string; listTitle: string; boardTitle: string; } | null;
}
interface ExportProject {
  id: string; title: string; description: string | null; createdAt: string;
  tasks: ExportTask[];
}
interface ExportCatalog {
  id: string; title: string; content: string | null; group: string | null;
  startDate: string | null; endDate: string | null; createdAt: string;
}
interface FullExportData {
  boards: ExportBoard[];
  projects: ExportProject[];
  catalogs: ExportCatalog[];
}

interface Props { onClose: () => void; }

const SHEET_PREVIEW: Record<ExportType, string> = {
  boards: 'Sheets: Boards, Cards (date-filtered by created)',
  projects: 'Sheets: Projects, Tasks (date-filtered by start date)',
  all: 'Sheets: Boards, Cards, Checklist_Items, Projects, Tasks, Catalogs',
};

export function ExportModal({ onClose }: Props) {
  const [exportType, setExportType] = useState<ExportType>('all');
  const [fromDate, setFromDate] = useState(() => format(subMonths(new Date(), 3), 'yyyy-MM-dd'));
  const [toDate, setToDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [exporting, setExporting] = useState(false);

  const { data: exportData, isLoading } = useQuery({
    queryKey: ['me-export-full'],
    queryFn: async () => {
      const res = await api.get<{ success: true; data: FullExportData }>('/users/me/export');
      return res.data.data;
    },
    staleTime: 60_000,
  });

  const fmt = (d: string | null) => (d ? format(new Date(d), 'yyyy-MM-dd') : '');

  const handleExport = async () => {
    if (!exportData) return;
    setExporting(true);
    try {
      const XLSX = await import('xlsx');
      const from = new Date(fromDate);
      const to = new Date(toDate);
      to.setHours(23, 59, 59);

      const wb = XLSX.utils.book_new();
      const { boards, projects, catalogs } = exportData;

      if (exportType === 'boards' || exportType === 'all') {
        // Boards summary sheet
        const boardRows = boards.map((b) => {
          const allCards = b.lists.flatMap((l) => l.cards);
          return {
            'Board Title': b.title,
            'Description': b.description ?? '',
            'Color': b.color ?? '',
            'Public': b.isPublic ? 'Yes' : 'No',
            'Total Lists': b.lists.length,
            'Active Lists': b.lists.filter((l) => !l.isArchived).length,
            'Total Cards': allCards.length,
            'Active Cards': allCards.filter((c) => !c.isArchived).length,
            'Archived Cards': allCards.filter((c) => c.isArchived).length,
            'Created': fmt(b.createdAt),
          };
        });
        XLSX.utils.book_append_sheet(
          wb,
          XLSX.utils.json_to_sheet(boardRows.length ? boardRows : [{ Note: 'No boards found' }]),
          'Boards',
        );

        // Cards detail sheet
        const cardRows: Record<string, string | number>[] = [];
        boards.forEach((b) => {
          b.lists.forEach((l) => {
            l.cards.forEach((c) => {
              if (exportType === 'boards') {
                const created = new Date(c.createdAt);
                if (created < from || created > to) return;
              }
              const checkTotal = c.checklist.length;
              const checkDone = c.checklist.filter((ci) => ci.isChecked).length;
              cardRows.push({
                'Board': b.title,
                'List': l.title,
                'Card Title': c.title,
                'Description': c.description ?? '',
                'Color': c.color ?? '',
                'Catalog': c.catalogName ?? '',
                'Task Status': c.taskStatus ?? '',
                'Checklist Total': checkTotal,
                'Checklist Done': checkDone,
                'Completion %': checkTotal > 0 ? Math.round((checkDone / checkTotal) * 100) : '',
                'Start Date': fmt(c.startDate),
                'Due Date': fmt(c.endDate),
                'Is Archived': c.isArchived ? 'Yes' : 'No',
                'Has Media': c.mediaUrl ? 'Yes' : 'No',
                'Created': fmt(c.createdAt),
              });
            });
          });
        });
        XLSX.utils.book_append_sheet(
          wb,
          XLSX.utils.json_to_sheet(cardRows.length ? cardRows : [{ Note: 'No cards in selected range' }]),
          'Cards',
        );
      }

      if (exportType === 'all') {
        // Checklist Items sheet
        const checkRows: Record<string, string>[] = [];
        boards.forEach((b) => {
          b.lists.forEach((l) => {
            l.cards.forEach((c) => {
              c.checklist.forEach((ci) => {
                checkRows.push({
                  'Board': b.title,
                  'List': l.title,
                  'Card': c.title,
                  'Item Text': ci.text,
                  'Is Done': ci.isChecked ? 'Yes' : 'No',
                  'Created': fmt(ci.createdAt),
                });
              });
            });
          });
        });
        if (checkRows.length > 0) {
          XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(checkRows), 'Checklist_Items');
        }
      }

      if (exportType === 'projects' || exportType === 'all') {
        // Projects summary sheet
        const projRows = projects.map((p) => {
          const done = p.tasks.filter((t) => t.status === 'DONE').length;
          return {
            'Project Title': p.title,
            'Description': p.description ?? '',
            'Total Tasks': p.tasks.length,
            'Done': done,
            'In Progress': p.tasks.filter((t) => t.status === 'IN_PROGRESS').length,
            'Todo': p.tasks.filter((t) => t.status === 'TODO').length,
            'Blocked': p.tasks.filter((t) => t.status === 'BLOCKED').length,
            'Completion %': p.tasks.length > 0 ? Math.round((done / p.tasks.length) * 100) : 0,
            'Created': fmt(p.createdAt),
          };
        });
        XLSX.utils.book_append_sheet(
          wb,
          XLSX.utils.json_to_sheet(projRows.length ? projRows : [{ Note: 'No projects found' }]),
          'Projects',
        );

        // Tasks detail sheet
        const taskRows: Record<string, string>[] = [];
        projects.forEach((p) => {
          p.tasks.forEach((t) => {
            if (exportType === 'projects' && t.startDate) {
              const start = new Date(t.startDate);
              if (start < from || start > to) return;
            }
            taskRows.push({
              'Project': p.title,
              'Task Title': t.title,
              'Description': t.description ?? '',
              'Status': t.status,
              'Start Date': fmt(t.startDate),
              'Due Date': fmt(t.endDate),
              'Linked Board': t.linkedCard?.boardTitle ?? '',
              'Linked List': t.linkedCard?.listTitle ?? '',
              'Linked Card': t.linkedCard?.title ?? '',
              'Created': fmt(t.createdAt),
            });
          });
        });
        XLSX.utils.book_append_sheet(
          wb,
          XLSX.utils.json_to_sheet(taskRows.length ? taskRows : [{ Note: 'No tasks in selected range' }]),
          'Tasks',
        );
      }

      if (exportType === 'all' && catalogs.length > 0) {
        const catRows = catalogs.map((c) => ({
          'Catalog Title': c.title,
          'Content': c.content ? c.content.slice(0, 300) : '',
          'Group': c.group ?? '',
          'Start Date': fmt(c.startDate),
          'End Date': fmt(c.endDate),
          'Created': fmt(c.createdAt),
        }));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(catRows), 'Catalogs');
      }

      const filename = `bethflow-${exportType}-${format(new Date(), 'yyyyMMdd')}.xlsx`;
      XLSX.writeFile(wb, filename);
      onClose();
    } finally {
      setExporting(false);
    }
  };

  const totalCards = exportData?.boards.flatMap((b) => b.lists.flatMap((l) => l.cards)).length ?? 0;
  const ready = !isLoading && !!exportData;

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="anim-scale-in"
        style={{ background: 'var(--lin-panel)', border: '1px solid var(--lin-border-2)', borderRadius: 16, width: '100%', maxWidth: 460, padding: '28px 32px', boxShadow: '0 24px 80px rgba(0,0,0,0.5)', position: 'relative' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--lin-text-1)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <IconDownload size={18} style={{ color: '#10b981' }} /> Export to Excel
          </h2>
          <button
            onClick={onClose}
            style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(255,255,255,0.06)', border: 'none', color: 'var(--lin-text-3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <IconX size={15} />
          </button>
        </div>

        {/* Type selector */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
          {([
            ['boards', 'Boards & Cards', IconKanban],
            ['projects', 'Projects & Tasks', IconCalendar],
            ['all', 'All Data', IconGrid],
          ] as const).map(([val, label, Icon]) => (
            <button
              key={val}
              onClick={() => setExportType(val)}
              style={{
                padding: '10px 4px', borderRadius: 10,
                border: `1px solid ${exportType === val ? 'rgba(113,112,255,0.4)' : 'var(--lin-border-2)'}`,
                background: exportType === val ? 'rgba(113,112,255,0.1)' : 'transparent',
                color: exportType === val ? '#7170ff' : 'var(--lin-text-3)',
                cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                transition: 'all 0.15s', fontSize: 11, fontWeight: 600, lineHeight: 1.3, textAlign: 'center',
              }}
            >
              <Icon size={17} />
              {label}
            </button>
          ))}
        </div>

        {/* Sheet preview badge */}
        <div style={{ background: 'rgba(113,112,255,0.06)', border: '1px solid rgba(113,112,255,0.15)', borderRadius: 8, padding: '8px 12px', marginBottom: 18, fontSize: 11, color: 'var(--lin-text-3)', lineHeight: 1.5 }}>
          {SHEET_PREVIEW[exportType]}
        </div>

        {/* Date range (boards / projects only) */}
        {exportType !== 'all' && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--lin-text-3)', marginBottom: 10 }}>Date Range</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--lin-text-4)', marginBottom: 5 }}>FROM</div>
                <input
                  type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
                  style={{ width: '100%', background: 'var(--lin-surface-2)', border: '1px solid var(--lin-border-2)', borderRadius: 8, padding: '8px 10px', color: 'var(--lin-text-1)', fontSize: 13, outline: 'none', colorScheme: 'dark' }}
                />
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--lin-text-4)', marginBottom: 5 }}>TO</div>
                <input
                  type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
                  style={{ width: '100%', background: 'var(--lin-surface-2)', border: '1px solid var(--lin-border-2)', borderRadius: 8, padding: '8px 10px', color: 'var(--lin-text-1)', fontSize: 13, outline: 'none', colorScheme: 'dark' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Status line */}
        <div style={{ fontSize: 12, color: 'var(--lin-text-4)', marginBottom: 16 }}>
          {isLoading
            ? 'Loading data…'
            : `Ready — ${exportData?.boards.length ?? 0} board${exportData?.boards.length !== 1 ? 's' : ''}, ${totalCards} card${totalCards !== 1 ? 's' : ''}, ${exportData?.projects.length ?? 0} project${exportData?.projects.length !== 1 ? 's' : ''}`}
        </div>

        <button
          onClick={() => void handleExport()}
          disabled={exporting || !ready}
          style={{ width: '100%', padding: '12px', borderRadius: 10, background: 'linear-gradient(135deg, #10b981, #0891b2)', color: '#fff', fontSize: 14, fontWeight: 700, border: 'none', cursor: exporting || !ready ? 'not-allowed' : 'pointer', opacity: exporting || !ready ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.15s' }}
        >
          <IconDownload size={16} />
          {exporting ? 'Exporting…' : isLoading ? 'Loading…' : 'Download .xlsx'}
        </button>
      </div>
    </div>
  );
}
