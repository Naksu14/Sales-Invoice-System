function Sidebar({ children }) {
	return (
		<aside className="fixed left-4 top-4 bottom-4 z-50 w-64 bg-black text-white rounded-md">
			<div className="h-full overflow-y-auto p-4">
				{children}
			</div>
		</aside>
	)
}

export default Sidebar