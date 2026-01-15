const LoadingPage = () => {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-700 border-t-green-500 mb-4"></div>
        <h1 className="text-2xl font-semibold text-gray-400">Cargando...</h1>
      </div>
    </div>
  );
};

export default LoadingPage;
