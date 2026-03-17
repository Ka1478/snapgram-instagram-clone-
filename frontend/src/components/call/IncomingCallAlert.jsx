import { Phone, PhoneOff } from "lucide-react";

export default function IncomingCallAlert({ callData, onAccept, onReject }) {
  return (
    <div className="fixed top-4 right-4 z-50 bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 w-72 animate-slide-up">
      <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          <img
            src={callData.fromAvatar || `https://ui-avatars.com/api/?name=${callData.fromName}&background=random`}
            className="w-12 h-12 rounded-full object-cover"
          />
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white animate-pulse" />
        </div>
        <div>
          <p className="font-bold text-sm">{callData.fromName}</p>
          <p className="text-gray-500 text-xs">📹 Incoming video call...</p>
        </div>
      </div>
      <div className="flex gap-3">
        <button onClick={onReject}
          className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl font-semibold text-sm transition-colors">
          <PhoneOff size={16} /> Decline
        </button>
        <button onClick={onAccept}
          className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-xl font-semibold text-sm transition-colors animate-pulse">
          <Phone size={16} /> Accept
        </button>
      </div>
    </div>
  );
}
