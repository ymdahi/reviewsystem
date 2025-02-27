'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { cn } from "@/lib/utils"

interface StarRatingProps extends React.HTMLAttributes<HTMLDivElement> {
  maxStars?: number
  value?: number
  onChange?: (value: number) => void
  readOnly?: boolean
}

export function StarRating({
  maxStars = 5,
  value = 0,
  onChange,
  readOnly = false,
  className,
  ...props
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null)
  const displayValue = hoverValue ?? value

  return (
    <div 
      className={cn("flex gap-1", className)} 
      {...props}
    >
      {Array.from({ length: maxStars }).map((_, index) => {
        const starValue = index + 1
        const filled = starValue <= displayValue

        return (
          <button
            key={index}
            type="button"
            disabled={readOnly}
            className={cn(
              "p-0.5 transition-colors",
              filled ? "text-yellow-400" : "text-gray-300",
              !readOnly && "hover:text-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2",
              readOnly && "cursor-default"
            )}
            onClick={() => !readOnly && onChange?.(starValue)}
            onMouseEnter={() => !readOnly && setHoverValue(starValue)}
            onMouseLeave={() => !readOnly && setHoverValue(null)}
          >
            <Star className="h-6 w-6 fill-current" />
          </button>
        )
      })}
    </div>
  )
}
