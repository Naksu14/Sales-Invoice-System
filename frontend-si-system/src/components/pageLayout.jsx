import MainBackground from './mainBackground'
import Sidebar from './sidebar'
import Navbar from './navbar'

export const PageLayout = ({ children }) => {
  return (
    <MainBackground>
      <Sidebar />
      <Navbar />
      <main className="fixed left-72 right-4 top-24 bottom-0 overflow-auto p-6">
        {children}
      </main>
    </MainBackground>
  )
}
