"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface DeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  productName: string
  title?: string
  description?: React.ReactNode
  confirmLabel?: string
  confirming?: boolean
}

export function DeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  productName,
  title = 'Ürünü Sil',
  description,
  confirmLabel = 'Sil',
  confirming = false,
}: DeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {description ?? (
              <>
                <span className="font-medium text-foreground">{productName}</span> ürününü silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={confirming}>İptal</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={confirming} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {confirming ? 'İşleniyor...' : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
