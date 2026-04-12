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
      <Navbar />
      <div className="flex-1">{children}</div>
      <Footer />
      <ChatWidget />
    </ModalProvider>
  );
}
