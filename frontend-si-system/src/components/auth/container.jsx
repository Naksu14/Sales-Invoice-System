function Container({ title, subtitle, children, footer }) {
	return (
		<div className="w-full max-w-md rounded-2xl border border-white/40 bg-white/90 p-6 shadow-lg backdrop-blur-sm sm:p-8">
			<div className="mb-6 text-center">
				<h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
				{subtitle ? <p className="mt-2 text-sm text-gray-600">{subtitle}</p> : null}
			</div>
			<div className="space-y-4">{children}</div>
			{footer ? <div className="mt-6 text-center text-sm text-gray-600">{footer}</div> : null}
		</div>
	)
}

export default Container