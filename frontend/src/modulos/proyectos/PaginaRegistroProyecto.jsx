import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, TriangleAlert } from 'lucide-react';

import { registrarProyecto } from '../../api/proyectos.js';
import Boton from '../../componentes/ui/Boton.jsx';
import Campo from '../../componentes/ui/Campo.jsx';
import Seccion from '../../componentes/ui/Seccion.jsx';
import estilos from '../../estilos/gestion.module.css';

const VACIO = { nombre: '', descripcion: '' };

/**
 * Registro de un proyecto (RF-008, HU-08).
 *
 * Solo dos campos, y es deliberado: RF-008 habla de "los datos identificativos
 * y descriptivos que defina la empresa" sin enumerarlos, y HU-08 T1 lo deja
 * como acuerdo pendiente (D-02). El backend admite nombre y descripcion, que
 * son los dos deducibles de los documentos, asi que el formulario no ofrece
 * campos que no se podrian guardar.
 *
 * El identificador lo asigna el servidor (C01) y por eso no se pide: es lo que
 * garantiza que ninguno se repita (C03).
 *
 * C04 -el proyecto queda habilitado y disponible para asignarle desarrolladores
 * y etapas- lo cumple el servidor, que lo crea habilitado.
 */
export default function PaginaRegistroProyecto() {
  const navegar = useNavigate();

  const [valores, setValores] = useState(VACIO);
  const [errores, setErrores] = useState({});
  const [fallo, setFallo] = useState(null);
  const [guardando, setGuardando] = useState(false);

  function alCambiar(evento) {
    const { name, value } = evento.target;
    setValores((previos) => ({ ...previos, [name]: value }));
    setErrores((previos) => (previos[name] ? { ...previos, [name]: undefined } : previos));
  }

  async function alEnviar(evento) {
    evento.preventDefault();
    setGuardando(true);
    setFallo(null);
    setErrores({});

    try {
      const creado = await registrarProyecto(valores);
      navegar(`/app/proyectos/${creado.id}`, { replace: true, state: { registrado: true } });
    } catch (error) {
      // C02: se indica que falta y se conserva lo escrito (RN-13).
      if (error.campos) {
        setErrores(error.campos);
      }
      setFallo(error.message);
      setGuardando(false);
    }
  }

  return (
    <Seccion
      titulo="Registrar proyecto"
      descripcion="El identificador del proyecto lo asigna el sistema al guardarlo."
      id="registro-proyecto"
    >
      <div className={estilos.barraSuperior}>
        <Boton a="/app/proyectos" variante="texto" icono={ArrowLeft}>
          Volver a la busqueda
        </Boton>
      </div>

      {fallo && (
        <p className={estilos.avisoError} role="alert">
          <TriangleAlert size={18} aria-hidden="true" />
          {fallo}
        </p>
      )}

      <form className={estilos.formulario} onSubmit={alEnviar} noValidate>
        <Campo
          etiqueta="Nombre del proyecto"
          nombre="nombre"
          obligatorio
          value={valores.nombre}
          onChange={alCambiar}
          error={errores.nombre}
        />
        <Campo
          etiqueta="Descripcion"
          nombre="descripcion"
          area
          rows={6}
          value={valores.descripcion}
          onChange={alCambiar}
          error={errores.descripcion}
          pista="Opcional. Hasta 2000 caracteres."
        />

        <div className={estilos.accionesBuscador}>
          <Boton type="submit" icono={Save} disabled={guardando}>
            {guardando ? 'Guardando...' : 'Guardar proyecto'}
          </Boton>
        </div>
      </form>
    </Seccion>
  );
}
