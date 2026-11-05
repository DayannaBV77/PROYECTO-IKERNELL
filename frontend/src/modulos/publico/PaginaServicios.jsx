import { useState } from 'react';
import { CheckCircle2, ChevronRight, Layers, Sparkles } from 'lucide-react';
import { TIPOS_CONTENIDO } from '../../api/contenidoPublico.js';
import { iconoParaTitulo } from '../../utilidades/iconos.js';
import SeccionContenido from './componentes/SeccionContenido.jsx';
import estilos from './PaginaServicios.module.css';

/**
 * Portafolio interactivo de servicios corporativos (RF-032, HU-01 C02).
 *
 * Permite explorar de forma dinámica y amplia cada servicio mediante pestañas
 * y vitrina interactiva en lugar de saturar de cuadros repetitivos.
 */
export default function PaginaServicios() {
  const [servicioSeleccionadoId, setServicioSeleccionadoId] = useState(null);

  return (
    <SeccionContenido
      tipo={TIPOS_CONTENIDO.PORTAFOLIO_SERVICIO}
      titulo="Portafolio de servicios corporativos"
      descripcion="Soluciones tecnológicas integrales diseñadas con rigor de ingeniería para empresas que buscan innovación y estabilidad."
      fondo="tenue"
      id="servicios"
      esqueleto={4}
    >
      {(contenido) => {
        const servicioActivo =
          contenido.find((s) => s.id === servicioSeleccionadoId) || contenido[0];
        const IconoActivo = iconoParaTitulo(servicioActivo?.titulo);

        return (
          <div className={estilos.serviciosModernos}>
            {/* Pestañas de Navegación Rápida */}
            <div className={estilos.selectorServicios} role="tablist" aria-label="Lista de servicios">
              {contenido.map((servicio) => {
                const esActivo = servicio.id === servicioActivo?.id;
                const IconoTab = iconoParaTitulo(servicio.titulo);
                return (
                  <button
                    key={servicio.id}
                    type="button"
                    role="tab"
                    aria-selected={esActivo}
                    className={`${estilos.pestanaServicio} ${esActivo ? estilos.pestanaActiva : ''}`}
                    onClick={() => setServicioSeleccionadoId(servicio.id)}
                  >
                    <IconoTab size={16} aria-hidden="true" />
                    <span>{servicio.titulo}</span>
                  </button>
                );
              })}
            </div>

            {/* Vitrina Amplia del Servicio Seleccionado */}
            {servicioActivo && (
              <div className={estilos.panelServicioDetalle} key={servicioActivo.id}>
                <div className={estilos.ladoVisual}>
                  <div className={estilos.iconoServicioGrande}>
                    <IconoActivo size={36} aria-hidden="true" />
                  </div>
                  <span className={estilos.badgeCategoria}>Solución Especializada</span>
                  <h3 className={estilos.tituloServicioGrande}>{servicioActivo.titulo}</h3>
                </div>

                <div className={estilos.ladoContenido}>
                  <p className={estilos.descripcionServicio}>{servicioActivo.cuerpo}</p>

                  <div className={estilos.puntosClave}>
                    <div className={puntoEstilo()}>
                      <CheckCircle2 size={16} color="var(--c-enlace)" aria-hidden="true" />
                      <span>Implementación con metodologías ágiles y estándares limpios</span>
                    </div>
                    <div className={puntoEstilo()}>
                      <CheckCircle2 size={16} color="var(--c-enlace)" aria-hidden="true" />
                      <span>Garantía de soporte, auditoría técnica y escalabilidad modular</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Vista en rejilla resumida complementaria */}
            <div className={estilos.rejillaMini}>
              {contenido.map((servicio) => {
                const IconoMini = iconoParaTitulo(servicio.titulo);
                const esActivo = servicio.id === servicioActivo?.id;
                return (
                  <div
                    key={servicio.id}
                    className={estilos.tarjetaMini}
                    style={{
                      borderColor: esActivo ? 'var(--c-enlace)' : undefined,
                      background: esActivo ? 'color-mix(in srgb, var(--c-enlace) 5%, var(--c-superficie))' : undefined,
                    }}
                    onClick={() => setServicioSeleccionadoId(servicio.id)}
                  >
                    <div className={estilos.miniIcono}>
                      <IconoMini size={22} aria-hidden="true" />
                    </div>
                    <p className={estilos.miniTitulo}>{servicio.titulo}</p>
                    <ChevronRight size={16} style={{ marginLeft: 'auto', color: 'var(--c-texto-secundario)' }} />
                  </div>
                );
              })}
            </div>
          </div>
        );
      }}
    </SeccionContenido>
  );
}

function puntoEstilo() {
  return estilos.puntoItem;
}
