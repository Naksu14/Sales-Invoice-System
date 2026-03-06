function AuthBackground({ children }) {
	return (
		<div className="relative min-h-screen min-w-screen flex items-center justify-center">
			<div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-tr from-[#FFFFFF] via-[#E1ECA4] to-[#8EBCB8]" />
			{children}
		</div>
	)
}

export default AuthBackground
