import { BrowserRouter } from 'react-router-dom';

import ProveedorSesion from './sesion/ProveedorSesion.jsx';
import { ProveedorNotificaciones } from './componentes/ui/Notificador.jsx';
import AppRouter from './routes/AppRouter.jsx';

/**
 * El proveedor de sesion y el notificador global envuelven al enrutador
 * para ofrecer alertas dinámicas, confirmaciones y gestión de sesión en toda la app.
 */
export default function App() {
  return (
    <BrowserRouter>
      <ProveedorSesion>
        <ProveedorNotificaciones>
          <AppRouter />
        </ProveedorNotificaciones>
      </ProveedorSesion>
    </BrowserRouter>
  );
}
