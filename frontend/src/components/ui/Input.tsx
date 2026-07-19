import type { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from 'react'

const field =
  'w-full rounded-xl border border-line bg-panel px-3 py-2.5 text-cream placeholder:text-mist/60 outline-none transition-[border-color,background-color,box-shadow] duration-200 ease-out hover:border-sage/35 focus:border-sage/70 focus:bg-panel-2 focus:ring-2 focus:ring-sage/20'

const fieldInvalid = 'border-red-400/70 focus:border-red-400 focus:ring-red-400/20'

export function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-sm font-medium text-mist">{children}</label>
}

export function Input({
  invalid,
  className = '',
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return (
    <input
      className={`${field} ${invalid ? fieldInvalid : ''} ${className}`}
      aria-invalid={invalid || undefined}
      {...props}
    />
  )
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${field} min-h-28 resize-y`} {...props} />
}

export function Select({
  className = '',
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`${field} ${className}`} {...props} />
}

export function Field({
  label,
  children,
  error,
  hint,
}: {
  label: string
  children: React.ReactNode
  error?: string
  hint?: string
}) {
  return (
    <div className="mb-4">
      <Label>{label}</Label>
      {hint ? <p className="mb-1.5 text-xs text-mist">{hint}</p> : null}
      {children}
      {error ? <p className="mt-1 text-xs text-red-300">{error}</p> : null}
    </div>
  )
}

export function FieldRow({ children }: { children: React.ReactNode }) {
  return <div className="input-row mb-4 [&>div]:mb-0">{children}</div>
}
