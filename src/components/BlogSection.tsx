import * as React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { blogs as staticBlogs, BlogPost } from '../data/blogs';
import { supabase } from '../lib/supabase';

interface BlogSectionProps {
    onViewAll: () => void;
    onPostClick: (post: BlogPost) => void;
}

export const BlogSection = ({ onViewAll, onPostClick }: BlogSectionProps) => {
    const [liveBlogs, setLiveBlogs] = React.useState<BlogPost[]>([]);

    React.useEffect(() => {
        const fetchBlogs = async () => {
            const { data } = await supabase
                .from('blogs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(3);

            if (data && data.length > 0) {
                setLiveBlogs(data as BlogPost[]);
            }
        };

        fetchBlogs();
    }, []);

    // Show only the 3 most recent posts
    const displayBlogs = liveBlogs.length > 0 ? liveBlogs : staticBlogs;
    const featuredPosts = displayBlogs.slice(0, 3);

    return (
        <section id="blog" className="py-24 px-4 border-t border-white/5 bg-[#080808] relative overflow-hidden">
            {/* Section Decor */}
            <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-white/5 blur-[120px] rounded-full -translate-y-1/2 -translate-x-1/2 pointer-events-none" />
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6 text-white">
                    <div>
                        <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">Articles & Insights.</h2>
                        <p className="text-white/40 text-lg">Stay ahead of the curve with our latest AI research.</p>
                    </div>
                    <button
                        onClick={onViewAll}
                        className="flex items-center gap-2 text-sm font-bold bg-white text-black px-6 py-3 rounded-full hover:scale-105 transition-transform"
                    >
                        VIEW ALL ARTICLES
                        <ArrowUpRight className="w-4 h-4" />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mx-5">
                    {featuredPosts.map((post, i) => (
                        <motion.div
                            key={post.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className={cn(
                                "group cursor-pointer",
                                i === 2 && "hidden md:block"
                            )}
                            onClick={() => onPostClick(post)}
                        >
                            <div className="relative aspect-[16/10] rounded-[32px] overflow-hidden mb-6 border border-white/5">
                                <img
                                    src={post.image}
                                    alt={post.title}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                                <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold tracking-widest text-white/80">
                                    {post.category}
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-white/30 text-xs font-bold mb-3 uppercase tracking-widest">
                                {post.date}
                            </div>
                            <h3 className="text-xl font-display font-bold leading-tight group-hover:text-primary transition-colors text-white">
                                {post.title}
                            </h3>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
