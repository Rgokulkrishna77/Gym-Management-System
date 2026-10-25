import { useMemo, useState } from 'react';
import Icon from './Icon';
import { Spinner } from './ui';

/**
 * Data table with search, column sorting and pagination (all client-side).
 * columns: [{ key, header, sortable = true, render?: (row) => node }]
 */
export default function DataTable({ columns, data, searchKeys = [], pageSize = 8, loading, emptyText = 'No records found', toolbar, rowKey }) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState({ key: null, dir: 'asc' });
  const [page, setPage] = useState(1);

  const rows = useMemo(() => {
    let result = data || [];
    const q = query.trim().toLowerCase();
    if (q) result = result.filter((r) => searchKeys.some((k) => String(r[k] ?? '').toLowerCase().includes(q)));
    if (sort.key) {
      result = [...result].sort((a, b) => {
        const x = a[sort.key];
        const y = b[sort.key];
        const c = typeof x === 'number' && typeof y === 'number'
          ? x - y
          : String(x ?? '').localeCompare(String(y ?? ''), undefined, { numeric: true });
        return sort.dir === 'asc' ? c : -c;
      });
    }
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, query, sort]);

  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const current = Math.min(page, pages);
  const visible = rows.slice((current - 1) * pageSize, current * pageSize);

  const toggleSort = (key) => {
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }));
  };

  return (
    <div className="card p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
        <div className="relative w-full sm:max-w-xs">
          <Icon name="search" className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="search" aria-label="Search table" placeholder="Search..."
            value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            className="input pl-9"
          />
        </div>
        {toolbar}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              {columns.map((c) => {
                const sortable = c.sortable !== false && c.key !== 'actions';
                const active = sort.key === c.key;
                return (
                  <th key={c.key} scope="col" className="px-4 py-3 font-semibold"
                    aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
                    {sortable ? (
                      <button onClick={() => toggleSort(c.key)} className="inline-flex items-center gap-1 uppercase hover:text-slate-900 focus:outline-none focus-visible:underline">
                        {c.header}
                        <span aria-hidden="true" className={active ? 'text-brand-600' : 'text-slate-300'}>
                          {active ? (sort.dir === 'asc' ? '▲' : '▼') : '↕'}
                        </span>
                      </button>
                    ) : c.header}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={columns.length}><Spinner /></td></tr>
            ) : visible.length === 0 ? (
              <tr><td colSpan={columns.length} className="px-4 py-10 text-center text-slate-500">{emptyText}</td></tr>
            ) : (
              visible.map((row, i) => (
                <tr key={rowKey ? row[rowKey] : i} className="hover:bg-slate-50">
                  {columns.map((c) => (
                    <td key={c.key} className="px-4 py-3 align-middle text-slate-700">
                      {c.render ? c.render(row) : (row[c.key] ?? '-')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 p-3 text-sm text-slate-500">
        <span>{rows.length} record{rows.length === 1 ? '' : 's'}</span>
        <div className="flex items-center gap-2">
          <button className="btn btn-secondary btn-sm" onClick={() => setPage(current - 1)} disabled={current <= 1}>Previous</button>
          <span aria-live="polite">Page {current} of {pages}</span>
          <button className="btn btn-secondary btn-sm" onClick={() => setPage(current + 1)} disabled={current >= pages}>Next</button>
        </div>
      </div>
    </div>
  );
}
