import { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useData } from '../context/DataContext';
import { Lock, Mail, User, ArrowRight, Loader, AlertCircle } from 'lucide-react';

export function Auth() {
    const { loginAsGuest } = useData();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLogin, setIsLogin] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        const trimmedEmail = email.trim();
        const trimmedPassword = password.trim();

        try {
            if (isLogin) {
                const { error, data } = await supabase.auth.signInWithPassword({
                    email: trimmedEmail,
                    password: trimmedPassword,
                });
                if (error) {
                    console.error("Supabase Sign In Error:", error);
                    if (error.message.includes('Email not confirmed')) {
                        throw new Error("Account exists but EMAIL NOT VERIFIED. Please check your inbox and click the confirmation link.");
                    }
                    if (error.message.includes('Invalid login credentials')) {
                        throw new Error("Invalid email or password. If you haven't signed up yet, please switch to Sign Up.");
                    }
                    throw error;
                }
                if (data.session) {
                    setMessage("Successfully signed in!");
                }
            } else {
                const { error, data } = await supabase.auth.signUp({
                    email: trimmedEmail,
                    password: trimmedPassword,
                });
                if (error) {
                    console.error("Supabase Sign Up Error:", error);
                    throw error;
                }
                if (data.user && !data.session) {
                    setMessage("Registration successful! PLEASE CHECK YOUR EMAIL (including Spam) to verify your account before you can sign in.");
                }
            }
        } catch (err: unknown) {
            console.error("Full Auth Error Logic Block:", err);
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4 transition-colors duration-300">
            <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-white/20">
                {!isSupabaseConfigured && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-100 dark:border-amber-900/30 p-4 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">Configuration Supabase Invalide</p>
                            <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                                La clé fournie n'est pas une clé Supabase (format JWT attendu).
                                Utilisez le mode **Invité** ci-dessous ou vérifiez votre fichier `.env`.
                            </p>
                        </div>
                    </div>
                )}
                <div className="p-8">
                    <div className="bg-indigo-600 w-12 h-12 rounded-xl flex items-center justify-center mb-6 mx-auto shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20">
                        <User className="w-6 h-6 text-white" />
                    </div>

                    <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-2">
                        {isLogin ? 'Welcome Back' : 'Create Account'}
                    </h2>
                    <p className="text-center text-gray-500 dark:text-gray-400 mb-8">
                        {isLogin
                            ? 'Enter your credentials to access your workspace'
                            : 'Sign up to start analyzing your data'}
                    </p>

                    <form onSubmit={handleAuth} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                                    placeholder="you@example.com"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm text-center border border-red-100 dark:border-red-900/30">
                                {error}
                            </div>
                        )}

                        {message && (
                            <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-3 rounded-lg text-sm text-center border border-green-100 dark:border-green-900/30">
                                {message}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !isSupabaseConfigured}
                            className={`w-full font-semibold py-3 rounded-lg transition-all transform flex items-center justify-center gap-2 group shadow-md ${loading || !isSupabaseConfigured
                                ? 'bg-gray-300 dark:bg-slate-700 cursor-not-allowed text-gray-500 dark:text-gray-400'
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:scale-[1.02] active:scale-[0.98] shadow-indigo-200 dark:shadow-none'
                                }`}
                        >
                            {loading ? (
                                <Loader className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    {!isSupabaseConfigured ? 'Connexion Désactivée' : (isLogin ? 'Sign In' : 'Sign Up')}
                                    {isSupabaseConfigured && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                                </>
                            )}
                        </button>
                    </form>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-gray-300 dark:border-slate-700" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white dark:bg-slate-800 text-gray-500">Or continue with</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => loginAsGuest()}
                        className="w-full bg-white dark:bg-slate-800 border-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold py-3 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all flex items-center justify-center gap-2 group shadow-sm"
                    >
                        Continue as Guest (Recommendé)
                    </button>

                    <div className="mt-6 text-center">
                        <p className="text-gray-600 dark:text-gray-400">
                            {isLogin ? "Don't have an account? " : "Already have an account? "}
                            <button
                                onClick={() => {
                                    setIsLogin(!isLogin);
                                    setError(null);
                                    setMessage(null);
                                }}
                                className="text-indigo-600 dark:text-indigo-400 font-semibold hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline"
                            >
                                {isLogin ? 'Sign up' : 'Sign in'}
                            </button>
                        </p>
                    </div>
                </div>

                {/* Decorative bar */}
                <div className="h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 w-full"></div>
            </div>
        </div>
    );
}
