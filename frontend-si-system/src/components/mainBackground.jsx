import { useEffect } from 'react'

function MainBackground({ children }) {
	useEffect(() => {
		const prev = document.body.style.backgroundColor
		document.body.style.backgroundColor = '#F4F9F7' // red-500
		return () => { document.body.style.backgroundColor = prev }
	}, [])

	return (
		<div className="relative min-h-screen overflow-hidden">
			<div className="pointer-events-none absolute inset-0 z-0 bg-red-500" />
			{children}
		</div>
	)
}

export default MainBackground
