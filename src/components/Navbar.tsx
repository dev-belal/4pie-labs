import { useState, useEffect } from 'react';
import { Menu, X, ArrowRight, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

export const Navbar = ({ onHome, onAbout, onBlog, onServices, onResults }: {
    onHome: () => void;
    onAbout: () => void;
    onBlog: () => void;
    onServices: () => void;
    onResults: () => void;
}) => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav className={cn(
            "fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-4 py-4",
            isScrolled ? "py-4" : "py-6"
        )}>
            <div className={cn(
                "max-w-7xl mx-auto flex md:grid md:grid-cols-3 items-center justify-between px-6 py-3 rounded-full transition-all duration-300 relative",
                "glass-morphism border-white/5",
                isScrolled ? "bg-background/40 backdrop-blur-xl border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)]" : "bg-white/5 backdrop-blur-md"
            )}>
                {/* Left: Logo */}
                <div className="flex items-center justify-start md:ml-5">
                    <div className="cursor-pointer group" onClick={onHome}>
                        <img
                            src="/logo.png"
                            alt="4Pie Labs"
                            className="h-7 md:h-8 w-auto brightness-0 invert group-hover:scale-110 transition-transform"
                        />
                    </div>
                </div>

                {/* Center: Navigation Links */}
                <div className="hidden md:flex items-center gap-1">
                    <button
                        onClick={onHome}
                        className="text-sm font-medium px-4 py-2 rounded-full transition-all duration-300 relative group text-white/50 hover:text-white"
                    >
                        Home
                        <div className="absolute bottom-0 left-4 right-4 h-px bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                    </button>

                    <button
                        onClick={onAbout}
                        className="text-sm font-medium px-4 py-2 rounded-full transition-all duration-300 relative group text-white/50 hover:text-white"
                    >
                        About
                        <div className="absolute bottom-0 left-4 right-4 h-px bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                    </button>

                    <button
                        onClick={onServices}
                        className="text-sm font-medium px-4 py-2 rounded-full transition-all duration-300 relative group text-white/50 hover:text-white"
                    >
                        Services
                        <div className="absolute bottom-0 left-4 right-4 h-px bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                    </button>

                    <button
                        onClick={onResults}
                        className="text-sm font-medium px-4 py-2 rounded-full transition-all duration-300 relative group text-white/50 hover:text-white"
                    >
                        Results
                        <div className="absolute bottom-0 left-4 right-4 h-px bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                    </button>

                    <button
                        onClick={onBlog}
                        className="text-sm font-medium px-4 py-2 rounded-full transition-all duration-300 relative group text-white/50 hover:text-white"
                    >
                        Blogs
                        <div className="absolute bottom-0 left-4 right-4 h-px bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                    </button>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center justify-end gap-4">
                    <a
                        href="https://cal.com/four-pie-labs/30min"
                        target="_blank"
                        rel="noopener noreferrer"
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                        className="hidden md:flex items-center gap-2 bg-white text-black px-6 py-2.5 rounded-full text-sm font-bold hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                    >
                        Schedule Call
                        <div className="relative w-4 h-4 overflow-hidden">
                            <AnimatePresence mode="wait">
                                {isHovered ? (
                                    <motion.div
                                        key="phone"
                                        initial={{ y: 15, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        exit={{ y: -15, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <Phone className="w-4 h-4 text-primary" />
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="arrow"
                                        initial={{ y: 15, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        exit={{ y: -15, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <ArrowRight className="w-4 h-4" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </a>
                    <button
                        className="md:hidden p-2 text-white"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <X /> : <Menu />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden absolute top-full left-0 right-0 mt-2 mx-4 p-6 glass-morphism rounded-2xl flex flex-col gap-4 animate-fade-in">
                    <button
                        onClick={() => { onAbout(); setIsMobileMenuOpen(false); }}
                        className="text-lg font-medium text-white/70 hover:text-white transition-colors text-left"
                    >
                        About
                    </button>
                    <button
                        onClick={() => { onServices(); setIsMobileMenuOpen(false); }}
                        className="text-lg font-medium text-white/70 hover:text-white transition-colors text-left"
                    >
                        Services
                    </button>
                    <button
                        onClick={() => { onResults(); setIsMobileMenuOpen(false); }}
                        className="text-lg font-medium text-white/70 hover:text-white transition-colors text-left"
                    >
                        Results
                    </button>
                    <button
                        onClick={() => { onBlog(); setIsMobileMenuOpen(false); }}
                        className="text-lg font-medium text-white/70 hover:text-white transition-colors text-left"
                    >
                        Blogs
                    </button>
                    <a
                        href="https://cal.com/four-pie-labs/30min"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 bg-white text-black px-5 py-3 rounded-full text-base font-bold"
                    >
                        Schedule Call
                    </a>
                </div>
            )}
        </nav>
    );
};
