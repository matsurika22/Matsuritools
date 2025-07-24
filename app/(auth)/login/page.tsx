import { LoginForm } from '@/components/features/auth/login-form'

export default function LoginPage() {
  return (
    <>
      <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-6">
        ログイン
      </h2>
      <LoginForm />
    </>
  )
}