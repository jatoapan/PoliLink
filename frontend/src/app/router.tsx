import { createBrowserRouter, Navigate } from 'react-router'

import { AppLayout } from '@/app/layouts/AppLayout'
import { NotFoundPage } from '@/app/pages/NotFoundPage'
import { UiPreviewPage } from '@/app/pages/UiPreviewPage'
import { appRoutePatterns, appRoutes } from '@/app/routes'
import { AdminCatalogPage } from '@/features/admin/pages/AdminCatalogPage'
import { AdminCommunityRequestsPage } from '@/features/admin/pages/AdminCommunityRequestsPage'
import { AdminPage } from '@/features/admin/pages/AdminPage'
import { AuthLoadingState } from '@/features/auth/components/AuthLoadingState'
import { AuthRouteError } from '@/features/auth/components/AuthRouteError'
import { AuthLayout } from '@/features/auth/layouts/AuthLayout'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { RegisterPage } from '@/features/auth/pages/RegisterPage'
import {
  RequireAdmin,
  RequireAnonymous,
  RequireAuth,
} from '@/features/auth/route-guards'
import { CommunityCreationRequestsPage } from '@/features/communities/pages/CommunityCreationRequestsPage'
import { CommunityDetailPage } from '@/features/communities/pages/CommunityDetailPage'
import { CommunityDirectoryPage } from '@/features/communities/pages/CommunityDirectoryPage'
import { CommunityMembersPage } from '@/features/communities/pages/CommunityMembersPage'
import { EventCatalogPage } from '@/features/events/catalog/pages/EventCatalogPage'
import { EventDetailPage } from '@/features/events/detail/pages/EventDetailPage'
import { LandingPage } from '@/features/events/landing/pages/LandingPage'
import { CreateEventPage } from '@/features/events/management/pages/CreateEventPage'
import { EditEventPage } from '@/features/events/management/pages/EditEventPage'
import { OrganizerEventsPage } from '@/features/events/management/pages/OrganizerEventsPage'
import { CommunityOnboardingPage } from '@/features/organizer/pages/CommunityOnboardingPage'
import { OrganizePage } from '@/features/organizer/pages/OrganizePage'
import { OrganizerPage } from '@/features/organizer/pages/OrganizerPage'
import { EventAttendeesPage } from '@/features/registrations/attendees/pages/EventAttendeesPage'
import { MyRegistrationsPage } from '@/features/registrations/student/pages/MyRegistrationsPage'

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      {
        path: appRoutes.login.slice(1),
        element: (
          <RequireAnonymous loadingFallback={<AuthLoadingState />}>
            <LoginPage />
          </RequireAnonymous>
        ),
      },
      {
        path: appRoutes.register.slice(1),
        element: (
          <RequireAnonymous loadingFallback={<AuthLoadingState />}>
            <RegisterPage />
          </RequireAnonymous>
        ),
      },
    ],
  },
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: appRoutes.events.slice(1), element: <EventCatalogPage /> },
      {
        path: appRoutePatterns.eventDetail,
        element: <EventDetailPage />,
      },
      {
        path: appRoutes.communities.slice(1),
        element: <CommunityDirectoryPage />,
      },
      {
        path: appRoutePatterns.communityDetail,
        element: <CommunityDetailPage />,
      },
      {
        path: appRoutePatterns.eventEdit,
        element: (
          <RequireAuth
            errorFallback={<AuthRouteError />}
            loadingFallback={<AuthLoadingState />}
          >
            <EditEventPage />
          </RequireAuth>
        ),
      },
      {
        path: appRoutes.organize.slice(1),
        element: (
          <RequireAuth
            errorFallback={<AuthRouteError />}
            loadingFallback={<AuthLoadingState />}
          >
            <OrganizePage />
          </RequireAuth>
        ),
      },
      {
        path: appRoutes.createCommunity.slice(1),
        element: (
          <RequireAuth
            errorFallback={<AuthRouteError />}
            loadingFallback={<AuthLoadingState />}
          >
            <CommunityOnboardingPage />
          </RequireAuth>
        ),
      },
      {
        path: appRoutes.communityRequests.slice(1),
        element: (
          <RequireAuth
            errorFallback={<AuthRouteError />}
            loadingFallback={<AuthLoadingState />}
          >
            <CommunityCreationRequestsPage />
          </RequireAuth>
        ),
      },
      {
        path: appRoutes.myCommunities.slice(1),
        element: (
          <RequireAuth
            errorFallback={<AuthRouteError />}
            loadingFallback={<AuthLoadingState />}
          >
            <OrganizerPage />
          </RequireAuth>
        ),
      },
      {
        path: appRoutePatterns.communityMembers,
        element: (
          <RequireAuth
            errorFallback={<AuthRouteError />}
            loadingFallback={<AuthLoadingState />}
          >
            <CommunityMembersPage />
          </RequireAuth>
        ),
      },
      {
        path: appRoutes.myEvents.slice(1),
        element: (
          <RequireAuth
            errorFallback={<AuthRouteError />}
            loadingFallback={<AuthLoadingState />}
          >
            <OrganizerEventsPage />
          </RequireAuth>
        ),
      },
      {
        path: appRoutes.createEvent.slice(1),
        element: (
          <RequireAuth
            errorFallback={<AuthRouteError />}
            loadingFallback={<AuthLoadingState />}
          >
            <CreateEventPage />
          </RequireAuth>
        ),
      },
      {
        path: appRoutes.myRegistrations.slice(1),
        element: (
          <RequireAuth
            errorFallback={<AuthRouteError />}
            loadingFallback={<AuthLoadingState />}
          >
            <MyRegistrationsPage />
          </RequireAuth>
        ),
      },
      {
        path: appRoutePatterns.eventAttendees,
        element: (
          <RequireAuth
            errorFallback={<AuthRouteError />}
            loadingFallback={<AuthLoadingState />}
          >
            <EventAttendeesPage />
          </RequireAuth>
        ),
      },
      {
        path: appRoutes.admin.slice(1),
        element: (
          <RequireAdmin
            errorFallback={<AuthRouteError />}
            loadingFallback={<AuthLoadingState />}
          >
            <AdminPage />
          </RequireAdmin>
        ),
      },
      {
        path: appRoutes.adminCommunityRequests.slice(1),
        element: (
          <RequireAdmin
            errorFallback={<AuthRouteError />}
            loadingFallback={<AuthLoadingState />}
          >
            <AdminCommunityRequestsPage />
          </RequireAdmin>
        ),
      },
      {
        path: appRoutes.adminCatalog.slice(1),
        element: (
          <RequireAdmin
            errorFallback={<AuthRouteError />}
            loadingFallback={<AuthLoadingState />}
          >
            <AdminCatalogPage />
          </RequireAdmin>
        ),
      },
      {
        path: appRoutes.legacyOrganizer.slice(1),
        element: <Navigate replace to={appRoutes.organize} />,
      },
      { path: appRoutes.uiPreview.slice(1), element: <UiPreviewPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
