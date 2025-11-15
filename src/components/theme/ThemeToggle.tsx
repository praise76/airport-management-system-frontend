import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

export function ThemeToggle({ className }: { className?: string }) {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('theme')
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    const next = stored ?? (prefersDark ? 'dark' : 'light')
    setIsDark(next === 'dark')
    document.documentElement.classList.toggle('dark', next === 'dark')
    document.documentElement.setAttribute('data-theme', next)
  }, [])

  function toggle() {
    const next = !isDark
    setIsDark(next)
    const theme = next ? 'dark' : 'light'
    localStorage.setItem('theme', theme)
    document.documentElement.classList.toggle('dark', next)
    document.documentElement.setAttribute('data-theme', theme)
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggle}
      aria-label="Toggle theme"
      className={cn(className)}
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </Button>
  )
}


