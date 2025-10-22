"use client";

import { useParams } from "next/navigation";
import { JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal, useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, doc, getDoc, query, where, getDocs, orderBy, serverTimestamp, addDoc, updateDoc, arrayUnion, deleteDoc, arrayRemove } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { Plus, MessageSquare, User, ArrowRight, Trash2, X, Send, Clock, CheckCircle2, UserPlus, Users, Crown, Shield, Code, Briefcase, Mail } from "lucide-react";

type Comment = { uid: string; userName?: string; text: string; timestamp: any };
type Member = { uid: string; email: string; name: string; role: "owner" | "project_manager" | "developer" | "viewer"; addedAt: number };
type Task = { id: string; title: string; description: string; status: string; assignedTo: string; comments: Comment[]; createdAt?: any; history?: { status: string; timestamp: any }[] };

const ROLES = [
  { key: "owner", label: "Propriétaire", icon: Crown, description: "Contrôle total du projet", color: "text-amber-600" },
  { key: "project_manager", label: "Chef de projet", icon: Briefcase, description: "Gère l'équipe et les tâches", color: "text-blue-600" },
  { key: "developer", label: "Développeur", icon: Code, description: "Crée et modifie les tâches", color: "text-green-600" },
  { key: "viewer", label: "Observateur", icon: Shield, description: "Lecture seule", color: "text-gray-600" },
];

export default function WorkflowPage() {
  const params = useParams();
  const workflowId = Array.isArray(params.workflowId) ? params.workflowId[0] : params.workflowId;
  const [user] = useAuthState(auth);
  const [workflow, setWorkflow] = useState<any>(null);
  const [owner, setOwner] = useState<any>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showNewTaskForm, setShowNewTaskForm] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");

  // Members management
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<string>("developer");
  const [inviting, setInviting] = useState(false);

  const [newTask, setNewTask] = useState({ title: "", description: "", assignedTo: "" });

  const statuses = [
    { key: "report", label: "Rapport", description: "Initialisation", isInitial: true },
    { key: "in_reflexion", label: "Réflexion", description: "Analyse", isInitial: false },
    { key: "in_progress", label: "En cours", description: "Exécution", isInitial: false },
    { key: "done", label: "Terminé", description: "Complété", isInitial: false },
  ];

  useEffect(() => {
    if (!workflowId) return;

    const fetchWorkflow = async () => {
      const workflowRef = doc(db, "workflows", workflowId);
      const snap = await getDoc(workflowRef);
      if (snap.exists()) {
        const wfData = snap.data();
        setWorkflow(wfData);

        const ownerRef = doc(db, "users", wfData.ownerId);
        const ownerSnap = await getDoc(ownerRef);
        if (ownerSnap.exists()) setOwner(ownerSnap.data());
      }

      const q = query(collection(db, "tasks"), where("workflowId", "==", workflowId), orderBy("createdAt", "asc"));
      const snapTasks = await getDocs(q);
      const taskList: Task[] = snapTasks.docs.map((d) => ({ id: d.id, ...d.data() })) as Task[];
      setTasks(taskList);
      setLoading(false);
    };

    fetchWorkflow();
  }, [workflowId]);

  const getCurrentUserRole = (): string => {
    if (!workflow || !user) return "viewer";
    if (workflow.ownerId === user.uid) return "owner";
    const member = workflow.members?.find((m: Member) => m.uid === user.uid);
    return member?.role || "viewer";
  };

  const canManageMembers = () => ["owner", "project_manager"].includes(getCurrentUserRole());
  const canCreateTasks = () => ["owner", "project_manager", "developer"].includes(getCurrentUserRole());
  const getRoleInfo = (roleKey?: string | number | readonly string[]) => {
    const key = typeof roleKey === "string" ? roleKey : String(roleKey || "");
    return ROLES.find((r) => r.key === key) || ROLES[3];
  };
  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return "";
    let date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(date);
  };
  const getTaskCount = (statusKey: string) => tasks.filter((t) => t.status === statusKey).length;
  const getNextStatus = (currentStatus: string) => {
    const idx = statuses.findIndex(s => s.key === currentStatus);
    return idx < statuses.length - 1 ? statuses[idx + 1] : null;
  };

const handleInviteMember = async () => {
  if (!inviteEmail.trim() || !user) return;
  setInviting(true);

  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", inviteEmail.trim()));
    const snapshot = await getDocs(q);

    let invitedUserData: any;
    let invitedUserId: string;

    if (!snapshot.empty) {
      // L'utilisateur existe déjà
      const invitedUser = snapshot.docs[0];
      invitedUserData = invitedUser.data();
      invitedUserId = invitedUser.id;

      // Vérifier si déjà membre
      const isAlreadyMember = workflow.members?.some((m: Member) => m.uid === invitedUserId);
      if (isAlreadyMember) {
        alert("Cet utilisateur est déjà membre");
        setInviting(false);
        return;
      }

      // Ajouter directement au workflow
      const newMember: Member = {
        uid: invitedUserId,
        email: invitedUserData.email,
        name: invitedUserData.name || invitedUserData.email,
        role: inviteRole as any,
        addedAt: Date.now(),
      };

      const workflowRef = doc(db, "workflows", workflowId);
      await updateDoc(workflowRef, { members: arrayUnion(newMember) });
      setWorkflow({ ...workflow, members: [...(workflow.members || []), newMember] });

      alert(`${invitedUserData.name || invitedUserData.email} a été ajouté au projet !`);
    } else {
      // Utilisateur non inscrit → envoyer invitation par mail via l'API
      const inviteLink = `${window.location.origin}/register?invite=${crypto.randomUUID()}&workflowId=${workflowId}&role=${inviteRole}`;

      await fetch("/api/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail,
          name: inviteEmail,
          projectName: workflow.name,
          inviteLink,
        }),
      });

      alert(`Invitation envoyée à ${inviteEmail} !`);
    }

    setInviteEmail("");
    setInviteRole("developer");
    setShowInviteModal(false);
  } catch (err) {
    console.error(err);
  } finally {
    setInviting(false);
  }
};


  const handleAddTask = async (status: string) => {
    if (!newTask.title.trim() || !canCreateTasks() || !user) return;
    const now = Date.now();
    const docRef = await addDoc(collection(db, "tasks"), { workflowId, title: newTask.title, description: newTask.description, status, assignedTo: newTask.assignedTo || user.uid, comments: [], history: [{ status, timestamp: now }], createdAt: serverTimestamp() });
    setTasks([...tasks, { id: docRef.id, ...newTask, status, comments: [], history: [{ status, timestamp: now }], createdAt: new Date() }]);
    setNewTask({ title: "", description: "", assignedTo: "" }); setShowNewTaskForm(null);
  };

  const handleMoveTask = async (taskId: string, newStatus: string) => {
    if (!canCreateTasks()) return;
    const now = Date.now();
    const taskRef = doc(db, "tasks", taskId);
    await updateDoc(taskRef, { status: newStatus, history: arrayUnion({ status: newStatus, timestamp: now }) });
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus, history: [...(t.history || []), { status: newStatus, timestamp: now }] } : t));
  };

  const handleAddComment = async (taskId: string) => {
    if (!commentText.trim()) return;
    if (!user) { alert("Vous devez être connecté pour commenter."); return; }
    const now = Date.now();
    const comment: Comment = { uid: user.uid, userName: user.displayName || user.email || "Utilisateur", text: commentText, timestamp: now };
    const taskRef = doc(db, "tasks", taskId);
    await updateDoc(taskRef, { comments: arrayUnion(comment) });
    setTasks(tasks.map(t => t.id === taskId ? { ...t, comments: [...t.comments, comment] } : t));
    setCommentText("");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;
  if (!workflow) return <div className="min-h-screen flex items-center justify-center">Workflow introuvable</div>;

  const RoleIcon = getRoleInfo(getCurrentUserRole()).icon;

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-8 py-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">{workflow.name}</h1>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2 text-gray-500">
                <User className="w-4 h-4" />
                <span className="text-gray-900 font-medium">{owner?.name || "Inconnu"}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                <RoleIcon className={`w-4 h-4 ${getRoleInfo(getCurrentUserRole()).color}`} />
                <span className={`font-medium ${getRoleInfo(getCurrentUserRole()).color}`}>{getRoleInfo(getCurrentUserRole()).label}</span>
              </div>
              <span className="text-gray-500">{tasks.length} tâches</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 w-full sm:w-auto">
            <button onClick={() => setShowMembersModal(true)} className="flex items-center gap-2 px-4 py-2 border border-neutral-300 hover:border-neutral-400 rounded-lg text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors w-full sm:w-auto">
              <Users className="w-4 h-4" />
              {workflow.members?.length || 0} membre{(workflow.members?.length || 0) > 1 ? 's' : ''}
            </button>
            {canManageMembers() && (
              <button onClick={() => setShowInviteModal(true)} className="flex items-center gap-2 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-sm font-medium transition-colors w-full sm:w-auto">
                <UserPlus className="w-4 h-4" />
                Inviter
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="max-w-[1800px] mx-auto px-4 sm:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {statuses.map(status => (
            <div key={status.key} className="flex flex-col">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">{status.label}</h2>
                  <span className="text-sm font-medium text-gray-400">{getTaskCount(status.key)}</span>
                </div>
                <div className="h-0.5 bg-neutral-900 w-12"></div>
              </div>
              <div className="space-y-4 flex-1">
                {tasks.filter(t => t.status === status.key).map(task => (
                  <div key={task.id} onClick={() => setSelectedTask(task)} className="group bg-white border border-neutral-200 hover:border-neutral-900 rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-lg">
                    <h3 className="font-medium text-gray-900 mb-1">{task.title}</h3>
                    {task.description && <p className="text-sm text-gray-600 line-clamp-2">{task.description}</p>}
                    <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-neutral-100 mt-2">
                      <div className="flex items-center gap-2">
                        {task.comments.length > 0 && <span>{task.comments.length} <MessageSquare className="w-3 h-3 inline" /></span>}
                        {task.createdAt && <span>{formatTimestamp(task.createdAt)} <Clock className="w-3 h-3 inline" /></span>}
                      </div>
                      {getNextStatus(task.status) && canCreateTasks() && (
                        <button onClick={(e) => { e.stopPropagation(); handleMoveTask(task.id, getNextStatus(task.status)!.key); }} className="opacity-0 group-hover:opacity-100 transition-opacity"><ArrowRight className="w-4 h-4" /></button>
                      )}
                    </div>
                  </div>
                ))}

                {/* New Task */}
                {status.isInitial && canCreateTasks() && (
                  showNewTaskForm === status.key ? (
                    <div className="bg-white border-2 border-dashed border-neutral-300 rounded-lg p-4 space-y-2">
                      <input type="text" placeholder="Titre" className="w-full border-b border-neutral-200 focus:border-neutral-900 focus:ring-0 text-sm py-1" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} autoFocus />
                      <textarea placeholder="Description" className="w-full border-b border-neutral-200 focus:border-neutral-900 focus:ring-0 text-sm py-1 resize-none" rows={2} value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})}></textarea>
                      <div className="flex gap-2">
                        <button className="flex-1 bg-neutral-900 text-white rounded py-1 text-sm" onClick={() => handleAddTask(status.key)}>Créer</button>
                        <button className="px-3 py-1 text-sm text-gray-500" onClick={() => setShowNewTaskForm(null)}>Annuler</button>
                      </div>
                    </div>
                  ) : (
                    <button className="w-full border-2 border-dashed border-neutral-300 rounded-lg py-6 flex items-center justify-center gap-2 text-gray-400 hover:text-gray-600 transition-all" onClick={() => setShowNewTaskForm(status.key)}>
                      <Plus className="w-5 h-5" /> Nouvelle tâche
                    </button>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Members Modal */}
      {showMembersModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 sm:p-6 backdrop-blur-sm" onClick={() => setShowMembersModal(false)}>
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md sm:max-w-xl md:max-w-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Membres</h2>
              <button onClick={() => setShowMembersModal(false)}><X className="w-5 h-5 text-gray-400 hover:text-gray-900" /></button>
            </div>
            <div className="p-6 space-y-4">
              {/* Owner */}
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-600 flex items-center justify-center text-white font-semibold">{owner?.name?.charAt(0).toUpperCase()}</div>
                  <div>
                    <p className="font-medium text-gray-900">{owner?.name}</p>
                    <p className="text-sm text-gray-500">{owner?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-amber-700"><Crown className="w-4 h-4" /><span className="text-sm font-medium">Propriétaire</span></div>
              </div>
              {/* Members */}
              {workflow.members?.length > 0 && workflow.members.map((member: { role: string | number | readonly string[] | undefined; uid: Key | null | undefined; name: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; email: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; }) => {
                const roleInfo = getRoleInfo(member.role);
                const RoleIcon = roleInfo.icon;
                return (
                  <div key={member.uid} className="flex items-center justify-between p-3 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-neutral-900 flex items-center justify-center text-white font-semibold">{String(member.name || '').charAt(0).toUpperCase()}</div>
                      <div>
                        <p className="font-medium text-gray-900">{member.name}</p>
                        <p className="text-sm text-gray-500">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {canManageMembers() ? (
                        <select
                            value={String(member.role)}
                            onChange={e => {
                                const updatedMembers = workflow.members.map((m: { uid: Key | null | undefined; }) =>
                                m.uid === member.uid ? { ...m, role: e.target.value } : m
                                );
                                setWorkflow({ ...workflow, members: updatedMembers });

                                // don't call Firestore if we don't have a workflowId
                                if (!workflowId) return;

                                const workflowRef = doc(db, "workflows", workflowId);
                                updateDoc(workflowRef, { members: updatedMembers }).catch(err => {
                                // handle/save error as needed
                                console.error("Failed to update members:", err);
                                });
                            }}
                            className="text-sm border border-neutral-300 text-gray-600 rounded px-2 py-1"
                            >
                            {ROLES.filter(r => r.key !== "owner").map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
                        </select>
                      ) : <div className={`flex items-center gap-1 ${roleInfo.color}`}><RoleIcon className="w-4 h-4" /><span className="text-sm">{roleInfo.label}</span></div>}
                      {canManageMembers() && member.role !== "owner" && (
                        <button
                            onClick={() => {
                                const updatedMembers = workflow.members.filter((m: { uid: Key | null | undefined; }) => m.uid !== member.uid);
                                setWorkflow({ ...workflow, members: updatedMembers });

                                // guard before calling Firestore
                                if (!workflowId) return;

                                const workflowRef = doc(db, "workflows", workflowId);
                                updateDoc(workflowRef, { members: updatedMembers }).catch(err => {
                                console.error("Failed to remove member:", err);
                                });
                            }}
                            className="text-red-500 hover:text-red-700"
                            >
                            <Trash2 className="w-4 h-4" />
                            </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 sm:p-6 backdrop-blur-sm" onClick={() => setShowInviteModal(false)}>
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md sm:max-w-xl p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Inviter un membre</h2>
            <input type="email" placeholder="Email" className="w-full border border-neutral-300 rounded px-3 py-2 mb-4 focus:border-neutral-900 focus:ring-0" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} />
            <select className="w-full border border-neutral-300 rounded px-3 py-2 mb-4" value={inviteRole} onChange={e => setInviteRole(e.target.value)}>
              {ROLES.filter(r => r.key !== "owner").map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
            </select>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowInviteModal(false)} className="px-4 py-2 rounded border border-neutral-300 text-gray-600 hover:text-gray-900">Annuler</button>
              <button onClick={handleInviteMember} disabled={inviting} className="px-4 py-2 rounded bg-neutral-900 text-white hover:bg-neutral-800">{inviting ? "Envoi..." : "Inviter"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Task Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 sm:p-6 backdrop-blur-sm" onClick={() => setSelectedTask(null)}>
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">{selectedTask.title}</h2>
              <button onClick={() => setSelectedTask(null)}><X className="w-5 h-5 text-gray-400 hover:text-gray-900" /></button>
            </div>
            <p className="text-sm text-gray-600 mb-4">{selectedTask.description}</p>
            <div className="flex gap-2 mb-4 flex-wrap">
              <span className="text-xs bg-neutral-100 text-gray-600 px-2 py-1 rounded">{getRoleInfo(selectedTask.status)?.label || selectedTask.status}</span>
              <span className="text-xs bg-neutral-100 text-gray-600 px-2 py-1 rounded">{formatTimestamp(selectedTask.createdAt)}</span>
            </div>
            <div className="space-y-3">
              <h3 className="font-medium text-gray-900">Commentaires</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {selectedTask.comments.map((c, idx) => (
                  <div key={idx} className="flex flex-col bg-neutral-50 p-2 rounded">
                    <span className="text-sm font-medium text-gray-900">{c.userName}</span>
                    <span className="text-sm text-gray-600">{c.text}</span>
                    <span className="text-xs text-gray-400">{formatTimestamp(c.timestamp)}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <input type="text" placeholder="Ajouter un commentaire" className="flex-1 border border-gray-300 text-gray-500 rounded px-3 py-2 focus:border-gray-900 focus:ring-0 text-sm" value={commentText} onChange={e => setCommentText(e.target.value)} />
                <button onClick={() => handleAddComment(selectedTask.id)} className="px-4 py-2 rounded bg-gray-900 text-white hover:bg-neutral-800"><Send className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
