import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import logo from '../assets/images/logo.svg'
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
	const activeItemClass = 'bg-[#aaaaaa] text-white font-semibold'

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
		<aside className="fixed left-4 top-4 bottom-4 z-50 w-64 rounded-md bg-[linear-gradient(160deg,#222625_0%,#1d2221_100%)] text-white shadow-lg">
			<div className="flex h-full flex-col p-4">
				<div className="border-b border-white/20 pb-4">
					<div className="flex items-center justify-center gap-3">
						<div className="text-gray-200">
							<img src={logo} alt="Logo" className="h-8 w-8" />
						</div>
						<div>
							<p className="text-xs font-bold tracking-[0.35em] text-[#d8ea46]">LAUNCHPAD</p>
							<p className="text-xs font-bold tracking-[0.35em] text-[#d8ea46]">COWORKING</p>
						</div>
					</div>
				</div>

				<nav className="mt-4 flex flex-col gap-2">
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
						className={`${baseItemClass} w-full`}
					>
						<LogoutIcon fontSize="small" />
						<span>Logout</span>
					</button>
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