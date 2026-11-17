import { useCallback, useMemo, useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronRight,
  ClipboardCopy,
  Code,
  FileCode,
  Folder,
  Layers,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
} from 'lucide-react';

import { obtenerTutoriales } from '../../api/corporativo.js';
import {
  cambiarPublicacionRecurso,
  crearRecurso,
  eliminarRecurso,
  obtenerRecursosAdmin,
} from '../../api/recursosAdmin.js';
import Boton from '../../componentes/ui/Boton.jsx';
import EstadoCarga from '../../componentes/estados/EstadoCarga.jsx';
import EstadoError from '../../componentes/estados/EstadoError.jsx';
import EstadoVacio from '../../componentes/estados/EstadoVacio.jsx';
import Seccion from '../../componentes/ui/Seccion.jsx';
import { usePeticion } from '../../hooks/usePeticion.js';
import { useSesion } from '../../sesion/contexto.js';
import estilos from './PaginaTutoriales.module.css';

/**
 * Catálogo base de tutoriales técnicos alineados con la arquitectura IKernell
 * y el caso de estudio ADSI SENA.
 */
const TUTORIALES_BASE = [
  {
    id: 1,
    titulo: 'Gestión de Migraciones Relacionales con Flyway',
    categoria: 'Database',
    subcategoria: 'Database',
    version: 'v1.2',
    descripcion:
      'Instrucciones paso a paso para crear scripts SQL portables con control de versiones en db/migration.',
    contenido: `# Migraciones con Flyway

1. Archivos 'V<numero>__descripcion.sql' en 'src/main/resources/db/migration'.

\`\`\`sql
-- V1.0__Initial_Schema.sql
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100),
    email VARCHAR(255) UNIQUE
);
\`\`\`

2. Usar tipos estándar SQL ANSI (e.g., VARCHAR, INT). Evitar tipos específicos de base de datos.

\`VARCHAR(100)\`

3. Probar reversión y verificación en limpio antes de enviar a git.

\`\`\`bash
mvn flyway:clean flyway:migrate
\`\`\`

4. Para pruebas automatizadas con base de datos en memoria H2, las migraciones se aplican en la carpeta de prueba 'test/resources/db/migration-h2'.`,
  },
  {
    id: 2,
    titulo: 'Getting Started con IKernell y Spring Boot',
    categoria: 'Getting Started',
    subcategoria: 'Getting Started',
    version: 'v1.0',
    descripcion:
      'Guía inicial de preparación del entorno de desarrollo local con JDK 17 y PostgreSQL.',
    contenido: `# Getting Started

Bienvenido al repositorio central de IKernell Soluciones Software.

1. Clonar el repositorio y verificar variables de entorno en el archivo .env.
2. Iniciar el contenedor local de PostgreSQL:

\`\`\`bash
docker-compose up -d postgres
\`\`\`

3. Compilar el backend con Maven wrapper:

\`\`\`bash
./mvnw clean compile
\`\`\``,
  },
  {
    id: 3,
    titulo: 'Configuración y Pool de Conexiones HikariCP',
    categoria: 'Database Settings',
    subcategoria: 'Database Settings',
    version: 'v2.1',
    descripcion:
      'Ajustes de alta concurrencia, límites de conexiones simultáneas y timeouts en HikariCP.',
    contenido: `# Configuración de HikariCP

Ajuste de parámetros en 'application.properties':

\`\`\`properties
spring.datasource.hikari.maximum-pool-size=15
spring.datasource.hikari.minimum-idle=5
spring.datasource.hikari.idle-timeout=30000
spring.datasource.hikari.connection-timeout=20000
\`\`\`

Verificar métricas activas en los endpoints de Micrometer y Prometheus.`,
  },
  {
    id: 4,
    titulo: 'Autenticación Stateless con Spring Security y JWT',
    categoria: 'Authentication',
    subcategoria: 'Authentication Cores',
    version: 'v2.4',
    descripcion:
      'Implementación del filtro OncePerRequestFilter y validación de tokens de acceso criptográficos.',
    contenido: `# Seguridad con JWT

Flujo de verificación en cada petición entrante:

\`\`\`java
@Override
protected void doFilterInternal(HttpServletRequest request, 
                                HttpServletResponse response, 
                                FilterChain chain) throws ServletException, IOException {
    String authHeader = request.getHeader("Authorization");
    if (authHeader != null && authHeader.startsWith("Bearer ")) {
        String token = authHeader.substring(7);
        // Validar firma HMAC-SHA256
    }
    chain.doFilter(request, response);
}
\`\`\``,
  },
  {
    id: 5,
    titulo: 'Pipelines CI/CD con GitHub Actions y Podman',
    categoria: 'CI/CD',
    subcategoria: 'CI/CD',
    version: 'v1.5',
    descripcion:
      'Construcción automatizada de artefactos, ejecución de pruebas unitarias y generación de imágenes.',
    contenido: `# Pipeline de Integración Continua

Configuración del flujo en '.github/workflows/ci.yml':

\`\`\`yaml
name: CI Pipeline
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Java 17
        uses: actions/setup-java@v3
        with:
          java-version: '17'
      - name: Build with Maven
        run: mvn test
\`\`\``,
  },
  {
    id: 6,
    titulo: 'Convenciones y Estándares de Diseño RESTful',
    categoria: 'API Design',
    subcategoria: 'API Design Servers',
    version: 'v1.0',
    descripcion:
      'Códigos de estado HTTP, estructura uniforme de respuestas y paginación en Spring Web.',
    contenido: `# Estándares de API RESTful

- Nombres de recursos siempre en plural y minúsculas: '/api/proyectos', '/api/trabajadores'.
- Métodos idempotentes bien respetados: GET, PUT, DELETE.
- Respuestas de error estandarizadas con código RFC-7807:

\`\`\`json
{
  "tipo": "ERROR_VALIDACION",
  "mensaje": "Los datos suministrados son inválidos.",
  "timestamp": "2026-11-17T02:40:00Z"
}
\`\`\``,
  },
];

/**
 * Componente interactivo para bloques de código con botón de copiado.
 */
function BloqueCodigo({ codigo, lenguaje = 'code' }) {
  const [copiado, setCopiado] = useState(false);

  function copiarAlPortapapeles() {
    navigator.clipboard.writeText(codigo.trim()).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    });
  }

  return (
    <div className={estilos.bloqueCodigoWrapper}>
      <div className={estilos.bloqueCodigoHeader}>
        <span className={estilos.lenguajeTag}>{lenguaje}</span>
        <button
          type="button"
          onClick={copiarAlPortapapeles}
          className={`${estilos.btnCopiar} ${copiado ? estilos.btnCopiado : ''}`}
          title="Copiar código al portapapeles"
        >
          {copiado ? <Check size={13} /> : <ClipboardCopy size={13} />}
          <span>{copiado ? 'Copiado!' : 'Copiar'}</span>
        </button>
      </div>
      <pre className={estilos.preCodigo}>
        <code>{codigo.trim()}</code>
      </pre>
    </div>
  );
}

/**
 * Renderizador de texto y bloques de código de tutoriales.
 */
function VisorContenido({ texto = '' }) {
  // Dividir el contenido buscando bloques ```lenguaje ... ```
  const partes = useMemo(() => {
    const regex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
    const resultado = [];
    let ultimoIndice = 0;
    let coincidencia;

    while ((coincidencia = regex.exec(texto)) !== null) {
      if (coincidencia.index > ultimoIndice) {
        resultado.push({
          tipo: 'texto',
          valor: texto.slice(ultimoIndice, coincidencia.index),
        });
      }
      resultado.push({
        tipo: 'codigo',
        lenguaje: coincidencia[1] || 'bash',
        valor: coincidencia[2],
      });
      ultimoIndice = regex.lastIndex;
    }

    if (ultimoIndice < texto.length) {
      resultado.push({
        tipo: 'texto',
        valor: texto.slice(ultimoIndice),
      });
    }

    return resultado;
  }, [texto]);

  return (
    <div className={estilos.cuerpoMarkdown}>
      {partes.map((parte, idx) => {
        if (parte.tipo === 'codigo') {
          return (
            <BloqueCodigo
              key={idx}
              codigo={parte.valor}
              lenguaje={parte.lenguaje}
            />
          );
        }

        // Renderizar párrafos y código inline `...`
        const lineas = parte.valor.split('\n');
        return (
          <div key={idx}>
            {lineas.map((linea, lIdx) => {
              const lineaTrim = linea.trim();
              if (!lineaTrim) return <br key={lIdx} />;

              if (lineaTrim.startsWith('# ')) {
                return <h2 key={lIdx}>{lineaTrim.replace('# ', '')}</h2>;
              }
              if (lineaTrim.startsWith('## ')) {
                return <h3 key={lIdx}>{lineaTrim.replace('## ', '')}</h3>;
              }

              // Parsear código inline `codigo`
              const tokens = linea.split(/(`[^`]+`)/g);
              return (
                <p key={lIdx}>
                  {tokens.map((token, tIdx) => {
                    if (token.startsWith('`') && token.endsWith('`')) {
                      return (
                        <code key={tIdx} className={estilos.codigoInline}>
                          {token.slice(1, -1)}
                        </code>
                      );
                    }
                    return token;
                  })}
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Página principal de Tutoriales de Programación (RF-030, RF-040, HU-21).
 *
 * Adopta el diseño de panel lateral con árbol jerárquico de navegación,
 * buscador rápido y visor de documentación con bloques de código copiables.
 */
export default function PaginaTutoriales() {
  const { sesion } = useSesion();
  const esCoordinador = sesion?.tipoTrabajador === 'COORDINADOR';

  const [filtroTexto, setFiltroTexto] = useState('');
  const [categoriasAbiertas, setCategoriasAbiertas] = useState({
    'Getting Started': true,
    Database: true,
    'Database Settings': true,
    Authentication: false,
    'CI/CD': false,
    'API Design': false,
  });

  // Cargar tutoriales del backend
  const cargarTutoriales = useCallback(
    ({ senal }) =>
      esCoordinador
        ? obtenerRecursosAdmin('TUTORIAL', { senal })
        : obtenerTutoriales('', { senal }),
    [esCoordinador],
  );
  const { datos, cargando, error, reintentar } = usePeticion(cargarTutoriales, [esCoordinador]);

  // Consolidar tutoriales de base de datos con los base
  const listaTutoriales = useMemo(() => {
    const backendItems = datos?.contenido || [];
    if (backendItems.length === 0) return TUTORIALES_BASE;

    const mapa = new Map();
    TUTORIALES_BASE.forEach((t) => mapa.set(t.titulo, t));
    backendItems.forEach((item) => {
      mapa.set(item.titulo, {
        id: item.id,
        titulo: item.titulo,
        categoria: item.categoria || 'Database',
        version: item.version || 'v1.0',
        descripcion: item.descripcion,
        contenido: item.contenido,
        enlace: item.enlace,
      });
    });

    return Array.from(mapa.values());
  }, [datos]);

  // Tutorial seleccionado actualmente (por defecto el de Migraciones Flyway)
  const [tutorialSeleccionadoId, setTutorialSeleccionadoId] = useState(1);

  const tutorialActivo = useMemo(() => {
    return (
      listaTutoriales.find((t) => t.id === tutorialSeleccionadoId) ||
      listaTutoriales[0]
    );
  }, [listaTutoriales, tutorialSeleccionadoId]);

  // Agrupar tutoriales por categoría jerárquica
  const arbolCategorias = useMemo(() => {
    const mapa = new Map();
    const qNorm = filtroTexto.toLowerCase().trim();

    listaTutoriales.forEach((t) => {
      const coincide =
        !qNorm ||
        t.titulo.toLowerCase().includes(qNorm) ||
        t.categoria.toLowerCase().includes(qNorm);

      if (coincide) {
        const cat = t.categoria || 'General';
        if (!mapa.has(cat)) {
          mapa.set(cat, []);
        }
        mapa.get(cat).push(t);
      }
    });

    return Array.from(mapa.entries());
  }, [listaTutoriales, filtroTexto]);

  function alternarCategoria(cat) {
    setCategoriasAbiertas((prev) => ({
      ...prev,
      [cat]: !prev[cat],
    }));
  }

  return (
    <Seccion
      titulo="Tutoriales de Programación"
      descripcion="Guías oficiales, estándares de arquitectura y buenas prácticas del equipo de desarrollo."
      id="tutoriales"
    >
      <div className={estilos.layoutTutoriales}>
        {/* ============================================================ */}
        {/* PANEL LATERAL IZQUIERDO: ÁRBOL Y BUSCADOR                     */}
        {/* ============================================================ */}
        <aside className={estilos.sidebar} aria-label="Navegación de tutoriales">
          {/* Buscador de tutoriales */}
          <div className={estilos.buscadorSidebar}>
            <Search size={15} className={estilos.iconoBuscador} />
            <input
              type="text"
              placeholder="Search for tutorials"
              className={estilos.inputBuscador}
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
            />
          </div>

          {/* Lista colapsable por categoría */}
          <div className={estilos.arbolCategorias}>
            {arbolCategorias.map(([categoria, items]) => {
              const estaAbierta = categoriasAbiertas[categoria] !== false;

              return (
                <div key={categoria} className={estilos.grupoCategoria}>
                  <div
                    className={estilos.categoriaCabecera}
                    onClick={() => alternarCategoria(categoria)}
                  >
                    <div className={estilos.categoriaTitulo}>
                      <Folder size={14} style={{ color: '#0284c7' }} />
                      <span>{categoria}</span>
                    </div>
                    {estaAbierta ? (
                      <ChevronDown size={14} className={estilos.categoriaIconoFlecha} />
                    ) : (
                      <ChevronRight size={14} className={estilos.categoriaIconoFlecha} />
                    )}
                  </div>

                  {estaAbierta && (
                    <div className={estilos.listaItemsCategoria}>
                      {items.map((t) => {
                        const esActivo = t.id === tutorialActivo?.id;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            className={`${estilos.itemTutorial} ${
                              esActivo ? estilos.itemTutorialActivo : ''
                            }`}
                            onClick={() => setTutorialSeleccionadoId(t.id)}
                            title={t.titulo}
                          >
                            {t.titulo}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {arbolCategorias.length === 0 && (
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center' }}>
                No se encontraron tutoriales
              </p>
            )}
          </div>
        </aside>

        {/* ============================================================ */}
        {/* VISOR PRINCIPAL DE CONTENIDO                                  */}
        {/* ============================================================ */}
        <main className={estilos.panelContenido}>
          <div className={estilos.barraSuperiorVisor}>
            <button
              type="button"
              className={estilos.btnVolver}
              onClick={() => {
                setFiltroTexto('');
                setTutorialSeleccionadoId(listaTutoriales[0]?.id || 1);
              }}
            >
              ← Volver a los tutoriales
            </button>
          </div>

          {tutorialActivo && (
            <>
              <h1 className={estilos.tituloPrincipal}>{tutorialActivo.titulo}</h1>

              <div className={estilos.tarjetaVisor}>
                <div className={estilos.metaHeader}>
                  <span>{tutorialActivo.categoria}</span>
                  <span>·</span>
                  <span>VERSION {tutorialActivo.version || 'V1.0'}</span>
                </div>

                <p className={estilos.descripcionTutorial}>
                  {tutorialActivo.descripcion}
                </p>

                <div className={estilos.separador} />

                <VisorContenido texto={tutorialActivo.contenido} />
              </div>
            </>
          )}

          {!tutorialActivo && (
            <EstadoVacio
              mensaje="Seleccione un tutorial del árbol de navegación izquierdo para ver su contenido."
              icono={FileCode}
            />
          )}
        </main>
      </div>
    </Seccion>
  );
}
