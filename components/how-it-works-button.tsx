"use client"

import { useState } from 'react'
import { HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { HELP_CONTENT, type HelpPageKey } from '@/lib/help-content'

export function HowItWorksButton({ page }: { page: HelpPageKey }) {
  const [open, setOpen] = useState(false)
  const content = HELP_CONTENT[page]
  if (!content) return null

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 text-muted-foreground shrink-0"
        onClick={() => setOpen(true)}
        aria-label="Nasil Calisir"
      >
        <HelpCircle className="w-5 h-5" />
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-primary shrink-0" />
              {content.title}
            </AlertDialogTitle>
          </AlertDialogHeader>
          <ol className="space-y-2.5 text-sm text-foreground">
            {content.steps.map((step, i) => (
              <li key={i} className="flex gap-2.5">
                <span className="shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center mt-0.5">{i + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setOpen(false)}>Anladim</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
