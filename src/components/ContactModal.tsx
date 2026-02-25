import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Check, Send, User, Mail, MessageSquare } from 'lucide-react';
import { cn } from '../lib/utils';
import { CustomDropdown } from './CustomDropdown';

interface ContactModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ContactModal = ({ isOpen, onClose }: ContactModalProps) => {
    const [status, setStatus] = React.useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [isHovered, setIsHovered] = React.useState(false);
    const [formData, setFormData] = React.useState({
        name: '',
        email: '',
        phone: '',
        serviceType: 'AI Automation',
        description: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');

        try {
            const response = await fetch('https://myna-marketing.app.n8n.cloud/webhook/request-submission', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    source: 'Contact Modal',
                    timestamp: new Date().toISOString()
                })
            });

            if (response.ok) {
                setStatus('success');
                setTimeout(() => {
                    onClose();
                    setStatus('idle');
                    setFormData({ name: '', email: '', phone: '', serviceType: 'AI Automation', description: '' });
                }, 2000);
            } else {
                setStatus('error');
            }
        } catch (error) {
            console.error('Submission error:', error);
            setStatus('error');
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-md bg-[#0A0A0A] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent pointer-events-none" />

                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all z-10"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="p-6 md:p-8 relative">
                            <div className="mb-6">
                                <h2 className="text-2xl font-display font-bold mb-1">Get Started</h2>
                                <p className="text-white/40 text-sm">Tell us about your project and let's build something great.</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Name Field */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-white/60 ml-1 flex items-center gap-2">
                                        <User className="w-3.5 h-3.5 text-primary" />
                                        Full Name
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="John Doe"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 focus:bg-white/[0.08] transition-all"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Email Field */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-white/60 ml-1 flex items-center gap-2">
                                            <Mail className="w-3.5 h-3.5 text-primary" />
                                            Email Address
                                        </label>
                                        <input
                                            required
                                            type="email"
                                            placeholder="john@example.com"
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 focus:bg-white/[0.08] transition-all"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>

                                    {/* Phone Field */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-white/60 ml-1 flex items-center gap-2">
                                            <div className="bg-emerald-500/20 p-0.5 rounded-sm">
                                                <svg className="w-3 h-3 text-emerald-500 fill-current" viewBox="0 0 24 24">
                                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                                </svg>
                                            </div>
                                            Phone Number
                                        </label>
                                        <input
                                            required
                                            type="tel"
                                            placeholder="+1 (555) 000-0000"
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 focus:bg-white/[0.08] transition-all"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Service Type Dropdown */}
                                <CustomDropdown
                                    label="Service Required"
                                    icon={<Send className="w-3.5 h-3.5 text-primary" />}
                                    options={[
                                        { value: 'AI Automation', label: 'AI Automation' },
                                        { value: 'Design Creatives', label: 'Design Creatives' },
                                        { value: 'Digital Marketing', label: 'Digital Marketing' }
                                    ]}
                                    value={formData.serviceType}
                                    onChange={(val) => setFormData({ ...formData, serviceType: val })}
                                />

                                {/* Description Field */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-white/60 ml-1 flex items-center gap-2">
                                        <MessageSquare className="w-3.5 h-3.5 text-primary" />
                                        Project Brief
                                    </label>
                                    <textarea
                                        rows={2}
                                        placeholder="Explain your needs in 1-2 lines..."
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 focus:bg-white/[0.08] transition-all resize-none"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={status === 'loading' || status === 'success'}
                                    onMouseEnter={() => setIsHovered(true)}
                                    onMouseLeave={() => setIsHovered(false)}
                                    className={cn(
                                        "w-full flex items-center justify-center gap-3 px-8 py-3.5 rounded-2xl text-lg font-bold transition-all duration-300",
                                        status === 'success'
                                            ? "bg-emerald-500 text-white"
                                            : status === 'error'
                                                ? "bg-red-500 text-white"
                                                : isHovered
                                                    ? "bg-accent text-white shadow-[0_0_30px_rgba(var(--accent-rgb),0.3)]"
                                                    : "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.1)]",
                                        (status === 'loading' || status === 'success') && "opacity-80 cursor-not-allowed"
                                    )}
                                >
                                    {status === 'loading' ? 'Sending...' : status === 'success' ? 'Request Sent!' : status === 'error' ? 'Error Sending' : 'Submit Request'}
                                    <div className="relative w-5 h-5 overflow-hidden">
                                        <AnimatePresence mode="wait">
                                            {status === 'success' ? (
                                                <motion.div
                                                    key="success"
                                                    initial={{ y: 20, opacity: 0 }}
                                                    animate={{ y: 0, opacity: 1 }}
                                                    transition={{ duration: 0.2 }}
                                                >
                                                    <Check className="w-5 h-5" />
                                                </motion.div>
                                            ) : isHovered ? (
                                                <motion.div
                                                    key="check"
                                                    initial={{ y: 20, opacity: 0 }}
                                                    animate={{ y: 0, opacity: 1 }}
                                                    exit={{ y: -20, opacity: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                >
                                                    <Check className="w-5 h-5" />
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
                            </form>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
