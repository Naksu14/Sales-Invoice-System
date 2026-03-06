function MainBackground({ children }) {
	return (
		<div className="relative min-h-screen overflow-hidden">
			<div className="pointer-events-none absolute inset-0 -z-10 bg-white" />
			{children}
		</div>
	)
}

export default MainBackground
