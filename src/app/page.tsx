import { redirect } from 'next/navigation';

export default function HomePage() {
  // Redirect to login page - actual routing will be handled by middleware
  redirect('/login');
}
