import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, TriangleAlert } from 'lucide-react';

import { registrarActividad } from '../../api/actividades.js';
import Boton from '../../componentes/ui/Boton.jsx';
import Campo from '../../componentes/ui/Campo.jsx';
import Confirmacion from '../../componentes/ui/Confirmacion.jsx';
import Seccion from '../../componentes/ui/Seccion.jsx';
import estilos from '../../estilos/gestion.module.css';
import {
  useContextoDeProyecto,
  useProyectosComoOpciones,
} from './componentes/useContextoDeProyecto.js';

const VACIO = { proyectoId: '', etapaId: '', desarrolladorId: '', descripcion: '' };

/**
 * Registro de una actividad (RF-019, HU-13 C01 y C02).
 *
 * C01 describe la secuencia: se elige un proyecto, una etapa y un
 * desarrollador, y se escribe la descripcion. Los tres primeros son
 * desplegables encadenados porque la etapa y el desarrollador solo tienen
 * sentido dentro del proyecto elegido.
 *
 * El desarrollador sale del equipo del proyecto, asi que lo normal es que ya
 * este asignado. Si no lo estuviera -porque dejo de estarlo entre que se cargo
 * la lista y se guardo-, el servidor responde 409 con la advertencia y no
 * guarda nada; entonces se pide confirmacion y se repite (D-24). El cliente no
 * decide saltarse ese paso.
 */
export default function PaginaRegistroActividad() {
  const navegar = useNavigate();

  const [valores, setValores] = useState(VACIO);
  const [errores, setErrores] = useState({});
  const [fallo, setFallo] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [advertencias, setAdvertencias] = useState(null);

  const { opcionesDeProyecto } = useProyectosComoOpciones({ soloHabilitados: true });
  const { opcionesDeEtapa, opcionesDeDesarrollador } = useContextoDeProyecto(valores.proyectoId);

  function alCambiar(evento) {
    const { name, value } = evento.target;
    setValores((previos) =>
      name === 'proyectoId'
        ? { ...previos, proyectoId: value, etapaId: '', desarrolladorId: '' }
        : { ...previos, [name]: value },
    );
    setErrores((previos) => (previos[name] ? { ...previos, [name]: undefined } : previos));
  }

  async function guardar(confirmado) {
    setGuardando(true);
    setFallo(null);
    setErrores({});

    try {
      const creada = await registrarActividad(
        valores.proyectoId,
        {
          etapaId: valores.etapaId ? Number(valores.etapaId) : null,
          desarrolladorId: valores.desarrolladorId ? Number(valores.desarrolladorId) : null,
          descripcion: valores.descripcion,
        },
        confirmado,
      );
      setAdvertencias(null);
      navegar(`/app/actividades/${creada.id}`, { replace: true, state: { registrada: true } });
    } catch (error) {
      if (error.requiereConfirmacion) {
        setAdvertencias(error.advertencias);
        return;
      }
      // C02: se indica que completar y el formulario conserva lo escrito.
      if (error.campos) {
        setErrores(error.campos);
      }
      setFallo(error.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Seccion
      titulo="Registrar actividad"
      descripcion="La actividad queda asociada al proyecto, a la etapa y al desarrollador elegidos."
      id="registro-actividad"
    >
      <div className={estilos.barraSuperior}>
        <Boton a="/app/actividades" variante="texto" icono={ArrowLeft}>
          Volver a la busqueda
        </Boton>
      </div>

      {fallo && (
        <p className={estilos.avisoError} role="alert">
          <TriangleAlert size={18} aria-hidden="true" />
          {fallo}
        </p>
      )}

      <form
        className={estilos.formulario}
        onSubmit={(evento) => {
          evento.preventDefault();
          guardar(false);
        }}
        noValidate
      >
        <div className={estilos.criterios}>
          <Campo
            etiqueta="Proyecto"
            nombre="proyectoId"
            opciones={opcionesDeProyecto}
            obligatorio
            value={valores.proyectoId}
            onChange={alCambiar}
            error={errores.proyectoId}
          />
          <Campo
            etiqueta="Etapa"
            nombre="etapaId"
            opciones={opcionesDeEtapa}
            obligatorio
            value={valores.etapaId}
            onChange={alCambiar}
            error={errores.etapaId}
            disabled={!valores.proyectoId}
            pista={valores.proyectoId ? undefined : 'Elija primero un proyecto.'}
          />
          <Campo
            etiqueta="Desarrollador"
            nombre="desarrolladorId"
            opciones={opcionesDeDesarrollador}
            obligatorio
            value={valores.desarrolladorId}
            onChange={alCambiar}
            error={errores.desarrolladorId}
            disabled={!valores.proyectoId}
            pista={
              valores.proyectoId
                ? 'Se ofrecen los desarrolladores del equipo del proyecto.'
                : 'Elija primero un proyecto.'
            }
          />
        </div>

        <Campo
          etiqueta="Descripcion de la actividad"
          nombre="descripcion"
          area
          rows={5}
          obligatorio
          value={valores.descripcion}
          onChange={alCambiar}
          error={errores.descripcion}
        />

        <div className={estilos.accionesBuscador}>
          <Boton type="submit" icono={Save} disabled={guardando}>
            {guardando ? 'Guardando...' : 'Guardar actividad'}
          </Boton>
        </div>
      </form>

      {/* D-24: el servidor pide confirmacion cuando el desarrollador no esta
          asignado al proyecto, y no guarda nada hasta recibirla. */}
      <Confirmacion
        abierto={advertencias !== null}
        titulo="Confirmar el registro"
        textoConfirmar="Registrar de todos modos"
        varianteConfirmar="primario"
        ocupado={guardando}
        alConfirmar={() => guardar(true)}
        alCancelar={() => setAdvertencias(null)}
      >
        <p>El servidor advierte lo siguiente:</p>
        <ul className={estilos.advertencias}>
          {(advertencias || []).map((advertencia) => (
            <li key={advertencia}>{advertencia}</li>
          ))}
        </ul>
      </Confirmacion>
    </Seccion>
  );
}
