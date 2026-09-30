import Box from '@mui/material/Box'

export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <Box
      aria-hidden
      sx={{
        width: size,
        height: size,
        borderRadius: `${size * 0.3}px`,
        display: 'grid',
        placeItems: 'center',
        color: '#fff',
        fontWeight: 800,
        fontSize: size * 0.34,
        letterSpacing: '0.02em',
        background: 'linear-gradient(135deg, #4f5bd5 0%, #7c5cf0 55%, #0ea5a4 100%)',
        boxShadow: '0 4px 14px rgba(79, 91, 213, 0.35)',
        flex: 'none',
      }}
    >
      IMS
    </Box>
  )
}
