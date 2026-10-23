import { useCallback, useState } from 'react';
import { CircleCheck, Inbox, Mail, TriangleAlert } from 'lucide-react';

import { marcarConsultaAtendida, obtenerConsultas } from '../../api/contenidoAdmin.js';
import EstadoCarga from '../../componentes/estados/EstadoCarga.jsx';
import EstadoError from '../../componentes/estados/EstadoError.jsx';
import EstadoVacio from '../../componentes/estados/EstadoVacio.jsx';
import Boton from '../../componentes/ui/Boton.jsx';
import Campo from '../../componentes/ui/Campo.jsx';
import Seccion from '../../componentes/ui/Seccion.jsx';
import estilos from '../../estilos/gestion.module.css';
import { usePeticion } from '../../hooks/usePeticion.js';

const FILTROS = [
  { valor: '', texto: 'Todas' },
  { valor: 'false', texto: 'Sin atender' },
  { valor: 'true', texto: 'Atendidas' },
];

/**
 * Consultas recibidas por el formulario publico (RF-035, HU-02).
 *
 * HU-02 deja abierto quien las recibe y las atiende, asi que marcar una como
 * atendida es por ahora dejar constancia de que alguien se hizo cargo: el
 * servidor guarda quien y cuando. La respuesta al interesado se envia por fuera
 * del aplicativo, porque no hay nada definido para hacerlo desde aqui.
 *
 * Una consulta no se borra ni se edita: es lo que escribio una persona, y
 * cambiarlo seria falsear lo que dijo.
 */
export default function PaginaConsultas() {
  const [atendida, setAtendida] = useState('');
  const [recarga, setRecarga] = useState(0);
  const [fallo, setFallo] = useState(null);
  const [confirmado, setConfirmado] = useState(null);
  const [marcando, setMarcando] = useState(null);

  const cargar = useCallback(({ senal }) => obtenerConsultas(atendida, { senal }), [atendida]);
  const { datos, error, cargando, reintentar } = usePeticion(cargar, [atendida, recarga]);

  const consultas = datos?.contenido || [];

  async function alAtender(consulta) {
    setMarcando(consulta.id);
    setFallo(null);
    setConfirmado(null);

    try {
      await marcarConsultaAtendida(consulta.id);
      setConfirmado(`La consulta de ${consulta.nombreContacto} quedo marcada como atendida.`);
      setRecarga((numero) => numero + 1);
    } catch (fallaApi) {
      setFallo(fallaApi.message);
    } finally {
      setMarcando(null);
    }
  }

  return (
    <Seccion
      titulo="Consultas recibidas"
      descripcion="Preguntas que los interesados enviaron desde la pagina publica."
      id="consultas"
    >
      <div className={estilos.buscador}>
        <div style={{ maxWidth: '320px' }}>
          <Campo
            etiqueta="Mostrar"
            nombre="atendida"
            opciones={FILTROS}
            textoVacio={null}
            value={atendida}
            onChange={(evento) => setAtendida(evento.target.value)}
          />
        </div>
      </div>

      {confirmado && (
        <p className={estilos.avisoExito} role="status">
          <CircleCheck size={18} aria-hidden="true" />
          {confirmado}
        </p>
      )}

      {fallo && (
        <p className={estilos.avisoError} role="alert">
          <TriangleAlert size={18} aria-hidden="true" />
          {fallo}
        </p>
      )}

      {cargando && <EstadoCarga mensaje="Cargando las consultas..." esqueleto={2} />}

      {!cargando && error && <EstadoError error={error} alReintentar={reintentar} />}

      {/* El aviso de que no hay consultas lo redacta el servidor (RN-14). */}
      {!cargando && !error && consultas.length === 0 && (
        <EstadoVacio mensaje={datos?.mensaje} icono={Inbox} />
      )}

      {!cargando && !error && consultas.length > 0 && (
        <div className={estilos.listaActividades}>
          {consultas.map((consulta) => (
            <article key={consulta.id} className={estilos.actividad}>
              <div className={estilos.actividadCabecera}>
                <div>
                  <p className={estilos.actividadProyecto}>
                    {consulta.nombreContacto}
                    {consulta.recibidaEn && ` · ${consulta.recibidaEn.slice(0, 16).replace('T', ' ')}`}
                  </p>
                  <p className={estilos.actividadDescripcion}>{consulta.pregunta}</p>
                  <p className={estilos.contacto}>
                    <Mail size={14} aria-hidden="true" />
                    <a href={`mailto:${consulta.correoContacto}`}>{consulta.correoContacto}</a>
                    {consulta.telefonoContacto && <span>· {consulta.telefonoContacto}</span>}
                  </p>
                </div>

                <span
                  className={`${estilos.estado} ${
                    consulta.atendida ? estilos.habilitado : estilos.inhabilitado
                  }`}
                >
                  {consulta.atendida ? 'Atendida' : 'Sin atender'}
                </span>
              </div>

              {!consulta.atendida && (
                <Boton
                  variante="secundario"
                  icono={CircleCheck}
                  disabled={marcando === consulta.id}
                  onClick={() => alAtender(consulta)}
                >
                  {marcando === consulta.id ? 'Marcando...' : 'Marcar como atendida'}
                </Boton>
              )}
            </article>
          ))}
        </div>
      )}
    </Seccion>
  );
}
