import { Outlet } from 'react-router-dom'
import { AuthFloatingBg } from './AuthFloatingBg'
import { Navbar } from './Navbar'

export function AuthLayout() {
  return (
    <div className="auth-layout flex min-h-screen flex-col">
      <Navbar />
      <main className="auth-layout-main flex flex-1 flex-col items-center justify-start px-4 pb-10 pt-10 md:pt-14">
        <AuthFloatingBg />
        <Outlet />
      </main>
    </div>
  )
}
