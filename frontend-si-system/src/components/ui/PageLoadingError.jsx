import React from 'react'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import RefreshIcon from '@mui/icons-material/Refresh'

export const PageLoadingError = ({ 
  error = 'Failed to load data', 
  onRetry = null,
  isRetrying = false 
}) => {
  return (
    <section className="flex min-h-[40vh] items-center justify-center">
      <div className="flex w-full max-w-md flex-col items-center text-center">
        <div className="mb-4 text-red-400">
          <ErrorOutlineIcon sx={{ fontSize: 56 }} />
        </div>

        <p className="mb-2 text-sm font-semibold text-slate-700">Unable to Load Data</p>
        <p className="max-w-xs text-sm leading-6 text-slate-500 mb-4">
          {error || 'There was an issue connecting to the server. Please check your internet connection and try again.'}
        </p>

        {onRetry && (
          <button
            onClick={onRetry}
            disabled={isRetrying}
            className="flex items-center gap-2 rounded-md bg-[#0b2a32] px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-[#113743] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshIcon sx={{ fontSize: 16 }} />
            {isRetrying ? 'Retrying...' : 'Retry'}
          </button>
        )}
      </div>
    </section>
  )
}

export default PageLoadingError
