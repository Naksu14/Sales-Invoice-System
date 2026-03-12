import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import logo from '../assets/images/updateLogo.svg'
import DashboardIcon from '@mui/icons-material/Dashboard'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import ContactPageIcon from '@mui/icons-material/ContactPage'
import LogoutIcon from '@mui/icons-material/Logout'
import { LogoutModal } from './modals/logout'
import { queryClient } from '../services/queryClient'

function Sidebar() {
	const navigate = useNavigate()
	const [isLogoutOpen, setIsLogoutOpen] = useState(false)
	const baseItemClass = 'flex items-center gap-3 rounded-md px-3 py-2 text-base text-gray-300 transition-colors duration-200 hover:bg-white/10 hover:text-white'
	const activeItemClass = 'bg-[#315266]/80 text-white font-semibold'

	const handleConfirmLogout = () => {
		localStorage.removeItem('access_token')
		sessionStorage.removeItem('access_token')
		localStorage.removeItem('user')
		sessionStorage.removeItem('user')
		queryClient.removeQueries({ queryKey: ['currentUser'] })
		setIsLogoutOpen(false)
		navigate('/login')
	}

	return (
		<aside className="fixed top-1 bottom-20 z-50 w-64 rounded-md text-white">
			{/* Header block (logo + name) */}
			<div className="p-3 pb-1">
				<div className="rounded-md bg-[#0b2a32] p-3 flex items-center gap-3">
					<div className="text-gray-200">
						<img src={logo} alt="Logo" className="h-10 w-10" />
					</div>
					<div>
						<p className="text-lg font-semibold">Launchpad</p>
						<p className="text-md -mt-2">Coworking</p>
					</div>
				</div>
			</div>

			{/* Nav block */}
			<div className="p-3 pt-0 h-full">
				<div className="h-full rounded-md bg-[#0b2a32] p-4 flex flex-col">
					<nav className="flex flex-col gap-2">
					<NavLink
						to="/dashboard"
						className={({ isActive }) => `${baseItemClass} ${isActive ? activeItemClass : ''}`}
					>
						<DashboardIcon fontSize="small" />
						<span>Dashboard</span>
					</NavLink>

					<NavLink
						to="/sales-invoice"
						className={({ isActive }) => `${baseItemClass} ${isActive ? activeItemClass : ''}`}
					>
						<ReceiptLongIcon fontSize="small" />
						<span>Sales Invoice</span>
					</NavLink>

					<NavLink
						to="/invoice-profile"
						className={({ isActive }) => `${baseItemClass} ${isActive ? activeItemClass : ''}`}
					>
						<ContactPageIcon fontSize="small" />
						<span>Invoice Profile</span>
					</NavLink>
					</nav>

					<div className="mt-auto">
						<button
							type="button"
							onClick={() => setIsLogoutOpen(true)}
							className={`${baseItemClass} w-full cursor-pointer disabled:cursor-not-allowed `}
						>
							<LogoutIcon fontSize="small" />
							<span>Logout</span>
						</button>
					</div>
				</div>
			</div>
			<LogoutModal
				isOpen={isLogoutOpen}
				onClose={() => setIsLogoutOpen(false)}
				onConfirm={handleConfirmLogout}
			/>
 		</aside>
	)
}

export default Sidebar