import { useEffect } from "react";
import { Select } from "@mantine/core";
import { Bars3Icon } from "@heroicons/react/24/outline";
import { UserMenu } from "./user-menu";
import { HeaderAIAssistant } from "./header-ai-assistant";
import { useTitlePage } from "../../../../hooks/useTitlePage";
import { useUIStore } from "../../../../stores/ui.store";
import logoSac from "../../../assets/svg/logo.svg";

interface HeaderProps {
  onMenuToggle: () => void;
}

export const Header = ({ onMenuToggle }: HeaderProps) => {
  const { title } = useTitlePage();
  const ver_sucursal = useUIStore((state) => state.ver_sucursal);
  const sucursales = useUIStore((state) => state.sucursales);
  const sucursal_elegida = useUIStore((state) => state.sucursal_elegida);
  const set_sucursal_elegida = useUIStore((state) => state.set_sucursal_elegida);

  // Auto-selecciona la primera sucursal cuando ver_sucursal se activa y no hay ninguna elegida
  useEffect(() => {
    if (ver_sucursal && sucursales.length > 0 && sucursal_elegida === null) {
      set_sucursal_elegida(sucursales[0]);
    }
  }, [ver_sucursal, sucursales, sucursal_elegida, set_sucursal_elegida]);



  return (
    <header
      className="fixed top-5 left-1/2 -translate-x-1/2 w-[calc(100%-2.5rem)]
      flex items-center justify-between px-6 h-12 bg-white/3 backdrop-blur-2xl 
      rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] z-40 
      transition-all duration-300"
    >
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none p-px overflow-hidden"
        style={{
          WebkitMask:
            "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        }}
      >
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[300%] aspect-square animate-[spin_8s_linear_infinite]"
          style={{
            background:
              "conic-gradient(from 0deg, transparent 0%, rgba(139, 92, 246, 0.4) 15%, transparent 30%, transparent 50%, rgba(59, 130, 246, 0.4) 65%, transparent 80%, transparent 100%)",
          }}
        />
      </div>
      {/* Lado izquierdo (Menu + Logo) */}
      <div className="flex items-center gap-3 relative z-10">
        {/* Icono de menu de navegacion */}
        <button
          onClick={onMenuToggle}
          className="p-2 text-zinc-400 hover:text-white transition-all duration-300 
          hover:bg-white/10 rounded-xl hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] active:scale-95"
          aria-label="Abrir menú"
        >
          <Bars3Icon className="w-5 h-5" />
        </button>
        <img src={logoSac} alt="Logo SAC" className="h-6 w-auto" />
        

        {ver_sucursal && (
          <Select
            placeholder="Sucursal"
            data={sucursales.map((s) => ({ value: String(s.id_sucursal), label: s.nombre }))}
            value={sucursal_elegida ? String(sucursal_elegida.id_sucursal) : null}
            onChange={(val) => {
              const selected = sucursales.find((s) => String(s.id_sucursal) === val) || null;
              set_sucursal_elegida(selected);
            }}
            searchable
            size="xs"
            radius="lg"
            w={180}
            classNames={{
              input: "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300 transition-all",
              dropdown: "bg-zinc-950/90 backdrop-blur-xl border border-zinc-800 rounded-xl shadow-2xl",
              option: [
                "rounded-lg text-xs text-zinc-300 transition-colors",
                "hover:bg-zinc-900 hover:text-white",
                "data-[selected]:bg-indigo-600 data-[selected]:text-white",
              ].join(" "),
            }}
          />
        )}
       
      </div>

      {/* Título (Centrado Absoluto) */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none z-10">
        <span
          className="text-sm font-bold text-white/85 tracking-wide 
          drop-shadow-md"
        >
          {title ? title : "Fabero"}
        </span>
      </div>

      {/* Menu de usuario */}
      <div className="relative z-10 flex items-center gap-2">

        <HeaderAIAssistant />

        <UserMenu />
      </div>

       
    </header>
  );
};
