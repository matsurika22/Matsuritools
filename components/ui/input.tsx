import { forwardRef } from 'react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`
          flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm
          ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium
          placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2
          focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50
          dark:bg-gray-950 dark:ring-offset-gray-950 dark:placeholder:text-gray-400
          ${error 
            ? 'border-red-500 focus-visible:ring-red-500' 
            : 'border-gray-300 focus-visible:ring-blue-600 dark:border-gray-700'
          }
          ${className}
        `}
        {...props}
      />
    )
  }
)

Input.displayName = 'Input'