import * as React from "react"
import clsx from "clsx"

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx(
      "rounded-lg border border-impact-dark/10 bg-white text-impact-dark shadow-sm",
      className
    )} {...props} />
  )
}

export function CardHeader(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div className="p-4 border-b border-impact-dark/10" {...props} />
}

export function CardContent(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div className="p-4" {...props} />
}

export function CardFooter(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div className="p-4 border-t border-impact-dark/10" {...props} />
}
