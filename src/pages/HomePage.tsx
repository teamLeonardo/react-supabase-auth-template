import { Link } from "react-router-dom";
import { useSession } from "../context/SessionContext";

const HomePage = () => {
  const { session } = useSession();
  return (
    <div className="container mx-auto px-4 py-12">
      <section className="max-w-4xl mx-auto">
        <div className="bg-gray-800 rounded-lg p-8 border-t-4 border-green-500">
          <h1 className="text-3xl font-bold text-center mb-6">Bienvenido a Wablas Send Masivo</h1>
          <p className="text-center text-gray-400 mb-8">
            Sistema de envío masivo de mensajes WhatsApp
          </p>

          {session ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link
                  to="/send-bulk"
                  className="block p-6 bg-green-600 hover:bg-green-700 rounded-lg transition text-center font-semibold text-lg"
                >
                  📨 Enviar Mensajes Masivos
                </Link>
                <Link
                  to="/devices"
                  className="block p-6 bg-blue-600 hover:bg-blue-700 rounded-lg transition text-center font-semibold text-lg"
                >
                  📱 Gestionar Devices
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-center text-gray-400 mb-4">
                Inicia sesión para acceder a las funcionalidades
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link
                  to="/auth/sign-in"
                  className="block px-6 py-3 bg-green-600 hover:bg-green-700 rounded transition text-center font-semibold"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  to="/auth/sign-up"
                  className="block px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded transition text-center"
                >
                  Crear Cuenta
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
