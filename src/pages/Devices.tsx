import { useState, useEffect } from "react";
import { Monitor, Plus, X, Loader2 } from "lucide-react";
import { useAuth } from "../store/useAuth";

export default function Devices() {
  const [devices, setDevices] = useState<{ id: string; name: string }[]>([]);
  const [pairingCode, setPairingCode] = useState("");
  const [deviceName, setDeviceName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPairing, setShowPairing] = useState(false);
  const [error, setError] = useState("");
  
  const token = useAuth(state => state.token);

  const fetchDevices = async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/devices", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDevices(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, [token]);

  const handlePair = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pairingCode.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/devices/claim", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ pairingCode, name: deviceName })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      await fetchDevices();
      setPairingCode("");
      setDeviceName("");
      setShowPairing(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlink = async (id: string) => {
    try {
      await fetch(`/api/devices/unlink/${id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchDevices();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-full pb-24 bg-black text-white font-sans">
      <header className="px-6 pt-12 pb-4 sticky top-0 bg-black/90 backdrop-blur-md z-10 border-b border-white/10 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black tracking-tighter">HARDWARE</h1>
          <p className="font-mono text-red-500 text-[10px] tracking-[0.2em] uppercase font-bold mt-1">
            Linked Devices
          </p>
        </div>
        <button 
          onClick={() => setShowPairing(!showPairing)}
          className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center hover:bg-white/80 transition-colors"
        >
          <Plus size={24} strokeWidth={2} className={`transition-transform ${showPairing ? "rotate-45" : ""}`} />
        </button>
      </header>

      <main className="px-6 py-6 space-y-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 text-xs font-mono uppercase tracking-widest text-center">
            {error}
          </div>
        )}

        {showPairing && (
          <div className="bg-[#111] border border-white/20 p-5 shadow-[4px_4px_0px_0px_rgba(255,0,0,0.5)]">
            <h2 className="font-mono text-xs font-bold uppercase tracking-widest text-red-500 mb-4">Pair New Device</h2>
            <form onSubmit={handlePair} className="space-y-4">
              <input 
                type="text" 
                placeholder="6-DIGIT CODE..." 
                maxLength={6}
                required
                className="w-full bg-black border border-white/20 py-3 px-4 focus:outline-none focus:border-white font-mono text-xl tracking-[0.5em] text-center placeholder:text-white/30 text-white uppercase"
                value={pairingCode}
                onChange={(e) => setPairingCode(e.target.value)}
              />
              <input 
                type="text" 
                placeholder="DEVICE NAME (OPTIONAL)..." 
                className="w-full bg-black border border-white/20 py-3 px-4 focus:outline-none focus:border-white font-mono text-sm tracking-widest uppercase placeholder:text-white/30 text-white"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
              />
              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-white text-black font-mono font-bold tracking-widest py-3 uppercase hover:bg-white/80 transition-colors flex items-center justify-center"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : "Link Device"}
              </button>
            </form>
          </div>
        )}

        {devices.length === 0 && !showPairing ? (
          <div className="text-center py-20 text-white/30 font-mono text-xs uppercase tracking-widest">
            No hardware linked
          </div>
        ) : (
          <div className="space-y-3">
            {devices.map(device => (
              <div key={device.id} className="bg-[#111] border border-white/10 p-5 flex items-center gap-4">
                <Monitor className="text-white/50" size={24} />
                <div className="flex-1">
                  <h3 className="font-mono text-sm font-bold tracking-widest uppercase">{device.name || "T-Display-S3"}</h3>
                  <p className="font-sans text-[10px] text-white/40">ID: {device.id}</p>
                </div>
                <button 
                  onClick={() => handleUnlink(device.id)}
                  className="text-white/30 hover:text-red-500 transition-colors p-2"
                >
                  <X size={20} />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

