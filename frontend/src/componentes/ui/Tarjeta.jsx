import estilos from './Tarjeta.module.css';

/**
 * Tarjeta del sistema de diseno: superficie blanca, borde turquesa y sombra
 * sutil, como en los dos mockups.
 */
export default function Tarjeta({
  icono: Icono,
  titulo,
  children,
  pie,
  variante = 'clara',
  centrada = false,
  interactiva = false,
  como: Como = 'article',
  ...resto
}) {
  const clases = [
    estilos.tarjeta,
    variante === 'tenue' ? estilos.tenue : '',
    centrada ? estilos.centrada : '',
    interactiva ? estilos.interactiva : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Como className={clases} {...resto}>
      {Icono && (
        <span className={estilos.icono}>
          <Icono size={30} strokeWidth={1.6} aria-hidden="true" />
        </span>
      )}
      {titulo && <h3 className={estilos.titulo}>{titulo}</h3>}
      {children && <div className={estilos.cuerpo}>{children}</div>}
      {pie && <div className={estilos.pie}>{pie}</div>}
    </Como>
  );
}
