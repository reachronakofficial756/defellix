import Navbar from '@/components/Navbar'
import Dashboard from '@/components/Dashboard'
import ContractsOverlay from '@/components/ContractsOverlay'
import { Route, Routes } from 'react-router-dom'
import { useContractsStore } from '@/store/useContractsStore'

function HomePage() {
  const isOpen = useContractsStore((state) => state.isOpen);

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
            </Routes>
          </div>
        )}
      </div>
    </div>
  )
}

export default HomePage