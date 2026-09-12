import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Lock, Loader2 } from "lucide-react";
import { useAuth } from "../store/useAuth";

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const setAuth = useAuth(state => state.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }
      
      setAuth(data.token, data.user);
      navigate("/bookmarks");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-[400px]">
        <h1 className="text-4xl font-black tracking-tighter mb-2 text-center text-white">MANNA</h1>
        <p className="font-mono text-xs tracking-[0.2em] uppercase text-red-500 font-bold text-center mb-10">
          Neural Sync Portal
        </p>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 mb-6 text-xs font-mono uppercase tracking-widest text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" size={20} />
            <input 
              type="email" 
              placeholder="IDENTITY (EMAIL)..." 
              required
              className="w-full bg-[#111] border border-white/20 py-4 pl-12 pr-4 focus:outline-none focus:border-red-500 font-mono text-sm tracking-widest uppercase placeholder:text-white/30 text-white transition-colors"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" size={20} />
            <input 
              type="password" 
              placeholder="PASSPHRASE..." 
              required
              className="w-full bg-[#111] border border-white/20 py-4 pl-12 pr-4 focus:outline-none focus:border-red-500 font-mono text-sm tracking-widest uppercase placeholder:text-white/30 text-white transition-colors"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black font-mono font-bold tracking-[0.2em] py-4 uppercase hover:bg-white/80 transition-colors flex items-center justify-center mt-6"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : isLogin ? "Authenticate" : "Initialize"}
          </button>
        </form>

        <button 
          onClick={() => setIsLogin(!isLogin)}
          className="w-full mt-6 text-center font-sans text-sm text-white/50 hover:text-white transition-colors"
        >
          {isLogin ? "No account? Initialize new identity." : "Already registered? Authenticate here."}
        </button>
      </div>
    </div>
  );
}

