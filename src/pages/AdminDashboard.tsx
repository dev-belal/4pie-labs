import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, MessageSquarePlus, PenTool, LogOut, ChevronRight, CheckCircle2, Eye, FileText, TrendingUp, BarChart3, Users, Link2, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AdminDashboardProps {
    onLogout: () => void;
}

type Tab = 'overview' | 'testimonials' | 'blogs';

interface BlogStat {
    id: string;
    title: string;
    category: string;
    views: number;
    created_at: string;
}

export const AdminDashboard = ({ onLogout }: AdminDashboardProps) => {
    const [activeTab, setActiveTab] = React.useState<Tab>('overview');

    // Notification state
    const [notification, setNotification] = React.useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Blog form state  
    const [blogTitle, setBlogTitle] = React.useState('');
    const [blogSlug, setBlogSlug] = React.useState('');
    const [slugManuallyEdited, setSlugManuallyEdited] = React.useState(false);
    const [blogCategory, setBlogCategory] = React.useState('GUIDE');
    const [blogReadTime, setBlogReadTime] = React.useState('');
    const [blogImage, setBlogImage] = React.useState('');
    const [blogExcerpt, setBlogExcerpt] = React.useState('');
    const [blogContent, setBlogContent] = React.useState('');
    const [blogAuthor, setBlogAuthor] = React.useState('Syed Belal');
    const [isBlogPublishing, setIsBlogPublishing] = React.useState(false);

    // Testimonial form state
    const [testName, setTestName] = React.useState('');
    const [testRole, setTestRole] = React.useState('');
    const [testHeadline, setTestHeadline] = React.useState('');
    const [testQuote, setTestQuote] = React.useState('');
    const [testRating, setTestRating] = React.useState(5);
    const [isTestPublishing, setIsTestPublishing] = React.useState(false);

    // Analytics State
    const [totalViews, setTotalViews] = React.useState(0);
    const [totalBlogs, setTotalBlogs] = React.useState(0);
    const [totalTestimonials, setTotalTestimonials] = React.useState(0);
    const [blogStats, setBlogStats] = React.useState<BlogStat[]>([]);
    const [recentEvents, setRecentEvents] = React.useState<any[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    // Slug generation
    const generateSlug = (title: string) => {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    };

    const handleTitleChange = (value: string) => {
        setBlogTitle(value);
        if (!slugManuallyEdited) {
            setBlogSlug(generateSlug(value));
        }
    };

    const handleSlugChange = (value: string) => {
        setSlugManuallyEdited(true);
        setBlogSlug(generateSlug(value));
    };

    // Show notification helper
    const showNotification = (type: 'success' | 'error', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 4000);
    };

    // ─── Data Fetching ───────────────────────────────────────
    const fetchAnalytics = React.useCallback(async () => {
        // Fetch blog stats (with views)
        const { data: blogs } = await supabase
            .from('blogs')
            .select('id, title, category, views, created_at')
            .order('views', { ascending: false });

        if (blogs) {
            setBlogStats(blogs as BlogStat[]);
            setTotalBlogs(blogs.length);
            setTotalViews(blogs.reduce((sum: number, b: any) => sum + (b.views || 0), 0));
        }

        // Fetch testimonial count
        const { count: testCount } = await supabase
            .from('testimonials')
            .select('*', { count: 'exact', head: true })
            .eq('is_published', true);

        setTotalTestimonials(testCount || 0);

        // Fetch recent metric events (last 20)
        const { data: events } = await supabase
            .from('metrics')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20);

        if (events) {
            setRecentEvents(events);
        }

        setIsLoading(false);
    }, []);

    // Initial fetch
    React.useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);

    // ─── Supabase Realtime Subscriptions ─────────────────────
    React.useEffect(() => {
        const channel = supabase
            .channel('admin-dashboard-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'blogs' }, () => {
                fetchAnalytics();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'testimonials' }, () => {
                fetchAnalytics();
            })
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'metrics' }, () => {
                fetchAnalytics();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchAnalytics]);

    // ─── Blog Publishing ─────────────────────────────────────
    const handleBlogSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsBlogPublishing(true);

        const today = new Date();
        const dateStr = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

        const { error } = await supabase.from('blogs').insert({
            id: blogSlug,
            slug: blogSlug,
            title: blogTitle,
            category: blogCategory,
            author: blogAuthor,
            date: dateStr,
            read_time: blogReadTime || '5 min read',
            image: blogImage || 'https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=800&auto=format&fit=crop',
            excerpt: blogExcerpt,
            content: blogContent,
            views: 0,
        });

        setIsBlogPublishing(false);

        if (error) {
            showNotification('error', error.message);
        } else {
            showNotification('success', 'Article published to live site!');
            // Reset form
            setBlogTitle('');
            setBlogSlug('');
            setSlugManuallyEdited(false);
            setBlogCategory('GUIDE');
            setBlogReadTime('');
            setBlogImage('');
            setBlogExcerpt('');
            setBlogContent('');
        }
    };

    // ─── Testimonial Publishing ──────────────────────────────
    const handleTestimonialSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsTestPublishing(true);

        const { error } = await supabase.from('testimonials').insert({
            name: testName,
            role: testRole,
            headline: testHeadline,
            quote: testQuote,
            rating: testRating,
            is_published: true,
        });

        setIsTestPublishing(false);

        if (error) {
            showNotification('error', error.message);
        } else {
            showNotification('success', 'Testimonial published!');
            setTestName('');
            setTestRole('');
            setTestHeadline('');
            setTestQuote('');
            setTestRating(5);
        }
    };

    // ─── Helpers ─────────────────────────────────────────────
    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const formatTimeAgo = (dateStr: string) => {
        const now = new Date();
        const d = new Date(dateStr);
        const diffMs = now.getTime() - d.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays}d ago`;
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white flex">
            {/* Sidebar */}
            <aside className="w-72 border-r border-white/5 bg-black/40 backdrop-blur-xl p-8 flex flex-col hidden md:flex">
                <div className="flex items-center gap-3 mb-12">
                    <img
                        src="/logo.png"
                        alt="4Pie Labs"
                        className="h-7 w-auto brightness-0 invert"
                    />
                </div>

                <nav className="space-y-2 flex-1">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'overview' ? 'bg-white/10 text-white shadow-lg' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                    >
                        <LayoutDashboard className="w-4 h-4" />
                        Analytics
                    </button>
                    <button
                        onClick={() => setActiveTab('testimonials')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'testimonials' ? 'bg-white/10 text-white shadow-lg' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                    >
                        <MessageSquarePlus className="w-4 h-4" />
                        Testimonials
                    </button>
                    <button
                        onClick={() => setActiveTab('blogs')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'blogs' ? 'bg-white/10 text-white shadow-lg' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                    >
                        <PenTool className="w-4 h-4" />
                        Blog Publisher
                    </button>
                </nav>

                <button
                    onClick={onLogout}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-400/60 hover:text-red-400 hover:bg-red-400/10 transition-all mt-auto"
                >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                </button>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 md:p-12 overflow-y-auto">
                <header className="flex items-center justify-between mb-12">
                    <div>
                        <h2 className="text-3xl font-display font-bold">
                            {activeTab === 'overview' && 'Analytics Dashboard'}
                            {activeTab === 'testimonials' && 'Add Testimonial'}
                            {activeTab === 'blogs' && 'Create New Insight'}
                        </h2>
                        <p className="text-white/40 text-sm mt-1">
                            {activeTab === 'overview' ? 'Real-time metrics • Auto-refreshing' : 'Publishes directly to Supabase'}
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="px-4 py-2 rounded-full bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Realtime
                        </div>
                    </div>
                </header>

                <AnimatePresence mode="wait">
                    {activeTab === 'overview' && (
                        <motion.div
                            key="overview"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-8"
                        >
                            {/* Top-level KPI Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                {[
                                    { label: 'Total Page Views', value: isLoading ? '...' : totalViews.toLocaleString(), icon: Eye, color: 'text-blue-400', bgColor: 'bg-blue-400/10' },
                                    { label: 'Published Articles', value: isLoading ? '...' : totalBlogs.toString(), icon: FileText, color: 'text-primary', bgColor: 'bg-primary/10' },
                                    { label: 'Live Testimonials', value: isLoading ? '...' : totalTestimonials.toString(), icon: Users, color: 'text-amber-400', bgColor: 'bg-amber-400/10' },
                                    { label: 'Avg. Views/Article', value: isLoading ? '...' : (totalBlogs > 0 ? Math.round(totalViews / totalBlogs).toLocaleString() : '0'), icon: TrendingUp, color: 'text-emerald-400', bgColor: 'bg-emerald-400/10' },
                                ].map((stat, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.08 }}
                                        className="p-6 glass-morphism rounded-[28px] border-white/5 group hover:border-white/10 transition-all"
                                    >
                                        <div className="flex items-center justify-between mb-4">
                                            <div className={`text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]`}>{stat.label}</div>
                                            <div className={`w-9 h-9 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                                                <stat.icon className={`w-4 h-4 ${stat.color}`} />
                                            </div>
                                        </div>
                                        <div className="text-4xl font-display font-bold">{stat.value}</div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Per-Blog Analytics Table */}
                            <div className="glass-morphism rounded-[32px] border-white/5 overflow-hidden">
                                <div className="p-8 pb-4 flex items-center gap-3">
                                    <BarChart3 className="w-5 h-5 text-primary" />
                                    <h3 className="text-lg font-display font-bold">Per-Article Performance</h3>
                                </div>

                                {isLoading ? (
                                    <div className="p-8 text-center text-white/30 text-sm">Loading analytics...</div>
                                ) : blogStats.length === 0 ? (
                                    <div className="p-8 text-center text-white/30 text-sm">No blog data yet. Publish your first article!</div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-white/5">
                                                    <th className="text-left text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] px-8 py-4">Article</th>
                                                    <th className="text-left text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] px-4 py-4">Category</th>
                                                    <th className="text-right text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] px-4 py-4">Views</th>
                                                    <th className="text-right text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] px-8 py-4">Published</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {blogStats.map((blog, i) => (
                                                    <motion.tr
                                                        key={blog.id}
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        transition={{ delay: 0.3 + i * 0.05 }}
                                                        className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                                                    >
                                                        <td className="px-8 py-5">
                                                            <div className="font-bold text-sm max-w-xs truncate">{blog.title}</div>
                                                        </td>
                                                        <td className="px-4 py-5">
                                                            <span className="text-[10px] font-bold tracking-widest px-3 py-1.5 rounded-full bg-white/5 text-white/50">{blog.category}</span>
                                                        </td>
                                                        <td className="px-4 py-5 text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <Eye className="w-3.5 h-3.5 text-white/20" />
                                                                <span className="font-bold text-sm">{(blog.views || 0).toLocaleString()}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-5 text-right text-white/40 text-xs">
                                                            {formatDate(blog.created_at)}
                                                        </td>
                                                    </motion.tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {/* Recent Activity Feed */}
                            <div className="glass-morphism rounded-[32px] border-white/5 p-8">
                                <div className="flex items-center gap-3 mb-6">
                                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                                    <h3 className="text-lg font-display font-bold">Recent Activity</h3>
                                    <span className="text-[10px] font-bold text-white/20 ml-auto uppercase tracking-widest">Live Feed</span>
                                </div>

                                {isLoading ? (
                                    <div className="text-center text-white/30 text-sm py-4">Loading events...</div>
                                ) : recentEvents.length === 0 ? (
                                    <div className="text-center text-white/30 text-sm py-4">No activity recorded yet. Views will appear here once visitors read your articles.</div>
                                ) : (
                                    <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                                        {recentEvents.map((event, i) => (
                                            <motion.div
                                                key={event.id}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.4 + i * 0.03 }}
                                                className="flex items-center gap-4 py-3 px-4 rounded-xl hover:bg-white/[0.02] transition-colors"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-blue-400/10 flex items-center justify-center flex-shrink-0">
                                                    <Eye className="w-3.5 h-3.5 text-blue-400" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-bold truncate">
                                                        {event.metadata?.title || event.page_path}
                                                    </div>
                                                    <div className="text-[10px] text-white/30 font-bold uppercase tracking-widest">
                                                        {event.event_type === 'page_view' ? 'Article View' : event.event_type}
                                                        {event.metadata?.category && ` • ${event.metadata.category}`}
                                                    </div>
                                                </div>
                                                <span className="text-xs text-white/20 font-bold flex-shrink-0">
                                                    {formatTimeAgo(event.created_at)}
                                                </span>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'testimonials' && (
                        <motion.div
                            key="testimonials"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="max-w-2xl"
                        >
                            <form onSubmit={handleTestimonialSubmit} className="space-y-6 glass-morphism p-10 rounded-[40px] border-white/5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest ml-1">Client Name</label>
                                        <input type="text" value={testName} onChange={(e) => setTestName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-primary/50 transition-all" placeholder="John Doe" required />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest ml-1">Role / Company</label>
                                        <input type="text" value={testRole} onChange={(e) => setTestRole(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-primary/50 transition-all" placeholder="CEO, TechCo" required />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest ml-1">Testimonial Headline</label>
                                    <input type="text" value={testHeadline} onChange={(e) => setTestHeadline(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-primary/50 transition-all" placeholder="Impactful title..." required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest ml-1">Quote Content</label>
                                    <textarea rows={4} value={testQuote} onChange={(e) => setTestQuote(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-primary/50 transition-all resize-none" placeholder="Enter the client's words..." required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest ml-1">Rating</label>
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setTestRating(star)}
                                                className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all ${star <= testRating ? 'bg-amber-400/20 text-amber-400' : 'bg-white/5 text-white/20'}`}
                                            >
                                                ★
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={isTestPublishing}
                                    className="w-full bg-white text-black py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
                                >
                                    {isTestPublishing ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" /> Publishing...</>
                                    ) : (
                                        <>Publish Testimonial <ChevronRight className="w-4 h-4" /></>
                                    )}
                                </button>
                            </form>
                        </motion.div>
                    )}

                    {activeTab === 'blogs' && (
                        <motion.div
                            key="blogs"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="max-w-4xl"
                        >
                            <form onSubmit={handleBlogSubmit} className="space-y-8 glass-morphism p-10 rounded-[40px] border-white/5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest ml-1">Article Title</label>
                                            <input type="text" value={blogTitle} onChange={(e) => handleTitleChange(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-primary/50 transition-all font-display text-xl" placeholder="The Future of AI..." required />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest ml-1 flex items-center gap-2">
                                                <Link2 className="w-3 h-3" />
                                                URL Slug
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 text-sm font-mono">/blog/</span>
                                                <input type="text" value={blogSlug} onChange={(e) => handleSlugChange(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-[5.5rem] pr-6 text-white focus:outline-none focus:border-primary/50 transition-all font-mono text-sm" placeholder="the-future-of-ai" required />
                                            </div>
                                            {blogSlug && <p className="text-[10px] text-white/20 ml-1 font-mono">fourpielabs.com/blog/{blogSlug}</p>}
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest ml-1">Category</label>
                                                <select value={blogCategory} onChange={(e) => setBlogCategory(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-primary/50 transition-all appearance-none cursor-pointer">
                                                    <option>GUIDE</option>
                                                    <option>STRATEGY</option>
                                                    <option>INSIGHTS</option>
                                                    <option>NEWS</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest ml-1">Read Time</label>
                                                <input type="text" value={blogReadTime} onChange={(e) => setBlogReadTime(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-primary/50 transition-all" placeholder="5 min read" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest ml-1">Author</label>
                                            <input type="text" value={blogAuthor} onChange={(e) => setBlogAuthor(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-primary/50 transition-all" placeholder="Author name" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest ml-1">Header Image URL</label>
                                        {blogImage ? (
                                            <div className="relative aspect-video rounded-3xl overflow-hidden border border-white/10">
                                                <img src={blogImage} alt="Preview" className="w-full h-full object-cover" />
                                                <button type="button" onClick={() => setBlogImage('')} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white/60 hover:text-white transition-colors text-sm font-bold">✕</button>
                                            </div>
                                        ) : (
                                            <div className="aspect-video rounded-3xl bg-white/5 border border-white/10 flex flex-col items-center justify-center gap-4 border-dashed">
                                                <BarChart3 className="w-8 h-8 text-white/20" />
                                                <input type="text" value={blogImage} onChange={(e) => setBlogImage(e.target.value)} className="w-3/4 bg-white/5 border border-white/10 rounded-xl py-2 px-4 text-white/60 text-xs focus:outline-none focus:border-primary/50 transition-all text-center" placeholder="Paste image URL here..." />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest ml-1">Excerpt (Short Summary)</label>
                                    <textarea rows={2} value={blogExcerpt} onChange={(e) => setBlogExcerpt(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-primary/50 transition-all resize-none" placeholder="Catchy hook for the listing card..." required />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest ml-1">Full Content (Markdown Supported)</label>
                                    <textarea rows={12} value={blogContent} onChange={(e) => setBlogContent(e.target.value)} className="w-full bg-white/10 border border-white/10 rounded-[32px] py-8 px-8 text-white focus:outline-none focus:border-primary/50 transition-all resize-none font-mono text-sm leading-relaxed" placeholder={"# Start writing your masterpiece...\n\nUse standard markdown for formatting."} required />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isBlogPublishing}
                                    className="w-full bg-primary text-black py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/10 disabled:opacity-50 disabled:hover:scale-100"
                                >
                                    {isBlogPublishing ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" /> Publishing...</>
                                    ) : (
                                        <>Publish Article to Live Site <ChevronRight className="w-4 h-4" /></>
                                    )}
                                </button>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Global Notification */}
            <AnimatePresence>
                {notification && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className={`fixed bottom-12 right-12 z-50 px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-4 ${notification.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                            }`}
                    >
                        {notification.type === 'success' ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                        <div>
                            <div className="font-bold">{notification.type === 'success' ? 'Success!' : 'Error'}</div>
                            <div className="text-white/80 text-[10px] uppercase font-bold tracking-widest">{notification.message}</div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
