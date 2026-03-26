import Navbar from '@/components/Navbar'
import Dashboard from '@/components/Dashboard'
import ContractsOverlay from '@/components/ContractsOverlay'
import Profile from '@/Pages/Profile'
import ProfileEdit from '@/Pages/ProfileEdit'
import { Route, Routes, useNavigate, useLocation } from 'react-router-dom'
import { useContractsStore } from '@/store/useContractsStore'
import CreateContractForm from '@/components/CreateContractForm'
import { clearPrdExtractedText } from '@/utils/prdSessionCache'
import { useEffect, useRef } from 'react'

/** Matches create/edit contract wizard (nested under /dashboard/* or legacy /contract). */
function isContractWizardPath(p: string): boolean {
  return (
    p === "/contract" ||
    p === "/dashboard/contract" ||
    /^\/contract\/\d+$/.test(p) ||
    /^\/dashboard\/contract\/\d+$/.test(p)
  );
}

function HomePage() {
  const isOpen = useContractsStore((state) => state.isOpen);
  const navigate = useNavigate();
  const location = useLocation();
  const prevPathRef = useRef(location.pathname);

  useEffect(() => {
    const prev = prevPathRef.current;
    prevPathRef.current = location.pathname;
    const wasContract = isContractWizardPath(prev);
    const nowContract = isContractWizardPath(location.pathname);
    if (wasContract && !nowContract) {
      clearPrdExtractedText();
    }
  }, [location.pathname]);

  const leaveContractToDashboard = () => {
    clearPrdExtractedText();
    navigate("/dashboard");
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#0f1117]">
      <Navbar />
      <div className="flex-1 overflow-hidden">
        {isOpen ? (
          <ContractsOverlay />
        ) : (
          <div className="h-full overflow-y-auto scrBar">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              {/* Own profile can be viewed either at /profile or at /:userName (vanity URL for logged-in user) */}
              <Route path="/profile" element={<Profile />} />
              <Route path="/:userName" element={<Profile />} />
              <Route path="/profile/edit" element={<ProfileEdit />} />
              <Route path="/contract" element={<CreateContractForm onClose={leaveContractToDashboard} />} />
              <Route path="/contract/:contractId" element={<CreateContractForm onClose={leaveContractToDashboard} />} />
            </Routes>

          </div>
        )}
      </div>
    </div>
  )
}

export default HomePage