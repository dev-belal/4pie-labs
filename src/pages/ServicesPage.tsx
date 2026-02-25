import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Search, ChevronRight, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';

import { services, categories } from '../data/services';
import { ServiceDetailModal } from '../components/ServiceDetailModal';

export const ServicesPage = ({ onCustomRequest, onContactClick }: { onCustomRequest: () => void, onContactClick: () => void }) => {
    const [activeCategory, setActiveCategory] = React.useState("AI Systems");
    const [searchQuery, setSearchQuery] = React.useState("");
    const [selectedService, setSelectedService] = React.useState<any | null>(null);

    const filteredServices = services.filter(s =>
        s.category === activeCategory &&
        (s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.desc.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="min-h-screen bg-background pt-32 pb-20 px-4">
            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-12">

                {/* Side Navigation / Sidebar */}
                <aside className="lg:w-80 flex-shrink-0">
                    <div className="sticky top-40 space-y-8">
                        <div>
                            <h1 className="text-4xl font-display font-bold mb-4">Our Services</h1>
                            <p className="text-white/40 text-sm">
                                Explore every layer of the autonomous agency.
                            </p>
                        </div>

                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                            <input
                                type="text"
                                placeholder="Find a service..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-primary/50 transition-colors"
                            />
                        </div>

                        {/* Categories List */}
                        <div className="space-y-2">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setActiveCategory(cat)}
                                    className={cn(
                                        "w-full flex items-center justify-between px-6 py-4 rounded-2xl text-left font-bold transition-all",
                                        activeCategory === cat
                                            ? "glass-morphism border-primary/20 text-white translate-x-1"
                                            : "text-white/30 hover:text-white/50"
                                    )}
                                >
                                    {cat}
                                    <ChevronRight className={cn(
                                        "w-4 h-4 transition-transform",
                                        activeCategory === cat ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0"
                                    )} />
                                </button>
                            ))}
                        </div>
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeCategory + searchQuery}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="grid grid-cols-1 md:grid-cols-2 gap-6"
                        >
                            {filteredServices.map((service, idx) => (
                                <div
                                    key={service.title}
                                    onClick={() => setSelectedService(service)}
                                    className="group glass-morphism p-10 rounded-[40px] border-white/10 hover:border-white/20 transition-all flex flex-col gap-8 shadow-2xl relative overflow-hidden cursor-pointer"
                                >
                                    {/* Icon Header */}
                                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${service.color} p-0.5 group-hover:scale-110 transition-transform`}>
                                        <div className="w-full h-full bg-background rounded-[14px] flex items-center justify-center">
                                            <service.icon className="w-7 h-7" />
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-2xl font-display font-bold mb-4">{service.title}</h3>
                                        <p className="text-white/60 leading-relaxed mb-6">
                                            {service.desc}
                                        </p>
                                        <div className="pt-6 border-t border-white/5 text-sm text-white/40 group-hover:text-white/60 transition-colors italic">
                                            {service.details}
                                        </div>
                                    </div>

                                    <button className="flex items-center gap-2 text-xs font-bold text-primary group-hover:gap-3 transition-all mt-auto uppercase tracking-widest">
                                        Configure Service
                                        <ArrowRight className="w-4 h-4" />
                                    </button>

                                    {/* Numbering */}
                                    <div className="absolute top-10 right-10 text-white/5 font-display text-4xl font-black">
                                        {(idx + 1).toString().padStart(2, '0')}
                                    </div>
                                </div>
                            ))}

                            {filteredServices.length === 0 && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="col-span-full group glass-morphism p-12 rounded-[40px] border-primary/20 bg-primary/5 text-center flex flex-col items-center gap-6 shadow-2xl relative overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full -z-10" />

                                    <div className="w-20 h-20 rounded-3xl bg-primary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <Sparkles className="w-10 h-10 text-primary" />
                                    </div>

                                    <div>
                                        <h3 className="text-3xl font-display font-bold mb-4">Didn't find what you need?</h3>
                                        <p className="text-white/60 max-w-md mx-auto leading-relaxed">
                                            We build custom AI operating systems for unique workflows.
                                            Tell us what you're looking for and we'll build it.
                                        </p>
                                    </div>

                                    <button
                                        onClick={onCustomRequest}
                                        className="flex items-center gap-3 bg-primary hover:bg-primary/90 text-white px-10 py-4 rounded-full font-bold hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(139,92,246,0.3)]"
                                    >
                                        Submit Custom Request
                                        <ArrowRight className="w-5 h-5" />
                                    </button>
                                </motion.div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>

            <ServiceDetailModal
                isOpen={!!selectedService}
                onClose={() => setSelectedService(null)}
                service={selectedService}
                onContactClick={onContactClick}
            />
        </div>
    );
};
