import { useEffect, useCallback } from 'react';
import { usePerfilStore } from './usePerfilStore';
import { PerfilService } from '../service/perfil.service';
import { useAuthStore } from '../../../stores/auth.store';

export const usePerfil = () => {
    const { perfil, loading, setPerfil, setLoading } = usePerfilStore();
    const usuarioAuth = useAuthStore(s => s.usuario);

    const cargarPerfil = useCallback(async () => {
        setLoading(true);
        try {
            const res = await PerfilService.get_perfil();
            if (res.success) {
                setPerfil(res.data);
            }
        } catch (error) {
            console.error('Error al cargar perfil:', error);
        } finally {
            setLoading(false);
        }
    }, [setPerfil, setLoading]);

    useEffect(() => {
        // Necesita carga si:
        //  - No hay perfil cacheado.
        //  - El id_usuario del perfil no coincide con el logueado.
        //  - El perfil fue cargado con un backend viejo y le faltan campos nuevos
        //    (caso de migración: autoriza_ingreso_unidades introducido después).
        const perfilObsoleto =
            perfil !== null &&
            (perfil as { autoriza_ingreso_unidades?: unknown })
                .autoriza_ingreso_unidades === undefined;

        const necesitaCarga =
            !perfil ||
            (usuarioAuth && perfil.id_usuario !== usuarioAuth.id_usuario) ||
            perfilObsoleto;

        if (necesitaCarga && !loading) {
            cargarPerfil();
        }
    }, [perfil, usuarioAuth, cargarPerfil, loading]);

    return {
        perfil,
        loading,
        refetch: cargarPerfil,
    };
};
