import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthProvider'
import { ThemeProvider } from './context/ThemeProvider'
import { ToastProvider } from './context/ToastProvider'
import ProtectedRoute from './components/ProtectedRoute'
import GuestRoute from './components/GuestRoute'
import AdminRoute from './components/AdminRoute'
import AppLayout from './layouts/AppLayout'
import Login from './pages/Login'
import Register from './pages/Register'
import VerifyEmail from './pages/VerifyEmail'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import NotFound from './pages/NotFound'
import Dashboard from './pages/Dashboard'
import Documents from './pages/Documents'
import DocumentDetail from './pages/DocumentDetail'
import Profile from './pages/Profile'
import AdminUsers from './pages/admin/Users'
import AdminLogs from './pages/admin/Logs'

function AppRoutes() {
  return (
    <Routes>
      {/* Routes publiques — redirige si déjà connecté */}
      <Route path="/login"            element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/register"         element={<GuestRoute><Register /></GuestRoute>} />
      <Route path="/forgot-password"  element={<GuestRoute><ForgotPassword /></GuestRoute>} />
      <Route path="/reset-password"   element={<ResetPassword />} />

      {/* Vérification email — accessible sans être connecté */}
      <Route path="/verify-email"           element={<VerifyEmail />} />
      <Route path="/verify-email/:id/:hash" element={<VerifyEmail />} />

      {/* Routes protégées */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Routes>
                <Route path="/dashboard"  element={<Dashboard />} />
                <Route path="/documents"  element={<Documents />} />
                <Route path="/documents/:id" element={<DocumentDetail />} />
                <Route path="/profil"     element={<Profile />} />

                {/* Routes admin uniquement */}
                <Route path="/admin/utilisateurs" element={<AdminRoute><AdminUsers /></AdminRoute>} />
                <Route path="/admin/logs"         element={<AdminRoute><AdminLogs /></AdminRoute>} />

                {/* 404 dans l'app */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AppLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
