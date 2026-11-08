import React, { useState, useEffect } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Phone, ArrowUpRight, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/Logo'
import { Sheet, SheetTrigger, SheetContent } from '@/components/ui/sheet'

const NAV_LINKS = [
  { label: 'Services', to: '/services' },
  { label: 'Partners', to: '/partners' },
  { label: 'About', to: '/about' },
  { label: 'Track', to: '/track' },
  { label: 'Contact', to: '/contact' },
]

export function Header() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-all duration-300',
        scrolled
          ? 'border-b border-border/70 bg-background/85 backdrop-blur-xl'
          : 'border-b border-transparent bg-background/60 backdrop-blur-sm'
      )}
    >
      <div className="container-page flex h-[4.75rem] items-center justify-between gap-6">
        <Logo />
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {NAV_LINKS.map((item) =>
            item.to.includes('#') ? (
              <a
                key={item.label}
                href={item.to}
                className="rounded-full px-4 py-2 text-sm font-medium text-foreground/70 transition-colors hover:bg-secondary hover:text-foreground"
              >
                {item.label}
              </a>
            ) : (
              <NavLink
                key={item.label}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'rounded-full px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary hover:text-foreground',
                    isActive ? 'text-foreground' : 'text-foreground/70'
                  )
                }
              >
                {item.label}
              </NavLink>
            )
          )}
        </nav>
        <div className="flex items-center gap-2">
          <a
            href="tel:+447761734423"
            className="hidden items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-foreground/70 transition-colors hover:text-foreground xl:inline-flex"
          >
            <Phone className="h-4 w-4" strokeWidth={1.8} />
            07761 734423
          </a>
          <Link
            to="/request"
            className="group hidden items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-all duration-300 hover:bg-primary/90 sm:inline-flex"
          >
            Book a collection
            <ArrowUpRight
              className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              strokeWidth={1.8}
            />
          </Link>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                aria-label="Open menu"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border text-foreground lg:hidden"
              >
                <Menu className="h-5 w-5" strokeWidth={1.8} />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full max-w-sm border-l border-border bg-background p-8">
              <div className="mt-8 flex flex-col">
                {NAV_LINKS.map((item) => (
                  <Link
                    key={item.label}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className="border-b border-border/70 py-4 font-heading text-2xl font-semibold tracking-tight text-foreground/85 transition-colors hover:text-accent"
                  >
                    {item.label}
                  </Link>
                ))}
                <Link
                  to="/request"
                  onClick={() => setOpen(false)}
                  className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-4 text-sm font-medium text-primary-foreground"
                >
                  Book a collection
                  <ArrowUpRight className="h-4 w-4" strokeWidth={1.8} />
                </Link>
                <a
                  href="tel:+447761734423"
                  className="mt-4 inline-flex items-center justify-center gap-2 text-sm text-muted-foreground"
                >
                  <Phone className="h-4 w-4" strokeWidth={1.8} />
                  07761 734423
                </a>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}

