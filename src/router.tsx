import Box from '@mui/material/Box'
import type { QueryClient } from '@tanstack/react-query'
import {
  createRootRouteWithContext,
  createRoute,
  createRouter,
  Outlet,
  redirect,
  stripSearchParams,
  useRouter,
} from '@tanstack/react-router'
import { useEffect } from 'react'
import { z } from 'zod'
import { AppHeader } from '@/components/AppHeader'
import { LoginPage } from '@/features/auth/LoginPage'
import { getSession, useSession } from '@/features/auth/session'
import { InterviewsPage } from '@/features/interviews/InterviewsPage'
import { listSearchDefaults, listSearchSchema } from '@/features/interviews/search'
import { queryClient } from '@/lib/queryClient'

const rootRoute = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: Outlet,
})

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  validateSearch: z.object({ redirect: z.string().optional().catch(undefined) }),
  beforeLoad: async () => {
    if (await getSession()) throw redirect({ to: '/' })
  },
  component: function Login() {
    const { redirect } = loginRoute.useSearch()
    return <LoginPage redirect={redirect} />
  },
})

const authedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: '_authed',
  beforeLoad: async ({ location }) => {
    const session = await getSession()
    if (!session) throw redirect({ to: '/login', search: { redirect: location.href } })
  },
  component: AuthedLayout,
})

function AuthedLayout() {
  const session = useSession()
  const router = useRouter()
  // 退出登录或会话失效后回到登录页
  useEffect(() => {
    if (session === null) void router.navigate({ to: '/login' })
  }, [session, router])

  return (
    <Box sx={{ height: '100dvh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      <AppHeader />
      <Outlet />
    </Box>
  )
}

export const indexRoute = createRoute({
  getParentRoute: () => authedRoute,
  path: '/',
  validateSearch: listSearchSchema,
  search: { middlewares: [stripSearchParams(listSearchDefaults)] },
  component: InterviewsPage,
})

const routeTree = rootRoute.addChildren([loginRoute, authedRoute.addChildren([indexRoute])])

export const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: 'intent',
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
