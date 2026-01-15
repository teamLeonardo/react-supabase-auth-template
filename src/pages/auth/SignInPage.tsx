import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useSession } from "../../context/SessionContext";
import supabase from "../../supabase";

const SignInPage = () => {
  const { session } = useSession();
  const [status, setStatus] = useState("");
  const [formValues, setFormValues] = useState({
    email: "",
    password: "",
  });

  // ==============================
  // If user is already logged in, redirect to home
  // This logic is being repeated in SignIn and SignUp..
  if (session) return <Navigate to="/" />;
  // maybe we can create a wrapper component for these pages
  // just like the ./router/AuthProtectedRoute.tsx? up to you.
  // ==============================

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormValues({ ...formValues, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("Logging in...");
    const { error } = await supabase.auth.signInWithPassword({
      email: formValues.email,
      password: formValues.password,
    });
    if (error) {
      alert(error.message);
    }
    setStatus("");
  };
  return (
    <div className="flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <form
          onSubmit={handleSubmit}
          className="bg-gray-800 rounded-lg p-8 border-t-4 border-green-500 space-y-4"
        >
          <h1 className="text-3xl font-bold text-center mb-6">Iniciar Sesión</h1>
          
          <div>
            <input
              name="email"
              value={formValues.email}
              onChange={handleInputChange}
              type="email"
              placeholder="Email"
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-green-500 transition"
              required
            />
          </div>
          
          <div>
            <input
              name="password"
              value={formValues.password}
              onChange={handleInputChange}
              type="password"
              placeholder="Contraseña"
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-green-500 transition"
              required
            />
          </div>
          
          {status && (
            <p className="text-center text-gray-400 text-sm">{status}</p>
          )}
          
          <button
            type="submit"
            className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 rounded transition font-semibold"
          >
            Iniciar Sesión
          </button>
          
          <Link
            to="/auth/sign-up"
            className="block text-center text-green-400 hover:text-green-300 transition text-sm"
          >
            ¿No tienes una cuenta? Regístrate
          </Link>
        </form>
      </div>
    </div>
  );
};

export default SignInPage;
