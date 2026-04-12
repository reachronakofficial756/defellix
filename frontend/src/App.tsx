import './App.css'
import { Routes, Route, Navigate } from 'react-router-dom'
import HomePage from './Pages/HomePage'
import LandingPage from './Pages/LandingPage'
import SignUp from './Pages/SignUp'
import Login from './Pages/Login'
import ClientContractReview from './Pages/ClientContractReview'
import MilestoneSubmission from './Pages/MilestoneSubmission'
import MilestoneReview from './Pages/MilestoneReview'
import ContractReview from './Pages/ContractReview'
import PublicProfile from './Pages/PublicProfile'
import { useAuth } from './contexts/AuthContext'
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';



function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, isProfileComplete } = useAuth()
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f1117]">
        <div className="w-10 h-10 rounded-full border-2 border-[#3cb44f]/30 border-t-[#3cb44f] animate-spin" />
      </div>
    )
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />
  // Authenticated but profile not completed → force them through the signup wizard
  if (!isProfileComplete) return <Navigate to="/signup?step=2" replace />
  return <>{children}</>
}

function CatchAll() {
  const { isAuthenticated, isProfileComplete, isLoading } = useAuth()
  if (isLoading) return null
  if (isAuthenticated && isProfileComplete) return <Navigate to="/dashboard" replace />
  return <Navigate to="/" replace />
}

function App() {
  return (
    <>
      <Analytics />
      <SpeedInsights />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />

        <Route path="/review-contract/:contractId" element={<ClientContractReview />} />
        <Route path="/submit-milestone/:contractId" element={<ProtectedRoute><MilestoneSubmission /></ProtectedRoute>} />
        <Route path="/review-milestone/:contractId" element={<MilestoneReview />} />
        <Route path="/review/:token" element={<ContractReview />} />
        {/* All dashboard routes are protected */}
        <Route path="/dashboard/*" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />

        {/* Public profile vanity URL */}
        <Route path="/:userName" element={<PublicProfile />} />

        {/* Catch-all: go to dashboard if logged in, else landing */}
        <Route path="*" element={<CatchAll />} />
      </Routes>
    </>
  )
}

export default App
