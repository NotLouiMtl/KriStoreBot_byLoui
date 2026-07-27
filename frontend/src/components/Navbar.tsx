'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const links = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/users', label: 'Usuarios' },
  { href: '/stock', label: 'Stock' },
  { href: '/services', label: 'Servicios' },
  { href: '/transactions', label: 'Transacciones' },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  return (
    <nav className="bg-white border-b border-pink-200 px-6 py-4 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-6">
        <span className="text-lg font-bold text-pink-500">StreamingBot</span>
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`text-sm transition ${pathname === link.href ? 'text-pink-600 font-semibold' : 'text-gray-400 hover:text-pink-400'}`}
          >
            {link.label}
          </Link>
        ))}
      </div>
      <button onClick={handleLogout} className="text-sm text-rose-400 hover:text-rose-500 transition">
        Cerrar sesion
      </button>
    </nav>
  );
}
