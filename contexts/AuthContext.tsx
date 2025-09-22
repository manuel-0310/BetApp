import { createContext, useEffect, useState } from "react";
import { supabase } from "../utils/supabase";

interface AuthContextProps {
  user: any;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<any>;
  register: (
    email: string,
    password: string,
    nombre: string,
    documento: string,
    phone: string,
    gender: string,
    birthDate: string
  ) => Promise<any>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextProps>(
  {} as AuthContextProps
);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // 🔹 LOGIN
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setIsLoading(false);

    if (error) {
      console.error("Login error:", error);
      throw error;
    }

    setUser(data.user ?? data.session?.user ?? null);
    return data;
  };

  // 🔹 REGISTER
  const register = async (
    email: string,
    password: string,
    nombre: string,
    documento: string,
    phone: string,
    gender: string,
    birthDate: string
  ) => {
    setIsLoading(true);

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      console.error("Error al registrar:", error);
      setIsLoading(false);
      throw error;
    }

    const userId = data.user?.id;
    const emailFinal = data.user?.email;

    if (userId && emailFinal) {
      const { error: profileError } = await supabase.from("profiles").insert([
        {
          id: userId,
          name: nombre,
          documento,
          email: emailFinal,
          phone,
          gender,
          birth_date: birthDate, // 👈 se guarda como string YYYY-MM-DD
        },
      ]);

      if (profileError) {
        console.error("🔥 Error al guardar en profiles:", profileError);
        // no lanzamos error porque el usuario sí quedó creado en Auth
      }

      setUser(data.user);
    }

    setIsLoading(false);
    return data;
  };

  // 🔹 RESET PASSWORD
  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  };

  // 🔹 LOGOUT
  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        resetPassword,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
