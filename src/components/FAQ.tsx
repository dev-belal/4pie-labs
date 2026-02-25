import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Lucide from 'lucide-react';

const faqs = [
    {
        q: "What is an AI Operating System?",
        a: "A custom layer of autonomous agents and automated workflows that sits on top of your existing tech stack. It handles repetitive tasks, data processing, and decision-making, allowing your team to focus on high-value strategy."
    },
    {
        q: "What types of businesses do you work with?",
        a: "We work with everyone from startups to established brands. We specialize in industries like healthcare, e-commerce, real estate, SaaS, and professional services looking to scale faster without increasing overhead."
    },
    {
        q: "What services does your agency offer?",
        a: "We sit at the intersection of AI automation and digital marketing. We build custom workflows, chatbots, and lead systems, while also handling SEO, web development, paid ads, and social media strategy."
    },
    {
        q: "How do you ensure quality if you use AI?",
        a: "AI is a tool, not a crutch. We use proprietary workflows to accelerate research and production, but every piece of content undergoes human editorial review to ensure brand voice, accuracy, and SEO compliance."
    },
    {
        q: "What does the process look like?",
        a: "It starts with a strategy call to map your business goals. We then build a custom automation and marketing plan. Once approved, we move quickly into implementation with regular check-ins and performance reporting."
    },
    {
        q: "How long does it take to see results?",
        a: "Automation systems deliver value in 2-4 weeks. SEO and content are longer-term strategies with meaningful traction in 3-6 months. Paid ads can drive results almost immediately once campaigns are optimized."
    },
    {
        q: "Is our data secure with AI?",
        a: "Absolutely. We prioritize enterprise-grade security. We deploy models in secure cloud environments where your data is never used for training public models, ensuring your proprietary info stays yours."
    }
];

export const FAQ = () => {
    const [openIndex, setOpenIndex] = React.useState<number | null>(0);

    return (
        <section id="faq" className="py-24 px-4 bg-background">
            <div className="max-w-3xl mx-auto">
                <div className="text-center mb-20">
                    <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
                        Frequently asked <br />
                        <span className="text-white/50">questions.</span>
                    </h2>
                </div>

                <div className="space-y-4">
                    {faqs.map((faq, i) => (
                        <div key={i} className="glass-morphism rounded-[32px] overflow-hidden border-white/5">
                            <button
                                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                                className="w-full p-6 text-left flex items-center justify-between hover:bg-white/5 transition-colors"
                            >
                                <span className="text-lg font-bold">{faq.q}</span>
                                {openIndex === i ? <Lucide.Minus className="w-5 h-5 text-primary" /> : <Lucide.Plus className="w-5 h-5 text-white/20" />}
                            </button>
                            <AnimatePresence>
                                {openIndex === i && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.15, ease: "easeOut" }}
                                    >
                                        <div className="px-6 pb-6 text-white/50 leading-relaxed">
                                            {faq.a}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
