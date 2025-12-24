import FortressDemo from '@/components/FortressDemo'

export const metadata = {
  title: 'nextjs-fortress | Security Validation Framework',
  description: 'Test and validate security protections against common attack vectors',
  keywords: ['security', 'nextjs', 'firewall', 'penetration testing', 'vulnerability'],
}

export default function Home() {
  return (
    <main>
      <FortressDemo />
    </main>
  )
}