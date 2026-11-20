import { BrowserRouter } from 'react-router-dom';

import ErrorBoundary from './componentes/ErrorBoundary.jsx';
import ProveedorSesion from './sesion/ProveedorSesion.jsx';
import { ProveedorNotificaciones } from './componentes/ui/Notificador.jsx';
import AppRouter from './routes/AppRouter.jsx';

/**
 * El ErrorBoundary global, el proveedor de sesion y el notificador envuelven al
 * enrutador para proteger la experiencia ante fallos inesperados y cambios de sesion.
 */
export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ProveedorSesion>
          <ProveedorNotificaciones>
            <AppRouter />
          </ProveedorNotificaciones>
        </ProveedorSesion>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
