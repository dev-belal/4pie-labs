import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ChatWidget } from "@/components/ChatWidget";
import { ModalProvider } from "@/components/modal-provider";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ModalProvider>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[200] focus:px-4 focus:py-2 focus:bg-white focus:text-black focus:rounded-full focus:font-bold"
      >
        Skip to content
      </a>
      <Navbar />
      <div id="main-content" className="flex-1">
        {children}
      </div>
      <Footer />
      <ChatWidget />
    </ModalProvider>
  );
}
