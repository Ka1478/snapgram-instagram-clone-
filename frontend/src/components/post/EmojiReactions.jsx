import { useState, useRef } from "react";
import { Heart } from "lucide-react";
import api from "../../utils/api";

const EMOJIS = ["❤️", "😂", "😮", "😢", "😡", "👏"];

export default function EmojiReactions({ postId, initialLiked, onLikeToggle }) {
  const [showPicker, setShowPicker] = useState(false);
  const [userReaction, setUserReaction] = useState(null);
  const holdTimer = useRef(null);
  const isHolding = useRef(false);

  const startHold = () => {
    isHolding.current = false;
    holdTimer.current = setTimeout(() => {
      isHolding.current = true;
      setShowPicker(true);
    }, 600);
  };

  const endHold = () => {
    clearTimeout(holdTimer.current);
    if (!isHolding.current) {
      onLikeToggle();
    }
  };

  const handleReact = async (emoji) => {
    setShowPicker(false);
    isHolding.current = false;
    setUserReaction(emoji);
    try {
      await api.post(`/hashtags/posts/${postId}/react`, { emoji });
    } catch {}
  };

  return (
    <div className="relative">
      {showPicker && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowPicker(false)}
          />
          <div className="absolute bottom-10 left-0 bg-white dark:bg-neutral-800 rounded-full shadow-2xl border border-gray-200 dark:border-gray-700 flex gap-2 px-4 py-2 z-20 animate-scale-in">
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleReact(emoji)}
                className="text-2xl hover:scale-125 transition-transform p-1"
              >
                {emoji}
              </button>
            ))}
          </div>
        </>
      )}

      <button
        onMouseDown={startHold}
        onMouseUp={endHold}
        onMouseLeave={() => clearTimeout(holdTimer.current)}
        onTouchStart={startHold}
        onTouchEnd={endHold}
        className="transition-transform active:scale-90 select-none"
      >
        {userReaction ? (
          <span className="text-2xl">{userReaction}</span>
        ) : (
          <Heart
            size={24}
            className={initialLiked ? "fill-red-500 text-red-500" : "text-gray-700 dark:text-gray-300"}
          />
        )}
      </button>

      {showPicker && (
        <p className="text-xs text-gray-400 mt-1">Pick a reaction</p>
      )}
    </div>
  );
}
