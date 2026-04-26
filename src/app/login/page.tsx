'use client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useStore, UserRole } from '@/store/useStore';

export default function LoginPage() {
  const router = useRouter();
  const setUserRole = useStore(state => state.setUserRole);
  const setSessionOrg = useStore(state => state.setSessionOrg);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [orgName, setOrgName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;
    setLoading(true);
    setError(null);
    setNotice(null);

    if (isSignUp) {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: selectedRole,
            org_name: orgName || `${selectedRole} Org`,
          },
        },
      });

      if (signUpError || !data.user) {
        const message = signUpError?.message ?? 'Sign-up failed.';
        setError(
          message.toLowerCase().includes('email rate limit')
            ? 'Supabase email rate limit exceeded. Wait a few minutes or configure custom SMTP in Supabase Auth settings.'
            : message
        );
        setLoading(false);
        return;
      }

      setNotice('Account created. Check your email and confirm your address, then sign in.');
      setIsSignUp(false);
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('org_id, organizations(role)')
        .single();

      if (profile?.organizations) {
        const orgRecord = profile.organizations as unknown as { role: UserRole };
        setSessionOrg(orgRecord.role, profile.org_id);
      } else {
        setUserRole(selectedRole);
      }

      router.push('/dashboard');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-full flex flex-col items-center justify-center bg-beige text-dark p-4 relative">
      <Link href="/" className="absolute top-8 left-8 font-sans font-bold hover:text-signal-red transition-colors flex items-center gap-2">
        <span>&larr;</span> Back
      </Link>

      <div className="card-soft w-full max-w-md">
        <h1 className="text-3xl font-sans font-bold mb-8 text-center">
          {selectedRole ? `${isSignUp ? 'Create account' : 'Sign in'} as ${selectedRole}` : 'Select your role'}
        </h1>

        {!selectedRole ? (
          <div className="flex flex-col gap-4">
            {(['Retailer', 'Distributor', 'Manufacturer'] as UserRole[]).map(role => (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className="card-soft hover:shadow-md transition-all text-left group"
              >
                <h3 className="font-bold font-sans text-xl group-hover:text-signal-red">{role}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {role === 'Retailer' && 'Manage POS and store inventory.'}
                  {role === 'Distributor' && 'Fulfill incoming store orders.'}
                  {role === 'Manufacturer' && 'Monitor global supply chains.'}
                </p>
              </button>
            ))}
          </div>
        ) : (
          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            {isSignUp && (
              <div className="flex flex-col gap-2">
                <label className="font-sans font-bold text-sm text-gray-700">Organization Name</label>
                <input
                  type="text"
                  className="input-soft"
                  placeholder={`e.g. My ${selectedRole} Co.`}
                  value={orgName}
                  onChange={e => setOrgName(e.target.value)}
                />
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label className="font-sans font-bold text-sm text-gray-700">Email Address</label>
              <input
                type="email"
                required
                className="input-soft"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-sans font-bold text-sm text-gray-700">Password</label>
              <input
                type="password"
                required
                minLength={6}
                className="input-soft"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className="text-sm font-sans text-signal-red bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
                {error}
              </div>
            )}

            {notice && (
              <div className="text-sm font-sans text-green-700 bg-green-50 border border-green-100 rounded-2xl px-4 py-3">
                {notice}
              </div>
            )}

            <div className="flex items-center justify-between mt-2">
              <button
                type="button"
                onClick={() => { setSelectedRole(null); setError(null); setNotice(null); }}
                className="text-sm font-sans font-bold text-gray-500 hover:text-dark transition-colors"
              >
                Change Role
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-pill disabled:opacity-50"
              >
                {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
              </button>
            </div>

            <button
              type="button"
              onClick={() => { setIsSignUp(!isSignUp); setError(null); setNotice(null); }}
              className="text-center text-sm font-sans text-gray-500 hover:text-dark transition-colors mt-2"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
