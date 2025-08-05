"use client"

import * as React from "react"
import * as TogglePrimitive from "@radix-ui/react-toggle"
import { cn } from "@/lib/utils"

interface ToggleProps extends React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root> {
  size?: "default" | "sm" | "lg"
  variant?: "default" | "outline"
}

const Toggle = React.forwardRef<
  React.ElementRef<typeof TogglePrimitive.Root>,
  ToggleProps
>(({ className, size = "default", variant = "default", ...props }, ref) => {
  const sizeClasses = {
    default: "h-9 px-3",
    sm: "h-8 px-2",
    lg: "h-10 px-3",
  }

  const variantClasses = {
    default: "bg-transparent",
    outline: "border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground",
  }

  return (
    <TogglePrimitive.Root
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground",
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      {...props}
    />
  )
})

Toggle.displayName = TogglePrimitive.Root.displayName

export { Toggle }