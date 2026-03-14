import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useContractsStore } from '@/store/useContractsStore';
import { useState, useRef, useEffect } from 'react';
import { FaBolt } from 'react-icons/fa6';
import { IoGridOutline, IoFolderOutline } from 'react-icons/io5';
import { User, Image as ImageIcon, FileText, LogOut } from 'lucide-react';
import logo from '@/assets/logo.svg';

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { openContracts, closeContracts, isOpen: contractsOpen } = useContractsStore();

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
        <nav className="bg-transparent h-16 fixed top-0 w-full px-6 py-10 flex items-center justify-between z-50">

            {/* Logo */}
            <div className="flex items-center gap-2">
                <img src={logo} alt="Defellix" className="w-52 h-auto" />
            </div>

            {/* Nav Links */}
            <div className="flex items-center">
                {navLinks.map((link) => {
                    const Icon = link.icon;
                    const active = isActive(link.path);
                    return link.label === 'Contracts' ? (
                        <button
                            key={link.path}
                            onClick={openContracts}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer ${contractsOpen
                                    ? 'bg-[#3cb44f] text-[#0d140d]'
                                    : 'bg-[#3cb44f]/5 text-gray-400'
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
            <div className="flex items-center gap-3">


                <div className="relative" ref={dropdownRef}>
                    {/* Profile Toggle */}
                    <div
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-2 bg-[#ffffff] px-0.5 rounded-full py-0.5 cursor-pointer transition-colors"
                    >
                        <div className="w-10 h-10 rounded-full bg-[#3cb44f] -ml-5 flex items-center justify-center text-[#0d140d] font-bold text-xs">
                            AM
                        </div>
                        <div className="flex flex-col">
                            <span className="text-black text-xs font-semibold leading-none">Alex Morgan</span>
                            <span className="text-gray-400 text-[10px] leading-none mt-0.5">Product Designer</span>
                        </div>
                        <div className="w-10 h-10 flex items-center justify-center rounded-full bg-black hover:bg-neutral-800 transition-colors">
                            <svg width="24" height="24" viewBox="0 0 24 24" className="text-white">
                                <path d="M8 10l4 4 4-4" stroke="white" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
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
                                            closeContracts();
                                            navigate('/profile');
                                            setIsDropdownOpen(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors text-sm font-bold cursor-pointer"
                                    >
                                        <User className="w-[18px] h-[18px]" strokeWidth={2.5} />
                                        My Profile
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

            </div>
        </nav>
    );
};

export default Navbar;
