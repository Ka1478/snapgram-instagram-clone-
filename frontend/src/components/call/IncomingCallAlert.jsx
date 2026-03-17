import { Phone, PhoneOff } from "lucide-react";
import { useEffect, useState } from "react";

export default function IncomingCallAlert({ callData, onAccept, onReject }) {
  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    const ring = new Audio("https://cdn.freesound.org/previews/561/561164_7372308-lq.mp3");
    ring.loop = true;
    ring.volume = 0.5;
    ring.play().catch(() => {});

    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timer);
          ring.pause();
          onReject();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      ring.pause();
    };
  }, []);

  const name = callData.partnerName || callData.fromName || "Someone";
  const avatar = callData.partnerAvatar || callData.fromAvatar || `https://ui-avatars.com/api/?name=${name}&background=random`;

  return (
    <div className="fixed top-4 right-4 z-50 bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 w-72">
      <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          <img src={avatar} className="w-14 h-14 rounded-full object-cover ring-4 ring-green-400 ring-offset-2 animate-pulse" />
        </div>
        <div>
          <p className="font-bold text-sm">{name}</p>
          <p className="text-gray-500 text-xs">📹 Incoming video call...</p>
          <p className="text-xs text-orange-500 font-medium mt-0.5">Auto-declining in {timeLeft}s</p>
        </div>
      </div>
      <div className="flex gap-3">
        <button onClick={onReject}
          className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl font-semibold text-sm transition-colors">
          <PhoneOff size={16} /> Decline
        </button>
        <button onClick={onAccept}
          className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-xl font-semibold text-sm transition-colors">
          <Phone size={16} /> Accept
        </button>
      </div>
    </div>
  );
}
