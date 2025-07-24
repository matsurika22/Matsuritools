import { RegisterForm } from '@/components/features/auth/register-form'

export default function RegisterPage() {
  return (
    <>
      <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-6">
        新規登録
      </h2>
      <RegisterForm />
    </>
  )
}