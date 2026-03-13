import { useNavigate, useLocation } from 'react-router-dom'
import { IoGridOutline, IoFolderOutline, IoPeopleOutline, IoPersonOutline, IoSettingsOutline, IoLogOutOutline } from "react-icons/io5";
import { FaBolt } from "react-icons/fa6";
import { Link } from 'react-router-dom';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const mainLinks = [
    { icon: IoGridOutline, label: 'Dashboard', path: '/' },
    { icon: IoFolderOutline, label: 'Contracts', path: '/contracts' },
    { icon: IoPeopleOutline, label: 'Team', path: '/team' },
  ]

  const profileLinks = [
    { icon: IoPersonOutline, label: 'Profile', path: '/profile' },
    { icon: IoSettingsOutline, label: 'Profile Settings', path: '/profile/settings' },
  ]

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    if (path === '/profile') {
      return location.pathname === '/profile' || 
             (location.pathname.startsWith('/profile/') && !location.pathname.startsWith('/profile/settings'))
    }
    if (path === '/profile/settings') {
      return location.pathname.startsWith('/profile/settings')
    }
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  return (
    <div className="w-[240px] bg-[#eaf7f6] h-full flex flex-col py-6 border border-r-teal-500">
      <div className="px-6 mb-8">
        <div className="flex items-center gap-2">
          <FaBolt className="text-teal-600 text-2xl" />
          <h1 className="text-xl font-bold text-black">Defellix</h1>
        </div>
      </div>
      <div className="flex flex-col flex-1 px-4">
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">MAIN</h2>
          <nav className="flex flex-col gap-1">
            {mainLinks.map((link) => {
              const Icon = link.icon
              const active=isActive(link.path)
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
                    active
                      ? 'bg-teal-600 text-white' 
                      : 'text-white hover:bg-white/20'
                  }`}
                >
                  <Icon className={`text-lg text-black ${active ? 'text-white' : 'text-black'}`}/>
                  <span className={`font-medium text-sm ${active ? 'text-white' : 'text-black'}`}>{link.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">PROFILE</h2>
          <nav className="flex flex-col gap-1">
            {profileLinks.map((link) => {
              const Icon = link.icon
              const active = isActive(link.path)
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
                    active 
                      ? 'bg-teal-600 text-white' 
                      : 'text-black hover:bg-white/20'
                  }`}
                >
                  <Icon className={`text-lg ${active ? 'text-white' : 'text-black'}`}/>
                  <span className={`font-medium text-sm ${active ? 'text-white' : 'text-black'}`}>
                    {link.label}
                  </span>
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
      <div className="px-4 mt-auto">
        <div className="flex items-center gap-3 p-3 bg-white/10 rounded-lg">
          <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
            <img 
              src="https://via.placeholder.com/40" 
              alt="Profile" 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-black truncate">Alex Morgan</h3>
            <p className="text-xs text-gray-600 truncate">Product Designer</p>
          </div>
          <button 
            onClick={() => navigate('/login')}
            className="shrink-0 p-1.5 hover:bg-white/20 rounded transition-colors">
            <IoLogOutOutline className="text-lg text-black" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default Sidebar