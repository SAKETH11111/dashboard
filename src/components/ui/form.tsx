"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { Slot } from "@radix-ui/react-slot"
import {
  Controller,
  FormProvider,
  useFormContext,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form"

import { cn } from "@/lib/utils"

const Form = FormProvider

type FormItemContextValue = {
  id: string
}

const FormItemContext = React.createContext<FormItemContextValue | null>(null)

const useFormItemContext = () => {
  const context = React.useContext(FormItemContext)
  if (!context) {
    throw new Error("Form components must be used within a <FormItem>")
  }
  return context
}

const FormItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => {
  const id = React.useId()

  return (
    <FormItemContext.Provider value={{ id }}>
      <div ref={ref} className={cn("space-y-2", className)} {...props} />
    </FormItemContext.Provider>
  )
})
FormItem.displayName = "FormItem"

const FormLabel = React.forwardRef<React.ElementRef<typeof LabelPrimitive.Root>, React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>>(
  ({ className, ...props }, ref) => {
    const { id } = useFormItemContext()
    return <LabelPrimitive.Root ref={ref} className={cn("text-sm font-medium leading-none", className)} htmlFor={id} {...props} />
  }
)
FormLabel.displayName = "FormLabel"

const FormControl = React.forwardRef<React.ElementRef<typeof Slot>, React.ComponentPropsWithoutRef<typeof Slot>>(
  ({ className, ...props }, ref) => {
    const { id } = useFormItemContext()
    return <Slot ref={ref} className={className} id={id} {...props} />
  }
)
FormControl.displayName = "FormControl"

const FormDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
))
FormDescription.displayName = "FormDescription"

const FormMessage = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(({ className, children, ...props }, ref) => {
  const { formState } = useFormContext()
  const { id } = useFormItemContext()
  const error = formState.errors[id as keyof typeof formState.errors]

  return (
    <p ref={ref} className={cn("text-sm font-medium text-destructive", className)} {...props}>
      {children || (error && typeof error.message === "string" ? error.message : null)}
    </p>
  )
})
FormMessage.displayName = "FormMessage"

const FormFieldItem = <TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>>({ control, name, render }: ControllerProps<TFieldValues, TName>) => (
  <Controller control={control} name={name} render={render} />
)

export { Form, FormControl, FormDescription, FormFieldItem, FormItem, FormLabel, FormMessage }


