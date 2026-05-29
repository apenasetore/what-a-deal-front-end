import { Navbar } from "./components/Navbar";
import { Login } from "./components/Login";
import { ConsumerView } from "./components/ConsumerView";
import { StoreView } from "./components/StoreView";
import { SessionProvider, useSession } from "./context/SessionContext";

function Content() {
  const { role, name } = useSession();

  // Sem nome/papel definido = nao logado.
  if (!name || !role) return <Login />;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-6">
        {role === "store" ? <StoreView /> : <ConsumerView />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <SessionProvider>
      <Content />
    </SessionProvider>
  );
}
