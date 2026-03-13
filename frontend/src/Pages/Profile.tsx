import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import { MdLocationOn, MdCalendarToday, MdEmail } from 'react-icons/md'
import { FaGithub, FaLinkedin, FaInstagram, FaGlobe, FaStar } from 'react-icons/fa'
import { X, Globe as GlobeIcon, Github } from 'lucide-react'

interface Contract {
    id: number;
    name: string;
    role: string;
    liveLink: string;
    duration: string;
    teamSize: string;
    techStack: string[];
    summary: string;
    highlights: string[];
    images: string[];
    githubLink: string;
}

function Profile() {
    const [selectedContract, setSelectedContract] = useState<Contract | null>(null)
    const [isContractModalOpen, setIsContractModalOpen] = useState(false)

    // Load data from localStorage or use defaults
    const [user, setUser] = useState({
        name: "Alex Morgan",
        photo: "https://via.placeholder.com/120",
        headline: "Product Designer",
        role: "Product Designer",
        bio: "Designing scalable systems and thoughtful interfaces for fast-growing product teams.",
        location: "San Francisco, CA",
        email: "alex.morgan@example.com",
        profileUrl: "nexgen.app/alexmorgan",
        company: "NexGen Studio",
        joinedDate: "Jan 2022",
        timezone: "PST (UTC-8)",
        workingHours: "9am - 5pm",
        experience: "5+ years",
        skills: ["Design systems", "Product thinking", "Prototyping", "User research"],
        githubLink: "",
        linkedinLink: "https://linkedin.com/in/alex-morgan",
        portfolioLink: "https://alexmorgan.design",
        instagramLink: "https://instagram.com/alexmorgan",
        stats: {
            contracts: 0,
            files: 134,
            teammates: 18
        },
        contracts: [] as Contract[],
        availability: [
            "Available for design reviews on Tue & Thu",
            "Prefers async feedback via comments",
            "Best contact: Slack or in-app messages"
        ]
    })

    useEffect(() => {
        const savedProfile = localStorage.getItem('userProfile');
        if (savedProfile) {
            try {
                const profileData = JSON.parse(savedProfile);
                setUser({
                    name: profileData.fullName || user.name,
                    photo: profileData.profilePicture || user.photo,
                    headline: profileData.role || user.headline,
                    role: profileData.role || user.role,
                    bio: profileData.shortBio || user.bio,
                    location: profileData.location || user.location,
                    email: profileData.workEmail || user.email,
                    profileUrl: profileData.profileUrl || user.profileUrl,
                    company: profileData.organization || user.company,
                    joinedDate: profileData.joined || user.joinedDate,
                    timezone: profileData.timezone || user.timezone,
                    workingHours: profileData.workingHours || user.workingHours,
                    experience: user.experience,
                    skills: profileData.topSkills || user.skills,
                    githubLink: profileData.contracts?.[0]?.githubLink || "",
                    linkedinLink: profileData.linkedinUrl ? `https://linkedin.com${profileData.linkedinUrl}` : user.linkedinLink,
                    portfolioLink: profileData.website ? `https://${profileData.website}` : user.portfolioLink,
                    instagramLink: user.instagramLink,
                    stats: {
                        contracts: profileData.contracts?.length || 0,
                        files: user.stats.files,
                        teammates: user.stats.teammates
                    },
                    contracts: profileData.contracts || [],
                    availability: profileData.preferredCollaboration || user.availability
                });
            } catch (error) {
                console.error('Error parsing profile data:', error);
            }
        }
    }, [])

    return (
        <div className="flex flex-col h-screen w-full bg-[#0f1117]">
            <Navbar />

            <div className="flex-1 overflow-y-auto scrBar bg-[#0f1117]">
                <div className="max-w-7xl mx-auto p-6 lg:p-8">
                    <div className="bg-[#161b27] rounded-xl shadow-sm border border-gray-800 p-6 lg:p-8 mb-6">
                        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
                            <div className="flex items-start gap-6 flex-1">
                                <img
                                    src={user.photo}
                                    alt={user.name}
                                    className="w-24 h-24 lg:w-28 lg:h-28 rounded-full object-cover border-2 border-gray-800"
                                />

                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-4">
                                        <h1 className="text-3xl lg:text-4xl font-bold text-white">{user.name}</h1>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                                        <div className="flex items-center gap-1.5">
                                            <MdLocationOn className="text-gray-400" size={18} />
                                            <span>{user.location}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <MdCalendarToday className="text-gray-400" size={18} />
                                            <span>Joined {user.joinedDate}</span>
                                        </div>
                                    </div>

                                    <p className="text-gray-400 text-sm lg:text-base leading-relaxed max-w-2xl">
                                        {user.bio}
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-4">
                                <div className="flex gap-6 text-center">
                                    <div>
                                        <div className="text-2xl font-bold text-white">{user.stats.contracts}</div>
                                        <div className="text-xs text-gray-400">contracts</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-white">{user.stats.files}</div>
                                        <div className="text-xs text-gray-400">files</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-white">{user.stats.teammates}</div>
                                        <div className="text-xs text-gray-400">teammates</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        <div className="lg:col-span-1 space-y-6">

                            <div className="bg-[#161b27] rounded-xl shadow-sm border border-gray-800 p-6">
                                <h2 className="text-xl font-bold text-white mb-1">About</h2>
                                <p className="text-sm text-gray-400 mb-4">Basic details</p>

                                <div className="space-y-3 mb-6">
                                    <div className="flex items-center gap-2 text-sm">
                                        <MdEmail className="text-gray-500" size={16} />
                                        <span className="text-gray-300">{user.email}</span>
                                    </div>
                                    <div className="text-sm text-gray-300">
                                        <span className="text-gray-500">Role: </span>
                                        {user.role}
                                    </div>

                                    <div className="text-sm text-gray-300">
                                        <span className="text-gray-500">Working hours: </span>
                                        {user.workingHours}
                                    </div>
                                    <div className="text-sm text-gray-300">
                                        <span className="text-gray-500">Experience: </span>
                                        {user.experience}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-sm font-semibold text-gray-400 mb-3">Links</h3>
                                    <div className="space-y-2">
                                        {user.portfolioLink && (
                                            <a href={user.portfolioLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-gray-400 hover:text-[#00e676] transition-colors">
                                                <FaGlobe className="text-gray-500" size={14} />
                                                <span>{user.portfolioLink.replace('https://', '')}</span>
                                            </a>
                                        )}
                                        {user.linkedinLink && (
                                            <a href={user.linkedinLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-gray-400 hover:text-[#00e676] transition-colors">
                                                <FaLinkedin className="text-gray-500" size={14} />
                                                <span>{user.linkedinLink.replace('https://linkedin.com/in/', '/')}</span>
                                            </a>
                                        )}
                                        {user.instagramLink && (
                                            <a href={user.instagramLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-gray-400 hover:text-[#00e676] transition-colors">
                                                <FaInstagram className="text-gray-500" size={14} />
                                                <span>{user.instagramLink.replace('https://instagram.com/', '@')}</span>
                                            </a>
                                        )}
                                        {user.githubLink && (
                                            <a href={user.githubLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-gray-400 hover:text-[#00e676] transition-colors">
                                                <FaGithub className="text-gray-500" size={14} />
                                                <span>{user.githubLink.replace('https://github.com/', '') || user.githubLink}</span>
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Skills Section */}
                            <div className="bg-[#161b27] rounded-xl shadow-sm border border-gray-800 p-6">
                                <h2 className="text-xl font-bold text-white mb-1">Skills</h2>
                                <p className="text-sm text-gray-400 mb-4">Top strengths</p>

                                <div className="flex flex-wrap gap-2">
                                    {user.skills.map((skill, index) => (
                                        <span
                                            key={index}
                                            className="px-3 py-1.5 bg-[#0f1117] text-gray-300 border border-gray-800 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors cursor-pointer"
                                        >
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Work Section */}
                            <div className="bg-[#161b27] rounded-xl shadow-sm border border-gray-800 p-6">
                                <h2 className="text-xl font-bold text-white mb-1">Work</h2>
                                <p className="text-sm text-gray-400 mb-4">Recent contracts and activity</p>

                                {/* Contracts List */}
                                <div className="space-y-4">
                                    {user.contracts.length > 0 ? (
                                        user.contracts.map((contract, index) => (
                                            <div
                                                key={contract.id || index}
                                                onClick={() => {
                                                    setSelectedContract(contract);
                                                    setIsContractModalOpen(true);
                                                }}
                                                className="flex items-start justify-between p-4 hover:bg-[#1a2133] rounded-lg transition-colors cursor-pointer group"
                                            >
                                                <div className="flex items-start gap-3 flex-1">
                                                    <div className="w-10 h-10 rounded-lg bg-[#0f1117] border border-gray-800 flex items-center justify-center">
                                                        <FaStar className="text-gray-400 group-hover:text-[#00e676] transition-colors" size={20} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h3 className="font-semibold text-white mb-1 group-hover:text-[#00e676] transition-colors">{contract.name}</h3>
                                                        <p className="text-sm text-gray-500">
                                                            {contract.role} • {contract.duration} • {contract.teamSize}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-gray-500 text-center py-8">No contracts added yet.</p>
                                    )}
                                </div>
                            </div>

                            {/* Availability Section */}
                            <div className="bg-[#161b27] rounded-xl shadow-sm border border-gray-800 p-6">
                                <h2 className="text-xl font-bold text-white mb-1">Availability</h2>
                                <p className="text-sm text-gray-400 mb-4">Collaboration preferences</p>

                                <ul className="space-y-2">
                                    {user.availability.map((item, index) => (
                                        <li key={index} className="flex items-start gap-2 text-sm text-gray-300">
                                            <span className="text-[#00e676] mt-1">•</span>
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Contract Detail Modal */}
            {isContractModalOpen && selectedContract && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#161b27] rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-800">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-800 sticky top-0 bg-[#161b27] z-10">
                            <h3 className="text-2xl font-semibold text-white">{selectedContract.name}</h3>
                            <button
                                onClick={() => setIsContractModalOpen(false)}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 space-y-6">
                            {/* Contract Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Your Role</p>
                                    <p className="text-gray-300 font-medium">{selectedContract.role}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Duration</p>
                                    <p className="text-gray-300 font-medium">{selectedContract.duration}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Team Size</p>
                                    <p className="text-gray-300 font-medium">{selectedContract.teamSize}</p>
                                </div>
                            </div>

                            {/* Links */}
                            <div className="flex gap-4">
                                {selectedContract.liveLink && (
                                    <a
                                        href={selectedContract.liveLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-[#00e676] hover:text-[#00c853]"
                                    >
                                        <GlobeIcon className="w-4 h-4" />
                                        <span>Live Link</span>
                                    </a>
                                )}
                                {selectedContract.githubLink && (
                                    <a
                                        href={selectedContract.githubLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-[#00e676] hover:text-[#00c853]"
                                    >
                                        <Github className="w-4 h-4" />
                                        <span>GitHub</span>
                                    </a>
                                )}
                            </div>

                            {/* Tech Stack */}
                            {selectedContract.techStack.length > 0 && (
                                <div>
                                    <p className="text-sm text-gray-500 mb-2">Technologies / Tech Stack Used</p>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedContract.techStack.map((tech, index) => (
                                            <span
                                                key={index}
                                                className="px-3 py-1.5 bg-[#0f1117] border border-[#00e676]/30 text-[#00e676] rounded-full text-sm font-medium"
                                            >
                                                {tech}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Contract Summary */}
                            {selectedContract.summary && (
                                <div>
                                    <p className="text-sm font-semibold text-gray-400 mb-2">Contract Summary</p>
                                    <p className="text-gray-300 leading-relaxed">{selectedContract.summary}</p>
                                </div>
                            )}

                            {/* Key Highlights */}
                            {selectedContract.highlights.length > 0 && (
                                <div>
                                    <p className="text-sm font-semibold text-gray-400 mb-2">Key Highlights & Outcomes</p>
                                    <ul className="space-y-2">
                                        {selectedContract.highlights.map((highlight, index) => (
                                            <li key={index} className="flex items-start gap-2 text-gray-300">
                                                <span className="text-[#00e676] mt-1">•</span>
                                                <span>{highlight}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Contract Images */}
                            {selectedContract.images.length > 0 && (
                                <div>
                                    <p className="text-sm font-semibold text-gray-400 mb-2">Contract Images</p>
                                    <div className="grid grid-cols-3 gap-4">
                                        {selectedContract.images.map((image, index) => (
                                            <img
                                                key={index}
                                                src={image}
                                                alt={`${selectedContract.name} ${index + 1}`}
                                                className="w-full h-32 object-cover rounded-lg border border-gray-800"
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Profile




