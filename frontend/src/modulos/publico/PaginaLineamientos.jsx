import { CheckCircle2, Compass, Shield, Sparkles, Target } from 'lucide-react';
import { TIPOS_CONTENIDO } from '../../api/contenidoPublico.js';
import SeccionContenido from './componentes/SeccionContenido.jsx';
import estilos from './PaginaLineamientos.module.css';

/**
 * Lineamientos de la empresa (RF-032, HU-01 C02).
 *
 * Presentación moderna, amplia e interactiva:
 * - Misión y Visión destacadas en formato panorámico
 * - Valores corporativos desglosados en tarjetas interactivas de principios
 * - Políticas de seguridad de la información
 */
export default function PaginaLineamientos() {
  return (
    <SeccionContenido
      tipo={TIPOS_CONTENIDO.LINEAMIENTO}
      titulo="Nuestros lineamientos estratégicos"
      descripcion="Principios y directrices que definen el compromiso, calidad y visión de IKernell Soluciones Software."
      id="lineamientos"
    >
      {(contenido) => {
        // Clasificar lineamientos por título
        const mision = contenido.find((c) => /misi[oó]n/i.test(c.titulo));
        const vision = contenido.find((c) => /visi[oó]n/i.test(c.titulo));
        const valores = contenido.find((c) => /valores/i.test(c.titulo));
        const seguridad = contenido.find((c) => /seguridad|pol[ií]tica/i.test(c.titulo));

        // Otros posibles lineamientos que el administrador publique
        const otros = contenido.filter(
          (c) => c !== mision && c !== vision && c !== valores && c !== seguridad,
        );

        // Desglosar líneas de valores si vienen en formato "Nombre: Descripción"
        const lineasValores = valores?.cuerpo
          ? valores.cuerpo
              .split('\n')
              .filter((l) => l.trim().length > 0)
              .map((linea) => {
                const partes = linea.split(':');
                if (partes.length > 1) {
                  return {
                    nombre: partes[0].trim(),
                    desc: partes.slice(1).join(':').trim(),
                  };
                }
                return { nombre: 'Principio', desc: linea.trim() };
              })
          : [];

        return (
          <div className={estilos.lineamientosModernos}>
            {/* Fila Panorámica: Misión y Visión */}
            <div className={estilos.filaHero}>
              {mision && (
                <article className={estilos.tarjetaDestacada}>
                  <div className={estilos.iconoHero}>
                    <Target size={28} aria-hidden="true" />
                  </div>
                  <h3 className={estilos.tituloHero}>{mision.titulo}</h3>
                  <p className={estilos.cuerpoHero}>{mision.cuerpo}</p>
                </article>
              )}

              {vision && (
                <article className={estilos.tarjetaDestacada}>
                  <div className={estilos.iconoHero}>
                    <Compass size={28} aria-hidden="true" />
                  </div>
                  <h3 className={estilos.tituloHero}>{vision.titulo}</h3>
                  <p className={estilos.cuerpoHero}>{vision.cuerpo}</p>
                </article>
              )}
            </div>

            {/* Valores Corporativos Desglosados */}
            {valores && (
              <section className={estilos.seccionValores}>
                <div className={estilos.cabeceraValores}>
                  <div className={estilos.iconoHero} style={{ margin: 0 }}>
                    <Sparkles size={24} aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className={estilos.tituloValores}>{valores.titulo}</h3>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: 'var(--c-texto-secundario)' }}>
                      Los pilares éticos y operacionales que guían el trabajo diario de cada equipo.
                    </p>
                  </div>
                </div>

                <div className={estilos.rejillaValores}>
                  {lineasValores.map((val, idx) => (
                    <div key={idx} className={estilos.itemValor}>
                      <span className={estilos.nombreValor}>
                        <CheckCircle2 size={16} color="var(--c-enlace)" aria-hidden="true" />
                        {val.nombre}
                      </span>
                      <p className={estilos.descValor}>{val.desc}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Política de Seguridad */}
            {seguridad && (
              <div className={estilos.bannerSeguridad}>
                <div className={estilos.iconoSeguridad}>
                  <Shield size={26} aria-hidden="true" />
                </div>
                <div>
                  <h4 style={{ margin: '0 0 0.35rem', fontSize: '1.05rem', fontWeight: 700, color: 'var(--c-texto-principal)' }}>
                    {seguridad.titulo}
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.5, color: 'var(--c-texto-secundario)' }}>
                    {seguridad.cuerpo}
                  </p>
                </div>
              </div>
            )}

            {/* Otros lineamientos complementarios */}
            {otros.length > 0 && (
              <div className={estilos.filaHero}>
                {otros.map((item) => (
                  <article key={item.id} className={estilos.tarjetaDestacada}>
                    <h3 className={estilos.tituloHero}>{item.titulo}</h3>
                    <p className={estilos.cuerpoHero}>{item.cuerpo}</p>
                  </article>
                ))}
              </div>
            )}
          </div>
        );
      }}
    </SeccionContenido>
  );
}
