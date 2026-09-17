import Link from 'next/link'
import { signup } from '@/app/login/actions'

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const { message } = await searchParams

  return (
    <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2 mx-auto min-h-screen">
      <form className="flex-1 flex flex-col w-full justify-center gap-2 text-foreground" action={signup}>
        <div className="mb-8 flex flex-col items-center">
          <h1 className="text-3xl font-semibold mb-2">Create Account</h1>
          <p className="text-sm text-muted-foreground">Join chatINALabs today</p>
        </div>
        
        <label className="text-md" htmlFor="fullName">
          Full Name
        </label>
        <input
          className="rounded-md px-4 py-2 bg-inherit border mb-6"
          name="fullName"
          placeholder="John Doe"
          required
        />
        
        <label className="text-md" htmlFor="email">
          Email
        </label>
        <input
          className="rounded-md px-4 py-2 bg-inherit border mb-6"
          name="email"
          placeholder="you@example.com"
          required
        />
        
        <label className="text-md" htmlFor="password">
          Password
        </label>
        <input
          className="rounded-md px-4 py-2 bg-inherit border mb-6"
          type="password"
          name="password"
          placeholder="••••••••"
          required
          minLength={6}
        />
        
        <button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-md px-4 py-2 text-foreground mb-2">
          Sign Up
        </button>
        
        {message && (
          <p className="mt-4 p-4 bg-red-900/50 text-red-300 text-center rounded-md">
            {message}
          </p>
        )}

        <div className="mt-4 text-center text-sm">
          Already have an account?{' '}
          <Link href="/login" className="text-emerald-500 hover:underline">
            Sign in
          </Link>
        </div>
      </form>
    </div>
  )
}
