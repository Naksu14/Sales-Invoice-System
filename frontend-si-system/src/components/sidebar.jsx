import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import logo from '../assets/images/updateLogo.svg'
import DashboardIcon from '@mui/icons-material/Dashboard'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import ContactPageIcon from '@mui/icons-material/ContactPage'
import DescriptionIcon from '@mui/icons-material/Description'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import LogoutIcon from '@mui/icons-material/Logout'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import CloseIcon from '@mui/icons-material/Close'
import { LogoutModal } from './modals/logout'
import { UserGuideModal } from './modals/userGuide'
import { queryClient } from '../services/queryClient'

function Sidebar({ isOpen = false, onClose, isCollapsed = false, onToggleCollapse }) {
	const navigate = useNavigate()
	const [isLogoutOpen, setIsLogoutOpen] = useState(false)
	const [isUserGuideOpen, setIsUserGuideOpen] = useState(false)
	const baseItemClass = 'flex items-center gap-3 rounded-md px-3 py-2 text-base text-gray-300 transition-colors duration-200 hover:bg-white/10 hover:text-white'
	const activeItemClass = 'bg-[#315266]/80 text-white font-semibold'
	const collapsedItemClass = isCollapsed ? 'justify-center px-2' : ''

	const navItems = [
		{ to: '/dashboard', label: 'Dashboard', icon: <DashboardIcon fontSize="small" /> },
		{ to: '/sales-invoice', label: 'Sales Invoice', icon: <ReceiptLongIcon fontSize="small" /> },
		{ to: '/invoice-profile', label: 'Invoice Profile', icon: <DescriptionIcon fontSize="small" /> },
		{ to: '/user-management', label: 'Users', icon: <ContactPageIcon fontSize="small" /> },
	]

	const handleConfirmLogout = () => {
		localStorage.removeItem('access_token')
		sessionStorage.removeItem('access_token')
		localStorage.removeItem('user')
		sessionStorage.removeItem('user')
		queryClient.removeQueries({ queryKey: ['currentUser'] })
		setIsLogoutOpen(false)
		navigate('/login')
	}

	const handleNavClick = () => {
		if (onClose) onClose()
	}

	const SidebarContent = ({ mobile = false }) => (
		<>
			<div className="p-3 pb-1">
				<div className={`rounded-md bg-[#0b2a32] p-3 flex items-center ${isCollapsed && !mobile ? 'justify-center' : 'gap-3'}`}>
					<div className="text-gray-200">
						<img src={logo} alt="Logo" className="h-10 w-10" />
					</div>
					{(!isCollapsed || mobile) && (
						<div>
							<p className="text-lg font-semibold">Launchpad</p>
							<p className="text-md -mt-2">Coworking</p>
						</div>
					)}
				</div>
			</div>

			<div className="p-3 pt-0 h-full">
				<div className="h-full rounded-md bg-[#0b2a32] p-4 flex flex-col">
					<div className="mb-3 flex items-center justify-between">
						{(!isCollapsed || mobile) ? <span className="text-xs uppercase tracking-wide text-slate-300">Navigation</span> : <span />}
						{mobile ? (
							<button
								type="button"
								onClick={onClose}
								className="rounded-md p-1 text-slate-300 hover:bg-white/10 hover:text-white"
								aria-label="Close sidebar"
							>
								<CloseIcon fontSize="small" />
							</button>
						) : (
							<button
								type="button"
								onClick={onToggleCollapse}
								className="rounded-md p-1 text-slate-300 hover:bg-white/10 hover:text-white"
								aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
							>
								{isCollapsed ? <ChevronRightIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />}
							</button>
						)}
					</div>

					<nav className="flex flex-col gap-2">
						{navItems.map((item) => (
							<NavLink
								key={item.to}
								to={item.to}
								onClick={handleNavClick}
								className={({ isActive }) => `${baseItemClass} ${collapsedItemClass} ${isActive ? activeItemClass : ''}`}
								title={isCollapsed && !mobile ? item.label : undefined}
							>
								{item.icon}
								{(!isCollapsed || mobile) && <span>{item.label}</span>}
							</NavLink>
						))}
						<button
							type="button"
							onClick={() => {
								setIsUserGuideOpen(true)
								handleNavClick()
							}}
							className={`${baseItemClass} ${collapsedItemClass} w-full cursor-pointer`}
							title={isCollapsed && !mobile ? 'User Guide' : undefined}
						>
							<MenuBookIcon fontSize="small" />
							{(!isCollapsed || mobile) && <span>User Guide</span>}
						</button>
					</nav>

					<div className="mt-auto">
						<button
							type="button"
							onClick={() => {
								setIsLogoutOpen(true)
								handleNavClick()
							}}
							className={`${baseItemClass} ${collapsedItemClass} w-full cursor-pointer disabled:cursor-not-allowed`}
							title={isCollapsed && !mobile ? 'Logout' : undefined}
						>
							<LogoutIcon fontSize="small" />
							{(!isCollapsed || mobile) && <span>Logout</span>}
						</button>
					</div>
				</div>
			</div>
		</>
	)

	return (
		<>
			<aside className={`fixed top-1 bottom-20 z-50 hidden lg:block rounded-md text-white transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
				<SidebarContent />
			</aside>

			{isOpen ? (
				<div className="fixed inset-0 z-[70] bg-black/40 lg:hidden" onClick={onClose} />
			) : null}

			<aside className={`fixed inset-y-0 left-0 z-[80] w-72 text-white transform transition-transform duration-300 lg:hidden ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
				<SidebarContent mobile />
			</aside>

			<LogoutModal
				isOpen={isLogoutOpen}
				onClose={() => setIsLogoutOpen(false)}
				onConfirm={handleConfirmLogout}
			/>
			<UserGuideModal
				isOpen={isUserGuideOpen}
				onClose={() => setIsUserGuideOpen(false)}
			/>
		</>
	)
}

export default Sidebar