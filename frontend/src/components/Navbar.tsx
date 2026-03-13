import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { FaBolt } from 'react-icons/fa6';
import { IoGridOutline, IoFolderOutline } from 'react-icons/io5';
import { User, Image as ImageIcon, FileText, LogOut } from 'lucide-react';

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

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
        { icon: IoGridOutline, label: 'Dashboard', path: '/' },
        { icon: IoFolderOutline, label: 'Contracts', path: '/contracts' },
    ];

    const isActive = (path: string) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname === path || location.pathname.startsWith(path + '/');
    };

    return (
        <nav className="bg-[#0f1117] border-b border-gray-800 px-6 py-3 flex items-center justify-between sticky top-0 z-50">

            {/* Logo */}
            <div className="flex items-center gap-2">
                <FaBolt className="text-[#00e676] text-xl" />
                <span className="text-white text-lg font-bold tracking-tight">Defellix</span>
            </div>

            {/* Nav Links */}
            <div className="flex items-center gap-2">
                {navLinks.map((link) => {
                    const Icon = link.icon;
                    const active = isActive(link.path);
                    return (
                        <Link
                            key={link.path}
                            to={link.path}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${active
                                ? 'bg-[#00e676] text-black'
                                : 'text-gray-400 hover:text-white hover:bg-gray-800'
                                }`}
                        >
                            <Icon className={`text-base ${active ? 'text-black' : ''}`} />
                            {link.label}
                        </Link>
                    );
                })}
            </div>

            {/* Right: Actions + Profile */}
            <div className="flex items-center gap-3">

                {!isLoggedIn ? (
                    <button
                        onClick={() => setIsLoggedIn(true)} // Set to test login feature. In real app: navigate('/login')
                        className="cursor-pointer border border-[#00e676] text-[#00e676] hover:bg-[#00e676] hover:text-black text-sm font-semibold px-5 py-1.5 rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(0,230,118,0.2)] hover:shadow-[0_0_15px_rgba(0,230,118,0.4)]"
                    >
                        Login / Sign Up
                    </button>
                ) : (
                    <div className="relative" ref={dropdownRef}>
                        {/* Profile Toggle */}
                        <div
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-1.5 cursor-pointer hover:bg-gray-700 transition-colors"
                        >
                            <div className="w-7 h-7 rounded-full bg-[#00e676] flex items-center justify-center text-black font-bold text-xs">
                                AM
                            </div>
                            <div className="flex flex-col">
                                <span className="text-white text-xs font-semibold leading-none">Alex Morgan</span>
                                <span className="text-gray-400 text-[10px] leading-none mt-0.5">Product Designer</span>
                            </div>
                        </div>

                        {/* Dropdown Menu */}
                        {isDropdownOpen && (
                            <div className="absolute right-0 top-full mt-3 w-[260px] bg-[#1a1d24] border border-gray-800 rounded-2xl shadow-2xl z-50 overflow-hidden transform origin-top-right transition-all">
                                {/* Header */}
                                <div className="px-4 py-4 border-b border-gray-600 flex items-center gap-3">
                                    <div className="w-11 h-11 rounded-full flex-shrink-0 bg-gray-600 flex items-center justify-center overflow-hidden">
                                        <img src="https://ui-avatars.com/api/?name=Saiyam+Kumar&background=475569&color=fff" alt="Profile" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-white text-base font-bold truncate">Saiyam Kumar</span>
                                        <span className="text-gray-400 text-xs truncate">saiyamkumar2007@gmail.com</span>
                                    </div>
                                </div>

                                {/* Menu Items */}
                                <div className="p-3 space-y-1">
                                    <button
                                        onClick={() => {
                                            navigate('/profile');
                                            setIsDropdownOpen(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors text-sm font-bold"
                                    >
                                        <User className="w-[18px] h-[18px]" strokeWidth={2.5} />
                                        My Account
                                    </button>
                                    <button className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors text-sm font-bold">
                                        <ImageIcon className="w-[18px] h-[18px]" strokeWidth={2.5} />
                                        Upload Avatar
                                    </button>
                                    <button className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors text-sm font-bold">
                                        <FileText className="w-[18px] h-[18px]" strokeWidth={2.5} />
                                        Health Records
                                    </button>
                                </div>

                                <div className="px-3 pb-3">
                                    <button
                                        onClick={() => {
                                            setIsLoggedIn(false);
                                            setIsDropdownOpen(false);
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
                )}
            </div>
        </nav>
    );
};

export default Navbar;
