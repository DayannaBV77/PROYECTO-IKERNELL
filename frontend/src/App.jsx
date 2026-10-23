import { BrowserRouter } from 'react-router-dom';

import ProveedorSesion from './sesion/ProveedorSesion.jsx';
import AppRouter from './routes/AppRouter.jsx';

/**
 * El proveedor de sesion envuelve al enrutador porque el encabezado y las
 * guardas necesitan la sesion en cualquier ruta, publica o privada.
 */
export default function App() {
  return (
    <BrowserRouter>
      <ProveedorSesion>
        <AppRouter />
      </ProveedorSesion>
    </BrowserRouter>
  );
}
