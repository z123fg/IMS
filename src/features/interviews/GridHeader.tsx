import Box from '@mui/material/Box'
import TableSortLabel from '@mui/material/TableSortLabel'
import type { SortDir, SortKey, SortOption } from './filter'
import { GRID_COLUMNS, HEADER_H } from './layout'

const COLUMNS: { label: string; sort?: SortKey }[] = [
  { label: 'Client', sort: 'client' },
  { label: 'Vendor', sort: 'vendor' },
  { label: '面试者', sort: 'interviewee' },
  { label: '面试官', sort: 'interviewer' },
  { label: '面试类型', sort: 'interview_type' },
  { label: '收到面试日期', sort: 'received_at' },
  { label: '面试日期', sort: 'interview_at' },
  { label: 'JD' },
  { label: '材料' },
  { label: '面试题' },
  { label: '' },
]

type Props = { sort: SortOption; dir: SortDir; onSort: (key: SortKey) => void }

export function GridHeader({ sort, dir, onSort }: Props) {
  return (
    <Box
      role="row"
      sx={{
        display: 'grid',
        gridTemplateColumns: GRID_COLUMNS,
        height: HEADER_H,
        alignItems: 'center',
        px: 1,
        position: 'sticky',
        top: 0,
        zIndex: 4,
        bgcolor: 'background.default',
        borderBottom: 1,
        borderColor: 'divider',
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: '0.02em',
        color: 'text.secondary',
      }}
    >
      {COLUMNS.map((c, i) => (
        <Box
          key={i}
          role="columnheader"
          aria-sort={c.sort === sort ? (dir === 'asc' ? 'ascending' : 'descending') : undefined}
          sx={{ px: 1.75, whiteSpace: 'nowrap' }}
        >
          {c.sort ? (
            <TableSortLabel
              active={sort === c.sort}
              direction={sort === c.sort ? dir : 'asc'}
              onClick={() => onSort(c.sort!)}
              sx={{ fontSize: 'inherit', fontWeight: 'inherit' }}
            >
              {c.label}
            </TableSortLabel>
          ) : (
            c.label
          )}
        </Box>
      ))}
    </Box>
  )
}
