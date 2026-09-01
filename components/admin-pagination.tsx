'use client';

type AdminPaginationProps = {
  label: string;
  limit: number;
  offset: number;
  total: number;
  loading?: boolean;
  onOffsetChange: (offset: number) => void;
};

export function AdminPagination({
  label,
  limit,
  offset,
  total,
  loading = false,
  onOffsetChange,
}: AdminPaginationProps) {
  const start = total === 0 ? 0 : offset + 1;
  const end = Math.min(offset + limit, total);
  return (
    <div className="admin-pagination" role="group" aria-label={label}>
      <span aria-live="polite">{start}–{end} of {total.toLocaleString('en-GB')}</span>
      <div>
        <button type="button" disabled={loading || offset === 0} onClick={() => onOffsetChange(Math.max(0, offset - limit))}>Previous</button>
        <button type="button" disabled={loading || offset + limit >= total} onClick={() => onOffsetChange(offset + limit)}>Next</button>
      </div>
    </div>
  );
}
