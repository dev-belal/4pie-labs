import * as React from 'react'
import { Navbar } from './components/Navbar'
import { Hero } from './components/Hero'
import { AnimatePresence } from 'framer-motion'
import { ROICalculator } from './components/ROICalculator'
import { Services } from './components/Services'
import { Timeline } from './components/Timeline'
import { ServicesPage } from './pages/ServicesPage'
import { BlogPage } from './pages/BlogPage'
import { AboutPage } from './pages/AboutPage'
import { Testimonials } from './components/Testimonials'
import { BookingCTA } from './components/BookingCTA'
import { FAQ } from './components/FAQ'
import { BlogSection } from './components/BlogSection'
import { ContactModal } from './components/ContactModal'
import { CustomRequestModal } from './components/CustomRequestModal'
import { AdminLogin } from './pages/AdminLogin'
import { AdminDashboard } from './pages/AdminDashboard'
import { ChatWidget } from './components/ChatWidget'

import { BlogPost as BlogPostType } from './data/blogs'
import { BlogPost } from './components/BlogPost'

function App() {
  const [currentPage, setCurrentPage] = React.useState<'home' | 'blog' | 'services' | 'about' | 'admin-login' | 'admin'>('home');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = React.useState(false);
  const [selectedPost, setSelectedPost] = React.useState<BlogPostType | null>(null);
  const [isContactModalOpen, setIsContactModalOpen] = React.useState(false);
  const [isCustomRequestModalOpen, setIsCustomRequestModalOpen] = React.useState(false);

  const navigateTo = (page: 'home' | 'blog' | 'services' | 'about' | 'admin-login' | 'admin', sectionId?: string) => {
    if (sectionId === 'contact-modal') {
      setIsContactModalOpen(true);
      return;
    }

    // Auth Check for Admin
    if (page === 'admin' && !isAdminAuthenticated) {
      setCurrentPage('admin-login');
    } else {
      setCurrentPage(page);
    }

    setSelectedPost(null); // Reset post selection on navigation
    if (sectionId) {
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      window.scrollTo(0, 0);
    }
  };

  const isAdminPage = currentPage === 'admin-login' || currentPage === 'admin';

  return (
    <main className="min-h-screen bg-background text-white selection:bg-primary/30 scroll-smooth noise-bg">
      {!isAdminPage && (
        <Navbar
          onHome={() => navigateTo('home')}
          onAbout={() => navigateTo('about')}
          onBlog={() => navigateTo('blog')}
          onServices={() => navigateTo('services')}
          onResults={() => navigateTo('home', 'results')}
        />
      )}

      <ChatWidget />

      <ContactModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
      />

      <CustomRequestModal
        isOpen={isCustomRequestModalOpen}
        onClose={() => setIsCustomRequestModalOpen(false)}
      />

      {currentPage === 'home' && (
        <>
          <Hero onStartAutomation={() => setIsContactModalOpen(true)} />
          <ROICalculator />
          <Services
            onSeeMore={() => navigateTo('services')}
            onContactClick={() => setIsContactModalOpen(true)}
          />
          <Timeline />
          <Testimonials />
          <BookingCTA />
          <FAQ />
          <BlogSection
            onViewAll={() => navigateTo('blog')}
            onPostClick={(post) => setSelectedPost(post)}
          />
        </>
      )}

      {currentPage === 'blog' && (
        <BlogPage
          onReadPost={(post) => setSelectedPost(post)}
        />
      )}
      {currentPage === 'services' && (
        <ServicesPage
          onCustomRequest={() => setIsCustomRequestModalOpen(true)}
          onContactClick={() => setIsContactModalOpen(true)}
        />
      )}
      {currentPage === 'about' && <AboutPage onStartAutomation={() => setIsContactModalOpen(true)} />}

      <AnimatePresence>
        {selectedPost && (
          <BlogPost
            post={selectedPost}
            onBack={() => setSelectedPost(null)}
          />
        )}
      </AnimatePresence>

      {currentPage === 'admin-login' && (
        <AdminLogin
          onLogin={() => {
            setIsAdminAuthenticated(true);
            setCurrentPage('admin');
          }}
          onBack={() => navigateTo('home')}
        />
      )}

      {currentPage === 'admin' && isAdminAuthenticated && (
        <AdminDashboard
          onLogout={() => {
            setIsAdminAuthenticated(false);
            navigateTo('home');
          }}
        />
      )}

      <AnimatePresence>
        {selectedPost && (
          <BlogPost
            post={selectedPost}
            onBack={() => setSelectedPost(null)}
          />
        )}
      </AnimatePresence>

      {!isAdminPage && (
        <footer className="pt-24 pb-12 px-4 border-t border-white/5 bg-[#050505] glass-morphism">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-12 items-center md:items-start">
            {/* Left: Logo, Motto, Socials */}
            <div className="text-center md:text-left md:ml-5 flex flex-col items-center md:items-start">
              <div className="flex items-center gap-3 mb-4 justify-center md:justify-start">
                <img
                  src="/logo.png"
                  alt="4Pie Labs Logo"
                  className="h-8 w-auto brightness-0 invert"
                />
              </div>
              <p className="text-white/30 max-w-xs mb-6 px-4 md:px-0">Building the systems that make autonomous agencies possible.</p>
              <div className="flex items-center gap-4 justify-center md:justify-start">
                <a href="https://www.linkedin.com/company/4-pie-labs/" target="_blank" rel="noopener noreferrer" className="text-white/40 transition-all duration-300 hover:text-[#0A66C2] hover:drop-shadow-[0_0_8px_rgba(10,102,194,0.8)]" aria-label="LinkedIn">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                </a>
                <a href="mailto:team@fourpielabs.com" className="text-white/40 transition-all duration-300 hover:text-[#EA4335] hover:drop-shadow-[0_0_8px_rgba(234,67,53,0.8)]" aria-label="Email">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M22 7l-10 7L2 7" /></svg>
                </a>
              </div>
            </div>

            {/* Right: Quick Links + Services */}
            <div className="flex flex-col md:flex-row gap-8 md:gap-16 text-center md:text-left items-center md:items-start">
              <div>
                <h4 className="text-white font-semibold text-sm uppercase tracking-widest mb-4">Quick Links</h4>
                <ul className="space-y-3 text-white/40 text-sm">
                  <li><button onClick={() => navigateTo('home')} className="hover:text-white transition-colors">Home</button></li>
                  <li><button onClick={() => navigateTo('about')} className="hover:text-white transition-colors">About</button></li>
                  <li><button onClick={() => navigateTo('services')} className="hover:text-white transition-colors">Services</button></li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-semibold text-sm uppercase tracking-widest mb-4">Services</h4>
                <ul className="space-y-3 text-white/40 text-sm focus:outline-none">
                  <li><span className="hover:text-white transition-colors cursor-default">AI Automation</span></li>
                  <li><span className="hover:text-white transition-colors cursor-default">Design Creatives</span></li>
                  <li><span className="hover:text-white transition-colors cursor-default">Digital Marketing</span></li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-semibold text-sm uppercase tracking-widest mb-4">Admin</h4>
                <ul className="space-y-3 text-white/40 text-sm">
                  <li><button onClick={() => navigateTo('admin-login')} className="hover:text-white transition-colors">Internal Portal</button></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-12 border-t border-white/5 text-center text-white/20 text-xs">
            © 2026 4Pie Labs AI Automation Agency. All rights reserved.
          </div>
        </footer>
      )}
    </main>
  )
}

export default App
