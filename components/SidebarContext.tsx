"use client";

import { createContext, useContext, useState } from "react";

type SidebarContextValue = {
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
  collapsed: boolean;
  toggleCollapsed: () => void;
};

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <SidebarContext.Provider
      value={{
        isOpen,
        toggle: () => {
          // On desktop (lg+) the same button collapses to an icon rail;
          // on mobile it opens/closes the drawer. We can't reliably read
          // viewport width here without a listener, so both toggles are
          // exposed and the button below picks based on window width.
          if (typeof window !== "undefined" && window.innerWidth >= 1024) {
            setCollapsed((c) => !c);
          } else {
            setIsOpen((o) => !o);
          }
        },
        close: () => setIsOpen(false),
        collapsed,
        toggleCollapsed: () => setCollapsed((c) => !c),
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within SidebarProvider");
  return ctx;
}
