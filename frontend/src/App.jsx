import { Route, Routes } from 'react-router-dom'
import Dashboard from './pages/LoginPage'
import Complaint from './pages/ComplaintPage'
import AdminDashboard from './pages/AdminPage'
import RequireAdmin from './components/RequireAdmin'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/complaint" element={<Complaint />} />
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
