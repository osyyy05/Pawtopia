
import { useEffect, useState } from 'react';

import {
  Card,
  CardContent,
  CardHeader,
} from '../../components/ui/card';

import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '../../components/ui/avatar';

import { Badge } from '../../components/ui/badge';
import { useAuth } from '../../context/AuthContext';

import {
  Heart,
  MessageCircle,
  Share2,
  PlusCircle,
  Copy,
  Users,
  Sparkles,
  Send,
  ImagePlus,
  MoreHorizontal,
  Pencil,
  Trash2,
} from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog';

import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { toast } from 'sonner';

export default function Community() {
  const { user } = useAuth();

  const [posts, setPosts] = useState<any[]>([]);

  const [newPost, setNewPost] = useState({
    content: '',
    category: 'general',
  });

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);

  const [commentInputs, setCommentInputs] = useState<{
    [key: string]: string;
  }>({});

  const [likedPosts, setLikedPosts] = useState<string[]>([]);

  const [sharePostId, setSharePostId] =
    useState<string | null>(null);

  const [editingPost, setEditingPost] = useState<any | null>(null);

  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState('general');

  const [editImage, setEditImage] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);

  const [removeExistingImage, setRemoveExistingImage] = useState(false);

  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const [postMenuId, setPostMenuId] = useState<string | null>(null);

  // =========================================================
  // LOAD POSTS
  // =========================================================

  const fetchPosts = async () => {
    try {
      const token =
        sessionStorage.getItem('access_token');

      const response = await fetch(
        'http://127.0.0.1:8000/api/community/',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load posts');
      }

      const data = await response.json();
      setPosts(data);
      setLikedPosts(
        data
          .filter(
            (post: any) => post.likedByCurrentUser
          )
          .map((post: any) => String(post.id))
      );
    } catch (error) {
      console.error(
        'Error loading community posts:',
        error
      );
      toast.error('Unable to load community posts');
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];

  if (!file) return;

  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    toast.error('Only JPG, PNG and WebP images are allowed.');
    e.target.value = '';
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    toast.error('Image must be smaller than 10MB.');
    e.target.value = '';
    return;
  }

  if (imagePreview) URL.revokeObjectURL(imagePreview);

  setSelectedImage(file);
  setImagePreview(URL.createObjectURL(file));
};

const removeSelectedImage = () => {
  if (imagePreview) URL.revokeObjectURL(imagePreview);
  setSelectedImage(null);
  setImagePreview(null);
};

  // =========================================================
  // CREATE POST
  // =========================================================

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPost.content.trim()) {
      toast.error('Please enter some content.');
      return;
    }

    if (isCreating) return;
    setIsCreating(true);

    try {
      const token = sessionStorage.getItem('access_token');

      const formData = new FormData();
      formData.append('content', newPost.content.trim());
      formData.append('category', newPost.category);

      if (selectedImage) {
        formData.append('image', selectedImage);
      }

      const response = await fetch(
        'http://127.0.0.1:8000/api/community/create/',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create post');
      }

      setNewPost({
        content: '',
        category: 'general',
      });

      removeSelectedImage();
      setDialogOpen(false);

      await fetchPosts();

      toast.success('Post created successfully!');
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error(
        error instanceof Error ? error.message : 'Unable to create post.'
      );
    } finally {
      setIsCreating(false);
    }
  };

  // =========================================================
  // LIKE
  // =========================================================

  const handleLike = async (postId: string) => {
    try {
      const token =
        sessionStorage.getItem('access_token');

      const response = await fetch(
        `http://127.0.0.1:8000/api/community/${postId}/like/`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to like post');
      }

      const data = await response.json();
      setPosts(
        posts.map((post) =>
          String(post.id) === String(postId)
            ? {
                ...post,
                likes: data.likes,
                likedByCurrentUser: data.liked,
              }
            : post
        )
      );

      if (data.liked) {
        setLikedPosts([
          ...likedPosts,
          String(postId),
        ]);

        toast.success('Post liked!');
      } else {
        setLikedPosts(
          likedPosts.filter(
            (id) => String(id) !== String(postId)
          )
        );

        toast.success('Post unliked!');
      }
    } catch (error) {
      console.error('Error liking post:', error);
      toast.error('Unable to update like.');
    }
  };

  // =========================================================
  // SHARE
  // =========================================================

  const handleShare = async (
    platform: string,
    postId: string
  ) => {
    const shareUrl =
      `${window.location.origin}/user/community#post-${postId}`;

    const post = posts.find(
      (item) => String(item.id) === String(postId)
    );

    const shareText = post?.content
      ? `Check out this Pawtopia Community post: ${post.content}`
      : 'Check out this Pawtopia Community post!';

    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedText = encodeURIComponent(shareText);

    try {
      switch (platform) {
        case 'instagram':
          await navigator.clipboard.writeText(
            `${shareText}\n${shareUrl}`
          );
          window.open(
            'https://www.instagram.com/',
            '_blank',
            'noopener,noreferrer'
          );

          toast.success(
            'Post link copied. Instagram opened!'
          );
          break;

        case 'whatsapp':
          window.open(
            `https://wa.me/?text=${encodedText}%0A${encodedUrl}`,
            '_blank',
            'noopener,noreferrer'
          );
          break;

        case 'facebook':
          window.open(
            `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
            '_blank',
            'noopener,noreferrer,width=700,height=600'
          );
          break;

        case 'x':
          window.open(
            `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
            '_blank',
            'noopener,noreferrer,width=700,height=600'
          );
          break;

        case 'copy':
          await navigator.clipboard.writeText(shareUrl);
          toast.success('Post link copied!');
          break;

        default:
          break;
      }
    } catch (error) {
      console.error('Share error:', error);
      toast.error('Unable to share post');
    } finally {
      setSharePostId(null);
    }
  };

  // =========================================================
  // COMMENT
  // =========================================================

  const handleComment = async (postId: string) => {
    const commentText = commentInputs[postId];

    if (!commentText?.trim()) {
      return;
    }

    try {
      const token =
        sessionStorage.getItem('access_token');

      const response = await fetch(
        `http://127.0.0.1:8000/api/community/${postId}/comment/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            content: commentText,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to add comment');
      }

      const newComment = await response.json();

      setPosts(
        posts.map((post) =>
          String(post.id) === String(postId)
            ? {
                ...post,
                comments: [
                  ...post.comments,
                  newComment,
                ],
              }
            : post
        )
      );

      setCommentInputs({
        ...commentInputs,
        [postId]: '',
      });

      toast.success('Comment added!');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Unable to add comment.');
    }
  };

  
const handleOpenEdit = (post: any) => {
  setEditingPost(post);
  setEditContent(post.content);
  setEditCategory(post.category || 'general');
  setEditImage(null);
  setEditImagePreview(post.image || null);
  setRemoveExistingImage(false);
  setPostMenuId(null);
};


const handleEditImageChange = (
  e: React.ChangeEvent<HTMLInputElement>
) => {
  const file = e.target.files?.[0];

  if (!file) return;

  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    toast.error('Only JPG, PNG and WebP images are allowed.');
    e.target.value = '';
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    toast.error('Image must be smaller than 10MB.');
    e.target.value = '';
    return;
  }

  if (editImage && editImagePreview?.startsWith('blob:')) {
    URL.revokeObjectURL(editImagePreview);
  }

  setEditImage(file);
  setEditImagePreview(URL.createObjectURL(file));
  setRemoveExistingImage(false);
};

const handleRemoveEditImage = () => {
  if (editImage && editImagePreview?.startsWith('blob:')) {
    URL.revokeObjectURL(editImagePreview);
  }

  setEditImage(null);
  setEditImagePreview(null);
  setRemoveExistingImage(true);
};


const handleUpdatePost = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!editingPost || isUpdating) return;

  if (!editContent.trim()) {
    toast.error('Post content cannot be empty.');
    return;
  }

  setIsUpdating(true);

  try {
    const token = sessionStorage.getItem('access_token');

    const formData = new FormData();
    formData.append('content', editContent.trim());
    formData.append('category', editCategory);

    if (editImage) {
      formData.append('image', editImage);
    }

    if (removeExistingImage) {
      formData.append('remove_image', 'true');
    }

    const response = await fetch(
      `http://127.0.0.1:8000/api/community/${editingPost.id}/edit/`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to update post');
    }

    setEditingPost(null);
    setEditImage(null);
    setEditImagePreview(null);

    await fetchPosts();

    toast.success('Post updated successfully!');
  } catch (error) {
    console.error('Error updating post:', error);
    toast.error(
      error instanceof Error ? error.message : 'Unable to update post.'
    );
  } finally {
    setIsUpdating(false);
  }
};


const handleDeletePost = async (postId: string) => {
  const confirmed = window.confirm(
    'Are you sure you want to delete this post? This action cannot be undone.'
  );

  if (!confirmed || isDeleting) return;

  setIsDeleting(postId);

  try {
    const token = sessionStorage.getItem('access_token');

    const response = await fetch(
      `http://127.0.0.1:8000/api/community/${postId}/delete/`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to delete post');
    }

    setPostMenuId(null);
    await fetchPosts();

    toast.success('Post deleted successfully!');
  } catch (error) {
    console.error('Error deleting post:', error);
    toast.error(
      error instanceof Error ? error.message : 'Unable to delete post.'
    );
  } finally {
    setIsDeleting(null);
  }
};


  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div className="min-h-screen text-white">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <section className="relative overflow-hidden border-b border-white/10 bg-gradient-to-r from-purple-900/30 via-[#111827]/70 to-cyan-900/20 py-12">

        <div className="pointer-events-none absolute -top-24 right-0 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl" />

        <div className="pointer-events-none absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          {/* Header Badge */}
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-4 py-2 text-sm font-medium text-purple-300">
            <Users className="h-4 w-4" />
            Pawtopia Community
          </div>

          {/* Main Title */}
          <h1 className="mb-3 pb-2 text-4xl font-bold leading-[1.3] tracking-tight md:text-5xl">
            <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Community
            </span>
          </h1>

          <p className="mb-7 max-w-2xl text-base leading-relaxed text-gray-300 md:text-lg">
            Connect with fellow animal lovers and share your experiences.
          </p>

          {/* Create Post Dialog */}
          <Dialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
          >
            <DialogTrigger asChild>
              <Button className="h-11 rounded-xl border-0 bg-gradient-to-r from-purple-600 to-cyan-600 px-6 font-semibold text-white shadow-lg shadow-purple-950/20 transition-all hover:from-purple-500 hover:to-cyan-500">
                <PlusCircle className="mr-2 h-5 w-5" />
                Create Post
              </Button>
            </DialogTrigger>

            <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#111827] text-white shadow-2xl">

              <DialogHeader>
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-purple-500/20 bg-purple-500/10">
                  <PlusCircle className="h-6 w-6 text-purple-400" />
                </div>

                <DialogTitle className="text-2xl font-bold text-white">
                  Create New Post
                </DialogTitle>

                <DialogDescription className="text-sm leading-relaxed text-gray-400">
                  Share your thoughts, experiences, or ask questions.
                </DialogDescription>
              </DialogHeader>

              <form
                onSubmit={handleCreatePost}
                className="mt-4 space-y-5"
              >

                {/* Content */}
                <div className="space-y-2">
                  <Label
                    htmlFor="content"
                    className="text-sm font-medium text-gray-200"
                  >
                    What's on your mind?
                  </Label>

                  <Textarea
                    id="content"
                    required
                    value={newPost.content}
                    onChange={(e) =>
                      setNewPost({
                        ...newPost,
                        content: e.target.value,
                      })
                    }
                    className="min-h-36 resize-y rounded-xl border-white/10 bg-white/5 text-white placeholder:text-gray-500 focus-visible:border-purple-500/50 focus-visible:ring-purple-500/20"
                    placeholder="Share your story..."
                  />
                </div>

                {/* Category Selection */}
<div className="space-y-2">
  <Label className="text-sm font-medium text-gray-200">
    Post Category
  </Label>

  <select
    value={newPost.category}
    onChange={(e) =>
      setNewPost({
        ...newPost,
        category: e.target.value,
      })
    }
    className="h-11 w-full rounded-xl border border-white/10 bg-[#1f2937] px-4 text-white outline-none focus:border-purple-500/50"
  >
    <option value="general">General</option>
    <option value="adoption">Adoption</option>
    <option value="training">Training</option>
    <option value="community">Community</option>
  </select>
</div>

                {/* Image Upload */}
                <div className="space-y-2">
                  <Label
                    htmlFor="post-image"
                    className="flex items-center gap-2 text-sm font-medium text-gray-200"
                  >
                    <ImagePlus className="h-4 w-4 text-cyan-400" />
                    Add Image (optional)
                  </Label>

                  <Input
                    id="post-image"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageChange}
                    className="h-11 rounded-xl border-white/10 bg-white/5 text-white file:mr-3 file:rounded-lg file:border-0 file:bg-purple-500/20 file:px-3 file:py-1 file:text-purple-200"
                  />

                  <p className="text-xs text-gray-400">
                    Supported formats: JPG, PNG, WebP. Maximum 10MB.
                  </p>
                </div>

                {/* Image Preview */}
                {imagePreview && (
                  <div className="space-y-3 overflow-hidden rounded-xl border border-white/10 bg-white/5 p-3">
                    <img
                      src={imagePreview}
                      alt="New post preview"
                      className="max-h-56 w-full rounded-lg object-contain"
                    />

                    <Button
                      type="button"
                      variant="outline"
                      onClick={removeSelectedImage}
                      className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                    >
                      Remove Image
                    </Button>
                  </div>
                )}
                
                {/* Submit */}
                <Button
                  type="submit"
                  disabled={isCreating}
                  className="h-11 w-full rounded-xl border-0 bg-gradient-to-r from-purple-600 to-cyan-600 font-semibold text-white hover:from-purple-500 hover:to-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send className="mr-2 h-4 w-4" />
                  {isCreating ? 'Posting...' : 'Post'}
                </Button>
              </form>

            </DialogContent>
          </Dialog>

        </div>
      </section>

      {/* =====================================================
          COMMUNITY POSTS
      ===================================================== */}

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">

        {/* Section Heading */}
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-purple-400">
              <Sparkles className="h-4 w-4" />
              Connect & Share
            </div>

            <h2 className="text-2xl font-bold text-white md:text-3xl">
              Community Feed
            </h2>

            <p className="mt-2 text-sm text-gray-400">
              Discover stories and conversations from the Pawtopia community.
            </p>
          </div>

          {/* Post Counter */}
          <div className="self-start rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-300">
            {posts.length}{' '}
            {posts.length === 1 ? 'Post' : 'Posts'}
          </div>

        </div>

        {/* Empty State */}
        {posts.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-[#111827]/80 px-6 py-16 text-center shadow-xl">

            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-purple-500/20 bg-purple-500/10">
              <MessageCircle className="h-8 w-8 text-purple-400" />
            </div>

            <h3 className="mb-2 text-xl font-bold text-white">
              No community posts yet
            </h3>

            <p className="mx-auto max-w-md text-sm leading-relaxed text-gray-400">
              Be the first to share a story or start a conversation with fellow animal lovers.
            </p>

            <Button
              onClick={() => setDialogOpen(true)}
              className="mt-6 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 px-6 text-white hover:from-purple-500 hover:to-cyan-500"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Create First Post
            </Button>

          </div>
        )}

        {/* Posts */}
        <div className="space-y-6">

          {posts.map((post) => {
            const postId = String(post.id);
            const isOwner =
              user?.id != null &&
              post.userId != null &&
              String(user.id) === String(post.userId);

            const isLiked =
              likedPosts.includes(postId);

            const comments = post.comments || [];

            return (
              <Card
                key={post.id}
                id={`post-${post.id}`}
                className="group scroll-mt-24 overflow-visible rounded-2xl border border-white/10 bg-[#111827]/85 shadow-xl shadow-black/10 backdrop-blur-xl transition-all duration-300 hover:border-purple-500/25"
              >

                {/* ============================================
                    POST HEADER
                ============================================ */}

                <CardHeader className="pb-4">

                  <div className="flex items-start gap-4">

                    {/* User Avatar */}
                    <Avatar className="h-12 w-12 shrink-0 border-2 border-purple-500/20">
                      <AvatarImage
                        src={post.userAvatar}
                      />

                      <AvatarFallback className="bg-gradient-to-br from-purple-600/30 to-cyan-600/20 font-semibold text-purple-200">
                        {post.username?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>

                    {/* User Info */}
                    <div className="min-w-0 flex-1">

                      <div className="flex flex-wrap items-center gap-2">

                        <h3 className="break-words text-base font-semibold text-white">
                          {post.username}
                        </h3>

                        <Badge
                          variant="outline"
                          className="rounded-full border-purple-500/25 bg-purple-500/10 px-2.5 py-0.5 text-xs font-medium text-purple-300"
                        >
                          {post.category}
                        </Badge>

                      </div>

                      <p className="mt-1 text-xs text-gray-400 sm:text-sm">
                        {new Date(
                          post.timestamp
                        ).toLocaleDateString(
                          'en-US',
                          {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          }
                        )}
                      </p>
                    </div>
                                        
                    {/* Edit / Delete Menu - Post Owner Only */}
                    {isOwner && (
                      <div className="relative ml-auto shrink-0">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            setPostMenuId(
                              postMenuId === postId ? null : postId
                            )
                          }
                          className="h-9 w-9 rounded-xl text-gray-400 hover:bg-white/10 hover:text-white"
                        >
                          <MoreHorizontal className="h-5 w-5" />
                        </Button>

                        {postMenuId === postId && (
                          <div className="absolute right-0 top-full z-50 mt-2 w-44 rounded-xl border border-white/10 bg-[#1f2937] p-2 shadow-2xl">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(post)}
                              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-white hover:bg-white/10"
                            >
                              <Pencil className="h-4 w-4 text-cyan-400" />
                              Edit Post
                            </button>

                            <button
                              type="button"
                              disabled={isDeleting === postId}
                              onClick={() => handleDeletePost(postId)}
                              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                            >
                              <Trash2 className="h-4 w-4" />
                              {isDeleting === postId ? 'Deleting...' : 'Delete Post'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardHeader>

                {/* ============================================
                    POST CONTENT
                ============================================ */}

                <CardContent className="space-y-5 pt-0">

                  {/* Post Text */}
                  <p className="whitespace-pre-wrap break-words text-sm leading-7 text-gray-200 sm:text-base">
                    {post.content}
                  </p>

                  {/* Post Image */}
                  {post.image && (
                    <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0b1120]">
                      <img
                        src={post.image}
                        alt="Community post"
                        className="max-h-[480px] w-full object-contain"
                      />
                    </div>
                  )}

                  {/* ============================================
                      ACTION BUTTONS
                  ============================================ */}

                  <div className="flex flex-wrap items-center gap-2 border-t border-white/10 pt-4 sm:gap-4">
                    {/* Like */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        handleLike(postId)
                      }
                      className={`h-10 rounded-xl px-3 transition-all ${
                        isLiked
                          ? 'bg-pink-500/10 text-pink-400 hover:bg-pink-500/15 hover:text-pink-300'
                          : 'text-gray-400 hover:bg-pink-500/10 hover:text-pink-400'
                      }`}
                    >
                      <Heart
                        className="mr-2 h-5 w-5"
                        fill={
                          isLiked
                            ? 'currentColor'
                            : 'none'
                        }
                      />

                      {post.likes}
                    </Button>

                    {/* Comment Count */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-10 rounded-xl px-3 text-gray-400 hover:bg-cyan-500/10 hover:text-cyan-400"
                    >
                      <MessageCircle className="mr-2 h-5 w-5" />
                      {comments.length}
                    </Button>

                    {/* ========================================
                        SHARE
                    ======================================== */}

                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setSharePostId(
                            sharePostId === postId
                              ? null
                              : postId
                          )
                        }
                        className={`h-10 rounded-xl px-3 transition-all ${
                          sharePostId === postId
                            ? 'bg-purple-500/10 text-purple-300'
                            : 'text-gray-400 hover:bg-purple-500/10 hover:text-purple-400'
                        }`}
                      >
                        <Share2 className="mr-2 h-5 w-5" />
                        Share
                      </Button>

                      {/* Share Menu */}
                      {sharePostId === postId && (
                        <div className="absolute left-0 top-full z-[9999] mt-2 max-h-80 w-60 overflow-y-auto rounded-2xl border border-white/10 bg-[#0d1424] p-2 shadow-2xl shadow-black/50 sm:w-64">
                          <div className="px-3 pb-3 pt-2">
                            <p className="text-sm font-semibold text-white">
                              Share this post
                            </p>
                            <p className="mt-1 text-xs text-gray-400">
                              Choose a platform
                            </p>
                          </div>

                          {/* Copy Link */}
                          <button
                            type="button"
                            onClick={() =>
                              handleShare(
                                'copy',
                                postId
                              )
                            }
                            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-white transition hover:bg-white/10"
                          >
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10">
                              <Copy className="h-4 w-4 text-gray-200" />
                            </span>
                            Copy link
                          </button>

                          <div className="my-2 border-t border-white/10" />

                          {/* Instagram */}
                          <button
                            type="button"
                            onClick={() =>
                              handleShare(
                                'instagram',
                                postId
                              )
                            }
                            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-white transition hover:bg-white/10"
                          >
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#833AB4] via-[#E1306C] to-[#F77737] text-base font-bold text-white">
                              ◎
                            </span>
                            Instagram
                          </button>

                          {/* WhatsApp */}
                          <button
                            type="button"
                            onClick={() =>
                              handleShare(
                                'whatsapp',
                                postId
                              )
                            }
                            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-white transition hover:bg-white/10"
                          >
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#25D366] text-base font-bold text-white">
                              W
                            </span>
                            WhatsApp
                          </button>

                          {/* Facebook */}
                          <button
                            type="button"
                            onClick={() =>
                              handleShare(
                                'facebook',
                                postId
                              )
                            }
                            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-white transition hover:bg-white/10"
                          >
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#1877F2] text-lg font-bold text-white">
                              f
                            </span>
                            Facebook
                          </button>

                          {/* X */}
                          <button
                            type="button"
                            onClick={() =>
                              handleShare(
                                'x',
                                postId
                              )
                            }
                            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-white transition hover:bg-white/10"
                          >
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-black text-base font-semibold text-white">
                              𝕏
                            </span>
                            X (Twitter)
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ============================================
                      COMMENTS
                  ============================================ */}

                  {comments.length > 0 && (
                    <div className="space-y-4 border-t border-white/10 pt-5">
                      <div className="flex items-center gap-2">
                        <MessageCircle className="h-4 w-4 text-cyan-400" />
                        <h4 className="text-sm font-semibold text-white">
                          Comments ({comments.length})
                        </h4>
                      </div>
                      {comments.map((comment: any) => (
                        <div
                          key={comment.id}
                          className="flex items-start gap-3"
                        >

                          {/* Comment Avatar */}
                          <Avatar className="h-9 w-9 shrink-0 border border-white/10">
                            <AvatarImage
                              src={comment.userAvatar}
                            />
                            <AvatarFallback className="bg-purple-500/10 text-xs font-semibold text-purple-300">
                              {comment.username?.[0] || 'U'}
                            </AvatarFallback>
                          </Avatar>

                          {/* Comment Bubble */}
                          <div className="min-w-0 flex-1 rounded-xl border border-white/5 bg-white/[0.04] p-3.5">
                            <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                              <span className="text-sm font-semibold text-white">
                                {comment.username}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(
                                  comment.timestamp
                                ).toLocaleDateString(
                                  'en-US',
                                  {
                                    month: 'short',
                                    day: 'numeric',
                                  }
                                )}
                              </span>
                            </div>
                            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-300">
                              {comment.content}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ============================================
                      ADD COMMENT
                  ============================================ */}

                  <div className="flex items-start gap-3 border-t border-white/10 pt-5">

                    {/* Current User Avatar */}
                    <Avatar className="h-9 w-9 shrink-0 border border-purple-500/20">
                      <AvatarImage
                        src={user?.profilePicture}
                      />

                      <AvatarFallback className="bg-purple-500/10 text-xs font-semibold text-purple-300">
                        {user?.username?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>

                    {/* Comment Input */}
                    <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row">

                      <Input
                        placeholder="Write a comment..."
                        value={
                          commentInputs[post.id] || ''
                        }
                        onChange={(e) =>
                          setCommentInputs({
                            ...commentInputs,
                            [post.id]: e.target.value,
                          })
                        }
                        className="h-10 min-w-0 flex-1 rounded-xl border-white/10 bg-white/5 text-white placeholder:text-gray-500 focus-visible:border-purple-500/50 focus-visible:ring-purple-500/20"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleComment(postId);
                          }
                        }}
                      />

                      <Button
                        type="button"
                        onClick={() =>
                          handleComment(postId)
                        }
                        size="sm"
                        className="h-10 shrink-0 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 px-5 font-semibold text-white hover:from-purple-500 hover:to-cyan-500"
                      >
                        <Send className="mr-2 h-4 w-4" />
                        Post
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Edit Post Dialog */}
      <Dialog
        open={!!editingPost}
        onOpenChange={(open) => {
          if (!open && !isUpdating) {
            if (editImagePreview?.startsWith('blob:')) {
              URL.revokeObjectURL(editImagePreview);
            }
            setEditingPost(null);
            setEditImage(null);
            setEditImagePreview(null);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#111827] text-white shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white">
              Edit Post
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Update your community post.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdatePost} className="mt-4 space-y-5">
            {/* Content */}
            <div className="space-y-2">
              <Label className="text-gray-200">Post Content</Label>
              <Textarea
                required
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-36 resize-y rounded-xl border-white/10 bg-white/5 text-white"
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label className="text-gray-200">Post Category</Label>
              <select
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                className="h-11 w-full rounded-xl border border-white/10 bg-[#1f2937] px-4 text-white outline-none focus:border-purple-500/50"
              >
                <option value="general">General</option>
                <option value="adoption">Adoption</option>
                <option value="training">Training</option>
                <option value="community">Community</option>
              </select>
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-gray-200">
                <ImagePlus className="h-4 w-4 text-cyan-400" />
                Change Image (optional)
              </Label>

              <Input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleEditImageChange}
                className="h-11 rounded-xl border-white/10 bg-white/5 text-white"
              />

              <p className="text-xs text-gray-400">
                JPG, PNG, WebP. Maximum 10MB.
              </p>
            </div>

            {/* Image Preview */}
            {editImagePreview && (
              <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-3">
                <img
                  src={editImagePreview}
                  alt="Post preview"
                  className="max-h-56 w-full rounded-lg object-contain"
                />

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRemoveEditImage}
                  className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
                >
                  Remove Image
                </Button>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                disabled={isUpdating}
                onClick={() => setEditingPost(null)}
                className="flex-1 border-white/10 bg-white/5 text-white hover:bg-white/10"
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={isUpdating}
                className="flex-1 bg-gradient-to-r from-purple-600 to-cyan-600 text-white hover:from-purple-500 hover:to-cyan-500"
              >
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
