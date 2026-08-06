/**
 * Unauthenticated admin screens: login, forgot password, reset password.
 *
 * These deliberately sit in their own route group so they are NOT wrapped by
 * the authenticated shell. Nesting them under a layout that calls
 * `requireAdmin()` would redirect the login page to itself.
 */
export default function AdminAuthLayout({ children }: LayoutProps<'/admin'>) {
  return <div className="flex min-h-screen flex-col bg-paper-sunk">{children}</div>
}
