import { useState } from 'react';
import { LogIn, TriangleAlert } from 'lucide-react';

import {
  ETIQUETA_SERVICIO,
  ETIQUETA_TIPO,
  cerrarSesion,
  iniciarSesion,
} from '../../api/autenticacion.js';
import Boton from '../../componentes/ui/Boton.jsx';
import Campo from '../../componentes/ui/Campo.jsx';
import estilos from './PaginaIngreso.module.css';

const VACIO = { correoCorporativo: '', password: '' };

function iniciales(nombreCompleto) {
  return (nombreCompleto || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0].toUpperCase())
    .join('');
}

/**
 * Inicio de sesion de los trabajadores (RF-027, HU-03).
 *
 * Cubre los cinco criterios: abre la sesion con credenciales correctas (C01),
 * muestra los servicios comunes que devuelve el servidor (C02), repite el mismo
 * mensaje generico para credenciales incorrectas y para cuentas inhabilitadas
 * -el backend no distingue entre ambos a proposito- (C03 y C04) y exige los dos
 * datos antes de intentar el acceso (C05).
 *
 * Se adelanto a esta etapa para comprobar de extremo a extremo la parte mas
 * delicada de la integracion: la cookie de sesion y el token CSRF.
 *
 * Las funciones propias de cada tipo de trabajador llegan en las etapas
 * siguientes; hasta entonces esta pantalla no las anuncia como disponibles.
 */
export default function PaginaIngreso() {
  const [valores, setValores] = useState(VACIO);
  const [errores, setErrores] = useState({});
  const [fallo, setFallo] = useState(null);
  const [sesion, setSesion] = useState(null);
  const [enviando, setEnviando] = useState(false);

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
      setSesion(await iniciarSesion(valores));
      setValores(VACIO);
    } catch (error) {
      if (error.campos) {
        setErrores(error.campos);
      }
      setFallo(error.message);
    } finally {
      setEnviando(false);
    }
  }

  async function alSalir() {
    try {
      await cerrarSesion();
    } finally {
      setSesion(null);
    }
  }

  if (sesion) {
    return (
      <div className={estilos.pantalla}>
        <div className={estilos.caja}>
          <div className={estilos.sesion}>
            <div className={estilos.identidad}>
              <span className={estilos.iniciales} aria-hidden="true">
                {iniciales(sesion.nombreCompleto)}
              </span>
              <div>
                <p className={estilos.nombre}>{sesion.nombreCompleto}</p>
                <p className={estilos.detalle}>{sesion.correoCorporativo}</p>
                <span className={estilos.rol}>
                  {ETIQUETA_TIPO[sesion.tipoTrabajador] || sesion.tipoTrabajador}
                </span>
              </div>
            </div>

            <div>
              <p className={estilos.rotulo}>Servicios comunes</p>
              <ul className={estilos.listaServicios}>
                {(sesion.serviciosComunes || []).map((servicio) => (
                  <li key={servicio}>{ETIQUETA_SERVICIO[servicio] || servicio}</li>
                ))}
              </ul>
            </div>

            <p className={estilos.pendiente}>
              Su sesion esta abierta. Las pantallas de gestion correspondientes a su tipo de
              trabajador se incorporan en las siguientes etapas de desarrollo.
            </p>

            <Boton variante="secundario" onClick={alSalir} completo>
              Cerrar sesion
            </Boton>
          </div>
        </div>
      </div>
    );
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
