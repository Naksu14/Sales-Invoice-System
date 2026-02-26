function MainBackground({ children }) {
	return (
		<div className="relative min-h-screen overflow-hidden">
			<div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-tr from-white from-30% to-[#c1da8d]/80 to-100%" />
			{children}
		</div>
	)
}

export default MainBackground
