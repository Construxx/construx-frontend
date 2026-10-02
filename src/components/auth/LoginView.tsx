import { FormEvent, useState } from 'react';
import { Loader2, LockKeyhole } from 'lucide-react';

interface LoginViewProps {
  onLogin: (email: string, password: string) => Promise<void>;
  error: string | null;
}

export function LoginView({ onLogin, error }: LoginViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setFormError(null);
    try { await onLogin(email, password); }
    catch (e) { setFormError(e instanceof Error ? e.message : 'Unable to sign in.'); }
    finally { setLoading(false); }
  }

  return (
    <main className="min-h-screen bg-[#0b0f14] text-slate-100 flex items-center justify-center p-6">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-[#232c3b] bg-[#121821] p-7 space-y-5" aria-labelledby="login-title">
        <div className="flex items-center gap-3"><LockKeyhole className="text-amber-400" /><h1 id="login-title" className="text-xl font-bold">Sign in to CONSTRUX</h1></div>
        <p className="text-sm text-slate-400">Use your authorized CONSTRUX account to access project data.</p>
        {(formError || error) && <p role="alert" className="rounded-lg border border-rose-500/40 bg-rose-950/30 p-3 text-sm text-rose-200">{formError || error}</p>}
        <label className="block space-y-1.5 text-sm text-slate-300">Email
          <input autoComplete="username" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white" />
        </label>
        <label className="block space-y-1.5 text-sm text-slate-300">Password
          <input autoComplete="current-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white" />
        </label>
        <button disabled={loading} className="w-full rounded-lg bg-amber-500 px-4 py-2.5 font-bold text-slate-950 disabled:opacity-60">
          {loading ? <span className="flex justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Signing in…</span> : 'Sign in'}
        </button>
      </form>
    </main>
  );
}
