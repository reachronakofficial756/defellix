import Navbar from '@/components/Navbar'
import Dashboard from '@/components/Dashboard'
import { Route, Routes } from 'react-router-dom'

function HomePage() {
  return (
    <div className="flex flex-col h-screen w-full bg-[#0f1117]">
      <Navbar />
      <div className="flex-1 overflow-y-auto scrBar">
        <Routes>
          <Route path="/" element={<Dashboard />} />
        </Routes>
      </div>
    </div>
  )
}

export default HomePage