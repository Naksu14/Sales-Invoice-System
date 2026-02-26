function Navbar({ children }) {
	return (
		<aside className="fixed left-72 right-4 top-4 z-50 bg-white text-black rounded-md">
			<div className="w-full overflow-y-auto p-4">
				{children}
			</div>
		</aside>
	)
}

export default Navbar