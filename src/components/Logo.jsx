
import React from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import haydIcon from '@/assets/hayd-icon.png'

export function Logo({ variant = 'dark', className, showTagline = false }) {
  const isLight = variant === 'light'

  return (
    <Link
      to="/"
      aria-label="HAYD — Health At Your Door, home"
      className={cn('group inline-flex items-center gap-3', className)}
    >
      <img
        src={haydIcon}
        alt="HAYD icon"
        className="h-10 w-10 object-contain shrink-0 transition-transform duration-500 group-hover:scale-105"
      />

      <span className="flex flex-col leading-none">
        <span
          className={cn(
            'font-heading text-[1.4rem] font-extrabold tracking-[-0.03em]',
            isLight ? 'text-white' : 'text-[#09275F]'
          )}
        >
          HAYD
        </span>

        {showTagline && (
          <span
            className={cn(
              'mt-1 text-[0.6rem] font-medium italic tracking-[0.08em]',
              isLight ? 'text-white/70' : 'text-muted-foreground'
            )}
          >
            ...Delivering on Time
          </span>
        )}
      </span>
    </Link>
  )
}
