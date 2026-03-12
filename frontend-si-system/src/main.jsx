import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.jsx'
import { queryClient } from './services/queryClient'
import { scheduleTokenExpiryCheck } from './services/sessionManager'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      {/* start token expiry watcher so expired tokens auto logout */}
      {scheduleTokenExpiryCheck()}
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
