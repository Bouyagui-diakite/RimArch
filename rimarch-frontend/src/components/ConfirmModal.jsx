import { Button } from './ui'

export default function ConfirmModal({
  title,
  message,
  confirmLabel = 'Confirmer',
  tone = 'danger',
  onConfirm,
  onCancel,
  loading = false,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0b0d16]/70 backdrop-blur-sm" onClick={onCancel} />

      <div className="relative w-full max-w-sm overflow-hidden rounded-[18px] border border-line bg-surface shadow-2xl">
        <div className="px-8 py-8">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-[#c25048]/30 bg-[#c25048]/[0.07] text-[#c25048]">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="font-display mt-5 text-[21px] leading-tight text-ink">{title}</h3>
          <p className="mt-3 text-[13px] leading-relaxed text-muted">{message}</p>
        </div>

        <div className="flex justify-end gap-2.5 border-t border-line px-6 py-4">
          <Button onClick={onCancel} disabled={loading}>Annuler</Button>
          <Button variant={tone} onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  )
}
