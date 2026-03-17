import { useState, useEffect, useRef } from "react";
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff } from "lucide-react";

export default function VideoCall({ socket, callData, currentUser, onClose }) {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callStatus, setCallStatus] = useState(callData.isIncoming ? "incoming" : "calling");
  const [errorMsg, setErrorMsg] = useState("");
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const peerRef = useRef();
  const streamRef = useRef();

  const ICE_SERVERS = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
    ]
  };

  useEffect(() => {
    setupSocketListeners();
    if (!callData.isIncoming) startCall();
    return () => cleanup();
  }, []);

  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  const getMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (err) {
      // Camera busy (same device) — try audio only
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
        streamRef.current = stream;
        setLocalStream(stream);
        setIsVideoOff(true);
        return stream;
      } catch (err2) {
        // No media at all — create empty stream so call still works
        const stream = new MediaStream();
        streamRef.current = stream;
        setLocalStream(stream);
        setIsVideoOff(true);
        setIsMuted(true);
        return stream;
      }
    }
  };

  const createPeer = (stream) => {
    const peer = new RTCPeerConnection(ICE_SERVERS);
    if (stream && stream.getTracks().length > 0) {
      stream.getTracks().forEach(track => peer.addTrack(track, stream));
    }
    peer.ontrack = (e) => {
      if (e.streams && e.streams[0]) {
        setRemoteStream(e.streams[0]);
        setCallStatus("connected");
      }
    };
    peer.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit("iceCandidate", { to: callData.partnerId, candidate: e.candidate });
      }
    };
    peer.onconnectionstatechange = () => {
      if (peer.connectionState === "connected") setCallStatus("connected");
      if (peer.connectionState === "failed") setErrorMsg("Connection failed. Try again.");
    };
    peerRef.current = peer;
    return peer;
  };

  const startCall = async () => {
    try {
      const stream = await getMedia();
      const peer = createPeer(stream);
      const offer = await peer.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
      await peer.setLocalDescription(offer);
      socket.emit("callUser", {
        to: callData.partnerId,
        offer,
        from: currentUser._id,
        fromName: currentUser.username,
        fromAvatar: currentUser.avatar,
      });
    } catch (err) {
      console.error("Start call error:", err);
      setErrorMsg("Could not start call: " + err.message);
    }
  };

  const answerCall = async () => {
    try {
      setCallStatus("connecting");
      const stream = await getMedia();
      const peer = createPeer(stream);
      await peer.setRemoteDescription(new RTCSessionDescription(callData.offer));
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      socket.emit("answerCall", { to: callData.partnerId, answer });
      setCallStatus("connected");
    } catch (err) {
      console.error("Answer error:", err);
      setErrorMsg("Could not answer: " + err.message);
    }
  };

  const setupSocketListeners = () => {
    socket.on("callAnswered", async ({ answer }) => {
      try {
        if (peerRef.current) {
          await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
          setCallStatus("connected");
        }
      } catch (err) { console.error("setRemoteDescription error:", err); }
    });

    socket.on("iceCandidate", async ({ candidate }) => {
      try {
        if (peerRef.current && peerRef.current.remoteDescription) {
          await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch {}
    });

    socket.on("callEnded", () => {
      setCallStatus("ended");
      setTimeout(() => { cleanup(); onClose(); }, 1500);
    });

    socket.on("callRejected", () => {
      setCallStatus("rejected");
      setTimeout(onClose, 2000);
    });
  };

  const endCall = () => {
    socket.emit("endCall", { to: callData.partnerId });
    cleanup();
    onClose();
  };

  const rejectCall = () => {
    socket.emit("rejectCall", { to: callData.partnerId });
    cleanup();
    onClose();
  };

  const cleanup = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    peerRef.current?.close();
    socket.off("callAnswered");
    socket.off("iceCandidate");
    socket.off("callEnded");
    socket.off("callRejected");
  };

  const toggleMute = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(t => { t.enabled = isMuted; });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach(t => { t.enabled = isVideoOff; });
      setIsVideoOff(!isVideoOff);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
      {/* Remote Video / Waiting Screen */}
      <div className="flex-1 relative bg-gray-800 flex items-center justify-center">
        {callStatus === "connected" && remoteStream ? (
          <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 text-center px-8">
            <img
              src={callData.partnerAvatar || `https://ui-avatars.com/api/?name=${callData.partnerName}&background=random&size=150`}
              className="w-28 h-28 rounded-full object-cover border-4 border-white/20"
            />
            <p className="text-white text-2xl font-semibold">{callData.partnerName}</p>
            <p className="text-white/60 text-sm animate-pulse">
              {callStatus === "calling" ? "📞 Calling..." :
               callStatus === "incoming" ? "📹 Incoming video call..." :
               callStatus === "connecting" ? "🔄 Connecting..." :
               callStatus === "ended" ? "📵 Call ended" :
               callStatus === "rejected" ? "❌ Call declined" : "🔄 Connecting..."}
            </p>
            {errorMsg && <p className="text-red-400 text-sm bg-red-900/30 px-4 py-2 rounded-lg">{errorMsg}</p>}
          </div>
        )}

        {/* Local Video PiP */}
        <div className="absolute top-4 right-4 w-32 h-44 rounded-xl overflow-hidden border-2 border-white/30 shadow-xl bg-gray-700 flex items-center justify-center">
          {!isVideoOff && localStream ? (
            <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2">
              <img
                src={currentUser?.avatar || `https://ui-avatars.com/api/?name=${currentUser?.fullName}&background=random`}
                className="w-12 h-12 rounded-full object-cover"
              />
              <p className="text-white text-xs">You</p>
            </div>
          )}
        </div>
      </div>

      {/* Call Controls */}
      <div className="bg-gray-900 px-6 py-6">
        {callStatus === "incoming" ? (
          <div className="flex items-center justify-center gap-8">
            <div className="flex flex-col items-center gap-2">
              <button onClick={rejectCall}
                className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors shadow-lg">
                <PhoneOff size={28} className="text-white" />
              </button>
              <span className="text-white/60 text-xs">Decline</span>
            </div>
            <div className="text-center">
              <p className="text-white font-semibold">{callData.partnerName}</p>
              <p className="text-white/50 text-xs">is calling you</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <button onClick={answerCall}
                className="w-16 h-16 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center transition-colors shadow-lg animate-pulse">
                <Phone size={28} className="text-white" />
              </button>
              <span className="text-white/60 text-xs">Accept</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-6">
            <div className="flex flex-col items-center gap-2">
              <button onClick={toggleMute}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${isMuted ? "bg-red-500" : "bg-white/20 hover:bg-white/30"}`}>
                {isMuted ? <MicOff size={22} className="text-white" /> : <Mic size={22} className="text-white" />}
              </button>
              <span className="text-white/60 text-xs">{isMuted ? "Unmute" : "Mute"}</span>
            </div>

            <div className="flex flex-col items-center gap-2">
              <button onClick={endCall}
                className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors shadow-lg">
                <PhoneOff size={28} className="text-white" />
              </button>
              <span className="text-white/60 text-xs">End Call</span>
            </div>

            <div className="flex flex-col items-center gap-2">
              <button onClick={toggleVideo}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${isVideoOff ? "bg-red-500" : "bg-white/20 hover:bg-white/30"}`}>
                {isVideoOff ? <VideoOff size={22} className="text-white" /> : <Video size={22} className="text-white" />}
              </button>
              <span className="text-white/60 text-xs">{isVideoOff ? "Start Video" : "Stop Video"}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
