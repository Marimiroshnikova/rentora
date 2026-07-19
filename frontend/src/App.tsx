import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { LanguageProvider } from './context/LanguageContext'
import { Layout } from './components/layout/Layout'
import { DashboardShell } from './components/layout/DashboardShell'
import { ScrollToTop } from './components/layout/ScrollToTop'
import { AuthLayout } from './components/layout/AuthLayout'
import { AdminRoute, PrivateRoute } from './components/auth/PrivateRoute'
import { HomePage } from './pages/HomePage'
import { BrowsePage } from './pages/BrowsePage'
import { ListingDetailPage } from './pages/ListingDetailPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { AddListingPage } from './pages/AddListingPage'
import { EditListingPage } from './pages/EditListingPage'
import { MyListingsPage } from './pages/MyListingsPage'
import { ProfilePage } from './pages/ProfilePage'
import { DashboardPage } from './pages/DashboardPage'
import { BookingsPage } from './pages/BookingsPage'
import { BookingDetailPage } from './pages/BookingDetailPage'
import { NotificationsPage } from './pages/NotificationsPage'
import { MessagesPage } from './pages/MessagesPage'
import { FavoritesPage } from './pages/FavoritesPage'
import { AdminPage } from './pages/AdminPage'
import { FaqPage } from './pages/FaqPage'
import { MapPage } from './pages/MapPage'
import { LegalPage, TermsPrivacyPage } from './pages/LegalPage'
import { HashRedirect } from './pages/HashRedirect'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 15_000, retry: 1 },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <BrowserRouter>
              <ScrollToTop />
              <Routes>
                <Route element={<AuthLayout />}>
                  <Route path="login" element={<LoginPage />} />
                  <Route path="register" element={<RegisterPage />} />
                </Route>
                <Route element={<Layout />}>
                  <Route index element={<HomePage />} />
                  <Route path="browse" element={<BrowsePage />} />
                  <Route path="map" element={<MapPage />} />
                  <Route path="items/:id" element={<ListingDetailPage />} />
                  <Route path="how-it-works" element={<HashRedirect hash="#how-it-works" />} />
                  <Route path="faq" element={<FaqPage />} />
                  <Route path="terms" element={<TermsPrivacyPage />} />
                  <Route path="privacy" element={<Navigate to="/terms" replace />} />
                  <Route
                    path="pricing"
                    element={<LegalPage titleKey="pricingTitle" bodyKey="pricingBody" />}
                  />
                  <Route
                    path="listings/new"
                    element={
                      <PrivateRoute>
                        <AddListingPage />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="listings/:id/edit"
                    element={
                      <PrivateRoute>
                        <EditListingPage />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="profile"
                    element={
                      <PrivateRoute>
                        <ProfilePage />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    element={
                      <PrivateRoute>
                        <DashboardShell />
                      </PrivateRoute>
                    }
                  >
                    <Route path="dashboard" element={<DashboardPage />} />
                    <Route path="dashboard/bookings" element={<BookingsPage />} />
                    <Route path="dashboard/bookings/:id" element={<BookingDetailPage />} />
                    <Route path="dashboard/notifications" element={<NotificationsPage />} />
                    <Route path="dashboard/messages" element={<MessagesPage />} />
                    <Route path="dashboard/favorites" element={<FavoritesPage />} />
                    <Route path="dashboard/listings" element={<MyListingsPage />} />
                  </Route>
                  <Route
                    path="admin"
                    element={
                      <AdminRoute>
                        <AdminPage />
                      </AdminRoute>
                    }
                  />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
