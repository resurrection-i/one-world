import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Layout } from "@/components/Layout";

const Home = lazy(() => import("@/pages/Home"));
const MintLaunch = lazy(() => import("@/pages/MintLaunch"));
const MintLaunches = lazy(() => import("@/pages/MintLaunches"));
const MintProjectDetail = lazy(() => import("@/pages/MintProjectDetail"));
const MemeLaunch = lazy(() => import("@/pages/MemeLaunch"));
const Game = lazy(() => import("@/pages/Game"));

function PageLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center text-sm text-[#64748B]">
      <Loader2 className="mr-2 h-4 w-4 animate-spin text-[#B8860B]" />
      页面加载中…
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Layout>
        <Suspense fallback={<PageLoading />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/mint" element={<MintLaunch />} />
            <Route path="/mint-project/:token" element={<MintProjectDetail />} />
            <Route path="/mint-launches" element={<MintLaunches />} />
            <Route path="/meme-launch" element={<MemeLaunch />} />
            <Route path="/game" element={<Game />} />
          </Routes>
        </Suspense>
      </Layout>
    </Router>
  );
}
