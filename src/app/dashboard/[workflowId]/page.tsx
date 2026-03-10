"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { db } from "@/lib/firebase";
import {
  collection, doc, getDoc, query, where, getDocs,
  orderBy, serverTimestamp, addDoc, updateDoc, arrayUnion,
} from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import {
  Plus, MessageSquare, User, ArrowRight, Trash2, X, Send, Clock,
  UserPlus, Users, Crown, Shield, Code, Briefcase, Zap, ChevronRight,
  ChevronLeft, Flag, Tag, CheckSquare, Square, Activity, Filter,
  AlertCircle, Calendar, ChevronDown, Check,
} from "lucide-react";

// ── TYPES ────────────────────────────────────────────────────────────────────
type Priority = "low" | "medium" | "high" | "urgent";
type Label    = { id: string; text: string; color: string };
type Subtask  = { id: string; text: string; done: boolean };
type Comment  = { uid: string; userName?: string; text: string; timestamp: any };
type Member   = { uid: string; email: string; name: string; role: "owner"|"project_manager"|"developer"|"viewer"; addedAt: number };
type Task = {
  id: string; title: string; description: string; status: string;
  assignedTo: string; comments: Comment[]; createdAt?: any;
  history?: { status: string; timestamp: any; userName?: string }[];
  priority?: Priority; dueDate?: string;
  labels?: Label[]; subtasks?: Subtask[];
};

// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const ROLES = [
  { key: "owner",           label: "Propriétaire",  icon: Crown,     color: "#D97706" },
  { key: "project_manager", label: "Chef de projet", icon: Briefcase, color: "#4F46E5" },
  { key: "developer",       label: "Développeur",    icon: Code,      color: "#059669" },
  { key: "viewer",          label: "Observateur",    icon: Shield,    color: "#64748B" },
];

const STATUS_CONFIG = [
  { key: "report",       label: "Rapport",   color: "#6366F1", bg: "#EEF2FF", isInitial: true  },
  { key: "in_reflexion", label: "Réflexion", color: "#F59E0B", bg: "#FFFBEB", isInitial: false },
  { key: "in_progress",  label: "En cours",  color: "#3B82F6", bg: "#EFF6FF", isInitial: false },
  { key: "done",         label: "Terminé",   color: "#10B981", bg: "#ECFDF5", isInitial: false },
] as const;

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bg: string }> = {
  low:    { label: "Faible",  color: "#64748B", bg: "#F1F5F9" },
  medium: { label: "Moyen",   color: "#F59E0B", bg: "#FFFBEB" },
  high:   { label: "Élevé",   color: "#EF4444", bg: "#FEF2F2" },
  urgent: { label: "Urgent",  color: "#DC2626", bg: "#FEE2E2" },
};

const LABEL_COLORS = [
  { bg: "#DBEAFE", text: "#1D4ED8" }, { bg: "#D1FAE5", text: "#065F46" },
  { bg: "#FEF3C7", text: "#92400E" }, { bg: "#FCE7F3", text: "#9D174D" },
  { bg: "#EDE9FE", text: "#5B21B6" }, { bg: "#FFE4E6", text: "#9F1239" },
];

// ── HELPERS ──────────────────────────────────────────────────────────────────
const getRoleInfo   = (k?: string) => ROLES.find(r => r.key === k) || ROLES[3];
const getStatusConf = (k: string)  => STATUS_CONFIG.find(s => s.key === k) || STATUS_CONFIG[0];
const getPrioConf   = (p?: Priority) => p ? PRIORITY_CONFIG[p] : null;

const formatTs = (ts: any, short = false) => {
  if (!ts) return "";
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  if (short) return new Intl.DateTimeFormat("fr-FR", { day:"2-digit", month:"short" }).format(d);
  return new Intl.DateTimeFormat("fr-FR", { day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit" }).format(d);
};

const isDueSoon = (due?: string) => {
  if (!due) return false;
  const diff = new Date(due).getTime() - Date.now();
  return diff > 0 && diff < 48 * 3600 * 1000;
};
const isOverdue = (due?: string) => {
  if (!due) return false;
  return new Date(due).getTime() < Date.now();
};

// ─────────────────────────────────────────────────────────────────────────────
export default function WorkflowPage() {
  const params     = useParams();
  const workflowId = Array.isArray(params.workflowId) ? params.workflowId[0] : params.workflowId;
  const [user]     = useAuthState(auth);

  const [workflow, setWorkflow] = useState<any>(null);
  const [owner, setOwner]       = useState<any>(null);
  const [tasks, setTasks]       = useState<Task[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string|null>(null);

  // UI state
  const [selectedTask, setSelectedTask]         = useState<Task|null>(null);
  const [showNewTaskForm, setShowNewTaskForm]   = useState<string|null>(null);
  const [commentText, setCommentText]           = useState("");
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showInviteModal, setShowInviteModal]   = useState(false);
  const [showActivityFeed, setShowActivityFeed] = useState(false);
  const [inviteEmail, setInviteEmail]           = useState("");
  const [inviteRole, setInviteRole]             = useState("developer");
  const [inviting, setInviting]                 = useState(false);
  const [inviteStatus, setInviteStatus]         = useState<"idle"|"success"|"error">("idle");

  // Filters
  const [filterAssignee, setFilterAssignee] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterLabel, setFilterLabel]       = useState<string>("all");
  const [showFilters, setShowFilters]       = useState(false);

  // New task form
  const [newTask, setNewTask] = useState({
    title: "", description: "", assignedTo: "",
    priority: "medium" as Priority, dueDate: "", labels: [] as Label[],
  });
  const [newLabelText, setNewLabelText] = useState("");

  // Subtask input in modal
  const [subtaskInput, setSubtaskInput] = useState("");

  // ── FETCH ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!workflowId || !user) return;
    const fetchAll = async () => {
      setLoading(true); setError(null);
      try {
        const wfSnap = await getDoc(doc(db, "workflows", workflowId));
        if (!wfSnap.exists()) { setError("Workflow introuvable"); return; }
        const wfData = wfSnap.data();
        const isMember = wfData.ownerId === user.uid ||
          (Array.isArray(wfData.memberIds) && wfData.memberIds.includes(user.uid)) ||
          wfData.members?.some((m: Member) => m.uid === user.uid);
        if (!isMember) { setError("Accès refusé"); return; }
        if (wfData.ownerId === user.uid && !Array.isArray(wfData.memberIds)) {
          const memberIds = (wfData.members ?? []).map((m: Member) => m.uid);
          await updateDoc(doc(db, "workflows", workflowId), { memberIds });
          wfData.memberIds = memberIds;
        }
        setWorkflow(wfData);
        const ownerSnap = await getDoc(doc(db, "users", wfData.ownerId));
        if (ownerSnap.exists()) setOwner(ownerSnap.data());
        const snapTasks = await getDocs(query(
          collection(db, "tasks"),
          where("workflowId", "==", workflowId),
          orderBy("createdAt", "asc")
        ));
        setTasks(snapTasks.docs.map(d => ({ id: d.id, ...d.data() } as Task)));
      } catch (e: any) { setError(e?.message || "Erreur"); }
      finally { setLoading(false); }
    };
    fetchAll();
  }, [workflowId, user]);

  // ── PERMISSIONS ────────────────────────────────────────────────────────────
  const currentRole = useMemo(() => {
    if (!workflow || !user) return "viewer";
    if (workflow.ownerId === user.uid) return "owner";
    return workflow.members?.find((m: Member) => m.uid === user.uid)?.role || "viewer";
  }, [workflow, user]);
  const canManage = ["owner","project_manager"].includes(currentRole);
  const canEdit   = ["owner","project_manager","developer"].includes(currentRole);

  // ── FILTERED TASKS ─────────────────────────────────────────────────────────
  const filteredTasks = useMemo(() => tasks.filter(t => {
    if (filterAssignee !== "all" && t.assignedTo !== filterAssignee) return false;
    if (filterPriority !== "all" && t.priority !== filterPriority) return false;
    if (filterLabel !== "all" && !t.labels?.some(l => l.text === filterLabel)) return false;
    return true;
  }), [tasks, filterAssignee, filterPriority, filterLabel]);

  // ── PROGRESS ───────────────────────────────────────────────────────────────
  const progress = tasks.length === 0 ? 0 : Math.round((tasks.filter(t => t.status === "done").length / tasks.length) * 100);

  // ── ACTIVITY FEED ──────────────────────────────────────────────────────────
  const activityItems = useMemo(() => {
    const items: { text: string; time: any; taskName: string }[] = [];
    tasks.forEach(t => {
      (t.history || []).forEach(h => items.push({ text: `→ ${getStatusConf(h.status).label}`, time: h.timestamp, taskName: t.title }));
      (t.comments || []).forEach(c => items.push({ text: `💬 ${c.userName}: ${c.text.slice(0,40)}${c.text.length>40?"…":""}`, time: c.timestamp, taskName: t.title }));
    });
    return items.sort((a,b) => (b.time||0) - (a.time||0)).slice(0, 40);
  }, [tasks]);

  // ── ALL LABELS in project ──────────────────────────────────────────────────
  const allLabels = useMemo(() => {
    const map = new Map<string,Label>();
    tasks.forEach(t => t.labels?.forEach(l => map.set(l.text, l)));
    return Array.from(map.values());
  }, [tasks]);

  // ── MEMBER NAME LOOKUP ─────────────────────────────────────────────────────
  const getMemberName = (uid: string) => {
    if (!workflow) return uid;
    if (workflow.ownerId === uid) return owner?.name || "Owner";
    return workflow.members?.find((m: Member) => m.uid === uid)?.name || uid;
  };
  const getMemberInitial = (uid: string) => getMemberName(uid).charAt(0).toUpperCase();

  // ── ACTIONS ────────────────────────────────────────────────────────────────
  const handleAddTask = async (status: string) => {
    if (!newTask.title.trim() || !canEdit || !user) return;
    const now = Date.now();
    const payload = {
      workflowId, title: newTask.title, description: newTask.description,
      status, assignedTo: newTask.assignedTo || user.uid,
      priority: newTask.priority, dueDate: newTask.dueDate || null,
      labels: newTask.labels, subtasks: [],
      comments: [], history: [{ status, timestamp: now, userName: user.displayName || user.email }],
      createdAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, "tasks"), payload);
    setTasks(prev => [...prev, { id: docRef.id, ...payload, createdAt: new Date() } as unknown as Task]);
    setNewTask({ title:"", description:"", assignedTo:"", priority:"medium", dueDate:"", labels:[] });
    setShowNewTaskForm(null);
  };

  const handleMoveTask = async (taskId: string, newStatus: string) => {
    if (!canEdit) return;
    const now = Date.now();
    const userName = user?.displayName || user?.email || "Utilisateur";
    await updateDoc(doc(db, "tasks", taskId), { status: newStatus, history: arrayUnion({ status: newStatus, timestamp: now, userName }) });
    setTasks(prev => prev.map(t => t.id===taskId ? { ...t, status:newStatus, history:[...(t.history||[]),{status:newStatus,timestamp:now,userName}] } : t));
  };

  const handleAddComment = async (taskId: string) => {
    if (!commentText.trim() || !user) return;
    const comment: Comment = { uid: user.uid, userName: user.displayName||user.email||"Utilisateur", text: commentText, timestamp: Date.now() };
    await updateDoc(doc(db, "tasks", taskId), { comments: arrayUnion(comment) });
    setTasks(prev => prev.map(t => t.id===taskId ? { ...t, comments:[...t.comments,comment] } : t));
    if (selectedTask?.id===taskId) setSelectedTask(prev => prev ? { ...prev, comments:[...prev.comments,comment] } : prev);
    setCommentText("");
  };

  const handleToggleSubtask = async (taskId: string, subtaskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const updated = (task.subtasks||[]).map(s => s.id===subtaskId ? {...s, done:!s.done} : s);
    await updateDoc(doc(db, "tasks", taskId), { subtasks: updated });
    setTasks(prev => prev.map(t => t.id===taskId ? {...t, subtasks:updated} : t));
    if (selectedTask?.id===taskId) setSelectedTask(prev => prev ? {...prev, subtasks:updated} : prev);
  };

  const handleAddSubtask = async (taskId: string) => {
    if (!subtaskInput.trim()) return;
    const task = tasks.find(t => t.id===taskId);
    if (!task) return;
    const newSub: Subtask = { id: crypto.randomUUID(), text: subtaskInput, done: false };
    const updated = [...(task.subtasks||[]), newSub];
    await updateDoc(doc(db, "tasks", taskId), { subtasks: updated });
    setTasks(prev => prev.map(t => t.id===taskId ? {...t,subtasks:updated} : t));
    if (selectedTask?.id===taskId) setSelectedTask(prev => prev ? {...prev,subtasks:updated} : prev);
    setSubtaskInput("");
  };

  const handleUpdateTaskField = async (taskId: string, field: string, value: any) => {
    await updateDoc(doc(db, "tasks", taskId), { [field]: value });
    setTasks(prev => prev.map(t => t.id===taskId ? {...t,[field]:value} : t));
    if (selectedTask?.id===taskId) setSelectedTask(prev => prev ? {...prev,[field]:value} : prev);
  };

  // ── INVITE ────────────────────────────────────────────────────────────────
  const handleInviteMember = async () => {
    if (!inviteEmail.trim() || !workflowId || !user) return;
    setInviting(true);
    setInviteStatus("idle");

    try {
      // 1. Chercher l'utilisateur par email dans Firestore
      const usersSnap = await getDocs(
        query(collection(db, "users"), where("email", "==", inviteEmail.trim()))
      );

      if (!usersSnap.empty) {
        // Utilisateur existant → l'ajouter directement au workflow
        const invDoc = usersSnap.docs[0];
        const invData = invDoc.data();
        const invId = invDoc.id;

        if (workflow.memberIds?.includes(invId) || workflow.ownerId === invId) {
          alert("Cet utilisateur est déjà membre du projet.");
          return;
        }

        const newMember: Member = {
          uid: invId,
          email: invData.email,
          name: invData.firstName ? `${invData.firstName} ${invData.lastName || ""}`.trim() : invData.email,
          role: inviteRole as Member["role"],
          addedAt: Date.now(),
        };

        await updateDoc(doc(db, "workflows", workflowId), {
          members: arrayUnion(newMember),
          memberIds: arrayUnion(invId),
        });

        setWorkflow((prev: any) => ({
          ...prev,
          members: [...(prev.members || []), newMember],
          memberIds: [...(prev.memberIds || []), invId],
        }));

        setInviteStatus("success");
      } else {
        // Utilisateur non inscrit → envoyer un email d'invitation
        const inviteLink = `${window.location.origin}/auth/register?invite=${workflowId}&role=${inviteRole}`;

        const res = await fetch("/api/invite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: inviteEmail.trim(),
            name: inviteEmail.trim(),       // fallback sur l'email si pas de nom
            projectName: workflow.name,
            inviteLink,
          }),
        });

        if (!res.ok) throw new Error("Échec de l'envoi de l'email");
        setInviteStatus("success");
      }

      // Reset après 2s et fermeture
      setTimeout(() => {
        setInviteEmail("");
        setInviteRole("developer");
        setInviteStatus("idle");
        setShowInviteModal(false);
      }, 1500);

    } catch (e) {
      console.error(e);
      setInviteStatus("error");
    } finally {
      setInviting(false);
    }
  };

  // ── LOADING / ERROR ────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#F7F7F8]">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-2 border-indigo-100"/>
          <div className="absolute inset-0 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"/>
        </div>
        <p style={{fontFamily:"'DM Sans',sans-serif"}} className="text-sm text-zinc-400">Chargement...</p>
      </div>
    </div>
  );
  if (error||!workflow) return (
    <div className="flex items-center justify-center min-h-screen bg-[#F7F7F8]">
      <div className="text-center">
        <p style={{fontFamily:"'Bricolage Grotesque',sans-serif"}} className="text-xl font-bold text-zinc-800 mb-2">{error||"Introuvable"}</p>
        <p className="text-sm text-zinc-400">Vérifiez vos permissions</p>
      </div>
    </div>
  );

  const roleInfo = getRoleInfo(currentRole);
  const RoleIcon = roleInfo.icon;
  const activeFilters = [filterAssignee!=="all", filterPriority!=="all", filterLabel!=="all"].filter(Boolean).length;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Bricolage+Grotesque:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        .wf-root { font-family:'DM Sans',sans-serif; background:#F7F7F8; min-height:100vh; display:flex; flex-direction:column; }
        .fade-up { animation: fadeUp 0.4s cubic-bezier(.22,.68,0,1.2) both; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }

        .task-card { background:#fff; border:1px solid #EBEBEC; border-radius:14px; padding:14px; cursor:pointer; transition:box-shadow .2s,border-color .2s,transform .2s; }
        .task-card:hover { box-shadow:0 6px 24px rgba(0,0,0,.08); border-color:#D4D4FF; transform:translateY(-1px); }

        .col-add-btn { width:100%; border:1.5px dashed #DDDDE0; border-radius:12px; padding:14px; display:flex; align-items:center; justify-content:center; gap:8px; font-size:13px; color:#B0B0B4; background:#fff; cursor:pointer; transition:border-color .15s,color .15s; border-style:dashed; }
        .col-add-btn:hover { border-color:#4F46E5; color:#4F46E5; }

        .btn-primary { display:inline-flex; align-items:center; gap:7px; padding:9px 18px; background:#4F46E5; color:#fff; border-radius:9px; font-size:13px; font-weight:500; border:none; cursor:pointer; transition:background .15s,box-shadow .15s,transform .15s; font-family:'DM Sans',sans-serif; }
        .btn-primary:hover:not(:disabled) { background:#4338CA; box-shadow:0 4px 12px rgba(79,70,229,.3); transform:translateY(-1px); }
        .btn-primary:disabled { opacity:.6; cursor:not-allowed; }

        .btn-ghost { display:inline-flex; align-items:center; gap:7px; padding:8px 14px; background:#fff; color:#555; border:1px solid #DDDDE0; border-radius:9px; font-size:13px; font-weight:500; cursor:pointer; transition:border-color .15s,color .15s; font-family:'DM Sans',sans-serif; }
        .btn-ghost:hover { border-color:#4F46E5; color:#4F46E5; }

        .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.45); display:flex; align-items:center; justify-content:center; z-index:50; padding:24px; backdrop-filter:blur(4px); animation:fadeUp .2s ease both; }
        .modal-box { background:#fff; border-radius:18px; box-shadow:0 24px 60px rgba(0,0,0,.15); width:100%; animation:fadeUp .25s cubic-bezier(.22,.68,0,1.2) both; }

        .input-field { width:100%; padding:9px 13px; border:1.5px solid #EBEBEC; border-radius:9px; font-size:13px; color:#111; background:#fff; transition:border-color .15s; outline:none; font-family:'DM Sans',sans-serif; }
        .input-field:focus { border-color:#4F46E5; }
        .input-field::placeholder { color:#C0C0C4; }

        .priority-badge { display:inline-flex; align-items:center; gap:4px; padding:2px 8px; border-radius:999px; font-size:11px; font-weight:600; }
        .label-chip { display:inline-flex; align-items:center; gap:4px; padding:2px 8px; border-radius:999px; font-size:11px; font-weight:500; }
        .status-pill { display:inline-flex; align-items:center; gap:5px; padding:3px 10px; border-radius:999px; font-size:11px; font-weight:600; }

        .activity-panel { width:300px; min-width:300px; background:#fff; border-left:1px solid #EBEBEC; overflow-y:auto; flex-shrink:0; }

        .progress-bar-track { height:6px; background:#EBEBEC; border-radius:999px; overflow:hidden; }
        .progress-bar-fill { height:100%; border-radius:999px; background:linear-gradient(90deg,#4F46E5,#7C3AED); transition:width .6s cubic-bezier(.22,.68,0,1.2); }

        .filter-pill { display:inline-flex; align-items:center; gap:5px; padding:5px 12px; border-radius:999px; font-size:12px; font-weight:500; border:1.5px solid #EBEBEC; background:#fff; cursor:pointer; transition:border-color .15s,color .15s; white-space:nowrap; font-family:'DM Sans',sans-serif; }
        .filter-pill:hover { border-color:#4F46E5; color:#4F46E5; }
        .filter-pill.active { border-color:#4F46E5; background:#EEF2FF; color:#4F46E5; }

        select.input-field { appearance:none; cursor:pointer; }
      `}</style>

      <div className="wf-root">

        {/* ── NAV ── */}
        <header style={{background:"#fff",borderBottom:"1px solid #EBEBEC",position:"sticky",top:0,zIndex:30,flexShrink:0}}>
          <div style={{maxWidth:"100%",padding:"0 24px",height:60,display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:28,height:28,background:"linear-gradient(135deg,#4F46E5,#7C3AED)",borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}} onClick={()=>window.history.back()}>
                <ChevronLeft style={{width:14,height:14,color:"#fff"}}/>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:7}}>
                <div style={{width:26,height:26,background:"linear-gradient(135deg,#4F46E5,#7C3AED)",borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <Zap style={{width:13,height:13,color:"#fff"}}/>
                </div>
                <span style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontWeight:700,fontSize:14,color:"#1a1a1a"}}>Workflow</span>
              </div>
              <ChevronRight style={{width:13,height:13,color:"#C0C0C4"}}/>
              <span style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontWeight:600,fontSize:14,color:"#111",maxWidth:220,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                {workflow.name}
              </span>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
              <div style={{display:"flex",alignItems:"center",gap:5,padding:"4px 10px",background:"#F7F7F8",borderRadius:999,border:"1px solid #EBEBEC"}}>
                <RoleIcon style={{width:12,height:12,color:roleInfo.color}}/>
                <span style={{fontSize:11,fontWeight:500,color:roleInfo.color}}>{roleInfo.label}</span>
              </div>
              <button className="btn-ghost" onClick={()=>setShowActivityFeed(p=>!p)} style={{padding:"6px 12px",gap:5}}>
                <Activity style={{width:13,height:13}}/> Activité
              </button>
              <button className="btn-ghost" onClick={()=>setShowMembersModal(true)} style={{padding:"6px 12px"}}>
                <Users style={{width:13,height:13}}/> {workflow.members?.length||0}
              </button>
              {canManage && (
                <button className="btn-primary" onClick={()=>setShowInviteModal(true)} style={{padding:"6px 14px"}}>
                  <UserPlus style={{width:13,height:13}}/> Inviter
                </button>
              )}
            </div>
          </div>
        </header>

        {/* ── BODY (board + activity) ── */}
        <div style={{flex:1,display:"flex",overflow:"hidden"}}>

          {/* ── MAIN BOARD ── */}
          <main style={{flex:1,overflow:"auto",padding:"24px 24px 80px"}}>

            {/* Project header */}
            <div className="fade-up" style={{marginBottom:24}}>
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:12}}>
                <div>
                  <h1 style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:22,fontWeight:700,color:"#111",letterSpacing:"-0.3px",marginBottom:4}}>
                    {workflow.name}
                  </h1>
                  <div style={{display:"flex",alignItems:"center",gap:12}}>
                    <div style={{display:"flex",alignItems:"center",gap:5}}>
                      <User style={{width:12,height:12,color:"#A0A0A8"}}/>
                      <span style={{fontSize:12,color:"#888"}}>{owner?.name||owner?.firstName||"Inconnu"}</span>
                    </div>
                    <span style={{fontSize:12,color:"#C0C0C4"}}>·</span>
                    <span style={{fontSize:12,color:"#888"}}>{tasks.length} tâche{tasks.length>1?"s":""}</span>
                    <span style={{fontSize:12,color:"#C0C0C4"}}>·</span>
                    <span style={{fontSize:12,color:"#888"}}>{progress}% complété</span>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div style={{marginBottom:20}}>
                <div className="progress-bar-track">
                  <div className="progress-bar-fill" style={{width:`${progress}%`}}/>
                </div>
              </div>

              {/* Filters */}
              <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                <button className={`filter-pill ${showFilters?"active":""}`} onClick={()=>setShowFilters(p=>!p)}>
                  <Filter style={{width:12,height:12}}/>
                  Filtres
                  {activeFilters>0 && <span style={{background:"#4F46E5",color:"#fff",borderRadius:"50%",width:16,height:16,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700}}>{activeFilters}</span>}
                </button>

                {showFilters && <>
                  <select className="filter-pill" value={filterAssignee} onChange={e=>setFilterAssignee(e.target.value)} style={{paddingRight:24}}>
                    <option value="all">Tous les membres</option>
                    {workflow.members?.map((m:Member)=>(
                      <option key={m.uid} value={m.uid}>{m.name}</option>
                    ))}
                  </select>

                  <select className="filter-pill" value={filterPriority} onChange={e=>setFilterPriority(e.target.value)} style={{paddingRight:24}}>
                    <option value="all">Toutes priorités</option>
                    {Object.entries(PRIORITY_CONFIG).map(([k,v])=>(
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>

                  {allLabels.length>0 && (
                    <select className="filter-pill" value={filterLabel} onChange={e=>setFilterLabel(e.target.value)} style={{paddingRight:24}}>
                      <option value="all">Tous les labels</option>
                      {allLabels.map(l=>(
                        <option key={l.id} value={l.text}>{l.text}</option>
                      ))}
                    </select>
                  )}

                  {activeFilters>0 && (
                    <button className="filter-pill" onClick={()=>{setFilterAssignee("all");setFilterPriority("all");setFilterLabel("all")}} style={{color:"#EF4444",borderColor:"#FECACA"}}>
                      <X style={{width:11,height:11}}/> Reset
                    </button>
                  )}
                </>}
              </div>
            </div>

            {/* Kanban columns */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,minmax(250px,1fr))",gap:18,minWidth:860}}>
              {STATUS_CONFIG.map((status,colIdx)=>{
                const colTasks = filteredTasks.filter(t=>t.status===status.key);
                const allColTasks = tasks.filter(t=>t.status===status.key);
                return (
                  <div key={status.key} className="fade-up" style={{animationDelay:`${colIdx*.05}s`}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
                      <div style={{display:"flex",alignItems:"center",gap:7}}>
                        <div style={{width:8,height:8,borderRadius:"50%",background:status.color}}/>
                        <span style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:12,fontWeight:700,color:"#111",textTransform:"uppercase",letterSpacing:".07em"}}>
                          {status.label}
                        </span>
                      </div>
                      <span style={{fontSize:11,fontWeight:600,color:"#B0B0B4",background:"#F0F0F2",padding:"1px 7px",borderRadius:999}}>
                        {colTasks.length}{colTasks.length!==allColTasks.length&&`/${allColTasks.length}`}
                      </span>
                    </div>

                    <div style={{display:"flex",flexDirection:"column",gap:9}}>
                      {colTasks.map((task,ti)=>{
                        const prio = getPrioConf(task.priority);
                        const over = isOverdue(task.dueDate);
                        const soon = isDueSoon(task.dueDate);
                        const doneSubtasks = (task.subtasks||[]).filter(s=>s.done).length;
                        const totalSubtasks = (task.subtasks||[]).length;
                        return (
                          <div key={task.id} className="task-card fade-up" style={{animationDelay:`${colIdx*.05+ti*.03}s`}} onClick={()=>setSelectedTask(task)}>
                            <div style={{height:3,borderRadius:999,background:status.color,marginBottom:11}}/>

                            <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:8,flexWrap:"wrap"}}>
                              {prio && (
                                <span className="priority-badge" style={{background:prio.bg,color:prio.color}}>
                                  <Flag style={{width:9,height:9}}/>{prio.label}
                                </span>
                              )}
                              {task.labels?.slice(0,2).map(l=>(
                                <span key={l.id} className="label-chip" style={{background:l.color.split("|")[0],color:l.color.split("|")[1]}}>
                                  {l.text}
                                </span>
                              ))}
                            </div>

                            <h3 style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontWeight:600,fontSize:13,color:"#111",marginBottom:task.description?6:10,lineHeight:1.35}}>
                              {task.title}
                            </h3>
                            {task.description && (
                              <p style={{fontSize:11,color:"#888",lineHeight:1.5,marginBottom:10,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>
                                {task.description}
                              </p>
                            )}

                            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",paddingTop:9,borderTop:"1px solid #F0F0F2",gap:6}}>
                              <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                                {task.assignedTo && (
                                  <div style={{width:20,height:20,borderRadius:"50%",background:"linear-gradient(135deg,#4F46E5,#7C3AED)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:"#fff"}} title={getMemberName(task.assignedTo)}>
                                    {getMemberInitial(task.assignedTo)}
                                  </div>
                                )}
                                {task.dueDate && (
                                  <span style={{display:"flex",alignItems:"center",gap:3,fontSize:10,color:over?"#EF4444":soon?"#F59E0B":"#A0A0A8",fontWeight:over||soon?600:400}}>
                                    <Calendar style={{width:10,height:10}}/>{new Date(task.dueDate).toLocaleDateString("fr-FR",{day:"2-digit",month:"short"})}
                                  </span>
                                )}
                                {totalSubtasks>0 && (
                                  <span style={{display:"flex",alignItems:"center",gap:3,fontSize:10,color:doneSubtasks===totalSubtasks?"#10B981":"#A0A0A8"}}>
                                    <CheckSquare style={{width:10,height:10}}/>{doneSubtasks}/{totalSubtasks}
                                  </span>
                                )}
                                {task.comments.length>0 && (
                                  <span style={{display:"flex",alignItems:"center",gap:3,fontSize:10,color:"#A0A0A8"}}>
                                    <MessageSquare style={{width:10,height:10}}/>{task.comments.length}
                                  </span>
                                )}
                              </div>
                              {canEdit && (() => {
                                const idx = STATUS_CONFIG.findIndex(s=>s.key===task.status);
                                const next = idx < STATUS_CONFIG.length-1 ? STATUS_CONFIG[idx+1] : null;
                                return next ? (
                                  <button onClick={e=>{e.stopPropagation();handleMoveTask(task.id,next.key)}}
                                    style={{padding:"3px 7px",borderRadius:6,background:"#F0F0F2",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:3,fontSize:10,color:"#666",transition:"background .15s",fontFamily:"'DM Sans',sans-serif"}}
                                    title={`→ ${next.label}`}>
                                    <ArrowRight style={{width:10,height:10}}/>{next.label}
                                  </button>
                                ) : null;
                              })()}
                            </div>
                          </div>
                        );
                      })}

                      {status.isInitial && canEdit && (
                        showNewTaskForm===status.key ? (
                          <div style={{background:"#fff",border:"1.5px dashed #C7C7FF",borderRadius:14,padding:14}} className="fade-up">
                            <input autoFocus type="text" placeholder="Titre *" className="input-field" style={{marginBottom:7}} value={newTask.title} onChange={e=>setNewTask({...newTask,title:e.target.value})}/>
                            <textarea placeholder="Description" className="input-field" style={{resize:"none",marginBottom:7}} rows={2} value={newTask.description} onChange={e=>setNewTask({...newTask,description:e.target.value})}/>
                            <select className="input-field" style={{marginBottom:7}} value={newTask.assignedTo} onChange={e=>setNewTask({...newTask,assignedTo:e.target.value})}>
                              <option value="">Assigné à...</option>
                              {workflow.members?.map((m:Member)=>(
                                <option key={m.uid} value={m.uid}>{m.name}</option>
                              ))}
                            </select>
                            <select className="input-field" style={{marginBottom:7}} value={newTask.priority} onChange={e=>setNewTask({...newTask,priority:e.target.value as Priority})}>
                              {Object.entries(PRIORITY_CONFIG).map(([k,v])=>(
                                <option key={k} value={k}>{v.label}</option>
                              ))}
                            </select>
                            <input type="date" className="input-field" style={{marginBottom:7}} value={newTask.dueDate} onChange={e=>setNewTask({...newTask,dueDate:e.target.value})}/>
                            <div style={{display:"flex",gap:6,marginBottom:7,flexWrap:"wrap"}}>
                              {newTask.labels.map(l=>(
                                <span key={l.id} className="label-chip" style={{background:l.color.split("|")[0],color:l.color.split("|")[1],cursor:"pointer"}} onClick={()=>setNewTask({...newTask,labels:newTask.labels.filter(x=>x.id!==l.id)})}>
                                  {l.text} ×
                                </span>
                              ))}
                            </div>
                            <div style={{display:"flex",gap:6,marginBottom:10}}>
                              <input type="text" placeholder="+ Label" className="input-field" style={{flex:1,padding:"6px 10px",fontSize:12}} value={newLabelText} onChange={e=>setNewLabelText(e.target.value)}
                                onKeyDown={e=>{
                                  if(e.key==="Enter"&&newLabelText.trim()){
                                    const ci = newTask.labels.length % LABEL_COLORS.length;
                                    const col = LABEL_COLORS[ci];
                                    setNewTask({...newTask,labels:[...newTask.labels,{id:crypto.randomUUID(),text:newLabelText.trim(),color:`${col.bg}|${col.text}`}]});
                                    setNewLabelText("");
                                  }
                                }}/>
                            </div>
                            <div style={{display:"flex",gap:7}}>
                              <button className="btn-primary" style={{flex:1,justifyContent:"center",padding:"8px 0",fontSize:13}} onClick={()=>handleAddTask(status.key)}>Créer</button>
                              <button className="btn-ghost" onClick={()=>setShowNewTaskForm(null)} style={{padding:"8px 12px",fontSize:13}}>Annuler</button>
                            </div>
                          </div>
                        ) : (
                          <button className="col-add-btn" onClick={()=>setShowNewTaskForm(status.key)}>
                            <Plus style={{width:13,height:13}}/> Nouvelle tâche
                          </button>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </main>

          {/* ── ACTIVITY FEED PANEL ── */}
          {showActivityFeed && (
            <aside className="activity-panel fade-up" style={{padding:"20px 16px"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
                <h3 style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontWeight:700,fontSize:14,color:"#111"}}>Activité récente</h3>
                <button onClick={()=>setShowActivityFeed(false)} style={{color:"#B0B0B4"}}><X style={{width:15,height:15}}/></button>
              </div>
              {activityItems.length===0 ? (
                <p style={{fontSize:12,color:"#B0B0B4",textAlign:"center",marginTop:32}}>Aucune activité</p>
              ) : (
                <div style={{display:"flex",flexDirection:"column",gap:0}}>
                  {activityItems.map((item,i)=>(
                    <div key={i} style={{padding:"10px 0",borderBottom:"1px solid #F5F5F5"}}>
                      <p style={{fontSize:12,fontWeight:600,color:"#333",marginBottom:2,lineHeight:1.3}}>{item.taskName}</p>
                      <p style={{fontSize:11,color:"#888",marginBottom:3,lineHeight:1.4}}>{item.text}</p>
                      {item.time && <p style={{fontSize:10,color:"#C0C0C4"}}>{formatTs(item.time)}</p>}
                    </div>
                  ))}
                </div>
              )}
            </aside>
          )}
        </div>
      </div>

      {/* ── TASK MODAL ── */}
      {selectedTask && (()=>{
        const sc   = getStatusConf(selectedTask.status);
        const prio = getPrioConf(selectedTask.priority);
        const doneS = (selectedTask.subtasks||[]).filter(s=>s.done).length;
        const totalS = (selectedTask.subtasks||[]).length;
        return (
          <div className="modal-overlay" onClick={()=>setSelectedTask(null)}>
            <div className="modal-box" style={{maxWidth:640,maxHeight:"90vh",overflow:"hidden",display:"flex",flexDirection:"column"}} onClick={e=>e.stopPropagation()}>
              <div style={{padding:"20px 24px",borderBottom:"1px solid #EBEBEC"}}>
                <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12}}>
                  <div style={{flex:1}}>
                    <h2 style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontWeight:700,fontSize:18,color:"#111",marginBottom:10,lineHeight:1.3}}>
                      {selectedTask.title}
                    </h2>
                    <div style={{display:"flex",alignItems:"center",gap:7,flexWrap:"wrap"}}>
                      <span className="status-pill" style={{background:sc.bg,color:sc.color}}>
                        <span style={{width:6,height:6,borderRadius:"50%",background:sc.color,display:"inline-block"}}/>
                        {sc.label}
                      </span>
                      {prio && (
                        <span className="priority-badge" style={{background:prio.bg,color:prio.color}}>
                          <Flag style={{width:9,height:9}}/>{prio.label}
                        </span>
                      )}
                      {selectedTask.labels?.map(l=>(
                        <span key={l.id} className="label-chip" style={{background:l.color.split("|")[0],color:l.color.split("|")[1]}}>
                          <Tag style={{width:9,height:9}}/>{l.text}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button onClick={()=>setSelectedTask(null)} style={{color:"#B0B0B4",flexShrink:0}}><X style={{width:18,height:18}}/></button>
                </div>
              </div>

              <div style={{overflowY:"auto",flex:1,padding:"20px 24px",display:"flex",flexDirection:"column",gap:20}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  <div>
                    <p style={{fontSize:11,fontWeight:600,color:"#888",textTransform:"uppercase",letterSpacing:".05em",marginBottom:6}}>Assigné à</p>
                    {canEdit ? (
                      <select className="input-field" style={{fontSize:12,padding:"6px 10px"}} value={selectedTask.assignedTo} onChange={e=>handleUpdateTaskField(selectedTask.id,"assignedTo",e.target.value)}>
                        {workflow.members?.map((m:Member)=>(
                          <option key={m.uid} value={m.uid}>{m.name}</option>
                        ))}
                      </select>
                    ) : (
                      <div style={{display:"flex",alignItems:"center",gap:7}}>
                        <div style={{width:24,height:24,borderRadius:"50%",background:"linear-gradient(135deg,#4F46E5,#7C3AED)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"#fff"}}>
                          {getMemberInitial(selectedTask.assignedTo)}
                        </div>
                        <span style={{fontSize:13,color:"#333"}}>{getMemberName(selectedTask.assignedTo)}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <p style={{fontSize:11,fontWeight:600,color:"#888",textTransform:"uppercase",letterSpacing:".05em",marginBottom:6}}>Priorité</p>
                    {canEdit ? (
                      <select className="input-field" style={{fontSize:12,padding:"6px 10px"}} value={selectedTask.priority||"medium"} onChange={e=>handleUpdateTaskField(selectedTask.id,"priority",e.target.value)}>
                        {Object.entries(PRIORITY_CONFIG).map(([k,v])=>(
                          <option key={k} value={k}>{v.label}</option>
                        ))}
                      </select>
                    ) : prio ? (
                      <span className="priority-badge" style={{background:prio.bg,color:prio.color}}><Flag style={{width:9,height:9}}/>{prio.label}</span>
                    ) : <span style={{fontSize:12,color:"#B0B0B4"}}>—</span>}
                  </div>

                  <div>
                    <p style={{fontSize:11,fontWeight:600,color:"#888",textTransform:"uppercase",letterSpacing:".05em",marginBottom:6}}>Échéance</p>
                    {canEdit ? (
                      <input type="date" className="input-field" style={{fontSize:12,padding:"6px 10px"}} value={selectedTask.dueDate||""} onChange={e=>handleUpdateTaskField(selectedTask.id,"dueDate",e.target.value)}/>
                    ) : selectedTask.dueDate ? (
                      <span style={{fontSize:12,color:isOverdue(selectedTask.dueDate)?"#EF4444":isDueSoon(selectedTask.dueDate)?"#F59E0B":"#333",fontWeight:500}}>
                        {new Date(selectedTask.dueDate).toLocaleDateString("fr-FR",{day:"2-digit",month:"long",year:"numeric"})}
                      </span>
                    ) : <span style={{fontSize:12,color:"#B0B0B4"}}>—</span>}
                  </div>

                  <div>
                    <p style={{fontSize:11,fontWeight:600,color:"#888",textTransform:"uppercase",letterSpacing:".05em",marginBottom:6}}>Statut</p>
                    {canEdit ? (
                      <select className="input-field" style={{fontSize:12,padding:"6px 10px"}} value={selectedTask.status} onChange={e=>handleMoveTask(selectedTask.id,e.target.value)}>
                        {STATUS_CONFIG.map(s=><option key={s.key} value={s.key}>{s.label}</option>)}
                      </select>
                    ) : (
                      <span className="status-pill" style={{background:sc.bg,color:sc.color,fontSize:11}}>{sc.label}</span>
                    )}
                  </div>
                </div>

                {selectedTask.description && (
                  <div>
                    <p style={{fontSize:11,fontWeight:600,color:"#888",textTransform:"uppercase",letterSpacing:".05em",marginBottom:8}}>Description</p>
                    <p style={{fontSize:13,color:"#444",lineHeight:1.6}}>{selectedTask.description}</p>
                  </div>
                )}

                <div>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                    <p style={{fontSize:11,fontWeight:600,color:"#888",textTransform:"uppercase",letterSpacing:".05em"}}>
                      Sous-tâches {totalS>0&&`(${doneS}/${totalS})`}
                    </p>
                    {totalS>0 && (
                      <div style={{width:60,height:4,background:"#EBEBEC",borderRadius:999,overflow:"hidden"}}>
                        <div style={{height:"100%",background:"#10B981",borderRadius:999,width:`${(doneS/totalS)*100}%`,transition:"width .3s"}}/>
                      </div>
                    )}
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:6}}>
                    {(selectedTask.subtasks||[]).map(s=>(
                      <div key={s.id} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",background:s.done?"#F0FDF4":"#F9F9F9",borderRadius:8,cursor:"pointer"}} onClick={()=>handleToggleSubtask(selectedTask.id,s.id)}>
                        {s.done ? <CheckSquare style={{width:14,height:14,color:"#10B981",flexShrink:0}}/> : <Square style={{width:14,height:14,color:"#C0C0C4",flexShrink:0}}/>}
                        <span style={{fontSize:13,color:s.done?"#888":"#333",textDecoration:s.done?"line-through":"none",lineHeight:1.4}}>{s.text}</span>
                      </div>
                    ))}
                    {canEdit && (
                      <div style={{display:"flex",gap:7,marginTop:4}}>
                        <input type="text" placeholder="Nouvelle sous-tâche..." className="input-field" style={{fontSize:12,padding:"6px 10px"}} value={subtaskInput} onChange={e=>setSubtaskInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")handleAddSubtask(selectedTask.id)}}/>
                        <button className="btn-primary" style={{padding:"6px 12px",fontSize:12,flexShrink:0}} onClick={()=>handleAddSubtask(selectedTask.id)}>
                          <Plus style={{width:12,height:12}}/>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <p style={{fontSize:11,fontWeight:600,color:"#888",textTransform:"uppercase",letterSpacing:".05em",marginBottom:10}}>
                    Commentaires ({selectedTask.comments.length})
                  </p>
                  <div style={{display:"flex",flexDirection:"column",gap:7,maxHeight:200,overflowY:"auto",marginBottom:12}}>
                    {selectedTask.comments.length===0 ? (
                      <p style={{fontSize:12,color:"#C0C0C4",textAlign:"center",padding:"16px 0"}}>Aucun commentaire</p>
                    ) : selectedTask.comments.map((c,i)=>(
                      <div key={i} style={{background:"#F7F7F8",borderRadius:10,padding:"9px 12px"}}>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:3}}>
                          <span style={{fontSize:11,fontWeight:600,color:"#111"}}>{c.userName}</span>
                          <span style={{fontSize:10,color:"#C0C0C4"}}>{formatTs(c.timestamp)}</span>
                        </div>
                        <p style={{fontSize:12,color:"#444",lineHeight:1.5}}>{c.text}</p>
                      </div>
                    ))}
                  </div>
                  <div style={{display:"flex",gap:7}}>
                    <input type="text" placeholder="Ajouter un commentaire..." className="input-field" value={commentText} onChange={e=>setCommentText(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")handleAddComment(selectedTask.id)}}/>
                    <button className="btn-primary" style={{flexShrink:0,padding:"9px 12px"}} onClick={()=>handleAddComment(selectedTask.id)}>
                      <Send style={{width:13,height:13}}/>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── MEMBERS MODAL ── */}
      {showMembersModal && (
        <div className="modal-overlay" onClick={()=>setShowMembersModal(false)}>
          <div className="modal-box" style={{maxWidth:520,maxHeight:"80vh",overflow:"hidden",display:"flex",flexDirection:"column"}} onClick={e=>e.stopPropagation()}>
            <div style={{padding:"18px 22px",borderBottom:"1px solid #EBEBEC",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <h2 style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontWeight:700,fontSize:16,color:"#111"}}>Membres</h2>
              <button onClick={()=>setShowMembersModal(false)} style={{color:"#B0B0B4"}}><X style={{width:16,height:16}}/></button>
            </div>
            <div style={{padding:"16px 22px",overflowY:"auto",display:"flex",flexDirection:"column",gap:8}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 14px",background:"#FFFBEB",border:"1px solid #FDE68A",borderRadius:11}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:36,height:36,borderRadius:"50%",background:"linear-gradient(135deg,#F59E0B,#D97706)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"#fff"}}>
                    {(owner?.firstName||owner?.name||"?").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p style={{fontSize:13,fontWeight:600,color:"#111"}}>{owner?.firstName ? `${owner.firstName} ${owner.lastName||""}`.trim() : owner?.name}</p>
                    <p style={{fontSize:11,color:"#888"}}>{owner?.email}</p>
                  </div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:4,color:"#D97706"}}><Crown style={{width:12,height:12}}/><span style={{fontSize:11,fontWeight:600}}>Propriétaire</span></div>
              </div>
              {workflow.members?.map((member:Member)=>{
                const ri = getRoleInfo(member.role); const RI = ri.icon;
                return (
                  <div key={member.uid} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",border:"1px solid #EBEBEC",borderRadius:11}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div style={{width:36,height:36,borderRadius:"50%",background:"linear-gradient(135deg,#4F46E5,#7C3AED)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"#fff"}}>{member.name?.charAt(0)?.toUpperCase()||"U"}</div>
                      <div><p style={{fontSize:13,fontWeight:600,color:"#111"}}>{member.name}</p><p style={{fontSize:11,color:"#888"}}>{member.email}</p></div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:7}}>
                      {canManage ? (
                        <select value={member.role} className="input-field" style={{width:"auto",padding:"4px 8px",fontSize:11}} onChange={e=>{
                          const up=workflow.members.map((m:Member)=>m.uid===member.uid?{...m,role:e.target.value}:m);
                          setWorkflow({...workflow,members:up});
                          if(workflowId) updateDoc(doc(db,"workflows",workflowId),{members:up}).catch(console.error);
                        }}>
                          {ROLES.filter(r=>r.key!=="owner").map(r=><option key={r.key} value={r.key}>{r.label}</option>)}
                        </select>
                      ) : (
                        <div style={{display:"flex",alignItems:"center",gap:4,color:ri.color}}><RI style={{width:12,height:12}}/><span style={{fontSize:11,fontWeight:500}}>{ri.label}</span></div>
                      )}
                      {canManage && member.role!=="owner" && (
                        <button style={{color:"#F87171"}} onClick={()=>{
                          const up=workflow.members.filter((m:Member)=>m.uid!==member.uid);
                          const upIds=(workflow.memberIds||[]).filter((id:string)=>id!==member.uid);
                          setWorkflow({...workflow,members:up,memberIds:upIds});
                          if(workflowId) updateDoc(doc(db,"workflows",workflowId),{members:up,memberIds:upIds}).catch(console.error);
                        }}><Trash2 style={{width:13,height:13}}/></button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── INVITE MODAL ── */}
      {showInviteModal && (
        <div className="modal-overlay" onClick={()=>{ if(!inviting){ setShowInviteModal(false); setInviteStatus("idle"); } }}>
          <div className="modal-box" style={{maxWidth:400,padding:26}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
              <h2 style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontWeight:700,fontSize:16,color:"#111"}}>Inviter un membre</h2>
              <button onClick={()=>{ setShowInviteModal(false); setInviteStatus("idle"); }} style={{color:"#B0B0B4"}}><X style={{width:16,height:16}}/></button>
            </div>

            {inviteStatus === "success" ? (
              <div style={{textAlign:"center",padding:"20px 0"}}>
                <div style={{width:48,height:48,borderRadius:"50%",background:"#D1FAE5",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px"}}>
                  <Check style={{width:22,height:22,color:"#059669"}}/>
                </div>
                <p style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontWeight:600,fontSize:15,color:"#111",marginBottom:4}}>Invitation envoyée !</p>
                <p style={{fontSize:12,color:"#888"}}>Le membre recevra un email avec les instructions.</p>
              </div>
            ) : (
              <>
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  <input
                    type="email"
                    placeholder="Adresse email"
                    className="input-field"
                    value={inviteEmail}
                    onChange={e=>setInviteEmail(e.target.value)}
                    onKeyDown={e=>{ if(e.key==="Enter") handleInviteMember(); }}
                  />
                  <select className="input-field" value={inviteRole} onChange={e=>setInviteRole(e.target.value)}>
                    {ROLES.filter(r=>r.key!=="owner").map(r=><option key={r.key} value={r.key}>{r.label}</option>)}
                  </select>
                </div>

                {inviteStatus === "error" && (
                  <p style={{fontSize:12,color:"#EF4444",marginTop:10}}>Une erreur est survenue. Vérifiez l'email et réessayez.</p>
                )}

                <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:18}}>
                  <button className="btn-ghost" onClick={()=>{ setShowInviteModal(false); setInviteStatus("idle"); }}>Annuler</button>
                  <button className="btn-primary" onClick={handleInviteMember} disabled={inviting||!inviteEmail.trim()}>
                    {inviting ? "Envoi en cours..." : <><UserPlus style={{width:13,height:13}}/> Inviter</>}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}  