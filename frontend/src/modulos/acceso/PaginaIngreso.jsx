import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { LogIn, TriangleAlert } from 'lucide-react';

import EstadoCarga from '../../componentes/estados/EstadoCarga.jsx';
import Boton from '../../componentes/ui/Boton.jsx';
import Campo from '../../componentes/ui/Campo.jsx';
import { useSesion } from '../../sesion/contexto.js';
import estilos from './PaginaIngreso.module.css';

const VACIO = { correoCorporativo: '', password: '' };

/**
 * Inicio de sesion de los trabajadores (RF-027, HU-03).
 *
 * Cubre los cinco criterios: abre la sesion con credenciales correctas (C01),
 * repite el mismo mensaje generico para credenciales incorrectas y para cuentas
 * inhabilitadas -el backend no distingue entre ambos a proposito- (C03 y C04) y
 * exige los dos datos antes de intentar el acceso (C05). Los servicios comunes
 * de C02 se muestran ya dentro, en el panel.
 *
 * Quien llega aqui con la sesion abierta no ve el formulario: se le lleva a su
 * destino. Si la guarda lo mando aqui desde una ruta privada, ese destino es la
 * ruta que pedia, para no obligarle a buscarla de nuevo.
 */
export default function PaginaIngreso() {
  const { sesion, comprobando, entrar } = useSesion();
  const ubicacion = useLocation();

  const [valores, setValores] = useState(VACIO);
  const [errores, setErrores] = useState({});
  const [fallo, setFallo] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const destino = ubicacion.state?.destino || '/app';

  function alCambiar(evento) {
    const { name, value } = evento.target;
    setValores((previos) => ({ ...previos, [name]: value }));
    setErrores((previos) => (previos[name] ? { ...previos, [name]: undefined } : previos));
  }

  async function alEnviar(evento) {
    evento.preventDefault();
    setEnviando(true);
    setFallo(null);
    setErrores({});

    try {
      await entrar(valores);
      setValores(VACIO);
    } catch (error) {
      // `campos` llega solo en los errores de validacion y permite marcar cada
      // campo sin descartar lo que la persona ya escribio (RN-13).
      if (error.campos) {
        setErrores(error.campos);
      }
      setFallo(error.message);
    } finally {
      setEnviando(false);
    }
  }

  if (comprobando) {
    return <EstadoCarga mensaje="Comprobando la sesion..." />;
  }

  if (sesion) {
    return <Navigate to={destino} replace />;
  }

  return (
    <div className={estilos.pantalla}>
      <div className={estilos.caja}>
        <h1 className={estilos.titulo}>Iniciar sesion</h1>
        <p className={estilos.introduccion}>
          Acceso para los trabajadores de IKernell Soluciones Software.
        </p>

        {fallo && (
          <p className={estilos.aviso} role="alert">
            <TriangleAlert size={18} className={estilos.iconoAviso} aria-hidden="true" />
            {fallo}
          </p>
        )}

        <form className={estilos.formulario} onSubmit={alEnviar} noValidate>
          <Campo
            etiqueta="Correo corporativo"
            nombre="correoCorporativo"
            tipo="email"
            obligatorio
            value={valores.correoCorporativo}
            onChange={alCambiar}
            error={errores.correoCorporativo}
            autoComplete="username"
          />
          <Campo
            etiqueta="Contrasena"
            nombre="password"
            tipo="password"
            obligatorio
            value={valores.password}
            onChange={alCambiar}
            error={errores.password}
            autoComplete="current-password"
          />
          <Boton type="submit" icono={LogIn} disabled={enviando} completo>
            {enviando ? 'Validando...' : 'Entrar'}
          </Boton>
        </form>
      </div>
    </div>
  );
}
