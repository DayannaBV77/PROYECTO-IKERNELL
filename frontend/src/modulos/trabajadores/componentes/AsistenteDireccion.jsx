import { useState } from 'react';
import { Check, MapPin, SlidersHorizontal, X } from 'lucide-react';

import Boton from '../../../componentes/ui/Boton.jsx';
import Campo from '../../../componentes/ui/Campo.jsx';
import {
  analizarProgresoDireccion,
  esFormatoDireccionColombiana,
  formatearDireccionEstandar,
  normalizarEntradaDireccion,
} from '../validaciones.js';
import estilos from './AsistenteDireccion.module.css';

const CHIPS_VIAS = ['Calle', 'Carrera', 'Avenida', 'Diagonal', 'Transversal', 'Vereda'];

const VIAS_PRINCIPALES = [
  'Calle',
  'Carrera',
  'Avenida Calle',
  'Avenida Carrera',
  'Diagonal',
  'Transversal',
  'Circular',
  'Autopista',
  'Vía',
];

/**
 * Campo de direccion colombiana con vista previa estandarizada y constructor
 * modular paso a paso opcional ("Estructurar direccion").
 */
export default function AsistenteDireccion({
  value,
  onChange,
  onBlur,
  error,
  obligatorio = false,
  nombre = 'direccion',
  className = '',
}) {
  const [abierto, setAbierto] = useState(false);
  const [via, setVia] = useState('Calle');
  const [numVia, setNumVia] = useState('');
  const [cruce, setCruce] = useState('');
  const [placa, setPlaca] = useState('');
  const [complemento, setComplemento] = useState('');

  const tieneValor = typeof value === 'string' && value.trim().length > 0;
  const esValida = tieneValor && esFormatoDireccionColombiana(value);
  const vistaPrevia = esValida ? formatearDireccionEstandar(value) : '';

  function aplicarConstruccion() {
    if (!numVia.trim() || !cruce.trim() || !placa.trim()) return;
    const base = `${via} ${numVia.trim()} # ${cruce.trim()}-${placa.trim()}`;
    const final = complemento.trim() ? `${base} ${complemento.trim()}` : base;
    onChange({ target: { name: nombre, value: final } });
    setAbierto(false);
  }

  const botonAsistente = (
    <button
      type="button"
      className={estilos.botonAsistente}
      onClick={() => setAbierto((prev) => !prev)}
      data-testid="toggle-address-assistant"
    >
      {abierto ? <X size={13} aria-hidden="true" /> : <SlidersHorizontal size={13} aria-hidden="true" />}
      <span>{abierto ? 'Cerrar asistente' : 'Estructurar dirección'}</span>
    </button>
  );

  return (
    <div className={`${estilos.contenedor} ${className}`}>
      <Campo
        etiqueta="Dirección"
        nombre={nombre}
        obligatorio={obligatorio}
        accionEtiqueta={botonAsistente}
        placeholder="Ej.: Calle 45 # 12-30 Apto 302 o Vereda San Isidro"
        chipsSugeridos={CHIPS_VIAS}
        guiaDinamica={analizarProgresoDireccion}
        value={value}
        onChange={(e) => {
          const normalizado = normalizarEntradaDireccion(e.target.value);
          onChange({ target: { name: nombre, value: normalizado } });
        }}
        onBlur={onBlur}
        error={error}
      />

      <div
        className={`${estilos.vistaPrevia} ${!vistaPrevia || error ? estilos.vistaPreviaOculta : ''}`}
        data-testid="address-standard-preview"
        aria-hidden={!vistaPrevia || Boolean(error)}
      >
        <MapPin size={13} aria-hidden="true" />
        <span>Formato estándar:</span>
        <strong>{vistaPrevia || '—'}</strong>
      </div>

      {abierto && (
        <div className={estilos.panelConstructor} data-testid="address-builder-panel">
          <p className={estilos.tituloConstructor}>Constructor de nomenclatura urbana</p>
          <div className={estilos.gridConstructor}>
            <label className={estilos.miniCampo}>
              <span>Vía principal</span>
              <select value={via} onChange={(e) => setVia(e.target.value)}>
                {VIAS_PRINCIPALES.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </label>

            <label className={estilos.miniCampo}>
              <span>Número</span>
              <input
                type="text"
                placeholder="Ej. 45"
                value={numVia}
                onChange={(e) => setNumVia(e.target.value)}
              />
            </label>

            <label className={estilos.miniCampo}>
              <span>Cruce (#)</span>
              <input
                type="text"
                placeholder="Ej. 12"
                value={cruce}
                onChange={(e) => setCruce(e.target.value)}
              />
            </label>

            <label className={estilos.miniCampo}>
              <span>Placa (-)</span>
              <input
                type="text"
                placeholder="Ej. 30"
                value={placa}
                onChange={(e) => setPlaca(e.target.value)}
              />
            </label>

            <label className={`${estilos.miniCampo} ${estilos.campoAncho}`}>
              <span>Complemento (opcional)</span>
              <input
                type="text"
                placeholder="Ej. Torre 2 Apto 302"
                value={complemento}
                onChange={(e) => setComplemento(e.target.value)}
              />
            </label>
          </div>

          <div className={estilos.accionesConstructor}>
            <Boton
              type="button"
              variante="primario"
              icono={Check}
              disabled={!numVia.trim() || !cruce.trim() || !placa.trim()}
              onClick={aplicarConstruccion}
              data-testid="apply-built-address"
            >
              Aplicar dirección
            </Boton>
          </div>
        </div>
      )}
    </div>
  );
}
