// lib/UserContext.js
import "regenerator-runtime/runtime";  // Thêm import này để xử lý lỗi regeneratorRuntime
import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "./supabase";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

useEffect(() => {
  const fetchInitialUser = async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) {
      setUser(data.session.user);
    }
  };

  fetchInitialUser();

  const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
    setUser(session?.user ?? null);
  });

  return () => {
    listener.subscription.unsubscribe();
  };
}, []);


  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
