import { redirect } from 'next/navigation'

export default function Home() {
  // Middleware handles auth check, if not authenticated it will redirect to /login
  // If authenticated, we just want to push them to /chat
  redirect('/chat')
}
