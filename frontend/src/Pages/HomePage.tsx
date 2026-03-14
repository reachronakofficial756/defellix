import Navbar from '@/components/Navbar'
import Dashboard from '@/components/Dashboard'
import ContractsOverlay from '@/components/ContractsOverlay'
import Profile from '@/Pages/Profile'
import ProfileEdit from '@/Pages/ProfileEdit'
import { Route, Routes, useNavigate } from 'react-router-dom'
import { useContractsStore } from '@/store/useContractsStore'
import CreateContractForm from '@/components/CreateContractForm'

function HomePage() {
  const isOpen = useContractsStore((state) => state.isOpen);
  const navigate = useNavigate();

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
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/profileEdit" element={<ProfileEdit />} />
              <Route path="/contract" element={<CreateContractForm onClose={() => navigate("/")} />} />
            </Routes>

          </div>
        )}
      </div>
    </div>
  )
}

export default HomePage