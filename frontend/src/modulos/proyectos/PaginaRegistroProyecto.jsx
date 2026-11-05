import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, TriangleAlert } from 'lucide-react';

import { registrarProyecto } from '../../api/proyectos.js';
import Boton from '../../componentes/ui/Boton.jsx';
import Campo from '../../componentes/ui/Campo.jsx';
import Confirmacion from '../../componentes/ui/Confirmacion.jsx';
import Seccion from '../../componentes/ui/Seccion.jsx';
import estilos from '../../estilos/gestion.module.css';

const VACIO = { nombre: '', descripcion: '', reporteExternoAutorizado: false };

export default function PaginaRegistroProyecto() {
  const navegar = useNavigate();

  const [valores, setValores] = useState(VACIO);
  const [errores, setErrores] = useState({});
  const [fallo, setFallo] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [mostrarConfirmacionVolver, setMostrarConfirmacionVolver] = useState(false);

  const hayCambios = Boolean(valores.nombre.trim() || valores.descripcion.trim() || valores.reporteExternoAutorizado);

  function alIntentarVolver(e) {
    if (e) e.preventDefault();
    if (hayCambios) {
      setMostrarConfirmacionVolver(true);
    } else {
      navegar('/app/proyectos');
    }
  }

  function alCambiar(evento) {
    const { name, type, checked, value } = evento.target;
    const siguiente = type === 'checkbox' ? checked : value;
    setValores((previos) => ({ ...previos, [name]: siguiente }));
    setErrores((previos) => (previos[name] ? { ...previos, [name]: undefined } : previos));
  }

  async function alEnviar(evento) {
    evento.preventDefault();
    setFallo(null);
    setErrores({});

    const nuevosErrores = {};
    if (!valores.nombre.trim()) {
      nuevosErrores.nombre = 'El nombre del proyecto es obligatorio.';
    } else if (valores.nombre.trim().length < 3) {
      nuevosErrores.nombre = 'El nombre del proyecto debe tener al menos 3 caracteres.';
    } else if (valores.nombre.trim().length > 150) {
      nuevosErrores.nombre = 'El nombre no puede exceder 150 caracteres.';
    }

    if (valores.descripcion && valores.descripcion.length > 2000) {
      nuevosErrores.descripcion = 'La descripción no puede superar los 2000 caracteres.';
    }

    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      return;
    }

    setGuardando(true);
    try {
      const creado = await registrarProyecto({
        ...valores,
        nombre: valores.nombre.trim(),
        descripcion: valores.descripcion.trim(),
      });
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
        <Boton type="button" onClick={alIntentarVolver} variante="texto" icono={ArrowLeft}>
          Volver a la busqueda
        </Boton>
      </div>

      <Confirmacion
        abierto={mostrarConfirmacionVolver}
        titulo="¿Desea salir sin guardar?"
        textoConfirmar="Salir y descartar"
        alConfirmar={() => {
          setMostrarConfirmacionVolver(false);
          navegar('/app/proyectos');
        }}
        alCancelar={() => setMostrarConfirmacionVolver(false)}
      >
        <p>
          Hay datos ingresados en el formulario de registro del proyecto. Si vuelve a la búsqueda ahora, se
          perderán todos los cambios de esta operación.
        </p>
      </Confirmacion>

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

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
          <input
            id="reporteExternoAutorizado"
            name="reporteExternoAutorizado"
            type="checkbox"
            checked={Boolean(valores.reporteExternoAutorizado)}
            onChange={alCambiar}
          />
          <label htmlFor="reporteExternoAutorizado">Autorizado para reporte externo</label>
        </div>
        <p className={estilos.notaDialogo}>
          Solo los proyectos con esta marca pueden entregarse a la empresa brasileña aliada.
        </p>

        <div className={estilos.accionesBuscador}>
          <Boton type="submit" icono={Save} disabled={guardando}>
            {guardando ? 'Guardando...' : 'Guardar proyecto'}
          </Boton>
        </div>
      </form>
    </Seccion>
  );
}
