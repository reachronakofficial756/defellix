import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useContractsStore } from '@/store/useContractsStore';
import { useState, useRef, useEffect } from 'react';
import { IoGridOutline, IoFolderOutline } from 'react-icons/io5';
import { User, LogOut } from 'lucide-react';
import logo from '@/assets/logo.svg';
import { BiSolidBellRing } from "react-icons/bi";
import NotificationPanel from '@/components/NotificationPanel';
import { apiClient } from '@/api/client';
import { useAuth } from '@/contexts/AuthContext'

type NavbarUser = {
    user_name?: string;
    full_name?: string;
    what_do_you_do?: string;
    email?: string;
    photo?: string;
};

function getInitials(user: NavbarUser | null): string {
    if (!user) return '?';
    const name = user.full_name || user.user_name || '';
    if (name) {
        const parts = name.trim().split(/\s+/);
        if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        if (parts[0]) return parts[0].slice(0, 2).toUpperCase();
    }
    const email = user.email || '';
    if (email) return email.slice(0, 2).toUpperCase();
    return '?';
}

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { openContracts, closeContracts, isOpen: contractsOpen } = useContractsStore();
    const { logout } = useAuth();

    const [user, setUser] = useState<NavbarUser | null>(null);
    const [userLoading, setUserLoading] = useState(true);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [hasContracts, setHasContracts] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await apiClient.get('/users/me');
                const apiData = res.data?.data || res.data;
                const profile = apiData.profile || apiData;
                setUser({
                    user_name: profile?.user_name ?? apiData?.user_name,
                    full_name: profile?.full_name ?? apiData?.full_name,
                    what_do_you_do: profile?.what_do_you_do ?? apiData?.what_do_you_do,
                    email: apiData?.email ?? profile?.email,
                    photo: profile?.photo ?? apiData?.photo
                });
                // Store name for CreateContractForm freelancer_name field
                const name = profile?.full_name ?? apiData?.full_name ?? profile?.user_name ?? apiData?.user_name;
                if (name) window.localStorage.setItem('profile_name', name);
            } catch {
                setUser(null);
            } finally {
                setUserLoading(false);
            }
        };
        fetchUser();
    }, []);

    // Derive unread notification count from contracts
    useEffect(() => {
        const fetchCount = async () => {
            try {
                const res = await apiClient.get('/contracts');
                const contracts: any[] = (res as any).data?.data?.contracts || [];
                setHasContracts(contracts.length > 0);
                const now = new Date();
                let count = 0;
                contracts.forEach((c) => {
                    if (c.status === 'pending') count++; // revision request
                    if (c.status === 'sent') count++;     // awaiting client signature
                    if (c.status === 'signed') count++;   // freshly signed
                    // overdue milestones
                    (c.milestones || []).forEach((ms: any) => {
                        if (ms.status === 'approved' || ms.status === 'paid') return;
                        if (ms.due_date && new Date(ms.due_date) < now) count++;
                        else if (ms.due_date) {
                            const days = Math.ceil((new Date(ms.due_date).getTime() - now.getTime()) / 86400000);
                            if (days <= 2) count++;
                        }
                    });
                });
                setUnreadCount(count);
            } catch { /* silent */ }
        };
        fetchCount();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const navLinks = [
        { icon: IoGridOutline, label: 'Dashboard', path: '/dashboard' },
        { icon: IoFolderOutline, label: 'Contracts', path: '/dashboard/contracts' },
    ];

    const isActive = (path: string) => {
        if (path === '/dashboard') return location.pathname === '/dashboard';
        return location.pathname === path || location.pathname.startsWith(path + '/');
    };

    return (
        <>
            <nav
                className={
                    `h-16 fixed top-0 w-full px-6 py-10 flex items-center justify-between z-50` +
                    (location.pathname.startsWith('/dashboard/profile')
                        ? ' bg-[#111f14]/10 backdrop-blur-md'
                        : '')
                }
            >
                {/* Logo */}
                <div
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => navigate('/dashboard')}
                    role="button"
                    tabIndex={0}
                    onKeyPress={e => {
                        if (e.key === "Enter" || e.key === " ") navigate('/dashboard');
                    }}
                >
                    <img src={logo} alt="Defellix" className="w-52 h-auto" />
                </div>

                {/* Nav Links */}
                <div className="flex items-center">
                    {navLinks.map((link) => {
                        if (link.label === 'Contracts' && !hasContracts) return null;
                        const active = isActive(link.path);
                        return link.label === 'Contracts' ? (
                            <button
                                key={link.path}
                                onClick={() => openContracts()}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer ${contractsOpen
                                    ? 'bg-[#3cb44f] text-[#0d140d]'
                                    : 'bg-[#d4edda]/20 text-gray-400'
                                    }`}
                            >
                                {/* <Icon className={`text-base ${contractsOpen ? 'text-black' : ''}`} /> */}
                                {link.label}
                            </button>
                        ) : (
                            <Link
                                key={link.path}
                                to={link.path}
                                onClick={closeContracts}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${active && !contractsOpen
                                    ? 'bg-[#3cb44f] text-[#0d140d]'
                                    : 'bg-[#3cb44f]/5 text-gray-400'
                                    }`}
                            >
                                {/* <Icon className={`text-base ${active && !contractsOpen ? 'text-black' : ''}`} /> */}
                                {link.label}
                            </Link>
                        );
                    })}
                </div>

                {/* Right: Actions + Profile */}
                <div className="flex items-center gap-7">

                    {/* Notifications Button */}
                    <button
                        type="button"
                        onClick={() => setIsNotifOpen((prev) => !prev)}
                        className={`relative flex items-center cursor-pointer justify-center w-11 h-11 rounded-full transition-all duration-200 focus:outline-none mr-0.5 ${isNotifOpen
                            ? 'bg-[#3cb44f]/15 text-[#3cb44f]'
                            : 'bg-[#1a1d24] text-gray-400 hover:text-white hover:bg-[#3cb44f]/10'
                            }`}
                        aria-label="Notifications"
                    >
                        <BiSolidBellRing className="text-xl transition-colors" />
                        {/* Dynamic unread badge */}
                        {unreadCount > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#3cb44f] text-[#0d140d] text-[9px] font-black flex items-center justify-center shadow-[0_0_8px_rgba(60,180,79,0.8)] leading-none">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>

                    <div className="relative" ref={dropdownRef}>
                        {/* Profile Toggle */}
                        <div
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="flex items-center gap-2 bg-[#ffffff] px-0.5 rounded-full py-0.5 cursor-pointer transition-colors"
                        >
                            <div className="w-10 h-10 rounded-full bg-[#3cb44f] -ml-5 flex items-center justify-center text-[#0d140d] font-bold text-xs overflow-hidden">
                                {userLoading ? (
                                    <span className="animate-pulse">…</span>
                                ) : user?.photo ? (
                                    <img src={user.photo} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    getInitials(user)
                                )}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-black text-xs font-semibold leading-none">
                                    {userLoading ? '…' : (user?.full_name || user?.user_name || 'Profile')}
                                </span>
                                <span className="text-gray-400 text-[10px] leading-none mt-0.5">
                                    {userLoading ? '…' : (user?.what_do_you_do || '')}
                                </span>
                            </div>
                            <div className="w-10 h-10 flex items-center justify-center rounded-full bg-black hover:bg-neutral-800 transition-colors">
                                <svg
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    className="text-white transition-transform duration-200"
                                    style={{
                                        transform: isDropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                                    }}
                                >
                                    <path d="M8 10l4 4 4-4" stroke="white" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                        </div>

                        {/* Dropdown Menu */}
                        {isDropdownOpen && (
                            <div className="absolute right-0 top-full mt-3 w-[260px] bg-[#1a1d24]/30 backdrop-blur-sm border border-gray-800 rounded-2xl shadow-2xl z-50 overflow-hidden transform origin-top-right transition-all">
                                {/* Header */}
                                <div className="px-4 py-4 border-b border-gray-600 flex items-center gap-3">
                                    <div className="w-11 h-11 rounded-full flex-shrink-0 bg-gray-600 flex items-center justify-center overflow-hidden">
                                        {user?.photo ? (
                                            <img src={user.photo} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-white font-bold text-sm">
                                                {getInitials(user)}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-white text-base font-bold truncate">
                                            {user?.full_name || user?.user_name || 'Profile'}
                                        </span>
                                        <span className="text-gray-400 text-xs truncate">
                                            {user?.email || ''}
                                        </span>
                                    </div>
                                </div>

                                {/* Menu Items */}
                                <div className="p-3 space-y-1">
                                    <button
                                        onClick={() => {
                                            closeContracts();
                                            const userName = user?.user_name;
                                            if (userName) {
                                                navigate(`/dashboard/${userName}`);
                                            } else {
                                                navigate('/dashboard/profile');
                                            }
                                            setIsDropdownOpen(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-400 hover:text-white hover:bg-[#3cb44f]/10 rounded-lg transition-colors text-sm font-bold cursor-pointer"
                                    >
                                        <User className="w-[18px] h-[18px]" strokeWidth={2.5} />
                                        My Profile
                                    </button>
                                </div>

                                <div className="px-3 pb-3">
                                    <button
                                        onClick={async () => {
                                            setIsDropdownOpen(false);
                                            await logout();
                                            navigate('/login');
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 text-[#ef5350] hover:bg-[#ef5350]/10 rounded-lg transition-colors text-sm font-bold"
                                    >
                                        <LogOut className="w-[18px] h-[18px]" strokeWidth={2.5} />
                                        Logout
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </nav>

            {/* Notification Slide-in Panel */}
            <NotificationPanel
                isOpen={isNotifOpen}
                onClose={() => setIsNotifOpen(false)}
            />
        </>
    );
};

export default Navbar;
