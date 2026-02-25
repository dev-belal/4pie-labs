import * as React from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { ArrowLeft, Clock, User, Facebook, Twitter, Linkedin, Link as LinkIcon, ChevronRight } from 'lucide-react';
import { BlogPost as BlogPostType } from '../data/blogs';
import { supabase } from '../lib/supabase';

interface BlogPostProps {
    post: BlogPostType;
    onBack: () => void;
}

export const BlogPost = ({ post, onBack }: BlogPostProps) => {
    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    React.useEffect(() => {
        const trackView = async () => {
            // 1. Increment view count in blogs table
            // Note: We use a simple update here. In a high-traffic production app, 
            // a stored procedure (RPC) would be more robust to prevent race conditions.
            if (post.id) {
                const { data: blogData } = await supabase
                    .from('blogs')
                    .select('views')
                    .eq('id', post.id)
                    .single();

                if (blogData) {
                    await supabase
                        .from('blogs')
                        .update({ views: (blogData.views || 0) + 1 })
                        .eq('id', post.id);
                }

                // 2. Log event in metrics table
                await supabase
                    .from('metrics')
                    .insert({
                        event_type: 'page_view',
                        page_path: `/blog/${post.id}`,
                        metadata: {
                            title: post.title,
                            category: post.category
                        }
                    });
            }
        };

        trackView();
    }, [post.id]);

    const [copied, setCopied] = React.useState(false);

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-background overflow-y-auto overflow-x-hidden pt-20"
        >
            {/* Reading Progress Bar */}
            <motion.div
                className="fixed top-0 left-0 right-0 h-1 bg-primary origin-left z-[70]"
                style={{ scaleX }}
            />

            <div className="max-w-4xl mx-auto px-4 py-20 relative">
                {/* Back Button */}
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-white/50 hover:text-primary mb-12 transition-colors group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to Insights
                </button>

                {/* Article Header */}
                <header className="mb-16">
                    <div className="flex items-center gap-4 text-xs font-bold text-primary uppercase tracking-[0.2em] mb-6">
                        <span>{post.category}</span>
                        <span className="w-1 h-1 rounded-full bg-white/20" />
                        <span>{post.date}</span>
                    </div>

                    <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-10 leading-[1.1]">
                        {post.title}
                    </h1>

                    <div className="flex flex-wrap items-center gap-8 py-8 border-y border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/20">
                                <User className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Writen By</div>
                                <div className="text-white font-bold">{post.author}</div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                                <Clock className="w-5 h-5 text-white/40" />
                            </div>
                            <div>
                                <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Reading Time</div>
                                <div className="text-white font-bold">{post.readTime}</div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 ml-auto">
                            <button
                                onClick={handleCopyLink}
                                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 hover:bg-primary transition-all group"
                            >
                                <LinkIcon className={`w-4 h-4 ${copied ? "text-emerald-400" : "text-white/40 group-hover:text-white"}`} />
                            </button>
                            <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 hover:bg-[#1877F2] transition-all group">
                                <Facebook className="w-4 h-4 text-white/40 group-hover:text-white" />
                            </button>
                            <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 hover:bg-[#1DA1F2] transition-all group">
                                <Twitter className="w-4 h-4 text-white/40 group-hover:text-white" />
                            </button>
                            <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 hover:bg-[#0077B5] transition-all group">
                                <Linkedin className="w-4 h-4 text-white/40 group-hover:text-white" />
                            </button>
                        </div>
                    </div>
                </header>

                {/* Main Image */}
                <div className="relative aspect-[21/9] rounded-[48px] overflow-hidden mb-20 shadow-2xl">
                    <img
                        src={post.image}
                        alt={post.title}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-[48px]" />
                </div>

                {/* Content Rendering */}
                <article className="prose prose-invert prose-lg max-w-none">
                    <div className="text-white/70 leading-[1.8] space-y-8 font-light text-lg">
                        {post.content.split('\n').map((line, i) => {
                            if (line.startsWith('# ')) {
                                return null; // Already rendered title in header
                            }
                            if (line.startsWith('## ')) {
                                return <h2 key={i} className="text-3xl font-display font-bold text-white pt-8">{line.replace('## ', '')}</h2>;
                            }
                            if (line.startsWith('### ')) {
                                return <h3 key={i} className="text-2xl font-display font-bold text-white pt-4">{line.replace('### ', '')}</h3>;
                            }
                            if (line.startsWith('**')) {
                                return <p key={i} className="font-bold text-white">{line.replace(/\*\*/g, '')}</p>;
                            }
                            if (line.startsWith('- ')) {
                                return <li key={i} className="ml-6 list-disc">{line.replace('- ', '')}</li>;
                            }
                            if (line.trim() === '') return <br key={i} />;
                            return <p key={i}>{line}</p>;
                        })}
                    </div>
                </article>

                {/* Bottom Navigation */}
                <div className="mt-32 pt-16 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="text-center md:text-left">
                        <div className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-2 text-white">Share this insight</div>
                        <div className="flex items-center gap-4">
                            <button className="flex items-center gap-2 glass-morphism px-4 py-2 rounded-lg text-xs font-bold hover:bg-[#1877F2]/20 transition-all text-white">
                                <Facebook className="w-3.5 h-3.5" />
                                Facebook
                            </button>
                            <button className="flex items-center gap-2 glass-morphism px-4 py-2 rounded-lg text-xs font-bold hover:bg-[#1DA1F2]/20 transition-all text-white">
                                <Twitter className="w-3.5 h-3.5" />
                                Twitter
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={onBack}
                        className="flex items-center gap-3 bg-white text-black px-8 py-4 rounded-full font-bold hover:scale-105 transition-all text-sm"
                    >
                        Back to all articles
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Sticky Footnote */}
            <div className="sticky bottom-0 left-0 right-0 bg-background/80 backdrop-blur-md border-t border-white/5 py-4 text-center text-[10px] font-bold text-white/20 uppercase tracking-[0.3em] overflow-hidden whitespace-nowrap">
                <motion.div
                    animate={{ x: [-1000, 0] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                    AI RESEARCH 2026 • 4PIE LABS INSIGHTS • AUTONOMOUS AGENCY PROTOCOLS • DESIGN PSYCHOLOGY • MARKET AUTOMATION •
                </motion.div>
            </div>
        </motion.div>
    );
};
