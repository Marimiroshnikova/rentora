export function Alert({
  children,
  tone = 'error',
}: {
  children: React.ReactNode
  tone?: 'error' | 'info'
}) {
  return (
    <div
      role="alert"
      className={`auth-alert ${tone === 'info' ? 'auth-alert-info' : 'auth-alert-error'}`}
    >
      {children}
    </div>
  )
}
