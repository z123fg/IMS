import Box from '@mui/material/Box'
import TableSortLabel from '@mui/material/TableSortLabel'
import type { SortDir, SortKey, SortOption } from './filter'
import { useT, type Messages } from '@/i18n'
import { gridColumns, HEADER_H } from './layout'

const columns = (m: Messages): { label: string; sort?: SortKey }[] => [
  { label: m.columns.client, sort: 'client' },
  { label: m.columns.vendor, sort: 'vendor' },
  { label: m.columns.interviewee, sort: 'interviewee' },
  { label: m.columns.interviewer, sort: 'interviewer' },
  { label: m.columns.interviewType, sort: 'interview_type' },
  { label: m.columns.receivedAt, sort: 'received_at' },
  { label: m.columns.interviewAt, sort: 'interview_at' },
  { label: m.docs.jd },
  { label: m.docs.materials },
  { label: m.docs.questions },
  { label: '' },
]

type Props = { sort: SortOption; dir: SortDir; onSort: (key: SortKey) => void }

export function GridHeader({ sort, dir, onSort }: Props) {
  const m = useT()
  return (
    <Box
      role="row"
      sx={{
        display: 'grid',
        gridTemplateColumns: gridColumns,
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
      {columns(m).map((c, i) => (
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
