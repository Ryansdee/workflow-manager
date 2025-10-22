import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-6">
      <div className="text-center space-y-6 max-w-3xl">
        {/* Badge */}
        <div className="inline-block">
          <span className="px-4 py-1.5 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
            ✨ Nouveau : Collaboration en temps réel
          </span>
        </div>

        {/* Titre principal */}
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
          Gérez vos projets avec
          <span className="text-blue-600"> simplicité</span>
        </h1>

        {/* Description */}
        <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Workflow Manager vous aide à organiser vos projets, collaborer efficacement
          avec vos équipes et suivre vos tâches en temps réel grâce à un workflow
          clair et structuré.
        </p>

        {/* Boutons CTA */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Link
            href="/auth/register"
            className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Commencer gratuitement
          </Link>

          <Link
            href="/auth/login"
            className="px-8 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all"
          >
            Se connecter
          </Link>
        </div>

        {/* Caractéristiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12">
          <div className="p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="text-3xl mb-3">📊</div>
            <h3 className="font-semibold text-gray-900 mb-2">Tableaux de bord</h3>
            <p className="text-sm text-gray-600">
              Visualisez vos projets et suivez la progression en un coup d'œil
            </p>
          </div>

          <div className="p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="text-3xl mb-3">👥</div>
            <h3 className="font-semibold text-gray-900 mb-2">Collaboration</h3>
            <p className="text-sm text-gray-600">
              Travaillez ensemble en temps réel avec votre équipe
            </p>
          </div>

          <div className="p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="font-semibold text-gray-900 mb-2">Automatisation</h3>
            <p className="text-sm text-gray-600">
              Automatisez vos workflows et gagnez du temps
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
