import { useState, useEffect, useRef } from "react";
import { Send, Bot, BookOpen, Plus, Users, ArrowLeft, X, Loader2, Swords, Trophy } from "lucide-react";
import api from "../utils/api";
import { useAuthStore } from "../context/authStore";
import { useSocket } from "../context/SocketContext";
import toast from "react-hot-toast";

export default function GroupChatPage() {
  const { user } = useAuthStore();
  const { socket } = useSocket();
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [aiQuestion, setAiQuestion] = useState("");
  const [mcqTopic, setMcqTopic] = useState("");
  const [battleTopic, setBattleTopic] = useState("");
  const [showAI, setShowAI] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [selectedMCQAnswer, setSelectedMCQAnswer] = useState({});
  const [showMobile, setShowMobile] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [mcqLoading, setMcqLoading] = useState(false);
  const [battleLoading, setBattleLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [activeBattles, setActiveBattles] = useState([]);
  const [battleAnswers, setBattleAnswers] = useState({});
  const [battleResults, setBattleResults] = useState({});
const [aiFile, setAiFile] = useState(null);
const [aiFileType, setAiFileType] = useState(""); // "image" or "pdf"
const [aiFilePreview, setAiFilePreview] = useState("");
const fileInputRef = useRef(null);

  const bottomRef = useRef(null);
  const searchTimer = useRef(null);

  useEffect(() => {
    api.get("/groups").then(r => setGroups(r.data.groups || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!socket || !activeGroup) return;
    socket.emit("joinGroup", activeGroup._id);

    socket.on("newGroupMessage", ({ groupId, message }) => {
      if (groupId === activeGroup._id && !message.isAI)
        setMessages(prev => [...prev, message]);
    });

    socket.on("quizBattleStarted", ({ battle }) => {
      if (battle.groupId === activeGroup._id) {
        setActiveBattles(prev => [battle, ...prev.filter(b => b._id !== battle._id)]);
        toast("⚔️ Quiz Battle started! Join to compete!", { icon: "🎮" });
      }
    });

    socket.on("quizBattleJoined", ({ battle }) => {
      if (battle.groupId === activeGroup._id) {
        setActiveBattles(prev => prev.map(b => b._id === battle._id ? battle : b));
        toast(`${battle.opponent?.username} joined the battle!`, { icon: "⚔️" });
      }
    });

    socket.on("quizBattleUpdated", ({ battle }) => {
      if (battle.groupId === activeGroup._id) {
        setActiveBattles(prev => prev.map(b => b._id === battle._id ? battle : b));
        if (battle.status === "finished") {
          setBattleResults(prev => ({ ...prev, [battle._id]: battle }));
          if (battle.winner) {
            const winnerId = battle.winner._id || battle.winner;
            if (winnerId === user._id) toast.success("🏆 You won the Quiz Battle!");
            else toast(`🏆 ${battle.winner.username} won the battle!`);
          } else {
            toast("😅 Both players got it wrong! No winner.");
          }
        }
      }
    });

    return () => {
      socket.off("newGroupMessage");
      socket.off("quizBattleStarted");
      socket.off("quizBattleJoined");
      socket.off("quizBattleUpdated");
    };
  }, [socket, activeGroup]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeBattles]);

  const openGroup = async (group) => {
    setActiveGroup(group);
    setShowMobile(true);
    setMessages([]);
    setActiveBattles([]);
    try {
      const [msgRes, battleRes] = await Promise.all([
        api.get(`/groups/${group._id}`),
        api.get(`/quiz/group/${group._id}`),
      ]);
      setMessages(msgRes.data.group.messages || []);
      setActiveBattles(battleRes.data.battles || []);
    } catch { toast.error("Failed to load messages"); }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    const savedText = text;
    setText("");
    try {
      await api.post(`/groups/${activeGroup._id}/message`, { text: savedText });
    } catch { toast.error("Failed to send"); setText(savedText); }
  };

 const askAI = async () => {
  if (!aiQuestion.trim() && !aiFile) return;
  setAiLoading(true);
  try {
    let imageBase64 = null;
    let imageType = null;
    let pdfText = null;

    if (aiFile) {
      if (aiFileType === "image") {
        // Convert image to base64
        imageBase64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result.split(",")[1]);
          reader.onerror = reject;
          reader.readAsDataURL(aiFile);
        });
        imageType = aiFile.type;
      } else if (aiFileType === "pdf") {
        // Extract PDF text on frontend using raw text extraction
        pdfText = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = async () => {
            try {
              // Send raw base64 to backend for parsing
              const base64 = reader.result.split(",")[1];
              const res = await api.post("/groups/ai/parse-pdf", { base64 });
              resolve(res.data.text);
            } catch { reject(new Error("Failed to parse PDF")); }
          };
          reader.onerror = reject;
          reader.readAsDataURL(aiFile);
        });
      }
    }

    const res = await api.post("/groups/ai/ask", {
      question: aiQuestion,
      groupId: activeGroup._id,
      imageBase64,
      imageType,
      pdfText,
    });

    setAiQuestion("");
    setAiFile(null);
    setAiFilePreview("");
    setAiFileType("");
    setShowAI(false);

    if (res.data.answer) {
      setMessages(prev => [...prev, {
        _id: Date.now(),
        isAI: true,
        text: res.data.answer,
        createdAt: new Date().toISOString(),
      }]);
    }
  } catch (err) {
    toast.error(err.response?.data?.message || "AI failed to respond");
  } finally { setAiLoading(false); }
};

const handleAIFile = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const isImage = file.type.startsWith("image/");
  const isPDF = file.type === "application/pdf";

  if (!isImage && !isPDF) {
    toast.error("Only images and PDFs are supported");
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    toast.error("File must be under 10MB");
    return;
  }

  setAiFile(file);
  setAiFileType(isImage ? "image" : "pdf");

  if (isImage) {
    const reader = new FileReader();
    reader.onload = () => setAiFilePreview(reader.result);
    reader.readAsDataURL(file);
  } else {
    setAiFilePreview("pdf");
  }
};

  const generateMCQ = async () => {
    if (!mcqTopic.trim()) return;
    setMcqLoading(true);
    try {
      const res = await api.post("/groups/ai/mcq", { topic: mcqTopic, groupId: activeGroup._id });
      setMcqTopic("");
      setShowAI(false);
      if (res.data.mcqs && res.data.mcqs.length > 0) {
  const newMsgs = res.data.mcqs.map((mcq, idx) => ({
    _id: Date.now() + idx,
    isAI: true,
    text: `📝 MCQ ${idx + 1}: ${mcq.question}`,
    mcq,
    createdAt: new Date().toISOString(),
  }));
  setMessages(prev => [...prev, ...newMsgs]);
  toast.success(`✅ ${res.data.mcqs.length} MCQs generated!`);
}
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to generate MCQ");
    } finally { setMcqLoading(false); }
  };

  const startBattle = async () => {
    if (!battleTopic.trim()) return;
    setBattleLoading(true);
    try {
      await api.post("/quiz/start", { groupId: activeGroup._id, topic: battleTopic });
      setBattleTopic("");
      setShowAI(false);
      toast.success("⚔️ Battle started! Waiting for opponent...");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to start battle");
    } finally { setBattleLoading(false); }
  };

  const joinBattle = async (battleId) => {
    try {
      await api.post(`/quiz/join/${battleId}`);
      toast.success("⚔️ You joined the battle!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to join");
    }
  };

  const submitBattleAnswer = async (battleId, answer) => {
    setBattleAnswers(prev => ({ ...prev, [battleId]: answer }));
    try {
      const res = await api.post(`/quiz/answer/${battleId}`, { answer });
      if (res.data.correct) toast.success("✅ Correct answer!");
      else toast.error(`❌ Wrong! Correct was: ${res.data.battle?.answer}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit");
    }
  };

  const searchUsers = (q) => {
    setMemberSearch(q);
    clearTimeout(searchTimer.current);
    if (!q.trim()) { setSearchResults([]); return; }
    searchTimer.current = setTimeout(async () => {
      try {
        const r = await api.get(`/users/search?q=${q}`);
        setSearchResults(r.data.users || []);
      } catch {}
    }, 400);
  };

  const addMember = (u) => {
    if (!selectedMembers.find(m => m._id === u._id))
      setSelectedMembers(prev => [...prev, u]);
    setMemberSearch("");
    setSearchResults([]);
  };

  const createGroup = async () => {
    if (!groupName.trim() || selectedMembers.length === 0) {
      toast.error("Enter group name and add at least 1 member");
      return;
    }
    setCreating(true);
    try {
      const r = await api.post("/groups", { name: groupName, memberIds: selectedMembers.map(m => m._id) });
      setGroups(prev => [r.data.group, ...prev]);
      setShowCreate(false);
      setGroupName("");
      setSelectedMembers([]);
      toast.success("Group created!");
    } catch { toast.error("Failed to create group"); }
    finally { setCreating(false); }
  };

  const avatarUrl = (name) => `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "U")}&background=random`;

  const BattleCard = ({ battle }) => {
    const myId = user._id;
    const isChallenger = battle.challenger?._id === myId || battle.challenger === myId;
    const canJoin = battle.status === "waiting" && !isChallenger;
    const isOpponent = battle.opponent?._id === myId || battle.opponent === myId;
    const isParticipant = isChallenger || isOpponent;
    const canAnswer = battle.status === "active" && isParticipant && !battleAnswers[battle._id];
    const result = battleResults[battle._id] || (battle.status === "finished" ? battle : null);
    const myAnswer = battleAnswers[battle._id];

    return (
      <div className="border border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-950 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-yellow-600 dark:text-yellow-400 flex items-center gap-1 uppercase tracking-wide">
            <Swords size={14} /> Quiz Battle · {battle.topic}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            battle.status === "waiting" ? "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300" :
            battle.status === "active" ? "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300" :
            "bg-gray-100 text-gray-500 dark:bg-gray-800"}`}>
            {battle.status === "waiting" ? "⏳ Waiting" : battle.status === "active" ? "🔥 Live" : "✅ Done"}
          </span>
        </div>

        {/* Players */}
        <div className="flex items-center justify-between px-2">
          <div className="flex flex-col items-center gap-1">
            <img src={battle.challenger?.avatar || avatarUrl(battle.challenger?.username)}
              className="w-10 h-10 rounded-full object-cover border-2 border-yellow-400" />
            <span className="text-xs font-semibold">{battle.challenger?.username}</span>
          </div>
          <span className="text-xl font-black text-yellow-500">VS</span>
          <div className="flex flex-col items-center gap-1">
            {battle.opponent ? (
              <>
                <img src={battle.opponent?.avatar || avatarUrl(battle.opponent?.username)}
                  className="w-10 h-10 rounded-full object-cover border-2 border-yellow-400" />
                <span className="text-xs font-semibold">{battle.opponent?.username}</span>
              </>
            ) : (
              <>
                <div className="w-10 h-10 rounded-full border-2 border-dashed border-yellow-400 flex items-center justify-center text-yellow-400">?</div>
                <span className="text-xs text-gray-400 italic">waiting...</span>
              </>
            )}
          </div>
        </div>

        {/* Join button */}
        {canJoin && (
          <button onClick={() => joinBattle(battle._id)}
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
            <Swords size={16} /> Accept Challenge!
          </button>
        )}

        {/* Question + Options */}
        {(battle.status === "active" || battle.status === "finished") && isParticipant && (
          <div className="space-y-2 pt-1">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{battle.question}</p>
            <div className="space-y-1.5">
              {battle.options?.map((opt, idx) => {
                const optLetter = opt[0];
                const isCorrect = optLetter === battle.answer;
                const isChosen = myAnswer === optLetter;
                let cls = "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700";
                if (myAnswer || result) {
                  if (isCorrect) cls = "bg-green-100 dark:bg-green-900 border-green-400 text-green-700 dark:text-green-300";
                  else if (isChosen) cls = "bg-red-100 dark:bg-red-900 border-red-400 text-red-600 dark:text-red-400";
                  else cls = "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 opacity-50";
                }
                return (
                  <button key={idx} disabled={!canAnswer}
                    onClick={() => canAnswer && submitBattleAnswer(battle._id, optLetter)}
                    className={`w-full text-left text-sm px-3 py-2 rounded-lg border transition-all ${cls} ${canAnswer ? "hover:bg-yellow-50 dark:hover:bg-yellow-900 cursor-pointer" : "cursor-default"}`}>
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Waiting for opponent message */}
        {battle.status === "active" && !isParticipant && (
          <p className="text-xs text-center text-gray-400 italic">Battle in progress between participants...</p>
        )}

        {/* Result */}
        {result && (
          <div className={`flex items-center gap-2 p-2.5 rounded-xl ${result.winner ? "bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800" : "bg-gray-50 dark:bg-gray-900"}`}>
            <Trophy size={18} className={result.winner ? "text-yellow-500" : "text-gray-400"} />
            <p className="text-sm font-bold">
              {result.winner
                ? `🏆 ${result.winner.username || "Someone"} wins!`
                : "😅 No winner — both got it wrong!"}
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-black text-gray-900 dark:text-white">
      {/* Sidebar */}
      <div className={`${showMobile ? "hidden md:flex" : "flex"} flex-col w-full md:w-80 border-r border-gray-200 dark:border-gray-800`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <h2 className="font-bold text-xl flex items-center gap-2"><Users size={20} /> Groups</h2>
          <button onClick={() => setShowCreate(s => !s)} className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors">
            <Plus size={18} />
          </button>
        </div>

        {showCreate && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 space-y-3 bg-gray-50 dark:bg-gray-900">
            <p className="text-sm font-semibold">New Group</p>
            <input value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="Group name..." maxLength={50}
              className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm outline-none" />
            <input value={memberSearch} onChange={e => searchUsers(e.target.value)} placeholder="Search members..."
              className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm outline-none" />
            {searchResults.length > 0 && (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden max-h-36 overflow-y-auto">
                {searchResults.map(u => (
                  <button key={u._id} onClick={() => addMember(u)} className="flex items-center gap-2 w-full hover:bg-gray-50 dark:hover:bg-gray-700 px-3 py-2">
                    <img src={u.avatar || avatarUrl(u.fullName)} className="w-7 h-7 rounded-full object-cover" />
                    <span className="text-sm">{u.username}</span>
                  </button>
                ))}
              </div>
            )}
            {selectedMembers.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selectedMembers.map(m => (
                  <span key={m._id} className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    {m.username} <button onClick={() => setSelectedMembers(prev => prev.filter(x => x._id !== m._id))}><X size={10} /></button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={createGroup} disabled={creating}
                className="flex-1 bg-blue-500 text-white py-2 rounded-xl text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-1">
                {creating ? <Loader2 size={14} className="animate-spin" /> : null} Create
              </button>
              <button onClick={() => { setShowCreate(false); setGroupName(""); setSelectedMembers([]); setMemberSearch(""); setSearchResults([]); }}
                className="flex-1 bg-gray-100 dark:bg-gray-800 py-2 rounded-xl text-sm">Cancel</button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
              <div className="text-5xl mb-3">👥</div>
              <p className="text-sm font-medium">No groups yet</p>
              <p className="text-xs mt-1 text-center">Click + to create one</p>
            </div>
          ) : groups.map(group => (
            <button key={group._id} onClick={() => openGroup(group)}
              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors ${activeGroup?._id === group._id ? "bg-gray-100 dark:bg-gray-900" : ""}`}>
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                {group.name[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="font-semibold text-sm truncate">{group.name}</p>
                <p className="text-xs text-gray-500 truncate">{group.lastMessage || `${group.members?.length} members`}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`${showMobile ? "flex" : "hidden md:flex"} flex-col flex-1 overflow-hidden`}>
        {!activeGroup ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <div className="text-6xl mb-4">👥</div>
            <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">Group Chats</p>
            <p className="text-sm mt-1">Select a group or create a new one</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <button onClick={() => setShowMobile(false)} className="md:hidden p-1"><ArrowLeft size={20} /></button>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                  {activeGroup.name[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-sm">{activeGroup.name}</p>
                  <p className="text-xs text-gray-500">{activeGroup.members?.length} members</p>
                </div>
              </div>
              <button onClick={() => setShowAI(s => !s)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${showAI ? "bg-purple-500 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"}`}>
                <Bot size={16} /> AI
              </button>
            </div>

            {/* AI Panel */}
            {showAI && (
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-purple-50 dark:bg-purple-950 space-y-3">
                <p className="text-sm font-semibold text-purple-700 dark:text-purple-300 flex items-center gap-2">
                  <Bot size={16} /> AI Tools
                </p>
                <div className="space-y-2">
  {/* File preview */}
  {aiFile && (
    <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-xl px-3 py-2 border border-purple-200 dark:border-purple-800">
      {aiFileType === "image" && aiFilePreview ? (
        <img src={aiFilePreview} className="w-10 h-10 rounded-lg object-cover" />
      ) : (
        <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900 flex items-center justify-center text-red-500 text-xs font-bold">PDF</div>
      )}
      <span className="text-xs text-gray-600 dark:text-gray-300 flex-1 truncate">{aiFile.name}</span>
      <button onClick={() => { setAiFile(null); setAiFilePreview(""); setAiFileType(""); }}
        className="text-gray-400 hover:text-red-500">
        <X size={14} />
      </button>
    </div>
  )}

  <div className="flex gap-2">
    {/* File upload button */}
    <input ref={fileInputRef} type="file" accept="image/*,.pdf" onChange={handleAIFile} className="hidden" />
    <button onClick={() => fileInputRef.current?.click()}
      className="px-3 py-2 bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-800 rounded-xl text-gray-500 hover:text-purple-500 hover:border-purple-400 transition-colors text-xs font-medium flex items-center gap-1">
      📎 File
    </button>

    <input value={aiQuestion} onChange={e => setAiQuestion(e.target.value)}
      onKeyDown={e => e.key === "Enter" && askAI()}
      placeholder={aiFile ? "Ask about this file..." : "Ask AI anything..."}
      className="flex-1 bg-white dark:bg-gray-800 rounded-xl px-3 py-2 text-sm outline-none border border-purple-200 dark:border-purple-800" />

    <button onClick={askAI} disabled={aiLoading || (!aiQuestion.trim() && !aiFile)}
      className="bg-purple-500 text-white px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50 flex items-center gap-1">
      {aiLoading ? <Loader2 size={14} className="animate-spin" /> : <Bot size={14} />} Ask
    </button>
  </div>
</div>
                <div className="flex gap-2">
                  <input value={mcqTopic} onChange={e => setMcqTopic(e.target.value)} onKeyDown={e => e.key === "Enter" && generateMCQ()}
                    placeholder="MCQ topic (e.g. Python, History)..."
                    className="flex-1 bg-white dark:bg-gray-800 rounded-xl px-3 py-2 text-sm outline-none border border-purple-200 dark:border-purple-800" />
                  <button onClick={generateMCQ} disabled={mcqLoading || !mcqTopic.trim()}
                    className="bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50 flex items-center gap-1.5">
                    {mcqLoading ? <Loader2 size={14} className="animate-spin" /> : <BookOpen size={14} />} MCQ
                  </button>
                </div>
                <div className="flex gap-2">
                  <input value={battleTopic} onChange={e => setBattleTopic(e.target.value)} onKeyDown={e => e.key === "Enter" && startBattle()}
                    placeholder="⚔️ Battle topic (e.g. Science, GK)..."
                    className="flex-1 bg-white dark:bg-gray-800 rounded-xl px-3 py-2 text-sm outline-none border border-yellow-300 dark:border-yellow-700" />
                  <button onClick={startBattle} disabled={battleLoading || !battleTopic.trim()}
                    className="bg-yellow-400 hover:bg-yellow-500 text-black px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-50 flex items-center gap-1.5 transition-colors">
                    {battleLoading ? <Loader2 size={14} className="animate-spin" /> : <Swords size={14} />} Battle
                  </button>
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {messages.length === 0 && activeBattles.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 py-10">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold mb-3">
                    {activeGroup.name[0].toUpperCase()}
                  </div>
                  <p className="font-semibold text-gray-700 dark:text-gray-300">{activeGroup.name}</p>
                  <p className="text-sm mt-1">No messages yet. Say hello! 👋</p>
                </div>
              )}

              {/* Active battles */}
              {activeBattles.map(battle => <BattleCard key={battle._id} battle={battle} />)}

              {/* Messages */}
              {messages.map((msg, i) => {
                if (msg.isAI && !msg.text) return null;
                if (msg.isAI && msg.mcq && !msg.mcq.question) return null;
                if (msg.isAI && (msg.text === "📝 MCQ: undefined" || msg.text === "📝 MCQ: ")) return null;

                const isMine = (msg.sender?._id || msg.sender) === user._id;

                if (msg.isAI) return (
                  <div key={msg._id || i} className="flex justify-start">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white flex-shrink-0 mr-2 self-end">
                      <Bot size={14} />
                    </div>
                    <div className="max-w-sm bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 rounded-2xl rounded-bl-sm p-3">
                      {msg.mcq ? (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1 uppercase tracking-wide">
                            <BookOpen size={12} /> MCQ
                          </p>
                          <p className="text-sm font-medium">{msg.mcq.question}</p>
                          <div className="space-y-1.5">
                            {msg.mcq.options.map((opt, idx) => {
                              const chosen = selectedMCQAnswer[msg._id];
                              const optLetter = opt[0];
                              let cls = "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50";
                              if (chosen) {
                                if (optLetter === msg.mcq.answer) cls = "bg-green-100 dark:bg-green-900 border-green-400 text-green-700 dark:text-green-300";
                                else if (optLetter === chosen) cls = "bg-red-100 dark:bg-red-900 border-red-400 text-red-600";
                                else cls = "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 opacity-50";
                              }
                              return (
                                <button key={idx} disabled={!!chosen}
                                  onClick={() => setSelectedMCQAnswer(prev => ({ ...prev, [msg._id]: optLetter }))}
                                  className={`w-full text-left text-sm px-3 py-2 rounded-lg border transition-all ${cls}`}>
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                          {selectedMCQAnswer[msg._id] && (
                            <p className={`text-xs font-semibold ${selectedMCQAnswer[msg._id] === msg.mcq.answer ? "text-green-600" : "text-red-500"}`}>
                              {selectedMCQAnswer[msg._id] === msg.mcq.answer ? "✅ Correct!" : `❌ Wrong! Answer: ${msg.mcq.answer}`}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div>
                          <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1 uppercase tracking-wide mb-1">
                            <Bot size={12} /> AI Answer
                          </p>
                          <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{msg.text}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );

                return (
                  <div key={msg._id || i} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                    {!isMine && (
                      <img src={msg.sender?.avatar || avatarUrl(msg.sender?.username)}
                        className="w-7 h-7 rounded-full object-cover mr-2 flex-shrink-0 self-end" />
                    )}
                    <div className="max-w-xs lg:max-w-md">
                      {!isMine && <p className="text-xs text-gray-500 mb-1 ml-1">{msg.sender?.username}</p>}
                      <div className={`px-4 py-2.5 rounded-2xl text-sm ${isMine ? "bg-blue-500 text-white rounded-br-sm" : "bg-gray-100 dark:bg-gray-800 rounded-bl-sm"}`}>
                        {msg.text}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form onSubmit={sendMessage} className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 flex items-center gap-3">
              <input value={text} onChange={e => setText(e.target.value)}
                placeholder={`Message ${activeGroup.name}...`} maxLength={1000}
                className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400" />
              <button type="submit" disabled={!text.trim()}
                className="w-9 h-9 bg-blue-500 text-white rounded-full flex items-center justify-center disabled:opacity-40 hover:bg-blue-600 transition-colors flex-shrink-0">
                <Send size={16} />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
