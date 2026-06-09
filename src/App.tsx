import { useEffect } from 'react'
import { IconContext, SquaresFour, Stack, GearSix, Plus } from '@phosphor-icons/react'
import { useApp, applyAccent } from './lib/store'
import { Sidebar } from './components/Sidebar'
import { Toasts } from './components/Toasts'
import { DocumentModal } from './components/DocumentModal'
import { Dashboard } from './pages/Dashboard'
import { Deals } from './pages/Deals'
import { DealWorkspace } from './pages/DealWorkspace'
import { Admin } from './pages/Admin'

function MobileBar() {
  const { route, navigate, settings, createDeal } = useApp()
  const is = (n: string) => route.name === n
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-2 bg-bg/85 px-4 py-3 backdrop-blur-xl lg:hidden">
      <button onClick={() => navigate({ name: 'dashboard' })} className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl text-accent-ink lift" style={{ background: 'var(--c-accent)', fontFamily: 'var(--font-display)' }}>
          {settings.brand.name.charAt(0)}
        </span>
        <span className="text-[15px] font-semibold text-ink" style={{ fontFamily: 'var(--font-display)' }}>
          {settings.brand.name}
        </span>
      </button>
      <nav className="flex items-center gap-1">
        <button onClick={() => navigate({ name: 'dashboard' })} className={`flex h-9 w-9 items-center justify-center rounded-full ${is('dashboard') ? 'bg-tray text-ink' : 'text-muted'}`}>
          <SquaresFour size={19} />
        </button>
        <button onClick={() => navigate({ name: 'deals' })} className={`flex h-9 w-9 items-center justify-center rounded-full ${is('deals') || is('deal') ? 'bg-tray text-ink' : 'text-muted'}`}>
          <Stack size={19} />
        </button>
        <button onClick={() => navigate({ name: 'admin' })} className={`flex h-9 w-9 items-center justify-center rounded-full ${is('admin') ? 'bg-tray text-ink' : 'text-muted'}`}>
          <GearSix size={19} />
        </button>
        <button onClick={createDeal} className="ml-1 flex h-9 w-9 items-center justify-center rounded-full bg-accent text-accent-ink lift">
          <Plus size={18} weight="bold" />
        </button>
      </nav>
    </header>
  )
}

function CurrentPage() {
  const route = useApp((s) => s.route)
  switch (route.name) {
    case 'dashboard':
      return <Dashboard />
    case 'deals':
      return <Deals />
    case 'deal':
      return <DealWorkspace id={route.id} />
    case 'admin':
      return <Admin />
    default:
      return <Dashboard />
  }
}

export default function App() {
  const accent = useApp((s) => s.settings.brand.accent)
  useEffect(() => {
    applyAccent(accent)
  }, [accent])

  return (
    <IconContext.Provider value={{ weight: 'light', size: 20, mirrored: false }}>
      <div className="relative z-[2] flex min-h-[100dvh]">
        <Sidebar />
        <main className="min-w-0 flex-1">
          <MobileBar />
          <CurrentPage />
        </main>
        <Toasts />
        <DocumentModal />
      </div>
    </IconContext.Provider>
  )
}
