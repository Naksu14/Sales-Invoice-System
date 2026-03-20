import React from 'react'

export const SkeletonLoader = ({ 
  type = 'card', 
  count = 1, 
  width = '100%', 
  height = '20px',
  className = ''
}) => {
  const shimmer = `
    @keyframes shimmer {
      0% { background-position: -1000px 0; }
      100% { background-position: 1000px 0; }
    }
  `

  const skeletonStyle = {
    background: 'linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%)',
    backgroundSize: '1000px 100%',
    animation: 'shimmer 2s infinite',
  }

  if (type === 'card') {
    return (
      <div className={`rounded-sm bg-white p-6 shadow-sm ${className}`}>
        <style>{shimmer}</style>
        {/* Header skeleton */}
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              style={skeletonStyle}
              className="h-12 w-12 rounded-md"
            />
            <div className="flex-1">
              <div
                style={skeletonStyle}
                className="mb-2 h-6 w-32 rounded"
              />
              <div
                style={skeletonStyle}
                className="h-4 w-48 rounded"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div style={skeletonStyle} className="h-8 w-8 rounded" />
            <div style={skeletonStyle} className="h-8 w-8 rounded" />
          </div>
        </div>
        <hr className="my-4 border-t border-slate-200" />
        {/* Content skeleton */}
        <div className="space-y-2">
          <div style={skeletonStyle} className="h-4 w-full rounded" />
          <div style={skeletonStyle} className="h-4 w-5/6 rounded" />
        </div>
      </div>
    )
  }

  if (type === 'table') {
    return (
      <div className={className}>
        <style>{shimmer}</style>
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-y-0 text-sm">
            <thead>
              <tr className="bg-slate-100">
                {[1, 2, 3, 4, 5, 6].map((col) => (
                  <th key={col} className="px-4 py-2">
                    <div
                      style={skeletonStyle}
                      className="h-4 w-20 rounded"
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: count }).map((_, row) => (
                <tr key={row} className="text-slate-700">
                  {[1, 2, 3, 4, 5, 6].map((col) => (
                    <td key={col} className="border-b border-slate-200 px-4 py-3">
                      <div
                        style={skeletonStyle}
                        className="h-4 w-24 rounded"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  if (type === 'grid') {
    return (
      <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 ${className}`}>
        <style>{shimmer}</style>
        {Array.from({ length: count }).map((_, idx) => (
          <div
            key={idx}
            className="rounded-sm bg-white p-6 shadow-sm relative overflow-hidden"
          >
            <div className="absolute left-0 right-0 top-0 h-2 bg-slate-200" />
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div
                  style={skeletonStyle}
                  className="h-12 w-12 rounded-md"
                />
                <div className="flex-1">
                  <div
                    style={skeletonStyle}
                    className="mb-2 h-5 w-24 rounded"
                  />
                  <div style={skeletonStyle} className="h-4 w-32 rounded" />
                </div>
              </div>
              <div className="flex items-center gap-1">
                <div style={skeletonStyle} className="h-6 w-6 rounded" />
                <div style={skeletonStyle} className="h-6 w-6 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (type === 'text') {
    return (
      <div className={className}>
        <style>{shimmer}</style>
        {Array.from({ length: count }).map((_, idx) => (
          <div
            key={idx}
            style={{ ...skeletonStyle, width: idx === count - 1 ? '80%' : '100%' }}
            className="mb-3 h-4 rounded"
          />
        ))}
      </div>
    )
  }

  // Default simple skeleton
  return (
    <div className={className}>
      <style>{shimmer}</style>
      <div
        style={{ ...skeletonStyle, width, height }}
        className="rounded"
      />
    </div>
  )
}

export default SkeletonLoader
