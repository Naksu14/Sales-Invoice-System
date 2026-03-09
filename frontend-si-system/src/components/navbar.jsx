import { useQuery } from '@tanstack/react-query'
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
		<aside className="fixed left-72 right-4 top-4 z-50 bg-[#222625] text-white rounded-md">
			<div className="w-full p-3">
				<div className="flex items-center justify-end">
					<div
						onClick={NavigateUserAccount}
						className="flex items-center gap-2 rounded-md hover:bg-[#414141] px-3 py-1.5">
						<div className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#1a1d1c]">
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
								<path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z" />
							</svg>
						</div>
						<div className="leading-tight">
							<p className="text-xs font-semibold text-[#dce884]">{user?.full_name || 'Admin User Name'}</p>
							<p className="text-[10px] text-gray-300">{user?.email || 'admin@example.com'}</p>
						</div>
					</div>
				</div>
			</div>
		</aside>
	)
}

export default Navbar