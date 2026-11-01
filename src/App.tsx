import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ArrowLeft, Compass } from "lucide-react";
import { StoreProvider } from "./lib/store";
import { Layout } from "./components/layout/Layout";
import { Home } from "./pages/Home";
import { Dashboard } from "./pages/Dashboard";
import { Button } from "./components/ui/Button";

function NotFound() {
  return (
    <div className="container-px flex min-h-[62vh] flex-col items-center justify-center py-20 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-2xl border border-white/[0.08] bg-white/[0.03]">
        <Compass className="h-6 w-6 text-violet-300" />
      </span>
      <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
        Error 404
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
        This page took a wrong turn
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-400">
        The page you're looking for doesn't exist or has moved. Head back to the downloader and
        keep saving.
      </p>
      <Button
        href="/"
        className="mt-7"
        leftIcon={<ArrowLeft className="h-4 w-4" />}
        magnetic
      >
        Back to downloader
      </Button>
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </StoreProvider>
  );
}
