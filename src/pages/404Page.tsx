import { Link } from "react-router-dom";

const NotFoundPage: React.FC = () => {
  return (
    <div className="flex items-center justify-center py-12 px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-4 text-gray-400">Página No Encontrada</h2>
        <p className="text-gray-500 mb-8">La página que buscas no existe.</p>
        <Link
          to="/"
          className="inline-block px-6 py-3 bg-green-600 hover:bg-green-700 rounded transition font-semibold"
        >
          Volver al Inicio
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
