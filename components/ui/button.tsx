import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import clsx from "clsx"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-impact-blue disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-impact-blue text-white hover:opacity-95",
        secondary: "bg-impact-light text-impact-dark ring-1 ring-impact-dark/10 hover:bg-white"
      },
      size: {
        sm: "h-9 px-3",
        md: "h-10 px-4",
        lg: "h-11 px-5"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "md"
    }
  }
)

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button ref={ref} className={clsx(buttonVariants({ variant, size }), className)} {...props} />
    )
  }
)
Button.displayName = "Button"
