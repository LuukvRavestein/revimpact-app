import * as React from "react"
import clsx from "clsx"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={clsx(
        "flex h-10 w-full rounded-md border border-impact-dark/20 bg-white px-3 py-2 text-sm placeholder:text-impact-dark/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-impact-blue disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
)
Input.displayName = "Input"
