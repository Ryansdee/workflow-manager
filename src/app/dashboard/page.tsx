"use client";

import { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, FolderKanban, Users, Calendar, ArrowRight, Loader2, Search, Grid3x3, List } from "lucide-react";

export default function DashboardPage() {
  const [user, loadingAuth] = useAuthState(auth);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const router = useRouter();

  useEffect(() => {
    if (!loadingAuth && !user) {
      router.push("/login");
      return;
    }

    const fetchWorkflows = async () => {
      if (!user) return;
      setLoading(true);

      // On récupère tous les workflows
      const snapshot = await getDocs(collection(db, "workflows"));
      const data: any[] = [];

      snapshot.forEach((doc) => {
        const wf = doc.data();
        // Vérifie si l'utilisateur est membre de ce workflow
        const isMember = wf.members?.some((m: any) => m.uid === user.uid);
        if (isMember) data.push({ id: doc.id, ...wf });
      });

      setWorkflows(data);
      setLoading(false);
    };

    fetchWorkflows();
  }, [user, loadingAuth, router]);

  const filteredWorkflows = workflows.filter((wf) =>
    wf.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (timestamp: any) => {
    if (!timestamp?.toDate) return "—";
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  if (loadingAuth || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-neutral-900 mx-auto mb-3" />
          <p className="text-sm text-neutral-600">Chargement de vos projets...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <main className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-neutral-900 mb-2 tracking-tight">
                Mes Projets
              </h1>
              <p className="text-sm text-neutral-600">
                Gérez vos workflows et collaborez avec votre équipe
              </p>
            </div>

            <Link
              href="/dashboard/create"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nouveau projet
            </Link>
          </div>

          {/* Stats Bar */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-sm">
              <FolderKanban className="w-4 h-4 text-neutral-500" />
              <span className="text-neutral-900 font-medium">{workflows.length}</span>
              <span className="text-neutral-500">projet{workflows.length > 1 ? 's' : ''}</span>
            </div>
            <div className="h-4 w-px bg-neutral-300"></div>
            <div className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-neutral-500" />
              <span className="text-neutral-500">
                {workflows.filter(wf => wf.ownerId === user.uid).length} créé{workflows.filter(wf => wf.ownerId === user.uid).length > 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Search & View Controls */}
        {workflows.length > 0 && (
          <div className="flex items-center justify-between mb-8">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Rechercher un projet..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-neutral-300 rounded-lg focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors"
              />
            </div>

            <div className="flex items-center gap-1 ml-4 bg-neutral-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded transition-colors ${
                  viewMode === "grid"
                    ? "bg-white text-neutral-900 shadow-sm"
                    : "text-neutral-500 hover:text-neutral-900"
                }`}
              >
                <Grid3x3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded transition-colors ${
                  viewMode === "list"
                    ? "bg-white text-neutral-900 shadow-sm"
                    : "text-neutral-500 hover:text-neutral-900"
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {workflows.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-lg border-2 border-dashed border-neutral-300">
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FolderKanban className="w-8 h-8 text-neutral-400" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              Aucun projet pour le moment
            </h3>
            <p className="text-sm text-neutral-600 mb-6 max-w-sm mx-auto">
              Créez votre premier projet pour commencer à organiser vos tâches et collaborer avec votre équipe.
            </p>
            <Link
              href="/dashboard/create"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Créer un projet
            </Link>
          </div>
        ) : filteredWorkflows.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg border border-neutral-200">
            <Search className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <h3 className="text-base font-medium text-neutral-900 mb-2">
              Aucun résultat
            </h3>
            <p className="text-sm text-neutral-500">
              Aucun projet ne correspond à votre recherche
            </p>
          </div>
        ) : viewMode === "grid" ? (
          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWorkflows.map((wf) => (
              <Link
                key={wf.id}
                href={`/dashboard/${wf.id}`}
                className="group block bg-white border border-neutral-200 hover:border-neutral-900 rounded-lg p-6 transition-all duration-200 hover:shadow-lg"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center">
                    <FolderKanban className="w-5 h-5 text-neutral-600" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-900 group-hover:translate-x-1 transition-all" />
                </div>

                <h2 className="text-base font-semibold text-neutral-900 mb-2 line-clamp-2 group-hover:text-neutral-900">
                  {wf.name}
                </h2>

                <div className="space-y-2 text-xs text-neutral-500">
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5" />
                    <span>
                      {wf.ownerId === user.uid ? "Vous êtes propriétaire" : "Membre"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formatDate(wf.createdAt)}</span>
                  </div>
                </div>

                {wf.members && wf.members.length > 1 && (
                  <div className="mt-4 pt-4 border-t border-neutral-100">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {wf.members.slice(0, 3).map((member: any, idx: number) => (
                          <div
                            key={idx}
                            className="w-6 h-6 bg-neutral-900 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-semibold text-white"
                          >
                            {member.name?.charAt(0).toUpperCase() || "U"}
                          </div>
                        ))}
                      </div>
                      <span className="text-xs text-neutral-500">
                        {wf.members.length} membre{wf.members.length > 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                )}
              </Link>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="bg-white border border-neutral-200 rounded-lg divide-y divide-neutral-200">
            {filteredWorkflows.map((wf) => (
              <Link
                key={wf.id}
                href={`/dashboard/${wf.id}`}
                className="group flex items-center justify-between p-6 hover:bg-neutral-50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FolderKanban className="w-5 h-5 text-neutral-600" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-neutral-900 mb-1">
                      {wf.name}
                    </h3>
                    <div className="flex items-center gap-4 text-xs text-neutral-500">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" />
                        <span>
                          {wf.ownerId === user.uid ? "Propriétaire" : "Membre"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDate(wf.createdAt)}</span>
                      </div>
                      {wf.members && (
                        <span>{wf.members.length} membre{wf.members.length > 1 ? "s" : ""}</span>
                      )}
                    </div>
                  </div>
                </div>

                <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-900 group-hover:translate-x-1 transition-all flex-shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}