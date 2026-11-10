import React from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import haydIconNavy from '@/assets/hayd-icon-navy.png'
import haydIconWhite from '@/assets/hayd-icon-white.png'

export function Logo({ variant = 'dark', className, showTagline = false }) {
  const isLight = variant === 'light'
  const iconSrc = isLight ? haydIconWhite : haydIconNavy

  return (
    <Link
      to="/"
      aria-label="HAYD — Health At Your Door, home"
      className={cn('group inline-flex items-center gap-2', className)}
    >
      <img
        src={iconSrc}
        alt="HAYD logo mark"
        className="h-8 w-8 object-contain shrink-0 transition-transform duration-300 group-hover:scale-105"
      />

      <span className="flex flex-col leading-none">
        <span
          className={cn(
            'font-heading text-[1.35rem] font-extrabold tracking-[-0.035em]',
            isLight ? 'text-white' : 'text-[#08162E]'
          )}
        >
          HAYD
        </span>

        {showTagline && (
          <span
            className={cn(
              'mt-1 text-[0.6rem] font-medium tracking-[0.08em]',
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
