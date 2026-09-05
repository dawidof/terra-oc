"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface AdminContextType {
  isAdmin: boolean;
  is_admin_user: boolean;
  toggleAdmin: () => void;
}

const AdminContext = createContext<AdminContextType>({
  isAdmin: false,
  is_admin_user: false,
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

  const is_admin_user = userRole === "admin";

  return (
    <AdminContext.Provider value={{ isAdmin, is_admin_user, toggleAdmin }}>
      {children}
    </AdminContext.Provider>
  );
}
