import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export default function TDisplayNothingOS() {
  const [verse, setVerse] = useState<{ reference: string; text: string } | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(localStorage.getItem("hw_device_id"));
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [macAddress] = useState(() => {
    let mac = localStorage.getItem("hw_mac");
    if (!mac) {
      mac = "MAC_" + Math.random().toString(36).substr(2, 9).toUpperCase();
      localStorage.setItem("hw_mac", mac);
    }
    return mac;
  });

  // Hardware pairing flow
  useEffect(() => {
    if (deviceId) return;
    
    const checkPairing = async () => {
      try {
        const res = await fetch("/api/devices/register-hardware", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ macAddress })
        });
        const data = await res.json();
        if (data.status === "paired") {
          setDeviceId(data.deviceId);
          localStorage.setItem("hw_device_id", data.deviceId);
        } else if (data.status === "pairing") {
          setPairingCode(data.pairingCode);
        }
      } catch (err) {
        console.error(err);
      }
    };

    checkPairing();
    const interval = setInterval(checkPairing, 3000);
    return () => clearInterval(interval);
  }, [deviceId, macAddress]);

  // Fetch active verse once paired
  useEffect(() => {
    if (!deviceId) return;

    const fetchActiveVerse = async () => {
      try {
        const res = await fetch(`/api/display/active?deviceId=${deviceId}`);
        if (res.ok) {
          const data = await res.json();
          setVerse(data);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchActiveVerse();
    const interval = setInterval(fetchActiveVerse, 5000);
    return () => clearInterval(interval);
  }, [deviceId]);

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 font-sans">
      <div className="text-center mb-8 absolute top-10 text-[#666] max-w-md">
        <h2 className="text-xl mb-2 text-white tracking-tight">Nothing OS 5.0 Mockup (Hardware Mode)</h2>
        <p className="text-sm">Device MAC: {macAddress}</p>
      </div>

      {/* T-Display S3 Screen Hardware Box (Landscape: 320x170 pixels) */}
      <div 
        className="relative overflow-hidden shadow-[0_0_50px_rgba(255,0,0,0.15)] border-[10px] border-[#111] rounded-xl flex flex-col justify-center items-center bg-black"
        style={{ width: "320px", height: "170px" }}
      >
        <div 
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)", backgroundSize: "10px 10px" }}
        />
        <div 
          className="absolute inset-0 bg-contain bg-no-repeat bg-center z-0 opacity-30 grayscale"
          style={{ backgroundImage: "url(`/images/world_map.jpg`)", backgroundPosition: "center 20%" }}
        />

        <div className="relative z-10 w-full h-full p-4 flex flex-col items-start justify-center border-l-4 border-red-600">
          {!deviceId ? (
            <div className="w-full flex flex-col items-center justify-center text-center">
              <p className="text-white text-[10px] font-mono tracking-widest uppercase mb-2">Awaiting Pairing</p>
              <p className="text-red-500 text-3xl font-mono font-bold tracking-[0.2em]">{pairingCode || <Loader2 className="animate-spin" />}</p>
            </div>
          ) : !verse ? (
            <div className="w-full flex items-center justify-center">
              <p className="text-white text-xs font-mono tracking-widest uppercase">No Active Verse</p>
            </div>
          ) : (
            <>
              <div className="w-full flex items-center justify-between absolute top-3 left-0 px-4">
                <h1 className="text-white text-[10px] font-mono font-bold tracking-[0.2em] uppercase bg-black/50 px-1 rounded">
                  {verse.reference}
                </h1>
                <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
              </div>
              <div className="w-full h-[100px] mt-4 flex items-center pr-2 px-3">
                <p className="text-white text-[13px] leading-snug tracking-tight text-left line-clamp-4 drop-shadow-md bg-black/30 rounded p-1">
                  "{verse.text}"
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

