import { Link } from "react-router-dom";
import FollowButton from "./FollowButton";

export default function SuggestedUsers({ users }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-gray-500">Suggested for you</p>
        <button className="text-xs font-semibold hover:text-gray-500">See all</button>
      </div>
      <div className="space-y-3">
        {users.slice(0, 5).map((u) => (
          <div key={u._id} className="flex items-center gap-3">
            <Link to={`/profile/${u.username}`}>
              <img
                src={u.avatar || `https://ui-avatars.com/api/?name=${u.fullName}&background=random`}
                alt={u.username}
                className="w-9 h-9 rounded-full object-cover"
              />
            </Link>
            <div className="flex-1 min-w-0">
              <Link to={`/profile/${u.username}`} className="text-sm font-semibold hover:underline truncate block">
                {u.username}
              </Link>
              <p className="text-xs text-gray-500">{u.followers?.length || 0} followers</p>
            </div>
            <FollowButton userId={u._id} size="sm" />
          </div>
        ))}
      </div>
    </div>
  );
}
