"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  doc,
} from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUserPlan } from "../hooks/useUserPlan";
import {
  Plus,
  FolderKanban,
  Users,
  Calendar,
  ArrowRight,
  Search,
  Grid3x3,
  List,
  Zap,
  TrendingUp,
  ChevronRight,
} from "lucide-react";

const PLAN_LIMITS = {
  free:    { maxProjects: 3,        canAutomate: false },
  starter: { maxProjects: Infinity, canAutomate: true  },
  pro:     { maxProjects: Infinity, canAutomate: true  },
};

const PLAN_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  free:    { bg: "bg-zinc-100",  text: "text-zinc-600",   dot: "bg-zinc-400"   },
  starter: { bg: "bg-indigo-50", text: "text-indigo-600", dot: "bg-indigo-500" },
  pro:     { bg: "bg-amber-50",  text: "text-amber-600",  dot: "bg-amber-500"  },
};

const PROJECT_COLORS = [
  "from-indigo-500 to-violet-500",
  "from-cyan-500 to-blue-500",
  "from-emerald-500 to-teal-500",
  "from-orange-500 to-rose-500",
  "from-pink-500 to-fuchsia-500",
  "from-amber-500 to-orange-500",
];

export default function DashboardPage() {
  const router = useRouter();
  const { plan, loadingPlan, user } = useUserPlan();
  const [workflows, setWorkflows]     = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode]       = useState<"grid" | "list">("grid");

  useEffect(() => {
    if (!user || loadingPlan) return;

    const fetchWorkflows = async () => {
      setLoading(true);
      try {
        // ── ÉTAPE 1 : migration silencieuse des anciens documents ──────────
        // On lit d'abord les workflows dont on est owner (autorisé par les règles)
        // et on ajoute memberIds s'il manque.
        const ownerMigrateSnap = await getDocs(
          query(collection(db, "workflows"), where("ownerId", "==", user.uid))
        );
        const needsMigration = ownerMigrateSnap.docs.filter(
          (d) => !Array.isArray(d.data().memberIds)
        );
        if (needsMigration.length > 0) {
          const batch = writeBatch(db);
          needsMigration.forEach((d) => {
            const memberIds = (d.data().members ?? []).map((m: any) => m.uid);
            batch.update(doc(db, "workflows", d.id), { memberIds });
          });
          await batch.commit();
        }

        // ── ÉTAPE 2 : deux queries ciblées (évite getDocs sur toute la collection) ──
        const [ownerSnap, memberSnap] = await Promise.all([
          getDocs(query(collection(db, "workflows"), where("ownerId", "==", user.uid))),
          getDocs(query(collection(db, "workflows"), where("memberIds", "array-contains", user.uid))),
        ]);

        // Déduplique (un owner figure aussi dans memberIds)
        const seen = new Set<string>();
        const data: any[] = [];
        [...ownerSnap.docs, ...memberSnap.docs].forEach((d) => {
          if (!seen.has(d.id)) {
            seen.add(d.id);
            data.push({ id: d.id, ...d.data() });
          }
        });

        // Tri par date décroissante
        data.sort((a, b) => {
          const ta = a.createdAt?.toDate?.()?.getTime() ?? 0;
          const tb = b.createdAt?.toDate?.()?.getTime() ?? 0;
          return tb - ta;
        });

        setWorkflows(data);
      } catch (err) {
        console.error("Erreur fetchWorkflows :", err);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkflows();
  }, [user, loadingPlan]);

  const filteredWorkflows = workflows.filter((wf) =>
    wf.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (timestamp: any) => {
    if (!timestamp?.toDate) return "—";
    return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(
      timestamp.toDate()
    );
  };

  const getProjectColor = (id: string) => {
    const index =
      id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % PROJECT_COLORS.length;
    return PROJECT_COLORS[index];
  };

  // ── LOADING ──
  if (loading || loadingPlan) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F7F7F8]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-2 border-indigo-100" />
            <div className="absolute inset-0 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          </div>
          <p style={{ fontFamily: "'DM Sans', sans-serif" }} className="text-sm text-zinc-400 tracking-wide">
            Chargement...
          </p>
        </div>
      </div>
    );
  }

  if (!user) { router.push("/login"); return null; }

  const limitReached = plan === "free" && workflows.length >= PLAN_LIMITS.free.maxProjects;
  const planStyle    = PLAN_COLORS[plan ?? "free"] ?? PLAN_COLORS.free;
  const firstName    = user.displayName?.split(" ")[0] || "vous";
  const hour         = new Date().getHours();
  const greeting     = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Bricolage+Grotesque:wght@400;500;600;700&display=swap');

        .dash-root { font-family:'DM Sans',sans-serif; background:#F7F7F8; min-height:100vh; }

        .fade-up { animation: fadeUp 0.5s cubic-bezier(.22,.68,0,1.2) both; }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(16px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .stagger-1 { animation-delay:.05s; }
        .stagger-2 { animation-delay:.10s; }
        .stagger-3 { animation-delay:.15s; }
        .stagger-4 { animation-delay:.20s; }

        .project-card {
          background:#fff; border:1px solid #EBEBEC; border-radius:16px;
          transition: box-shadow .2s ease, border-color .2s ease, transform .2s ease;
        }
        .project-card:hover { box-shadow:0 8px 30px rgba(0,0,0,.09); border-color:#D4D4FF; transform:translateY(-2px); }

        .project-list-item { border-bottom:1px solid #EBEBEC; transition:background .15s ease; }
        .project-list-item:last-child { border-bottom:none; }
        .project-list-item:hover { background:#F7F7FF; }

        .btn-primary {
          display:inline-flex; align-items:center; gap:8px;
          padding:10px 20px; background:#4F46E5; color:#fff;
          border-radius:10px; font-size:14px; font-weight:500; text-decoration:none;
          transition: background .15s, box-shadow .15s, transform .15s;
        }
        .btn-primary:hover { background:#4338CA; box-shadow:0 4px 14px rgba(79,70,229,.35); transform:translateY(-1px); }
        .btn-primary:active { transform:scale(.98); }
        .btn-disabled { background:#E5E5E5!important; color:#A0A0A0!important; cursor:not-allowed; }
        .btn-disabled:hover { box-shadow:none!important; transform:none!important; }

        .search-input {
          width:100%; padding:10px 14px 10px 40px;
          border:1.5px solid #EBEBEC; border-radius:10px;
          font-size:14px; color:#1a1a1a; background:#fff;
          transition:border-color .15s; outline:none;
        }
        .search-input:focus { border-color:#4F46E5; }
        .search-input::placeholder { color:#B0B0B4; }

        .stat-card { background:#fff; border:1px solid #EBEBEC; border-radius:14px; padding:20px 24px; }

        .upgrade-banner {
          background:linear-gradient(135deg,#4F46E5 0%,#7C3AED 100%);
          border-radius:14px; padding:20px 24px; color:#fff;
        }

        .view-toggle { display:flex; gap:2px; background:#EBEBEC; border-radius:8px; padding:3px; }
        .view-btn { padding:6px 10px; border-radius:6px; transition:background .15s,color .15s; color:#888; }
        .view-btn.active { background:#fff; color:#4F46E5; box-shadow:0 1px 4px rgba(0,0,0,.08); }

        .avatar-ring {
          width:28px; height:28px; border-radius:50%; border:2px solid #fff;
          display:flex; align-items:center; justify-content:center;
          font-size:11px; font-weight:600; color:#fff; margin-left:-8px;
        }
        .avatar-ring:first-child { margin-left:0; }
      `}</style>

      <div className="dash-root">

        {/* NAV */}
        <header className="fade-up" style={{ background:"#fff", borderBottom:"1px solid #EBEBEC", position:"sticky", top:0, zIndex:30 }}>
          <div style={{ maxWidth:1200, margin:"0 auto", padding:"0 32px", height:60, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:30, height:30, background:"linear-gradient(135deg,#4F46E5,#7C3AED)", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <Zap style={{ width:16, height:16, color:"#fff" }} />
              </div>
              <span style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontWeight:700, fontSize:17, color:"#1a1a1a", letterSpacing:"-0.3px" }}>
                Workflow
              </span>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${planStyle.bg} ${planStyle.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${planStyle.dot}`} />
                {plan?.toUpperCase() ?? "FREE"}
              </div>
              {user.photoURL ? (
                <img src={user.photoURL} alt="avatar" style={{ width:32, height:32, borderRadius:"50%", objectFit:"cover" }} />
              ) : (
                <div style={{ width:32, height:32, borderRadius:"50%", background:"linear-gradient(135deg,#4F46E5,#7C3AED)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:600, color:"#fff" }}>
                  {firstName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* MAIN */}
        <main style={{ maxWidth:1200, margin:"0 auto", padding:"40px 32px 80px" }}>

          {/* GREETING + CTA */}
          <div className="fade-up stagger-1" style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:36, flexWrap:"wrap", gap:16 }}>
            <div>
              <p style={{ fontSize:13, color:"#888", marginBottom:4, letterSpacing:"0.02em" }}>{greeting}, {firstName} 👋</p>
              <h1 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:30, fontWeight:700, color:"#111", letterSpacing:"-0.5px", lineHeight:1.2 }}>
                Mes Projets
              </h1>
            </div>
            <Link
              href={limitReached ? "#" : "/dashboard/create"}
              onClick={(e) => { if (limitReached) { e.preventDefault(); alert("Vous avez atteint la limite de 3 projets pour le plan gratuit."); }}}
              className={`btn-primary ${limitReached ? "btn-disabled" : ""}`}
            >
              <Plus style={{ width:16, height:16 }} /> Nouveau projet
            </Link>
          </div>

          {/* STATS */}
          <div className="fade-up stagger-2" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16, marginBottom:32 }}>
            <div className="stat-card">
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
                <p style={{ fontSize:12, color:"#888", fontWeight:500, letterSpacing:"0.04em", textTransform:"uppercase" }}>Projets</p>
                <FolderKanban style={{ width:16, height:16, color:"#4F46E5" }} />
              </div>
              <p style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:28, fontWeight:700, color:"#111", letterSpacing:"-0.5px" }}>{workflows.length}</p>
              {plan === "free" && <p style={{ fontSize:12, color:"#B0B0B4", marginTop:4 }}>{workflows.length}/3 utilisés</p>}
            </div>
            <div className="stat-card">
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
                <p style={{ fontSize:12, color:"#888", fontWeight:500, letterSpacing:"0.04em", textTransform:"uppercase" }}>Membres totaux</p>
                <Users style={{ width:16, height:16, color:"#4F46E5" }} />
              </div>
              <p style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:28, fontWeight:700, color:"#111", letterSpacing:"-0.5px" }}>
                {new Set(workflows.flatMap((wf) => wf.members?.map((m: any) => m.uid) ?? [])).size}
              </p>
              <p style={{ fontSize:12, color:"#B0B0B4", marginTop:4 }}>collaborateurs uniques</p>
            </div>
            <div className="stat-card">
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
                <p style={{ fontSize:12, color:"#888", fontWeight:500, letterSpacing:"0.04em", textTransform:"uppercase" }}>Plan actuel</p>
                <TrendingUp style={{ width:16, height:16, color:"#4F46E5" }} />
              </div>
              <p style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:28, fontWeight:700, color:"#111", letterSpacing:"-0.5px", textTransform:"capitalize" }}>{plan ?? "Free"}</p>
              <p style={{ fontSize:12, color:"#B0B0B4", marginTop:4 }}>{plan === "free" ? "Passer à Starter →" : "Plan actif"}</p>
            </div>
          </div>

          {/* UPGRADE BANNER */}
          {plan === "free" && (
            <div className="upgrade-banner fade-up stagger-3" style={{ marginBottom:32, display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:16 }}>
              <div>
                <p style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontWeight:600, fontSize:16, marginBottom:4 }}>Débloquez tout le potentiel ✨</p>
                <p style={{ fontSize:13, opacity:0.85 }}>Passez à Starter ou Pro pour des projets illimités et la collaboration temps réel.</p>
              </div>
              <Link href="/pricing" style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"9px 18px", background:"rgba(255,255,255,0.2)", border:"1px solid rgba(255,255,255,0.4)", borderRadius:9, color:"#fff", fontSize:14, fontWeight:500, backdropFilter:"blur(8px)", whiteSpace:"nowrap", textDecoration:"none" }}>
                Voir les offres <ArrowRight style={{ width:15, height:15 }} />
              </Link>
            </div>
          )}

          {/* SEARCH + TOGGLE */}
          {workflows.length > 0 && (
            <div className="fade-up stagger-3" style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24, gap:12 }}>
              <div style={{ position:"relative", flex:1, maxWidth:360 }}>
                <Search style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", width:15, height:15, color:"#B0B0B4" }} />
                <input type="text" placeholder="Rechercher un projet..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="search-input" />
              </div>
              <div className="view-toggle">
                <button onClick={() => setViewMode("grid")} className={`view-btn ${viewMode==="grid"?"active":""}`}><Grid3x3 style={{ width:15, height:15 }} /></button>
                <button onClick={() => setViewMode("list")} className={`view-btn ${viewMode==="list"?"active":""}`}><List style={{ width:15, height:15 }} /></button>
              </div>
            </div>
          )}

          {/* STATES */}
          {workflows.length === 0 ? (
            <div className="fade-up stagger-4" style={{ textAlign:"center", padding:"80px 32px", background:"#fff", borderRadius:20, border:"1.5px dashed #DDDDE0" }}>
              <div style={{ width:64, height:64, background:"linear-gradient(135deg,#EEF2FF,#F5F3FF)", borderRadius:18, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px" }}>
                <FolderKanban style={{ width:28, height:28, color:"#4F46E5" }} />
              </div>
              <h3 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:20, fontWeight:700, color:"#111", marginBottom:8 }}>Aucun projet pour le moment</h3>
              <p style={{ fontSize:14, color:"#888", maxWidth:340, margin:"0 auto 28px" }}>Créez votre premier projet pour organiser vos tâches et collaborer avec votre équipe.</p>
              <Link href="/dashboard/create" className="btn-primary" style={{ margin:"0 auto" }}>
                <Plus style={{ width:16, height:16 }} /> Créer un projet
              </Link>
            </div>

          ) : filteredWorkflows.length === 0 ? (
            <div className="fade-up stagger-4" style={{ textAlign:"center", padding:"60px 32px", background:"#fff", borderRadius:16, border:"1px solid #EBEBEC" }}>
              <Search style={{ width:36, height:36, color:"#DDDDE0", margin:"0 auto 12px" }} />
              <p style={{ fontWeight:600, color:"#333", marginBottom:4 }}>Aucun résultat</p>
              <p style={{ fontSize:13, color:"#888" }}>Aucun projet ne correspond à «&nbsp;{searchQuery}&nbsp;»</p>
            </div>

          ) : viewMode === "grid" ? (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:18 }}>
              {filteredWorkflows.map((wf, i) => {
                const c = getProjectColor(wf.id);
                return (
                  <Link key={wf.id} href={`/dashboard/${wf.id}`} className="project-card fade-up" style={{ animationDelay:`${0.2+i*0.05}s`, display:"block", padding:22, textDecoration:"none" }}>
                    <div style={{ height:4, borderRadius:999, marginBottom:18 }} className={`bg-gradient-to-r ${c}`} />
                    <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:14 }}>
                      <div style={{ width:40, height:40, borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center" }} className={`bg-gradient-to-br ${c}`}>
                        <FolderKanban style={{ width:18, height:18, color:"#fff" }} />
                      </div>
                      <ChevronRight style={{ width:16, height:16, color:"#C0C0C4" }} />
                    </div>
                    <h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:15, fontWeight:600, color:"#111", marginBottom:10, lineHeight:1.35 }}>{wf.name}</h2>
                    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                        <Users style={{ width:13, height:13, color:"#A0A0A8" }} />
                        <span style={{ fontSize:12, color:"#888" }}>{wf.ownerId === user.uid ? "Propriétaire" : "Membre"}</span>
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                        <Calendar style={{ width:13, height:13, color:"#A0A0A8" }} />
                        <span style={{ fontSize:12, color:"#888" }}>{formatDate(wf.createdAt)}</span>
                      </div>
                    </div>
                    {wf.members && wf.members.length > 1 && (
                      <div style={{ marginTop:16, paddingTop:14, borderTop:"1px solid #F0F0F2", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                        <div style={{ display:"flex", alignItems:"center" }}>
                          {wf.members.slice(0,4).map((member: any, idx: number) => (
                            <div key={idx} className={`avatar-ring bg-gradient-to-br ${c}`}>{member.name?.charAt(0).toUpperCase() || "U"}</div>
                          ))}
                        </div>
                        <span style={{ fontSize:11, color:"#AAA" }}>{wf.members.length} membre{wf.members.length>1?"s":""}</span>
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>

          ) : (
            <div className="fade-up stagger-4" style={{ background:"#fff", borderRadius:16, border:"1px solid #EBEBEC", overflow:"hidden" }}>
              {filteredWorkflows.map((wf) => {
                const c = getProjectColor(wf.id);
                return (
                  <Link key={wf.id} href={`/dashboard/${wf.id}`} className="project-list-item" style={{ display:"flex", alignItems:"center", padding:"16px 22px", textDecoration:"none", gap:16 }}>
                    <div style={{ width:38, height:38, borderRadius:11, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }} className={`bg-gradient-to-br ${c}`}>
                      <FolderKanban style={{ width:17, height:17, color:"#fff" }} />
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontWeight:600, fontSize:14, color:"#111", marginBottom:3 }}>{wf.name}</p>
                      <div style={{ display:"flex", alignItems:"center", gap:16 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                          <Users style={{ width:12, height:12, color:"#B0B0B4" }} />
                          <span style={{ fontSize:12, color:"#999" }}>{wf.ownerId === user.uid ? "Propriétaire" : "Membre"}</span>
                        </div>
                        <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                          <Calendar style={{ width:12, height:12, color:"#B0B0B4" }} />
                          <span style={{ fontSize:12, color:"#999" }}>{formatDate(wf.createdAt)}</span>
                        </div>
                        {wf.members && <span style={{ fontSize:12, color:"#999" }}>{wf.members.length} membre{wf.members.length>1?"s":""}</span>}
                      </div>
                    </div>
                    {wf.members && wf.members.length > 1 && (
                      <div style={{ display:"flex", alignItems:"center", flexShrink:0 }}>
                        {wf.members.slice(0,3).map((member: any, idx: number) => (
                          <div key={idx} className={`avatar-ring bg-gradient-to-br ${c}`} style={{ width:24, height:24, fontSize:10 }}>
                            {member.name?.charAt(0).toUpperCase() || "U"}
                          </div>
                        ))}
                      </div>
                    )}
                    <ChevronRight style={{ width:16, height:16, color:"#C0C0C4", flexShrink:0 }} />
                  </Link>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </>
  );
}