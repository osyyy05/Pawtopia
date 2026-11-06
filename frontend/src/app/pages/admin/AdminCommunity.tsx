
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  MessageCircle,
  Heart,
  Search,
  Trash2,
  RefreshCw,
  Users,
  FileText,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

const API = "http://127.0.0.1:8000/api/community";

interface CommunityComment {
  id: string;
  userId: string;
  username: string;
  userAvatar: string;
  content: string;
  timestamp: string;
}

interface CommunityPost {
  id: string;
  userId: string;
  username: string;
  userAvatar: string;
  content: string;
  image: string;
  category: string;
  likes: number;
  likedByCurrentUser: boolean;
  comments: CommunityComment[];
  timestamp: string;
}

async function requestAPI(
  path: string,
  options: RequestInit = {}
) {
  const token = sessionStorage.getItem("access_token");

  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      ...(token
        ? { Authorization: `Bearer ${token}` }
        : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(
      data.detail ||
      data.error ||
      `Request failed (${response.status})`
    );
  }

  if (response.status === 204) return null;
  return response.json();
}

const formatDate = (value: string) => {
  if (!value) return "-";
  const date = new Date(value);
  return isNaN(date.getTime())
    ? "-"
    : date.toLocaleString();
};

export default function AdminCommunity() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [expandedPosts, setExpandedPosts] = useState<string[]>([]);

  const loadPosts = useCallback(async () => {
    setLoading(true);

    try {
      const data = await requestAPI("/");

      setPosts(
        Array.isArray(data)
          ? data
          : Array.isArray(data.results)
          ? data.results
          : []
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load community posts"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const keyword = search.toLowerCase().trim();

      const matchesSearch =
        post.content.toLowerCase().includes(keyword) ||
        post.username.toLowerCase().includes(keyword) ||
        post.comments.some(
          (comment) =>
            comment.content.toLowerCase().includes(keyword) ||
            comment.username.toLowerCase().includes(keyword)
        );

      const matchesCategory =
        category === "all" || post.category === category;

      return matchesSearch && matchesCategory;
    });
  }, [posts, search, category]);

  const totalComments = posts.reduce(
    (sum, post) => sum + post.comments.length,
    0
  );

  const totalLikes = posts.reduce(
    (sum, post) => sum + post.likes,
    0
  );

  const uniqueUsers = new Set(
    posts.map((post) => post.userId)
  ).size;

  const toggleComments = (postId: string) => {
    setExpandedPosts((current) =>
      current.includes(postId)
        ? current.filter((id) => id !== postId)
        : [...current, postId]
    );
  };

  const deletePost = async (post: CommunityPost) => {
    const confirmed = window.confirm(
      `Delete the post by ${post.username}?\n\n` +
      "This will also delete its comments and likes."
    );

    if (!confirmed) return;

    setDeleting(true);

    try {
      await requestAPI(`/admin/posts/${post.id}/`, {
        method: "DELETE",
      });

      toast.success("Post deleted successfully");
      await loadPosts();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete post"
      );
    } finally {
      setDeleting(false);
    }
  };

  const deleteComment = async (
    comment: CommunityComment
  ) => {
    const confirmed = window.confirm(
      `Delete comment by ${comment.username}?`
    );

    if (!confirmed) return;

    setDeleting(true);

    try {
      await requestAPI(
        `/admin/comments/${comment.id}/`,
        { method: "DELETE" }
      );

      toast.success("Comment deleted successfully");
      await loadPosts();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete comment"
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 text-white">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">
              Community Management
            </h1>
            <p className="text-gray-300 mt-2">
              Monitor community posts and moderate comments.
            </p>
          </div>

          <button
            onClick={() => void loadPosts()}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-white/20 px-4 py-2 hover:bg-white/10 disabled:opacity-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Total Posts",
              value: posts.length,
              icon: FileText,
            },
            {
              label: "Total Comments",
              value: totalComments,
              icon: MessageCircle,
            },
            {
              label: "Total Likes",
              value: totalLikes,
              icon: Heart,
            },
            {
              label: "Post Authors",
              value: uniqueUsers,
              icon: Users,
            },
          ].map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.label}
                className="rounded-xl border border-white/10 bg-white/5 p-5"
              >
                <div className="flex items-center justify-between">
                  <p className="text-gray-300 text-sm">
                    {stat.label}
                  </p>
                  <Icon
                    size={20}
                    className="text-purple-300"
                  />
                </div>

                <p className="text-3xl font-bold mt-3">
                  {stat.value}
                </p>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex flex-col md:flex-row gap-4">

            <div className="flex items-center gap-3 bg-black/20 border border-white/10 rounded-lg px-4 flex-1">
              <Search
                size={18}
                className="text-gray-400"
              />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search posts, users or comments..."
                className="w-full py-3 bg-transparent outline-none text-white placeholder:text-gray-400"
              />
            </div>

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-gray-800 border border-white/10 rounded-lg px-4 py-3 text-white"
            >
              <option value="all">All Categories</option>
              <option value="general">General</option>
              <option value="adoption">Adoption</option>
              <option value="training">Training</option>
              <option value="community">Community</option>
            </select>

          </div>
        </div>

        {/* Post List */}
        {loading ? (
          <div className="text-center py-16 text-gray-400">
            Loading community posts...
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-16 rounded-xl border border-white/10 bg-white/5">
            <ShieldCheck
              size={40}
              className="mx-auto mb-3 text-gray-400"
            />
            <p className="text-gray-300">
              No community posts found.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {filteredPosts.map((post) => {
              const isExpanded =
                expandedPosts.includes(post.id);

              return (
                <div
                  key={post.id}
                  className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-4"
                >
                  {/* Author */}
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {post.userAvatar ? (
                        <img
                          src={post.userAvatar}
                          alt=""
                          className="w-11 h-11 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-purple-500/20 flex items-center justify-center">
                          <Users size={20} />
                        </div>
                      )}

                      <div>
                        <p className="font-semibold">
                          {post.username}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatDate(post.timestamp)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs rounded-full bg-purple-500/20 text-purple-200 px-3 py-1 capitalize">
                        {post.category}
                      </span>

                      <button
                        disabled={deleting}
                        onClick={() => void deletePost(post)}
                        className="flex items-center gap-2 text-red-400 hover:text-red-300 disabled:opacity-50"
                      >
                        <Trash2 size={16} />
                        <span className="text-sm">
                          Delete Post
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <p className="whitespace-pre-wrap break-words text-gray-200">
                    {post.content}
                  </p>

                  {post.image && (
                    <img
                      src={post.image}
                      alt="Community post"
                      className="max-h-80 max-w-full rounded-lg object-contain"
                    />
                  )}

                  {/* Likes & Comments */}
                  <div className="flex flex-wrap items-center gap-5 border-t border-white/10 pt-4 text-sm text-gray-300">
                    <div className="flex items-center gap-2">
                      <Heart size={17} />
                      {post.likes} Likes
                    </div>

                    <button
                      onClick={() => toggleComments(post.id)}
                      className="flex items-center gap-2 hover:text-white"
                    >
                      <MessageCircle size={17} />
                      {post.comments.length} Comments
                      <span className="text-purple-300">
                        {isExpanded ? "Hide" : "View"}
                      </span>
                    </button>
                  </div>

                  {/* Comments */}
                  {isExpanded && (
                    <div className="space-y-3 border-t border-white/10 pt-4">
                      <h3 className="font-semibold">
                        Comments
                      </h3>

                      {post.comments.length === 0 ? (
                        <p className="text-gray-400 text-sm">
                          No comments yet.
                        </p>
                      ) : (
                        post.comments.map((comment) => (
                          <div
                            key={comment.id}
                            className="flex items-start justify-between gap-3 bg-black/20 rounded-lg p-4"
                          >
                            <div className="min-w-0">
                              <p className="font-medium text-sm">
                                {comment.username}
                              </p>

                              <p className="text-xs text-gray-400 mt-1">
                                {formatDate(comment.timestamp)}
                              </p>

                              <p className="text-gray-200 mt-2 whitespace-pre-wrap break-words">
                                {comment.content}
                              </p>
                            </div>

                            <button
                              disabled={deleting}
                              onClick={() =>
                                void deleteComment(comment)
                              }
                              aria-label="Delete comment"
                              className="text-red-400 hover:text-red-300 disabled:opacity-50 shrink-0"
                            >
                              <Trash2 size={17} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
