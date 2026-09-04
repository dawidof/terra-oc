"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface AdminContextType {
  isAdmin: boolean;
  toggleAdmin: () => void;
}

const AdminContext = createContext<AdminContextType>({
  isAdmin: false,
  toggleAdmin: () => {},
});

export function useAdmin() {
  return useContext(AdminContext);
}

export function AdminProvider({ children, userRole }: { children: ReactNode; userRole?: string }) {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("adminMode");
    if (saved === "true" && userRole === "admin") {
      setIsAdmin(true);
    }
  }, [userRole]);

  function toggleAdmin() {
    if (userRole !== "admin") return;
    setIsAdmin((prev) => {
      const next = !prev;
      localStorage.setItem("adminMode", String(next));
      return next;
    });
  }

  return (
    <AdminContext.Provider value={{ isAdmin, toggleAdmin }}>
      {children}
    </AdminContext.Provider>
  );
}
