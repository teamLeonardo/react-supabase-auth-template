import { Outlet } from "react-router-dom";
import { SessionProvider } from "./context/SessionContext";
import { QueryProvider } from "./providers/QueryProvider";
import Layout from "./components/Layout";

const Providers = () => {
  return (
    <QueryProvider>
      <SessionProvider>
        <Layout>
          <Outlet />
        </Layout>
      </SessionProvider>
    </QueryProvider>
  );
};

export default Providers;
