import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Auth/Login'
import SignUp from './pages/Auth/SignUp'
import Home from './pages/dashboard/Home'
import Income from './pages/dashboard/Income'
import Expense from './pages/dashboard/Expense'
import Profile from './pages/dashboard/Profile'
import RequireAuth from './components/auth/RequireAuth'
import DashboardLayout from './components/layouts/DashboardLayout'
import { FinanceProvider } from './context/FinanceContext'

const App = () => {
  return (
    <div>
      <Router>
        <FinanceProvider>
          <Routes>
            <Route path="/" element={<Root />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signUp" element={<SignUp />} />
            <Route
              element={
                <RequireAuth>
                  <DashboardLayout />
                </RequireAuth>
              }
            >
              <Route path="/dashboard" element={<Home />} />
              <Route path="/income" element={<Income />} />
              <Route path="/expense" element={<Expense />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
          </Routes>
        </FinanceProvider>
      </Router>
    </div>
  )
}

export default App

const Root = () => {
  const hasSession = !!(
    localStorage.getItem('token') ||
    sessionStorage.getItem('token') ||
    localStorage.getItem('refreshToken') ||
    sessionStorage.getItem('refreshToken')
  )
  return hasSession ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
}
