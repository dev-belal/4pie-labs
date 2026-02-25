import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, ArrowRight, LucideIcon } from 'lucide-react';

interface Service {
    title: string;
    desc: string;
    icon: LucideIcon;
    color: string;
    category: string;
    details?: string;
    points: string[];
    seoDesc: string;
}

interface ServiceDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    service: Service | null;
    onContactClick: () => void;
}

export const ServiceDetailModal: React.FC<ServiceDetailModalProps> = ({ isOpen, onClose, service, onContactClick }) => {
    if (!service) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-md"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-lg glass-morphism rounded-[32px] border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] md:max-h-[90vh]"
                    >
                        {/* Scrollable Content Area */}
                        <div className="overflow-y-auto custom-scrollbar flex-1 relative">
                            {/* Gradient Background Flash */}
                            <div className={`absolute top-0 left-0 w-full h-32 bg-gradient-to-br ${service.color} opacity-10 blur-3xl`} />

                            {/* Close Button - Stays fixed if we move it out, but for now we keep it inside or make it absolute in the container */}
                            <button
                                onClick={onClose}
                                className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/50 transition-colors z-20"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="p-6 md:p-10">
                                {/* Header */}
                                <div className="flex items-center gap-4 mb-6 mt-2">
                                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${service.color} p-0.5 shadow-xl flex-shrink-0`}>
                                        <div className="w-full h-full bg-background rounded-[14px] flex items-center justify-center">
                                            <service.icon className="w-7 h-7" />
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-primary text-[10px] font-bold uppercase tracking-widest mb-0.5 block">
                                            {service.category}
                                        </span>
                                        <h2 className="text-2xl font-display font-bold text-white tracking-tight leading-tight">
                                            {service.title}
                                        </h2>
                                    </div>
                                </div>

                                {/* Main Description */}
                                <p className="text-base text-white/70 leading-relaxed mb-6">
                                    {service.seoDesc}
                                </p>

                                {/* Features / Points */}
                                <div className="space-y-3 mb-2">
                                    <h4 className="text-[11px] font-bold text-white uppercase tracking-wider mb-2 opacity-50">Key Deliverables</h4>
                                    <div className="space-y-2.5">
                                        {service.points.map((point, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.05 }}
                                                className="flex items-start gap-3 group/item border-l border-white/5 pl-4 py-0.5 hover:border-primary/30 transition-colors"
                                            >
                                                <div className="mt-1 flex-shrink-0">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(139,92,246,0.6)]" />
                                                </div>
                                                <span className="text-sm text-white/50 group-hover/item:text-white/80 transition-colors leading-snug">
                                                    {point}
                                                </span>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sticky Footer */}
                        <div className="p-6 md:p-10 pt-4 flex flex-col sm:flex-row items-center gap-4 border-t border-white/5 bg-background/50 backdrop-blur-sm relative z-10">
                            <button
                                onClick={() => {
                                    onClose();
                                    onContactClick();
                                }}
                                className="w-full sm:w-auto px-6 py-3 bg-white text-black rounded-full font-bold text-sm flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-xl"
                            >
                                Get Started
                                <Zap className="w-4 h-4 fill-current" />
                            </button>

                            <a
                                href="https://cal.com/four-pie-labs/30min"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hidden sm:block ml-auto group"
                            >
                                <div className="flex items-center gap-2 text-primary font-bold text-[11px] uppercase tracking-widest">
                                    Consult Expert
                                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </a>
                            <button
                                onClick={() => window.open('https://cal.com/four-pie-labs/30min', '_blank')}
                                className="sm:hidden w-full px-6 py-3 bg-white/5 text-white rounded-full font-bold text-sm flex items-center justify-center gap-2 border border-white/10 hover:bg-white/10 transition-all"
                            >
                                Book Strategy Session
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
