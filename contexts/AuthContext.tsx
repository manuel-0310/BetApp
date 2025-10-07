import { createContext, useContext, useEffect, useState } from "react";
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
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: userId,         // 👈 importante: coincide con auth.uid
      email: emailFinal,
      name: nombre,
      documento: documento,
      phone: phone,
      gender: gender,
      birth_date: birthDate || null, // 👈 null si no viene
    });

    if (profileError) {
      console.error("🔥 Error al guardar en profiles:", profileError);
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
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return context;
};