import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Play, Rocket } from 'lucide-react';
import { SplineScene } from './SplineScene';

export const Hero = ({ onStartAutomation }: { onStartAutomation: () => void }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <section className="relative pt-32 pb-20 overflow-hidden">
            {/* Background Glow */}
            <div className="hero-glow" />

            <div className="max-w-7xl mx-auto px-4 relative z-10">
                {/* Split Layout: Text Left (60%) + 3D Right (40%) */}
                <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-0">

                    {/* Left Column — Text Content (60%) */}
                    <div className="w-full lg:w-[60%] text-center lg:text-left">
                        <motion.h1
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                            className="text-4xl md:text-6xl lg:text-6xl xl:text-7xl font-display font-bold leading-tight mb-8"
                        >
                            Scale your operations <br />
                            <span className="text-gradient">[10x]</span> without hiring <br />
                            <span className="text-white/50">[100]</span> people.
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="max-w-2xl lg:max-w-xl text-lg md:text-xl text-white/60 mb-10 mx-auto lg:mx-0"
                        >
                            Humans should do human work. AI should do everything else. We build the systems that make this happen for high-growth agencies.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
                        >
                            <button
                                onClick={onStartAutomation}
                                onMouseEnter={() => setIsHovered(true)}
                                onMouseLeave={() => setIsHovered(false)}
                                className="w-full sm:w-auto flex items-center justify-center gap-3 bg-white text-black px-8 py-4 rounded-full text-lg font-bold hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                            >
                                Start Your Automation
                                <div className="relative w-5 h-5 overflow-hidden">
                                    <AnimatePresence mode="wait">
                                        {isHovered ? (
                                            <motion.div
                                                key="rocket"
                                                initial={{ y: 20, opacity: 0 }}
                                                animate={{ y: 0, opacity: 1 }}
                                                exit={{ y: -20, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <Rocket className="w-5 h-5 text-primary" />
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key="arrow"
                                                initial={{ y: 20, opacity: 0 }}
                                                animate={{ y: 0, opacity: 1 }}
                                                exit={{ y: -20, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <ArrowRight className="w-5 h-5" />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </button>
                            <button className="w-full sm:w-auto flex items-center justify-center gap-2 glass-morphism px-8 py-4 rounded-full text-lg font-bold hover:bg-white/5 transition-all">
                                <Play className="w-5 h-5 fill-current" />
                                Watch Video
                            </button>
                        </motion.div>
                    </div>

                    {/* Right Column — 3D Spline Scene (40%) — Hidden on mobile */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="hidden lg:block w-full lg:w-[40%] h-[500px] xl:h-[600px] relative"
                    >
                        <SplineScene
                            scene="https://prod.spline.design/HRXMTRjTJgHzNVSW/scene.splinecode"
                            className="w-full h-full"
                        />
                    </motion.div>
                </div>

                {/* Stats Section — Full Width */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                    className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-8"
                >
                    {[
                        { label: 'Successful Deployments', val: '50+' },
                        { label: 'Reduction in processing time', val: '83%' },
                        { label: 'Hours automated for clients', val: '115k' },
                        { label: 'Cost savings delivered', val: '$2.4M' },
                    ].map((stat, i) => (
                        <div key={i} className="text-center">
                            <div className="text-3xl md:text-4xl font-display font-bold mb-2">{stat.val}</div>
                            <div className="text-sm text-white/40">{stat.label}</div>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
};
