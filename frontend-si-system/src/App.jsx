import MainBackground from './components/mainBackground'
import Sidebar from './components/sidebar'
import Navbar from './components/navbar'

function App() {
  return (
    <MainBackground>
      <Sidebar/>
      <Navbar/>
      <main className="min-h-screen pl-64 flex items-center justify-center p-6">
        <div className="rounded-xl bg-white/80 p-8 text-center backdrop-blur-sm">
          <h1 className="text-2xl font-bold text-slate-900">SI SYSTEM</h1>
        </div>
      </main>
    </MainBackground>
  )
}

export default App
