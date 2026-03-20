import { useState } from 'react'
import MainBackground from './mainBackground'
import Sidebar from './sidebar'
import Navbar from './navbar'

export const PageLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  return (
    <MainBackground>
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
      />
      <Navbar
        onToggleSidebar={() => setIsSidebarOpen(true)}
        isSidebarCollapsed={isSidebarCollapsed}
      />
      <main
        className={`fixed left-4 right-4 top-24 bottom-0 overflow-auto p-4 lg:p-6 transition-all duration-300 ${isSidebarCollapsed ? 'lg:left-24' : 'lg:left-72'}`}
      >
        {children}
      </main>
    </MainBackground>
  )
}
