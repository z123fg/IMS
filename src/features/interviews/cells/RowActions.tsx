import DeleteOutline from '@mui/icons-material/DeleteOutlineOutlined'
import MoreHoriz from '@mui/icons-material/MoreHoriz'
import IconButton from '@mui/material/IconButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import { useState } from 'react'

export function RowActions({ onDelete }: { onDelete: () => void }) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  return (
    <>
      <IconButton
        size="small"
        aria-label="更多操作"
        onClick={(e) => setAnchor(e.currentTarget)}
        sx={{ color: 'text.secondary' }}
      >
        <MoreHoriz fontSize="small" />
      </IconButton>
      <Menu
        anchorEl={anchor}
        open={anchor !== null}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem
          onClick={() => {
            setAnchor(null)
            onDelete()
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon sx={{ color: 'inherit' }}>
            <DeleteOutline fontSize="small" />
          </ListItemIcon>
          删除面试
        </MenuItem>
      </Menu>
    </>
  )
}
