import { Routes, Route, Navigate } from "react-router-dom";
import { PublicLayout } from "../layouts/public.layout.tsx";
import { AuthLayout } from "../layouts/auth/auth.layout.tsx";
import { ProtectedRoute } from "./protectedRoute.tsx";
import { PublicRoute } from "./publicRoute.tsx";
// import { PlaceholderPage } from "../pages/placeholder.page.tsx";
// Layouts
import { GenericLayout } from "../layouts/generic.layout.tsx";
// Vistas
import { LoginPage } from "../../modules/login/presentation/login.page.tsx";
import { HomePage } from "../pages/home/home.page.tsx";
import { EmpresasPage } from "../../modules/empresas/presentation/empresas.page.tsx";
import { PersonalPage } from "../../modules/personal/presentation/personal.page.tsx";
import OrganigramaPage from "../../modules/organigrama/presentation/organigrama.page.tsx";
import { RolesPage } from "../../modules/roles/presentation/roles.page.tsx";
import { CuentasPage } from "../../modules/cuentas/presentation/cuentas.page.tsx";
import { PerfilPage } from "../../modules/perfil/presentation/perfil.page.tsx";
import { ProveedoresPage } from "../../modules/proveedores-mineros/presentation/proveedores-page/proveedores.page.tsx";
import { PlantasDestinoPage } from "../../modules/plantas-destino/presentation/plantas-page/plantas.page.tsx";
import { ConductoresPage } from "../../modules/conductores/presentation/conductores-page/conductores.page.tsx";
import { EmpresasTransportePage } from "../../modules/empresas-transporte/presentation/empresas-transporte-page/empresas-transporte.page.tsx";
import { VehiculosPage } from "../../modules/vehiculos/presentation/vehiculos-page/vehiculos.page.tsx";
import { RecepcionUnidadesPage } from "../../modules/recepcion-unidades/presentation/recepcion-unidades.page.tsx";
import { RecepcionVisitasPage } from "../../modules/recepcion-visitas/presentation/recepcion-visitas.page.tsx";
import { RecepcionMineralPage } from "../../modules/recepcion-mineral/presentation/recepcion-mineral.page.tsx";
import { ResumenBalanzaPage } from "../../modules/resumen-balanza/presentation/resumen-balanza.page.tsx";
import { GuiasPrimerTramoPage } from "../../modules/guias-primer-tramo/presentation/guias-primer-tramo.page.tsx";
import { useEffect } from "react";
import { onSocketEvent } from "../../service/_socket.ts";
import { useAuditoriaStore } from "../../stores/auditoria.store.ts";
import ModoAuditoriaPage from "../../modules/modo-auditoria/presentation/ModoAuditoriaPage.tsx";
import { SucursalesPage } from "../../modules/sucursales/presentation/sucursales.page.tsx";
import { GestionLeyesPage } from "../../modules/gestion-leyes/presentation/gestion-leyes.page.tsx";
import { CierreLeyesPage } from "../../modules/cierre-leyes/presentation/cierre-leyes.page.tsx";
import CondicionesComercialesProveedorPage from "../../modules/condiciones-comerciales-proveedor/presentation/condiciones-comerciales-proveedor.page.tsx";
import AnticiposProveedorPage from "../../modules/anticipos-proveedor/presentation/anticipos-proveedor.page.tsx";
import { ValorizacionesCompraPage } from "../../modules/valorizacion-compra/presentation/valorizacion-compra.page.tsx";
import ContabilidadCompraPage from "../../modules/contabilidad-compra/presentation/contabilidad-compra.page.tsx";
import BlendingPage from "../../modules/blending/presentation/blending.page.tsx";

export const App = () => {
  const { setModoAuditoria } = useAuditoriaStore();

  useEffect(() => {
    // Escuchar el evento global de modo auditoría
    const channel = onSocketEvent(
      "global-audit-mode",
      "audit.mode.toggled",
      (data: { en_modo_auditable: boolean }) => {
        console.log("[App] Evento de Auditoría recibido:", data);
        setModoAuditoria(data.en_modo_auditable);
      },
    );

    return () => {
      channel.stopListening(".audit.mode.toggled");
    };
  }, [setModoAuditoria]);

  return (
    <Routes>
      {/* Rutas publicas */}
      <Route
        element={
          <PublicRoute>
            <PublicLayout />
          </PublicRoute>
        }
      >
        <Route path="/login" element={<LoginPage />} />
      </Route>

      {/* Ruta oculta de auditoría (Sin layout) */}
      <Route path="/modo-auditoria" element={<ModoAuditoriaPage />} />

      {/* Rutas protegidas */}
      <Route
        element={
          <ProtectedRoute>
            <AuthLayout />
          </ProtectedRoute>
        }
      >
        {/* Inicio */}
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<HomePage />} />

        {/* Perfil */}
        <Route path="/perfil" element={<PerfilPage />} />

        {/* Configuracion */}
        <Route path="/configuracion" element={<GenericLayout />}>
          {/* Empresas */}
          <Route path="empresas" element={<GenericLayout />}>
            <Route path="empresas" element={<EmpresasPage />} />
            <Route path="sucursales" element={<SucursalesPage />} />
          </Route>

          {/* Personal */}
          <Route path="personal" element={<GenericLayout />}>
            <Route path="areas_cargos" element={<OrganigramaPage />} />
            <Route path="trabajadores" element={<PersonalPage />} />
          </Route>

          {/* Usuarios */}
          <Route path="usuarios" element={<GenericLayout />}>
            <Route path="roles" element={<RolesPage />} />
            <Route path="cuentas" element={<CuentasPage />} />
          </Route>

          {/* Socios Comerciales */}
          <Route path="socios-comerciales" element={<GenericLayout />}>
            <Route path="proveedores-mineros" element={<ProveedoresPage />} />
            <Route
              path="proveedor"
              element={<CondicionesComercialesProveedorPage />}
            />
            <Route path="plantas-destino" element={<PlantasDestinoPage />} />
            <Route
              path="empresas-transporte"
              element={<EmpresasTransportePage />}
            />
          </Route>

          {/* Transporte */}
          <Route path="empresa-transporte" element={<GenericLayout />}>
            <Route path="conductores" element={<ConductoresPage />} />
            <Route path="vehiculos" element={<VehiculosPage />} />
          </Route>
        </Route>

        {/* Operaciones */}
        <Route path="/operaciones" element={<GenericLayout />}>
          <Route path="vigilancia" element={<GenericLayout />}>
            {/* Recepción de Unidades */}
            <Route
              path="recepcion-unidades"
              element={<RecepcionUnidadesPage />}
            />
            {/* Recepción de Visitas */}
            <Route
              path="recepcion-visitas"
              element={<RecepcionVisitasPage />}
            />
          </Route>
          <Route path="balanza" element={<GenericLayout />}>
            {/* Recepción de Minerales */}
            <Route
              path="recepcion-mineral"
              element={<RecepcionMineralPage />}
            />
            {/* Resumen de Balanza */}
            <Route path="resumen-balanza" element={<ResumenBalanzaPage />} />
          </Route>
          <Route path="guias" element={<GenericLayout />}>
            {/* Recepción de Minerales */}
            <Route path="primer-tramo" element={<GuiasPrimerTramoPage />} />
          </Route>
          {/* Gestion Leyes */}
          <Route path="leyes" element={<GenericLayout />}>
            <Route path="configuracion" element={<GestionLeyesPage />} />
            <Route path="cierre-leyes" element={<CierreLeyesPage />} />
          </Route>

          <Route path="anticipos" element={<GenericLayout />}>
            <Route path="proveedor" element={<AnticiposProveedorPage />} />
          </Route>

          {/* Gestion Valorizaciones */}
          <Route path="valorizacion" element={<GenericLayout />}>
            <Route path="compra" element={<ValorizacionesCompraPage />} />
          </Route>

          {/* Gestion Contabilidad */}
          <Route path="contabilidad" element={<GenericLayout />}>
            <Route path="compra" element={<ContabilidadCompraPage />} />
          </Route>

          {/* Blending */}
          <Route path="blending" element={<GenericLayout />}>
            <Route path="blending" element={<BlendingPage />} />
          </Route>
        </Route>

        {/* Redireccion */}
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Route>
    </Routes>
  );
};
