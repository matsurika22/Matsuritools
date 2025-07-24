import { ReactNode } from 'react'

interface FormFieldProps {
  label: string
  error?: string
  children: ReactNode
  required?: boolean
}

export function FormField({ label, error, children, required }: FormFieldProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  )
}