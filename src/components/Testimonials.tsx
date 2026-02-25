import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

const staticTestimonials = [
    {
        headline: "Hiring used to take us weeks. Now it takes hours.",
        quote: "We process hundreds of CVs every week and it was all manual. They built us a system that generates standardized CVs and scores candidates. What used to take our recruiters two full days now happens in the background.",
        name: "Israel Sanc Rueda",
        role: "CEO & Founder, NexAi Automations, Espana",
        avatar: "/testimonials/israel.jpeg"
    },
    {
        headline: "Our content workflow went from chaos to clockwork.",
        quote: "We were publishing maybe 2 blogs a month with zero SEO consistency. Now we're pushing out 8 to 10 optimized posts a month and organic traffic has nearly tripled. Feels like we added a whole content team.",
        name: "Iman Motamed",
        role: "CEO & Founder, Bloomhouse Marketing, USA",
        avatar: "/testimonials/iman.png"
    },
    {
        headline: "Really Helpful in automating the hectic work we had",
        quote: "Really goes above and beyond to support me and my business. Not only puts together great solutions, but also helps explain them and why they will benefit our team. Would highly recommended!",
        name: "Louis Modeste",
        role: "Wealth Manager, Edward Bond Associates, UK",
        avatar: "/testimonials/louis.jpeg"
    },
    {
        headline: "Leads stopped falling through the cracks.",
        quote: "Now we have an AI chatbot handling first-touch support, booking calls, and following up automatically. Every inquiry gets an instant response, and we've seen a real jump in conversions.",
        name: "Saad Ali Khan",
        role: "CEO & Founder, Botyama AI, UK",
        avatar: "/testimonials/saad.jpeg"
    },
    {
        headline: "Finally, reporting that doesn't eat up our week.",
        quote: "They built us a fully automated system with a live dashboard where clients can see occupancy and revenue in real time. That one system alone freed up enough time to take on 20 more units.",
        name: "Abdul Kareem",
        role: "Lead Engineer, ZJ Rentals, USA",
        avatar: "/testimonials/abdul.jpeg"
    }
];

export const Testimonials = () => {
    const [liveTestimonials, setLiveTestimonials] = React.useState<any[]>([]);
    const [currentIndex, setCurrentIndex] = React.useState(0);
    const [direction, setDirection] = React.useState(0);

    // Use live data if available, otherwise fallback to static
    const testimonials = liveTestimonials.length > 0 ? liveTestimonials : staticTestimonials;

    React.useEffect(() => {
        const fetchTestimonials = async () => {
            const { data } = await supabase
                .from('testimonials')
                .select('*')
                .eq('is_published', true)
                .order('created_at', { ascending: false });

            if (data && data.length > 0) {
                setLiveTestimonials(data);
            }
        };

        fetchTestimonials();
    }, []);

    const slideVariants = {
        enter: (direction: number) => ({
            x: direction > 0 ? '100%' : '-100%',
            opacity: 0,
            scale: 0.9,
            filter: 'blur(10px)'
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1,
            scale: 1,
            filter: 'blur(0px)'
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction > 0 ? '-100%' : '100%',
            opacity: 0,
            scale: 0.9,
            filter: 'blur(10px)'
        })
    };

    const transition = {
        x: { type: "spring", stiffness: 200, damping: 25, restDelta: 0.5 },
        opacity: { duration: 0.4, ease: "easeInOut" },
        scale: { duration: 0.4, ease: "easeInOut" },
        filter: { duration: 0.4, ease: "easeInOut" }
    };

    const paginate = (newDirection: number) => {
        setDirection(newDirection);
        setCurrentIndex((prev) => (prev + newDirection + testimonials.length) % testimonials.length);
    };

    // Helper to get 3 items starting from currentIndex
    const getVisibleTestimonials = () => {
        const items = [];
        for (let i = 0; i < Math.min(3, testimonials.length); i++) {
            items.push(testimonials[(currentIndex + i) % testimonials.length]);
        }
        return items;
    };

    return (
        <section id="results" className="py-24 px-4 bg-[#050505] overflow-hidden relative border-t border-white/5">
            {/* Section Decor */}
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full -translate-y-1/2 pointer-events-none" />

            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16 relative">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-morphism text-[10px] font-bold text-primary mb-6 tracking-widest uppercase">
                        RESULTS & FEEDBACK
                    </div>
                    <h2 className="text-4xl md:text-6xl font-display font-bold italic text-white">
                        Don't take our word for it.
                    </h2>
                </div>

                <div className="relative px-4 md:px-16 group/carousel">
                    {/* Desktop Navigation Buttons - Sides */}
                    <div className="absolute top-1/2 -translate-y-1/2 left-0 z-20 hidden md:block">
                        <button
                            onClick={() => paginate(-1)}
                            className="p-4 rounded-full glass-morphism border-white/10 hover:border-primary/50 hover:bg-white/[0.05] transition-all group/btn"
                        >
                            <ChevronLeft className="w-6 h-6 text-white/50 group-hover/btn:text-primary transition-colors" />
                        </button>
                    </div>
                    <div className="absolute top-1/2 -translate-y-1/2 right-0 z-20 hidden md:block">
                        <button
                            onClick={() => paginate(1)}
                            className="p-4 rounded-full glass-morphism border-white/10 hover:border-primary/50 hover:bg-white/[0.05] transition-all group/btn"
                        >
                            <ChevronRight className="w-6 h-6 text-white/50 group-hover/btn:text-primary transition-colors" />
                        </button>
                    </div>

                    <div className="relative min-h-[460px]">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <AnimatePresence initial={false} custom={direction} mode="popLayout">
                                {getVisibleTestimonials().map((t, i) => (
                                    <motion.div
                                        key={`${t.name}-${currentIndex}-${i}`}
                                        custom={direction}
                                        variants={slideVariants}
                                        initial="enter"
                                        animate="center"
                                        exit="exit"
                                        transition={transition as any}
                                        className={`p-8 glass-morphism rounded-[40px] border-white/10 hover:border-primary/20 hover:bg-white/[0.07] transition-all shadow-2xl flex flex-col justify-between h-full ${i > 0 ? 'hidden md:flex' : 'flex'}`}
                                    >
                                        <div>
                                            <div className="flex gap-1 mb-6">
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <Star key={star} className="w-3.5 h-3.5 fill-primary text-primary" />
                                                ))}
                                            </div>
                                            <h3 className="text-xl font-bold mb-4 text-white leading-tight min-h-[3.5rem]">
                                                {t.headline || t.title}
                                            </h3>
                                            <p className="text-sm text-white/50 leading-relaxed mb-8 italic">
                                                "{t.quote}"
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-4 border-t border-white/5 pt-6 mt-auto">
                                            <div className="relative group/avatar">
                                                <div className="absolute inset-0 bg-primary/20 blur-md rounded-full pointer-events-none opacity-0 group-hover/avatar:opacity-100 transition-opacity" />
                                                <img
                                                    src={t.avatar}
                                                    alt={t.name}
                                                    className="w-12 h-12 rounded-full object-cover relative border border-white/10 grayscale hover:grayscale-0 transition-all duration-500"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(t.name)}&background=random&color=fff`;
                                                    }}
                                                />
                                            </div>
                                            <div>
                                                <div className="font-bold text-sm text-white">{t.name}</div>
                                                <div className="text-[10px] text-white/30 uppercase tracking-wider font-semibold">{t.role}</div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>


                {/* Mobile Navigation controls */}
                <div className="flex md:hidden justify-center gap-4 mt-8">
                    <button
                        onClick={() => paginate(-1)}
                        className="p-4 rounded-full glass-morphism border-white/10 hover:border-primary/50 text-white/50"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                        onClick={() => paginate(1)}
                        className="p-4 rounded-full glass-morphism border-white/10 hover:border-primary/50 text-white/50"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </div>

                {/* Pagination Indicators */}
                <div className="flex justify-center gap-2 mt-12">
                    {testimonials.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => {
                                setDirection(i > currentIndex ? 1 : -1);
                                setCurrentIndex(i);
                            }}
                            className={`h-1.5 rounded-full transition-all duration-500 ${i === currentIndex
                                ? "bg-primary w-8"
                                : "bg-white/10 w-2 hover:bg-white/20"
                                }`}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};
