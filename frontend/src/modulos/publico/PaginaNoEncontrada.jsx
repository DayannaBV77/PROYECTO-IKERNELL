import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Compass, LayoutDashboard, Home } from 'lucide-react';

import Boton from '../../componentes/ui/Boton.jsx';
import Seccion from '../../componentes/ui/Seccion.jsx';
import { useSesion } from '../../sesion/contexto.js';

/** Ruta inexistente (404): mantiene la sesion y navegacion intactas y ofrece retorno claro. */
export default function PaginaNoEncontrada() {
  const { sesion } = useSesion();
  const ubicacion = useLocation();
  const navegar = useNavigate();

  const enZonaPrivada = Boolean(sesion) || ubicacion.pathname.startsWith('/app');
  const rutaDestino = sesion ? '/app' : '/';
  const textoDestino = sesion ? 'Regresar al Panel Principal' : 'Volver al inicio';
  const iconoDestino = sesion ? LayoutDashboard : Home;

  return (
    <Seccion
      titulo="404 — Ruta no encontrada"
      descripcion={
        enZonaPrivada
          ? 'La dirección solicitada no existe dentro del espacio de trabajo o el enlace ya no está disponible.'
          : 'La dirección que abrió no corresponde a ninguna sección del portal. Es posible que el enlace esté desactualizado.'
      }
    >
      <div
        data-testid="not-found-page"
        style={{
          maxWidth: '520px',
          margin: '0 auto',
          padding: '2rem',
          borderRadius: '14px',
          border: '1px solid var(--c-borde, #e5e7eb)',
          backgroundColor: 'var(--c-superficie, #ffffff)',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: 'rgba(14, 165, 233, 0.1)',
            color: 'var(--c-turquesa-fuerte, #0284c7)',
            marginBottom: '1rem',
          }}
        >
          <Compass size={24} aria-hidden="true" />
        </div>
        <p
          style={{
            margin: '0 0 1.25rem',
            fontSize: '0.92rem',
            color: 'var(--c-texto-tenue, #6b7280)',
            lineHeight: 1.55,
          }}
        >
          Ruta consultada: <code>{ubicacion.pathname}</code>
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Boton a={rutaDestino} variante="primario" icono={iconoDestino}>
            {textoDestino}
          </Boton>
          <Boton variante="secundario" icono={ArrowLeft} onClick={() => navegar(-1)}>
            Regresar
          </Boton>
        </div>
      </div>
    </Seccion>
  );
}
