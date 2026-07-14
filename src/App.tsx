import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { PrivateRoute } from './components/PrivateRoute'
import { DashboardLayout } from './layouts/DashboardLayout'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { MapView } from './pages/MapView'
import { Catalog } from './pages/Catalog'
import { Orders } from './pages/Orders'
import { Customers } from './pages/Customers'
import { Marketing } from './pages/Marketing'
import { Settings } from './pages/Settings'
import { Partners } from './pages/Partners'
import { Team } from './pages/Team'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Rotas Privadas */}
          <Route
            path="/"
            element={
              <PrivateRoute>
                <DashboardLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="orders" element={<Orders />} />
            <Route path="catalog" element={<Catalog />} />
            <Route path="customers" element={<Customers />} />
            <Route path="marketing" element={<Marketing />} />
            <Route path="map" element={<MapView />} />
            <Route path="settings" element={<Settings />} />
            <Route path="partners" element={<Partners />} />
            <Route path="team" element={<Team />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
