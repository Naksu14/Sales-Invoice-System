function AuthButton({
	children,
	type = 'submit',
	onClick,
	disabled = false,
	className = '',
}) {
	return (
		<button
			type={type}
			onClick={onClick}
			disabled={disabled}
                className={`
                w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-all duration-500 ease-out
                bg-[linear-gradient(135deg,#111827_0%,#111827_50%,#E1ECA4_85%,#AECBFA_100%)]
                bg-[length:220%_220%] 
                bg-left-top 
				hover:text-gray-900
                hover:bg-right-bottom hover:shadow-lg 
                disabled:cursor-not-allowed disabled:opacity-60 
                ${className}
                `}		>
			{children}
		</button>
	)
}

export default AuthButton
