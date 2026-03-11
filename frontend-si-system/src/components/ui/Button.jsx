import React from 'react'

const VARIANTS = {
  primary: 'bg-[#222625] text-white border-transparent hover:bg-[#e7e98a] hover:text-[#222625] hover:border-[#e7e98a]',
  secondary: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100/80',
  ghost: 'bg-transparent text-slate-700 hover:bg-slate-50 border-transparent',
}

const SIZES = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-3 text-base',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  leftIcon,
  rightIcon,
  children,
  ...props
}) {
  const variantClass = VARIANTS[variant] || VARIANTS.primary
  const sizeClass = SIZES[size] || SIZES.md
  const base = 'inline-flex items-center gap-2 rounded-md font-semibold transition-all duration-200'

  return (
    <button className={`${base} ${sizeClass} ${variantClass} ${className}`} {...props}>
      {leftIcon && <span className="flex items-center">{leftIcon}</span>}
      <span>{children}</span>
      {rightIcon && <span className="flex items-center">{rightIcon}</span>}
    </button>
  )
}
