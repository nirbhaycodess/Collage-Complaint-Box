import { Navigate, Route, Routes } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Complaint from './pages/Complaint'
import Admin from './pages/Admin'
import AdminDashboard from './pages/AdminDashboard'
import RequireAdmin from './components/RequireAdmin'
import TrackComplaint from './pages/TrackComplaint'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/complaint" element={<Complaint />} />
      <Route path="/track" element={<TrackComplaint />} />
      <Route path="/track/:id" element={<TrackComplaint />} />
      <Route path="/admin" element={<Admin />} />
      <Route
        path="/admin/dashboard"
        element={
          <RequireAdmin>
            <AdminDashboard />
          </RequireAdmin>
        }
      />
    </Routes>
  )
}

export default App
