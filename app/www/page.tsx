import { redirect } from 'next/navigation'

export default function WWWPage() {
  // This page will be accessible at /www but redirects to marketing
  redirect('/marketing')
}
