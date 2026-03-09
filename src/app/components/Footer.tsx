import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-200 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">W</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Workflow Manager</span>
          </Link>

          {/* Navigation Desktop */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="#features" className="text-gray-600 hover:text-gray-900 transition">
              Fonctionnalités
            </Link>
            <Link href="#pricing" className="text-gray-600 hover:text-gray-900 transition">
              Tarifs
            </Link>
            <Link href="#about" className="text-gray-600 hover:text-gray-900 transition">
              À propos
            </Link>
            <Link href="/docs" className="text-gray-600 hover:text-gray-900 transition">
              Documentation
            </Link>
          </div>

          {/* Boutons CTA */}
          <div className="flex items-center space-x-4">
            <Link
              href="/auth/login"
              className="hidden md:block text-gray-700 hover:text-gray-900 font-medium transition"
            >
              Se connecter
            </Link>
            <Link
              href="/auth/register"
              className="px-5 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition shadow-sm"
            >
              Commencer
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}