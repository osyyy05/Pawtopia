import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Plus, Eye, Edit, Trash2, ThumbsUp, Globe, EyeOff } from 'lucide-react';

interface NewsArticle {
  id: string;
  title: string;
  category: string;
  author: string;
  publishedAt: string;
  views: number;
  likes: number;
  isPublished: boolean;
  excerpt: string;
  imageUrl: string;
}

const categoryColors: Record<string, string> = {
  Conservation: 'bg-emerald-500/20 text-emerald-400',
  Adoption: 'bg-pink-500/20 text-pink-400',
  'Law & Policy': 'bg-red-500/20 text-red-400',
  Research: 'bg-blue-500/20 text-blue-400',
  Guides: 'bg-amber-500/20 text-amber-400',
  Wildlife: 'bg-purple-500/20 text-purple-400',
};

export default function AdminNewsManagement() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [, setLoading] = useState(true);

  const fetchArticles = async () => {
  const accessToken =
    sessionStorage.getItem('access_token');

  if (!accessToken) {
    return;
  }

  try {
    const response = await fetch(
      'http://127.0.0.1:8000/api/news/admin/',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data?.error ||
        data?.detail ||
        'Failed to load news articles.'
      );
    }

    setArticles(
      data.map((article: any) => ({
        id: String(article.id),
        title: article.title,
        category: article.category,
        author: 'Admin',
        publishedAt: article.date || '',
        views: 0,
        likes: 0,
        isPublished: article.is_published,
        excerpt: article.summary,
        imageUrl: article.image,
      }))
    );

  } catch (error) {

    console.error(
      'Failed to load news articles:',
      error
    );

  } finally {

    setLoading(false);

  }
};

useEffect(() => {
  fetchArticles();
}, []);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Conservation');
  const [newExcerpt, setNewExcerpt] = useState('');

const addArticle = async () => {
  if (!newTitle.trim()) {
    toast.error('Please enter an article title.');
    return;
  }

  const accessToken = sessionStorage.getItem('access_token');

  if (!accessToken) {
    toast.error('Please login again.');
    return;
  }

  try {
    const isEditing = editingId !== null;

    const url = isEditing
      ? `http://127.0.0.1:8000/api/news/admin/${editingId}/`
      : 'http://127.0.0.1:8000/api/news/admin/create/';

    const response = await fetch(url, {
      method: isEditing ? 'PATCH' : 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(
        isEditing
          ? {
              title: newTitle,
              summary: newExcerpt,
              content: newExcerpt,
              category: newCategory,
            }
          : {
              title: newTitle,
              summary: newExcerpt || 'New article excerpt...',
              content: newExcerpt || 'New article content...',
              image:
                'https://images.unsplash.com/photo-1474511320723-9a56873867b5?w=800',
              date: new Date().toISOString().split('T')[0],
              category: newCategory,
              url: '',
              is_published: false,
            }
      ),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data?.error ||
          data?.detail ||
          'Failed to save article.'
      );
    }

    toast.success(
      isEditing
        ? 'Article updated successfully.'
        : 'Article saved as draft.'
    );

    setNewTitle('');
    setNewExcerpt('');
    setNewCategory('Conservation');
    setEditingId(null);
    setShowForm(false);

    fetchArticles();
  } catch (error) {
    console.error('Failed to save article:', error);

    toast.error(
      error instanceof Error
        ? error.message
        : 'Failed to save article.'
    );
  }
};

const editArticle = (article: NewsArticle) => {
  setEditingId(article.id);
  setNewTitle(article.title);
  setNewCategory(article.category);
  setNewExcerpt(article.excerpt);
  setShowForm(true);
};

const deleteArticle = async (id: string) => {
  try {
    const token = sessionStorage.getItem('access_token');

    const response = await fetch(
      `http://127.0.0.1:8000/api/news/admin/${id}/delete/`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to delete article');
    }

    toast.success('Article deleted successfully');

    fetchArticles();
  } catch (error) {
    console.error(error);
    toast.error('Failed to delete article');
  }
};

const togglePublish = async (id: string) => {
  try {
    const token = sessionStorage.getItem('access_token');

    const response = await fetch(
      `http://127.0.0.1:8000/api/news/admin/${id}/publish/`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to update publish status');
    }

    await response.json();

    toast.success('Article publish status updated');

    fetchArticles();
  } catch (error) {
    console.error(error);
    toast.error('Failed to update article');
  }
};

  const totalViews = articles.reduce((s, a) => s + a.views, 0);
  const totalLikes = articles.reduce((s, a) => s + a.likes, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">News & Articles</h1>
          <p className="text-slate-400 text-sm mt-0.5">Manage Malaysian wildlife and adoption news</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-medium transition-colors">
          <Plus className="size-4" /> New Article
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Articles', value: articles.length, color: 'text-white' },
          { label: 'Published', value: articles.filter(a => a.isPublished).length, color: 'text-emerald-400' },
          { label: 'Total Views', value: totalViews.toLocaleString(), color: 'text-cyan-400' },
          { label: 'Total Likes', value: totalLikes.toLocaleString(), color: 'text-pink-400' },
        ].map(s => (
          <div key={s.label} className="rounded-xl bg-slate-900/60 border border-purple-500/20 p-4">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* New Article Form */}
      {showForm && (
        <div className="rounded-2xl bg-slate-900/60 border border-purple-500/30 p-5 space-y-3">
          <h3 className="text-sm font-semibold text-white">
            {editingId ? 'Edit Article' : 'Write New Article'}
          </h3>
          <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Article title..." className="w-full h-10 px-4 rounded-xl bg-white/5 border border-purple-500/20 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-purple-400 transition-all" />
          <div className="flex gap-3">
            <select value={newCategory} onChange={e => setNewCategory(e.target.value)} className="h-10 px-3 rounded-xl bg-white/5 border border-purple-500/20 text-white text-sm focus:outline-none focus:border-purple-400 transition-all">
              {Object.keys(categoryColors).map(c => <option key={c} value={c} className="bg-slate-900">{c}</option>)}
            </select>
            <textarea value={newExcerpt} onChange={e => setNewExcerpt(e.target.value)} placeholder="Article excerpt..." rows={2} className="flex-1 p-3 rounded-xl bg-white/5 border border-purple-500/20 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-purple-400 transition-all resize-none" />
          </div>
          <button
            onClick={addArticle}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-medium transition-colors"
          >
            {editingId ? 'Update Article' : 'Save as Draft'}
          </button>
        </div>
      )}

      {/* Articles Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {articles.map(a => (
          <div key={a.id} className="rounded-2xl bg-slate-900/60 border border-purple-500/20 overflow-hidden hover:border-purple-500/40 transition-all group">
            <div className="relative h-36 overflow-hidden">
              <img src={a.imageUrl} alt={a.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
              <div className="absolute top-2 left-2 flex gap-2">
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${categoryColors[a.category] || 'bg-slate-500/20 text-slate-400'}`}>
                  {a.category}
                </span>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${a.isPublished ? 'bg-emerald-500/80 text-white' : 'bg-slate-800/80 text-slate-400'}`}>
                  {a.isPublished ? '● Live' : '○ Draft'}
                </span>
              </div>
            </div>
            <div className="p-4">
              <h3 className="text-sm font-semibold text-white mb-1 line-clamp-2">{a.title}</h3>
              <p className="text-xs text-slate-500 mb-3 line-clamp-2">{a.excerpt}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><Eye className="size-3" />{a.views.toLocaleString()}</span>
                  <span className="flex items-center gap-1"><ThumbsUp className="size-3" />{a.likes}</span>
                  {a.publishedAt && <span>{a.publishedAt}</span>}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => togglePublish(a.id)} className={`p-1.5 rounded-lg hover:bg-white/10 transition-colors ${a.isPublished ? 'text-emerald-400' : 'text-slate-400 hover:text-emerald-400'}`} title={a.isPublished ? 'Unpublish' : 'Publish'}>
                    {a.isPublished ? <Globe className="size-4" /> : <EyeOff className="size-4" />}
                  </button>
                  <button
                    onClick={() => editArticle(a)}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                    title="Edit"
                  >
                    <Edit className="size-4" />
                  </button>
                  <button onClick={() => deleteArticle(a.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
