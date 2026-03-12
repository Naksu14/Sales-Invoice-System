import React from 'react'
import Tooltip from '@mui/material/Tooltip'

const VARIANTS = {
  primary: 'bg-[#0b2a32] text-white border-transparent hover:bg-[#ACBFA4] hover:text-[#0b2a32] hover:border-[#e7e98a]',
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
  tooltip, // optional tooltip string
  ...props
}) {
  const variantClass = VARIANTS[variant] || VARIANTS.primary
  const sizeClass = SIZES[size] || SIZES.md
  const base = 'inline-flex items-center gap-2 rounded-md font-lg transition-all duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-300 disabled:text-gray-500 disabled:border-gray-300'

  const btn = (
    <button className={`${base} ${sizeClass} ${variantClass} ${className}`} {...props}>
      {leftIcon && <span className="flex items-center">{leftIcon}</span>}
      <span>{children}</span>
      {rightIcon && <span className="flex items-center">{rightIcon}</span>}
    </button>
  )

  if (tooltip) {
    return <Tooltip title={tooltip}>{btn}</Tooltip>
  }

  return btn
}
