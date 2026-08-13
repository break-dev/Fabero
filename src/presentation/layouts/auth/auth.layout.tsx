import { Outlet, useLocation } from "react-router-dom";
import { motion } from "motion/react";
import { Navbar } from "./components/navbar";
import { Header } from "./components/header";
import { GlobalNotification } from "./components/global-notification";
import { GlobalBlackcito } from "./components/global-blackcito";
import { useAuthLayout } from "./hooks/useAuthLayout";
import { GlobalPrinterPortal } from "../../utils/printer/GlobalPrinterPortal";
import { GlobalExcelPortal } from "../../utils/excel/GlobalExcelPortal";
import { AIAssistantPanel } from "./components/ai-assistant-panel";
import { ModuleAIContextBridge } from "./components/module-ai-context-bridge";

export const AuthLayout = () => {
  const { open, setOpen } = useAuthLayout();
  const { pathname } = useLocation();

  return (
    <div className="relative min-h-screen w-full bg-[#030303] text-zinc-100 flex flex-col overflow-hidden">
      <style>
        {`
          @keyframes blob1 {
            0% { transform: translate(0px, 0px) scale(1); }
            33% { transform: translate(30vw, -15vh) scale(1.1); }
            66% { transform: translate(-20vw, 20vh) scale(0.9); }
            100% { transform: translate(0px, 0px) scale(1); }
          }
          @keyframes blob2 {
            0% { transform: translate(0px, 0px) scale(1); }
            33% { transform: translate(-25vw, 25vh) scale(1.2); }
            66% { transform: translate(20vw, -20vh) scale(0.8); }
            100% { transform: translate(0px, 0px) scale(1); }
          }
          @keyframes blob3 {
            0% { transform: translate(0px, 0px) scale(1); }
            33% { transform: translate(25vw, -30vh) scale(0.9); }
            66% { transform: translate(-25vw, 25vh) scale(1.1); }
            100% { transform: translate(0px, 0px) scale(1); }
          }
          .animate-blob1 { animation: blob1 25s infinite alternate ease-in-out; }
          .animate-blob2 { animation: blob2 30s infinite alternate ease-in-out; }
          .animate-blob3 { animation: blob3 35s infinite alternate ease-in-out; }
        `}
      </style>
      {/* Background Mesh Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-600/13 blur-[120px] pointer-events-none mix-blend-screen animate-blob1" />
      <div className="absolute top-[10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-violet-600/13 blur-[120px] pointer-events-none mix-blend-screen animate-blob2" />
      <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[50%] rounded-full bg-fuchsia-600/13 blur-[120px] pointer-events-none mix-blend-screen animate-blob3" />

      {/* Capa de contenido */}
      <div className="relative z-10 flex flex-col flex-1">
        <ModuleAIContextBridge />
        <Header onMenuToggle={() => setOpen(true)} />
        {open && <Navbar onClose={() => setOpen(false)} />}
        <GlobalNotification />
        <GlobalBlackcito />
        <AIAssistantPanel />

        <main className="flex-1 mx-auto w-full pt-22 px-4 pb-10 overflow-hidden relative">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="w-full min-h-[calc(100vh-160px)]"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
      <GlobalPrinterPortal />
      <GlobalExcelPortal />
    </div>
  );
};
