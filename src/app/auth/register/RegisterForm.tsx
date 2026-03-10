'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../../lib/firebase";
import { Check, ArrowLeft, ArrowRight, ShieldCheck, Mail, Lock, User, Building2, Users, Loader2 } from 'lucide-react';

type Plan = {
  name: string; price: number; period: string; features: string[]; color: string; popular?: boolean;
};

const plans: Record<'free' | 'starter' | 'pro', Plan> = {
  free: {
    name: 'Free', price: 0, period: 'toujours gratuit', color: 'slate',
    features: ['3 utilisateurs', '3 projets', 'Éditeur basique', '500 MB stockage']
  },
  starter: {
    name: 'Starter', price: 12, period: 'par mois', color: 'blue', popular: true,
    features: ['Illimité', 'Collaboration live', '10 GB / utilisateur', 'Support email']
  },
  pro: {
    name: 'Professional', price: 24, period: 'par mois', color: 'indigo',
    features: ['Automatisation', '50 GB / utilisateur', 'Support 24/7', 'API complète']
  }
};

export default function RegisterForm() {
  const searchParams = useSearchParams();
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'starter' | 'pro'>('starter');
  const [step, setStep] = useState<'plan' | 'form'>('plan');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', password: '', confirmPassword: '',
    company: '', teamSize: '1-5', agreeToTerms: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const planParam = searchParams.get('plan');
    if (planParam && (planParam in plans)) {
      setSelectedPlan(planParam as any);
      setStep('form');
    }
  }, [searchParams]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
    if (errors[name]) setErrors(prev => { const n = { ...prev }; delete n[name]; return n; });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setErrors({ confirmPassword: "Les mots de passe ne correspondent pas" });
      return;
    }
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      await updateProfile(userCredential.user, { displayName: `${formData.firstName} ${formData.lastName}` });
      const { password, confirmPassword, agreeToTerms, ...safeData } = formData;
      await setDoc(doc(db, "users", userCredential.user.uid), {
        uid: userCredential.user.uid, ...safeData, plan: selectedPlan, createdAt: serverTimestamp()
      });
      if (selectedPlan !== 'free') {
        const res = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan: selectedPlan, email: formData.email }),
        });
        const data = await res.json();
        if (data.url) { window.location.href = data.url; return; }
      }
      window.location.href = '/dashboard';
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-blue-100">

      {/* Progress bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-slate-200">
        <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: step === 'plan' ? '33%' : '66%' }} />
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Back button */}
        <div className="mb-12">
          <button
            onClick={() => step === 'form' ? setStep('plan') : window.history.back()}
            className="group flex items-center text-slate-500 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            {step === 'plan' ? "Retour" : "Changer de plan"}
          </button>
        </div>

        {step === 'plan' ? (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-center mb-16">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
                Propulsez votre <span className="text-blue-600">Workflow</span>
              </h1>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Choisissez la solution adaptée à la taille de votre équipe. Essai gratuit de 14 jours sur tous les plans payants.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 items-start">
              {(Object.keys(plans) as Array<keyof typeof plans>).map((key) => (
                <PlanCard key={key} plan={plans[key]} isSelected={selectedPlan === key} onClick={() => setSelectedPlan(key)} />
              ))}
            </div>

            <div className="mt-16 text-center">
              <button
                onClick={() => setStep('form')}
                className="inline-flex items-center px-8 py-4 bg-slate-900 text-white font-bold rounded-full hover:bg-blue-600 transition-all shadow-xl hover:shadow-blue-200 hover:-translate-y-1"
              >
                Continuer avec le plan {plans[selectedPlan].name}
                <ArrowRight className="ml-2 w-5 h-5" />
              </button>
            </div>
          </section>
        ) : (
          <section className="max-w-xl mx-auto animate-in fade-in zoom-in-95 duration-500">
            <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
              <div className="bg-slate-900 p-8 text-white">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-slate-400 text-sm uppercase tracking-widest font-semibold">Plan sélectionné</p>
                    <h2 className="text-2xl font-bold">{plans[selectedPlan].name}</h2>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{plans[selectedPlan].price}€</p>
                    <p className="text-slate-400 text-xs">{plans[selectedPlan].period}</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Prénom" name="firstName" icon={<User size={18} />} onChange={handleInputChange} required />
                  <Input label="Nom" name="lastName" onChange={handleInputChange} required />
                </div>
                <Input label="Email professionnel" name="email" type="email" icon={<Mail size={18} />} onChange={handleInputChange} required />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Mot de passe" name="password" type="password" icon={<Lock size={18} />} onChange={handleInputChange} required />
                  <Input label="Confirmation" name="confirmPassword" type="password" error={errors.confirmPassword} onChange={handleInputChange} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Entreprise" name="company" icon={<Building2 size={18} />} onChange={handleInputChange} />
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-slate-500 ml-1">Taille</label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <select name="teamSize" onChange={handleInputChange} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none">
                        <option value="1-5">1-5</option>
                        <option value="6-20">6-20</option>
                        <option value="21+">21+</option>
                      </select>
                    </div>
                  </div>
                </div>
                <label className="flex items-center space-x-3 p-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
                  <input type="checkbox" name="agreeToTerms" required className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                  <span className="text-sm text-slate-600">J'accepte les conditions et la politique de confidentialité.</span>
                </label>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 shadow-lg shadow-blue-100 flex justify-center items-center group"
                >
                  {isLoading ? <Loader2 className="animate-spin" /> : (
                    <>
                      Créer mon compte
                      <ShieldCheck className="ml-2 w-5 h-5 group-hover:rotate-12 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function PlanCard({ plan, isSelected, onClick }: { plan: Plan; isSelected: boolean; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`relative p-8 rounded-3xl cursor-pointer transition-all duration-300 border-2 ${
        isSelected
          ? 'bg-white border-blue-600 shadow-2xl shadow-blue-100 scale-[1.02] z-10'
          : 'bg-transparent border-slate-200 hover:border-slate-300 opacity-80 hover:opacity-100'
      }`}
    >
      {plan.popular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] uppercase tracking-widest font-bold py-1 px-4 rounded-full">
          Recommandé
        </span>
      )}
      <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
      <div className="flex items-baseline mb-6">
        <span className="text-4xl font-extrabold tracking-tight">{plan.price}€</span>
        <span className="text-slate-500 ml-2 text-sm italic">{plan.period}</span>
      </div>
      <ul className="space-y-4 mb-2">
        {plan.features.map((f, i) => (
          <li key={i} className="flex items-start text-sm text-slate-600">
            <Check className="w-4 h-4 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
            {f}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Input({ label, icon, error, ...props }: any) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold uppercase text-slate-500 ml-1">{label}</label>
      <div className="relative">
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</div>}
        <input
          {...props}
          className={`w-full ${icon ? 'pl-10' : 'pl-4'} pr-4 py-3 bg-slate-50 border ${error ? 'border-red-500' : 'border-slate-200'} rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all placeholder:text-slate-300`}
        />
      </div>
      {error && <p className="text-[10px] text-red-500 font-bold ml-1">{error}</p>}
    </div>
  );
}