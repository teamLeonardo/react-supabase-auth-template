import { useSession } from "../context/SessionContext";

const ProtectedPage = () => {
  const { session } = useSession();
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-800 rounded-lg p-8 border-t-4 border-green-500">
          <h1 className="text-3xl font-bold mb-4">Página Protegida</h1>
          <p className="text-gray-400">
            Usuario actual: <span className="text-white font-medium">{session?.user.email || "Ninguno"}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProtectedPage;
