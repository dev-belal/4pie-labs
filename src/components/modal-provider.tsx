"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ContactModal } from "./ContactModal";
import { CustomRequestModal } from "./CustomRequestModal";

type ModalContextValue = {
  openContact: () => void;
  closeContact: () => void;
  openCustomRequest: () => void;
  closeCustomRequest: () => void;
};

const ModalContext = createContext<ModalContextValue | null>(null);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isCustomRequestOpen, setIsCustomRequestOpen] = useState(false);

  const openContact = useCallback(() => setIsContactOpen(true), []);
  const closeContact = useCallback(() => setIsContactOpen(false), []);
  const openCustomRequest = useCallback(() => setIsCustomRequestOpen(true), []);
  const closeCustomRequest = useCallback(() => setIsCustomRequestOpen(false), []);

  const value = useMemo(
    () => ({ openContact, closeContact, openCustomRequest, closeCustomRequest }),
    [openContact, closeContact, openCustomRequest, closeCustomRequest],
  );

  return (
    <ModalContext.Provider value={value}>
      {children}
      <ContactModal isOpen={isContactOpen} onClose={closeContact} />
      <CustomRequestModal
        isOpen={isCustomRequestOpen}
        onClose={closeCustomRequest}
      />
    </ModalContext.Provider>
  );
}

export function useModals() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useModals must be used within <ModalProvider>");
  return ctx;
}
