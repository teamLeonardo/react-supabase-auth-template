import { Link, useLocation } from 'react-router-dom';
import { useSession } from '../hooks/useSession';
import supabase from '../supabase';
import { ContentSendMessage } from './current-send-progress/ContentSendMessage';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { session } = useSession();
  const location = useLocation();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col overflow-hidden">
      {/* Header/Navbar */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link to="/" className="text-xl font-bold text-green-400 hover:text-green-300 transition">
                Wablas Send Masivo
              </Link>
              {session && (
                <nav className="hidden md:flex space-x-4">
                  <Link
                    to="/send-bulk"
                    className={`px-3 py-2 rounded-md text-sm font-medium transition ${location.pathname === '/send-bulk'
                      ? 'bg-green-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }`}
                  >
                    Enviar Mensajes
                  </Link>
                  <Link
                    to="/history"
                    className={`px-3 py-2 rounded-md text-sm font-medium transition ${location.pathname === '/history'
                      ? 'bg-green-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }`}
                  >
                    Historial
                  </Link>
                  <Link
                    to="/devices"
                    className={`px-3 py-2 rounded-md text-sm font-medium transition ${location.pathname === '/devices'
                      ? 'bg-green-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }`}
                  >
                    Devices
                  </Link>
                </nav>
              )}
            </div>
            <div className="flex items-center space-x-4">
              {session ? (
                <>
                  <span className="hidden sm:block text-sm text-gray-400">
                    {session.user.email}
                  </span>
                  <button
                    onClick={handleSignOut}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded transition text-sm"
                  >
                    Cerrar Sesión
                  </button>
                </>
              ) : (
                <div className="flex space-x-2">
                  <Link
                    to="/auth/sign-in"
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded transition text-sm"
                  >
                    Iniciar Sesión
                  </Link>
                  <Link
                    to="/auth/sign-up"
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded transition text-sm font-semibold"
                  >
                    Registrarse
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative w-full overflow-y-auto">
        <div className="max-w-4xl mx-auto! min-h-[calc(100vh-200px)]">
          {children}
        </div>
        
        {/* div current send messages */}
        <ContentSendMessage />
      </main>
    </div>
  );
};

export default Layout;
