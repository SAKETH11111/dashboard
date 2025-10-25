"use client"

import * as React from "react"
import * as SheetPrimitive from "@radix-ui/react-dialog"
import { XIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Sheet({ ...props }: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetPortal({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Portal>) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />
}

function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className
      )}
      {...props}
    />
  )
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function SheetContent({
  className,
  children,
  side = "right",
  resizable = false,
  defaultWidth = 720,
  minWidth = 440,
  maxWidth = 1024,
  storageKey,
  style: styleProp,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: "top" | "right" | "bottom" | "left"
  resizable?: boolean
  defaultWidth?: number
  minWidth?: number
  maxWidth?: number
  storageKey?: string
}) {
  const isHorizontal = side === "left" || side === "right"
  const enableResize = resizable && isHorizontal
  const resolvedStorageKey = storageKey ?? `sheet-width:${side}`

  const [width, setWidthState] = React.useState(() =>
    clamp(defaultWidth, minWidth, maxWidth)
  )
  const widthRef = React.useRef(width)

  React.useEffect(() => {
    widthRef.current = width
  }, [width])

  React.useEffect(() => {
    if (!enableResize || typeof window === "undefined") return
    try {
      const stored = window.localStorage.getItem(resolvedStorageKey)
      if (!stored) return
      const parsed = Number.parseInt(stored, 10)
      if (Number.isNaN(parsed)) return
      const clamped = clamp(parsed, minWidth, maxWidth)
      widthRef.current = clamped
      setWidthState(clamped)
    } catch {
      // swallow storage errors
    }
  }, [enableResize, resolvedStorageKey, minWidth, maxWidth])

  const setWidth = React.useCallback(
    (next: number | ((value: number) => number)) => {
      if (!enableResize) return
      setWidthState((current) => {
        const desired = typeof next === "function" ? next(current) : next
        const clamped = clamp(desired, minWidth, maxWidth)
        widthRef.current = clamped
        if (typeof window !== "undefined") {
          try {
            window.localStorage.setItem(resolvedStorageKey, String(clamped))
          } catch {
            // ignore write issues
          }
        }
        return clamped
      })
    },
    [enableResize, minWidth, maxWidth, resolvedStorageKey]
  )

  const startXRef = React.useRef(0)
  const startWidthRef = React.useRef(0)
  const pointerIdRef = React.useRef<number | null>(null)
  const previousCursorRef = React.useRef<string>("")

  const stopResizing = React.useCallback(() => {
    if (!enableResize) return
    pointerIdRef.current = null
    if (typeof document !== "undefined") {
      document.body.style.cursor = previousCursorRef.current
    }
  }, [enableResize])

  const handlePointerMove = React.useCallback(
    (event: PointerEvent) => {
      if (!enableResize || pointerIdRef.current === null) return
      const delta =
        side === "left"
          ? event.clientX - startXRef.current
          : startXRef.current - event.clientX
      setWidth(startWidthRef.current + delta)
    },
    [enableResize, side, setWidth]
  )

  const handlePointerUp = React.useCallback(() => {
    if (!enableResize || pointerIdRef.current === null) return
    window.removeEventListener("pointermove", handlePointerMove)
    window.removeEventListener("pointerup", handlePointerUp)
    stopResizing()
  }, [enableResize, handlePointerMove, stopResizing])

  const handlePointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!enableResize) return
      if (event.button !== 0) return
      event.preventDefault()
      pointerIdRef.current = event.pointerId
      startXRef.current = event.clientX
      startWidthRef.current = widthRef.current
      if (typeof document !== "undefined") {
        previousCursorRef.current = document.body.style.cursor
        document.body.style.cursor = "col-resize"
      }
      window.addEventListener("pointermove", handlePointerMove)
      window.addEventListener("pointerup", handlePointerUp)
    },
    [enableResize, handlePointerMove, handlePointerUp]
  )

  React.useEffect(() => {
    if (!enableResize) return
    return () => {
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", handlePointerUp)
      stopResizing()
    }
  }, [enableResize, handlePointerMove, handlePointerUp, stopResizing])

  const contentStyle = React.useMemo(() => {
    if (!enableResize) {
      return styleProp
    }
    const widthStyle = {
      width: `${width}px`,
      minWidth: `${minWidth}px`,
      maxWidth: `${maxWidth}px`,
    }
    return styleProp ? { ...styleProp, ...widthStyle } : widthStyle
  }, [enableResize, maxWidth, minWidth, styleProp, width])

  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        className={cn(
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out group fixed z-50 flex flex-col gap-4 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
          side === "right" &&
            cn(
              "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right inset-y-0 right-0 h-full border-l",
              enableResize ? "" : "w-3/4 sm:max-w-sm"
            ),
          side === "left" &&
            cn(
              "data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left inset-y-0 left-0 h-full border-r",
              enableResize ? "" : "w-3/4 sm:max-w-sm"
            ),
          side === "top" &&
            "data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top inset-x-0 top-0 h-auto border-b",
          side === "bottom" &&
            "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom inset-x-0 bottom-0 h-auto border-t",
          className
        )}
        style={contentStyle}
        {...props}
      >
        {enableResize ? (
          <div
            aria-hidden="true"
            role="separator"
            data-slot="sheet-resizer"
            className={cn(
              "absolute inset-y-0 z-10 hidden w-3 cursor-col-resize touch-none select-none sm:block",
              side === "right" ? "-left-1" : "-right-1"
            )}
            onPointerDown={handlePointerDown}
          >
            <div
              className={cn(
                "absolute left-1/2 top-1/2 h-16 w-px -translate-x-1/2 -translate-y-1/2 rounded-full bg-border/70",
                "opacity-0 transition-opacity duration-150 ease-linear",
                "hover:opacity-100 group-hover:opacity-100"
              )}
            />
          </div>
        ) : null}
        {children}
        <SheetPrimitive.Close className="ring-offset-background focus:ring-ring data-[state=open]:bg-secondary absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none">
          <XIcon className="size-4" />
          <span className="sr-only">Close</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-1.5 p-4", className)}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  )
}

function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn("text-foreground font-semibold", className)}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
