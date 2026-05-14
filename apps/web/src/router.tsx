import {
  createRouter,
  createRootRoute,
  createRoute,
  Outlet,
  redirect,
} from '@tanstack/react-router';
import { useAuthStore } from './stores/auth.store.js';

// Layout components
import { GuestLayout } from './pages/guest/GuestLayout.js';
import { AuthLayout } from './pages/auth/AuthLayout.js';
import { UserLayout } from './pages/user/UserLayout.js';
import { AdminLayout } from './pages/admin/AdminLayout.js';

// Pages
import { GuestHomePage } from './pages/guest/GuestHome.js';
import { ContactPage } from './pages/guest/Contact.js';
import { LoginPage } from './pages/auth/Login.js';
import { RegisterPage } from './pages/auth/Register.js';
import { UserDashboardPage } from './pages/user/Dashboard.js';
import { BoardsPage } from './pages/user/Boards.js';
import { BoardDetailPage } from './pages/user/BoardDetail.js';
import { ProjectsPage } from './pages/user/Projects.js';
import { ProjectDetailPage } from './pages/user/ProjectDetail.js';
import { CatalogsPage } from './pages/user/Catalogs.js';
import { SocialLinksPage } from './pages/user/SocialLinks.js';
import { PublicProfilePage } from './pages/guest/PublicProfile.js';
import { AdminDashboardPage } from './pages/admin/AdminDashboard.js';
import { AdminUsersPage } from './pages/admin/AdminUsers.js';

// Root
const rootRoute = createRootRoute({ component: Outlet });

// Guest routes (no auth required)
const guestLayoutRoute = createRoute({ getParentRoute: () => rootRoute, id: 'guest-layout', component: GuestLayout });
const homeRoute = createRoute({ getParentRoute: () => guestLayoutRoute, path: '/', component: GuestHomePage });
const contactRoute = createRoute({ getParentRoute: () => guestLayoutRoute, path: '/contact', component: ContactPage });
const publicProfileRoute = createRoute({ getParentRoute: () => guestLayoutRoute, path: '/u/$username/links', component: PublicProfilePage });

// Auth routes
const authLayoutRoute = createRoute({ getParentRoute: () => rootRoute, id: 'auth-layout', component: AuthLayout });
const loginRoute = createRoute({ getParentRoute: () => authLayoutRoute, path: '/login', component: LoginPage });
const registerRoute = createRoute({ getParentRoute: () => authLayoutRoute, path: '/register', component: RegisterPage });

// User routes (auth required)
const userLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'user-layout',
  component: UserLayout,
  beforeLoad: () => {
    const user = useAuthStore.getState().user;
    if (!user) throw redirect({ to: '/login' });
  },
});
const dashboardRoute = createRoute({ getParentRoute: () => userLayoutRoute, path: '/dashboard', component: UserDashboardPage });
const boardsRoute = createRoute({ getParentRoute: () => userLayoutRoute, path: '/boards', component: BoardsPage });
const boardDetailRoute = createRoute({ getParentRoute: () => userLayoutRoute, path: '/boards/$boardId', component: BoardDetailPage });
const projectsRoute = createRoute({ getParentRoute: () => userLayoutRoute, path: '/projects', component: ProjectsPage });
const projectDetailRoute = createRoute({ getParentRoute: () => userLayoutRoute, path: '/projects/$projectId', component: ProjectDetailPage });
const catalogsRoute = createRoute({ getParentRoute: () => userLayoutRoute, path: '/catalogs', component: CatalogsPage });
const socialLinksRoute = createRoute({ getParentRoute: () => userLayoutRoute, path: '/social-links', component: SocialLinksPage });

// Admin routes (admin only)
const adminLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'admin-layout',
  component: AdminLayout,
  beforeLoad: () => {
    const user = useAuthStore.getState().user;
    if (!user || user.role !== 'ADMIN') throw redirect({ to: '/dashboard' });
  },
});
const adminDashboardRoute = createRoute({ getParentRoute: () => adminLayoutRoute, path: '/admin', component: AdminDashboardPage });
const adminUsersRoute = createRoute({ getParentRoute: () => adminLayoutRoute, path: '/admin/users', component: AdminUsersPage });

const routeTree = rootRoute.addChildren([
  guestLayoutRoute.addChildren([homeRoute, contactRoute, publicProfileRoute]),
  authLayoutRoute.addChildren([loginRoute, registerRoute]),
  userLayoutRoute.addChildren([dashboardRoute, boardsRoute, boardDetailRoute, projectsRoute, projectDetailRoute, catalogsRoute, socialLinksRoute]),
  adminLayoutRoute.addChildren([adminDashboardRoute, adminUsersRoute]),
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
