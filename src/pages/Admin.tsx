import { useState, useEffect } from "react";
import { useAuth } from "../store/useAuth";
import { Users, Monitor, ShieldAlert } from "lucide-react";
import { Navigate } from "react-router-dom";

export default function Admin() {
  const { token, user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  if (!user || user.role !== "ADMIN") {
    return <Navigate to="/" replace />;
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, devicesRes] = await Promise.all([
          fetch("/api/admin/users", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("/api/admin/devices", { headers: { Authorization: `Bearer ${token}` } })
        ]);
        
        if (usersRes.ok) setUsers(await usersRes.json());
        if (devicesRes.ok) setDevices(await devicesRes.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  return (
    <div className="min-h-full pb-24 bg-black text-white font-sans">
      <header className="px-6 pt-12 pb-4 sticky top-0 bg-black/90 backdrop-blur-md z-10 border-b border-red-500/30 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-red-500">ADMIN CORE</h1>
          <p className="font-mono text-white/50 text-[10px] tracking-[0.2em] uppercase font-bold mt-1">
            System Overseer Access
          </p>
        </div>
        <ShieldAlert size={32} className="text-red-500" strokeWidth={1.5} />
      </header>

      <main className="px-6 py-6 space-y-8">
        {loading ? (
          <div className="text-center py-20 font-mono text-xs uppercase tracking-widest text-white/50">Loading data...</div>
        ) : (
          <>
            <section>
              <h2 className="font-mono text-white font-bold uppercase tracking-[0.2em] text-[10px] mb-4 flex items-center gap-2">
                <Users size={14} className="text-red-500" />
                Registered Users ({users.length})
              </h2>
              <div className="space-y-3">
                {users.map(u => (
                  <div key={u.id} className="bg-[#111] border border-white/10 p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-mono text-sm font-bold tracking-widest uppercase text-white">{u.email}</h3>
                      <span className={`font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded ${u.role === "ADMIN" ? "bg-red-500/20 text-red-500" : "bg-white/10 text-white/70"}`}>
                        {u.role}
                      </span>
                    </div>
                    <div className="flex gap-4 font-mono text-[10px] text-white/40 uppercase tracking-widest">
                      <span>Bookmarks: {u._count.bookmarks}</span>
                      <span>Devices: {u._count.devices}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="font-mono text-white font-bold uppercase tracking-[0.2em] text-[10px] mb-4 flex items-center gap-2">
                <Monitor size={14} className="text-red-500" />
                Global Hardware Fleet ({devices.length})
              </h2>
              <div className="space-y-3">
                {devices.map(d => (
                  <div key={d.id} className="bg-[#111] border border-white/10 p-4">
                    <h3 className="font-mono text-sm font-bold tracking-widest uppercase text-white mb-1">
                      {d.name || "T-Display S3"}
                    </h3>
                    <p className="font-sans text-xs text-white/50 mb-2">ID: {d.id}</p>
                    <div className="flex justify-between items-center font-mono text-[10px] uppercase tracking-widest">
                      <span className={d.owner ? "text-green-500" : "text-orange-500"}>
                        {d.owner ? `Linked to: ${d.owner.email}` : `Pairing Code: ${d.pairingCode}`}
                      </span>
                      {d.activeVerseId && <span className="text-white/40">Active Feed Running</span>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

