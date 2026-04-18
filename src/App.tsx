import { useAppStore } from '@/store/bracketStore'
import { Home } from '@/pages/Home'
import { Editor } from '@/pages/Editor'
import { Button } from '@/components/ui/Button'
import '@/styles/global.css'

export function App() {
  const view = useAppStore((s) => s.view)
  const isDark = useAppStore((s) => s.isDark)
  const toggleTheme = useAppStore((s) => s.toggleTheme)

  return (
    <>
      {/* Theme toggle sits globally over the app */}
      <div style={{ position: 'fixed', top: '1rem', right: '1.5rem', zIndex: 100 }}>
        <Button variant="icon" onClick={toggleTheme} aria-label="Toggle theme">
          {isDark ? <SunIcon /> : <MoonIcon />}
        </Button>
      </div>

      {view === 'home' ? <Home /> : <Editor />}
    </>
  )
}

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"></circle>
      <line x1="12" y1="1" x2="12" y2="3"></line>
      <line x1="12" y1="21" x2="12" y2="23"></line>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
      <line x1="1" y1="12" x2="3" y2="12"></line>
      <line x1="21" y1="12" x2="23" y2="12"></line>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
    </svg>
  )
}
