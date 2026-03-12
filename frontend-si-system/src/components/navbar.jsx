import { useQuery } from '@tanstack/react-query'
import Tooltip from '@mui/material/Tooltip'
import { getCurrentUser } from '../services/authService'
import { useNavigate } from 'react-router-dom'

function Navbar() {
	const navigate = useNavigate()
	
	const { data: user } = useQuery({
		queryKey: ['currentUser'],
		queryFn: getCurrentUser,
	})

	const NavigateUserAccount = () => {
		navigate('/user-account')
	}

	return (
		<aside className="fixed left-65 right-4 top-4 z-50 bg-white text-[#dce884] rounded-md shadow-sm">
			<div className="w-full p-2">
				<div className="flex items-center justify-end">
								<Tooltip title="Open user account">
									<div
										onClick={NavigateUserAccount}
										className="flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed  rounded-md hover:bg-gray-200 px-3 py-1.5">
										<div className="flex h-7 w-7  items-center justify-center rounded-full bg-white border border-[#1a1d1c] text-[#1a1d1c]">
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
								<path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z" />
							</svg>
						</div>
										<div className="leading-tight">
							<p className="text-md font-semibold text-[#062335]">{user?.full_name || 'Admin User Name'}</p>
							<p className="text-xs text-gray-500">{user?.email || 'admin@example.com'}</p>
						</div>
									</div>
								</Tooltip>
				</div>
			</div>
		</aside>
	)
}

export default Navbar