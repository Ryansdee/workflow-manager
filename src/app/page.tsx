import Link from 'next/link';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-8 max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-block animate-fade-in">
              <span className="px-4 py-2 bg-blue-100 text-blue-700 text-sm font-medium rounded-full inline-flex items-center space-x-2">
                <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
                <span>✨ Nouveau : Éditeur de code collaboratif intégré</span>
              </span>
            </div>

            {/* Titre principal */}
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 leading-tight">
              Gérez vos projets <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                Codez ensemble
              </span>
            </h1>

            {/* Description */}
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              La plateforme tout-en-un pour les équipes de développement. 
              Organisez vos workflows, collaborez en temps réel et codez directement 
              dans l'application avec notre éditeur intégré.
            </p>

            {/* Boutons CTA */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
              <Link
                href="/auth/register"
                className="px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-lg"
              >
                Commencer gratuitement →
              </Link>

              <Link
                href="#demo"
                className="px-8 py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all text-lg"
              >
                Voir la démo
              </Link>
            </div>

            {/* Stats */}
            <div className="pt-12 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div>
                <div className="text-3xl font-bold text-gray-900">10k+</div>
                <div className="text-sm text-gray-600">Utilisateurs actifs</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900">50k+</div>
                <div className="text-sm text-gray-600">Projets créés</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900">99.9%</div>
                <div className="text-sm text-gray-600">Uptime</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Une plateforme complète qui combine gestion de projets et développement collaboratif
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl hover:shadow-xl transition-all">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4">
                <span className="text-2xl">💻</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Éditeur de Code Intégré
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Codez directement dans l'application avec la coloration syntaxique, 
                l'autocomplétion et la collaboration en temps réel.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl hover:shadow-xl transition-all">
              <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Tableaux de Bord Visuels
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Visualisez vos projets avec des vues Kanban, Timeline et Calendar. 
                Suivez la progression en temps réel.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl hover:shadow-xl transition-all">
              <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center mb-4">
                <span className="text-2xl">👥</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Collaboration Temps Réel
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Travaillez ensemble sur le code et les tâches. Voyez les modifications 
                de votre équipe instantanément.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-8 bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl hover:shadow-xl transition-all">
              <div className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center mb-4">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Automatisation Intelligente
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Automatisez vos workflows répétitifs et intégrez vos outils préférés 
                (GitHub, GitLab, Slack).
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-8 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl hover:shadow-xl transition-all">
              <div className="w-12 h-12 bg-cyan-600 rounded-xl flex items-center justify-center mb-4">
                <span className="text-2xl">🔍</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Revue de Code Simplifiée
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Commentez, approuvez et discutez du code directement dans l'interface. 
                Tracking automatique des changements.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-8 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl hover:shadow-xl transition-all">
              <div className="w-12 h-12 bg-yellow-600 rounded-xl flex items-center justify-center mb-4">
                <span className="text-2xl">🔐</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Sécurité Enterprise
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Chiffrement de bout en bout, SSO, authentification 2FA et conformité 
                RGPD garantie.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Code Editor Preview Section */}
      <section className="py-20 px-6 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">
                Un éditeur de code professionnel intégré
              </h2>
              <p className="text-gray-300 text-lg mb-8 leading-relaxed">
                Pourquoi jongler entre plusieurs outils ? Notre éditeur de code intégré 
                vous permet de coder directement dans votre espace de travail.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start space-x-3">
                  <span className="text-green-400 text-xl">✓</span>
                  <span className="text-gray-300">Support multi-langages (JS, TS, Python, Go, etc.)</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-green-400 text-xl">✓</span>
                  <span className="text-gray-300">Collaboration en temps réel avec curseurs multiples</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-green-400 text-xl">✓</span>
                  <span className="text-gray-300">Intégration Git native et terminal intégré</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-green-400 text-xl">✓</span>
                  <span className="text-gray-300">Snippets réutilisables et raccourcis personnalisables</span>
                </li>
              </ul>
            </div>
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-2xl">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-gray-400 text-sm ml-4">app.tsx</span>
              </div>
              <pre className="text-sm text-gray-300 overflow-x-auto">
                <code>{`function App() {
  const [count, setCount] = useState(0);
  
  return (
    <div className="app">
      <h1>Hello Workflow Manager!</h1>
      <button onClick={() => setCount(count + 1)}>
        Count: {count}
      </button>
    </div>
  );
}`}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Des tarifs simples et transparents
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Commencez gratuitement, passez à la vitesse supérieure quand vous êtes prêt
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free Plan */}
            <div className="bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-gray-300 transition-all">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Free</h3>
              <p className="text-gray-600 mb-6">Pour découvrir la plateforme</p>
              <div className="mb-6">
                <span className="text-5xl font-bold text-gray-900">0€</span>
                <span className="text-gray-600">/mois</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start space-x-3">
                  <span className="text-green-500">✓</span>
                  <span className="text-gray-700">Jusqu'à 3 utilisateurs</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-green-500">✓</span>
                  <span className="text-gray-700">3 projets maximum</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-green-500">✓</span>
                  <span className="text-gray-700">Éditeur de code basique</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-green-500">✓</span>
                  <span className="text-gray-700">500 MB de stockage</span>
                </li>
              </ul>
              <Link
                href="/auth/register?plan=free"
                className="block w-full py-3 text-center border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:border-gray-400 hover:bg-gray-50 transition"
              >
                Commencer gratuitement
              </Link>
            </div>

            {/* Starter Plan */}
            <div className="bg-white rounded-2xl p-8 border-2 border-blue-500 hover:border-blue-600 transition-all relative shadow-xl scale-105">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="px-4 py-1 bg-blue-600 text-white text-sm font-medium rounded-full">
                  Populaire
                </span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Starter</h3>
              <p className="text-gray-600 mb-6">Pour les petites équipes</p>
              <div className="mb-6">
                <span className="text-5xl font-bold text-gray-900">12€</span>
                <span className="text-gray-600">/utilisateur/mois</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start space-x-3">
                  <span className="text-green-500">✓</span>
                  <span className="text-gray-700">Utilisateurs illimités</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-green-500">✓</span>
                  <span className="text-gray-700">Projets illimités</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-green-500">✓</span>
                  <span className="text-gray-700">Collaboration temps réel</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-green-500">✓</span>
                  <span className="text-gray-700">10 GB par utilisateur</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-green-500">✓</span>
                  <span className="text-gray-700">Intégrations basiques</span>
                </li>
              </ul>
              <Link
                href="/auth/register?plan=starter"
                className="block w-full py-3 text-center bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition shadow-lg"
              >
                Essayer 14 jours gratuits
              </Link>
            </div>

            {/* Professional Plan */}
            <div className="bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-gray-300 transition-all">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Professional</h3>
              <p className="text-gray-600 mb-6">Pour les équipes avancées</p>
              <div className="mb-6">
                <span className="text-5xl font-bold text-gray-900">24€</span>
                <span className="text-gray-600">/utilisateur/mois</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start space-x-3">
                  <span className="text-green-500">✓</span>
                  <span className="text-gray-700">Tout de Starter, plus:</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-green-500">✓</span>
                  <span className="text-gray-700">Automatisation avancée</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-green-500">✓</span>
                  <span className="text-gray-700">Intégrations illimitées</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-green-500">✓</span>
                  <span className="text-gray-700">50 GB par utilisateur</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-green-500">✓</span>
                  <span className="text-gray-700">Support prioritaire 24/7</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-green-500">✓</span>
                  <span className="text-gray-700">Analytics avancés</span>
                </li>
              </ul>
              <Link
                href="/auth/register?plan=pro"
                className="block w-full py-3 text-center border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:border-gray-400 hover:bg-gray-50 transition"
              >
                Essayer 14 jours gratuits
              </Link>
            </div>
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">
              Besoin d'une solution enterprise avec SSO, audit logs et support dédié ?
            </p>
            <Link
              href="/contact-sales"
              className="text-blue-600 font-semibold hover:text-blue-700 transition"
            >
              Contactez notre équipe →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Prêt à transformer votre façon de travailler ?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Rejoignez des milliers d'équipes qui utilisent Workflow Manager pour 
            gérer leurs projets et coder ensemble plus efficacement.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register"
              className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition shadow-xl text-lg"
            >
              Commencer gratuitement
            </Link>
            <Link
              href="/demo"
              className="px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition text-lg"
            >
              Planifier une démo
            </Link>
          </div>
          <p className="text-blue-100 text-sm mt-6">
            Sans carte bancaire • Configuration en 2 minutes • Annulation à tout moment
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}