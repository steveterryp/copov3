"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface StepProps {
  title: string
  isActive?: boolean
  isCompleted?: boolean
  isLastStep?: boolean
}

const Step = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & StepProps
>(({ title, isActive, isCompleted, isLastStep, className, ...props }, ref) => (
  <div
    ref={ref}
    {...props}
    className={cn("flex items-center", className)}
  >
    <div className="relative flex items-center">
      <div
        className={cn(
          "h-8 w-8 rounded-full border-2 flex items-center justify-center transition-colors",
          isActive && "border-primary bg-primary text-primary-foreground",
          isCompleted && "border-primary bg-primary text-primary-foreground",
          !isActive && !isCompleted && "border-muted-foreground"
        )}
      >
        {isCompleted ? (
          <Check className="h-4 w-4" />
        ) : (
          <span className="text-sm font-medium">
            {props["aria-label"]?.replace(/[^0-9]/g, '')}
          </span>
        )}
      </div>
      {!isLastStep && (
        <div
          className={cn(
            "absolute top-4 left-8 h-[2px] w-[calc(100%-2rem)]",
            (isActive || isCompleted) ? "bg-primary" : "bg-muted-foreground/30"
          )}
        />
      )}
    </div>
    <span
      className={cn(
        "ml-3 text-sm font-medium",
        isActive && "text-primary",
        !isActive && !isCompleted && "text-muted-foreground"
      )}
    >
      {title}
    </span>
  </div>
))
Step.displayName = "Step"

interface StepperProps extends React.HTMLAttributes<HTMLDivElement> {
  activeStep: number
  steps: string[]
}

const Stepper = React.forwardRef<HTMLDivElement, StepperProps>(
  ({ activeStep, steps, className, ...props }, ref) => (
    <div
      ref={ref}
      {...props}
      className={cn("flex justify-between", className)}
    >
      {steps.map((step, index) => (
        <Step
          key={step}
          title={step}
          isActive={index === activeStep}
          isCompleted={index < activeStep}
          isLastStep={index === steps.length - 1}
          aria-label={`Step ${index + 1}`}
        />
      ))}
    </div>
  )
)
Stepper.displayName = "Stepper"

export { Stepper }
