import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api.js';
import { IconDownload, IconX, IconKanban, IconCalendar } from '../ui/icons.js';
import { format, subMonths } from 'date-fns';

type ExportType = 'boards' | 'projects';

interface Props {
  onClose: () => void;
}

export function ExportModal({ onClose }: Props) {
  const [exportType, setExportType] = useState<ExportType>('boards');
  const [fromDate, setFromDate] = useState(() => format(subMonths(new Date(), 3), 'yyyy-MM-dd'));
  const [toDate, setToDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [exporting, setExporting] = useState(false);

  const { data: boards } = useQuery({
    queryKey: ['boards-export'],
    enabled: exportType === 'boards',
    queryFn: async () => {
      const res = await api.get<{ success: true; data: { id: string; title: string; description: string | null; createdAt: string }[] }>('/boards?limit=100');
      return res.data.data;
    },
  });

  const { data: projects } = useQuery({
    queryKey: ['projects-export'],
    enabled: exportType === 'projects',
    queryFn: async () => {
      const res = await api.get<{ success: true; data: { id: string; title: string; description: string | null; createdAt: string }[] }>('/projects?limit=100');
      return res.data.data;
    },
  });

  const { data: boardDetails } = useQuery({
    queryKey: ['boards-detail-export', boards?.map((b) => b.id)],
    enabled: exportType === 'boards' && (boards?.length ?? 0) > 0,
    queryFn: async () => {
      const results = await Promise.all(
        (boards ?? []).map((b) =>
          api.get<{ success: true; data: { id: string; title: string; lists: { id: string; title: string; cards: { id: string; title: string; description: string | null; startDate: string | null; endDate: string | null; createdAt: string }[] }[] } }>(`/boards/${b.id}`)
            .then((r) => r.data.data),
        ),
      );
      return results;
    },
  });

  const { data: projectDetails } = useQuery({
    queryKey: ['projects-detail-export', projects?.map((p) => p.id)],
    enabled: exportType === 'projects' && (projects?.length ?? 0) > 0,
    queryFn: async () => {
      const results = await Promise.all(
        (projects ?? []).map((p) =>
          api.get<{ success: true; data: { id: string; title: string; tasks: { id: string; title: string; status: string; startDate: string; endDate: string; description: string | null }[] } }>(`/projects/${p.id}`)
            .then((r) => r.data.data),
        ),
      );
      return results;
    },
  });

  const handleExport = async () => {
    setExporting(true);
    try {
      // Dynamic import to avoid SSR issues
      const XLSX = await import('xlsx');
      const from = new Date(fromDate);
      const to = new Date(toDate);
      to.setHours(23, 59, 59);

      const wb = XLSX.utils.book_new();

      if (exportType === 'boards' && boardDetails) {
        // Sheet 1: Boards summary
        const boardRows = boardDetails.map((b) => ({
          'Board Title': b.title,
          'Lists': b.lists.length,
          'Total Cards': b.lists.reduce((acc, l) => acc + l.cards.length, 0),
        }));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(boardRows), 'Boards');

        // Sheet 2: All cards
        const cardRows: Record<string, string>[] = [];
        boardDetails.forEach((b) => {
          b.lists.forEach((l) => {
            l.cards.forEach((c) => {
              const created = new Date(c.createdAt);
              if (created >= from && created <= to) {
                cardRows.push({
                  'Board': b.title,
                  'List': l.title,
                  'Card Title': c.title,
                  'Description': c.description ?? '',
                  'Start Date': c.startDate ? format(new Date(c.startDate), 'yyyy-MM-dd') : '',
                  'Due Date': c.endDate ? format(new Date(c.endDate), 'yyyy-MM-dd') : '',
                  'Created': format(created, 'yyyy-MM-dd'),
                });
              }
            });
          });
        });
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(cardRows.length ? cardRows : [{ Note: 'No cards in selected range' }]), 'Cards');
      }

      if (exportType === 'projects' && projectDetails) {
        // Sheet 1: Projects summary
        const projRows = projectDetails.map((p) => ({
          'Project': p.title,
          'Tasks': p.tasks.length,
          'Done': p.tasks.filter((t) => t.status === 'DONE').length,
          'In Progress': p.tasks.filter((t) => t.status === 'IN_PROGRESS').length,
          'Blocked': p.tasks.filter((t) => t.status === 'BLOCKED').length,
        }));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(projRows), 'Projects');

        // Sheet 2: All tasks
        const taskRows: Record<string, string>[] = [];
        projectDetails.forEach((p) => {
          p.tasks.forEach((t) => {
            const start = new Date(t.startDate);
            if (start >= from && start <= to) {
              taskRows.push({
                'Project': p.title,
                'Task': t.title,
                'Status': t.status,
                'Start': format(start, 'yyyy-MM-dd'),
                'Due': format(new Date(t.endDate), 'yyyy-MM-dd'),
                'Description': t.description ?? '',
              });
            }
          });
        });
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(taskRows.length ? taskRows : [{ Note: 'No tasks in selected range' }]), 'Tasks');
      }

      const filename = `bethflow-${exportType}-${format(new Date(), 'yyyyMMdd')}.xlsx`;
      XLSX.writeFile(wb, filename);
      onClose();
    } finally {
      setExporting(false);
    }
  };

  const readyToExport = exportType === 'boards' ? !!boardDetails : !!projectDetails;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="anim-scale-in" style={{ background: 'var(--lin-panel)', border: '1px solid var(--lin-border-2)', borderRadius: 16, width: '100%', maxWidth: 420, padding: '28px 32px', boxShadow: '0 24px 80px rgba(0,0,0,0.5)', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--lin-text-1)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <IconDownload size={18} style={{ color: '#10b981' }} /> Export to Excel
          </h2>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(255,255,255,0.06)', border: 'none', color: 'var(--lin-text-3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconX size={15} />
          </button>
        </div>

        {/* Type selector */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          {([['boards', 'Boards & Cards', IconKanban], ['projects', 'Projects & Tasks', IconCalendar]] as const).map(([val, label, Icon]) => (
            <button key={val} onClick={() => setExportType(val as ExportType)}
              style={{ padding: '12px', borderRadius: 10, border: `1px solid ${exportType === val ? 'rgba(113,112,255,0.4)' : 'var(--lin-border-2)'}`, background: exportType === val ? 'rgba(113,112,255,0.1)' : 'transparent', color: exportType === val ? '#7170ff' : 'var(--lin-text-3)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, transition: 'all 0.15s', fontSize: 12, fontWeight: 600 }}>
              <Icon size={20} />
              {label}
            </button>
          ))}
        </div>

        {/* Date range */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--lin-text-3)', marginBottom: 10 }}>Date Range</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--lin-text-4)', marginBottom: 5 }}>FROM</div>
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
                style={{ width: '100%', background: 'var(--lin-surface-2)', border: '1px solid var(--lin-border-2)', borderRadius: 8, padding: '8px 10px', color: 'var(--lin-text-1)', fontSize: 13, outline: 'none', colorScheme: 'dark' }} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--lin-text-4)', marginBottom: 5 }}>TO</div>
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
                style={{ width: '100%', background: 'var(--lin-surface-2)', border: '1px solid var(--lin-border-2)', borderRadius: 8, padding: '8px 10px', color: 'var(--lin-text-1)', fontSize: 13, outline: 'none', colorScheme: 'dark' }} />
            </div>
          </div>
        </div>

        <div style={{ fontSize: 12, color: 'var(--lin-text-4)', marginBottom: 16 }}>
          {readyToExport
            ? `Ready to export ${exportType === 'boards' ? boardDetails?.length ?? 0 : projectDetails?.length ?? 0} ${exportType}`
            : 'Loading data…'}
        </div>

        <button onClick={() => void handleExport()} disabled={exporting || !readyToExport}
          style={{ width: '100%', padding: '12px', borderRadius: 10, background: 'linear-gradient(135deg, #10b981, #0891b2)', color: '#fff', fontSize: 14, fontWeight: 700, border: 'none', cursor: exporting || !readyToExport ? 'not-allowed' : 'pointer', opacity: exporting || !readyToExport ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.15s' }}>
          <IconDownload size={16} />
          {exporting ? 'Exporting…' : 'Download .xlsx'}
        </button>
      </div>
    </div>
  );
}
