import { redirect } from 'next/navigation'

export default function Home() {
  // Redirect to dashboard as default landing page
  redirect('/dashboard')
}

