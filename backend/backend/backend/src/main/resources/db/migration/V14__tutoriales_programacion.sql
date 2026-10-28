-- =============================================================================
-- Tutoriales iniciales de programacion para IKernell
-- =============================================================================

INSERT INTO recurso_interno (
    tipo,
    titulo,
    descripcion,
    categoria,
    version,
    contenido,
    enlace,
    orden,
    publicada
)
VALUES (
    'TUTORIAL',
    'Introducción a PHP',
    'Conceptos básicos para empezar a escribir scripts en PHP y comprender su uso en aplicaciones web.',
    'PHP',
    'Básico',
    '## ¿Qué es PHP y para qué se utiliza?

PHP es un lenguaje de programación del lado del servidor, muy utilizado para construir sitios web, APIs y herramientas internas. Permite generar contenido dinámico en una página, procesar formularios y conectarse con bases de datos.

> Importante: el código PHP debe ejecutarse en un entorno compatible con PHP, como un servidor local o un hosting con soporte para PHP. No se ejecuta directamente como JavaScript en el navegador.

## Ejemplo mínimo

```php
<?php
$nombre = "Ana";
echo "Hola, " . $nombre;

$edad = 20;

if ($edad >= 18) {
    echo " Eres mayor de edad.";
}
?>
```

### ¿Qué hace cada parte?

- `$nombre = "Ana";` crea una variable de texto.
- `echo "Hola, " . $nombre;` escribe el texto y concatena la variable con un punto.
- `$edad = 20;` guarda un número.
- `if ($edad >= 18) { ... }` evalúa una condición y ejecuta el bloque si la condición es verdadera.

## Ejercicio breve

Crea un script que pida el nombre de una persona y muestre un mensaje como: "Bienvenida, Ana".

## Conclusión

PHP es una excelente opción para iniciar en el desarrollo web y conocer la lógica del backend. Con unos pocos conceptos, puedes crear páginas dinámicas y soluciones sencillas pero útiles.',
    NULL,
    1,
    TRUE
),
(
    'TUTORIAL',
    'Introducción a React',
    'Primeros pasos para entender componentes, JSX y el uso básico del estado en interfaces web.',
    'React',
    'Básico',
    '## ¿Qué es React?

React es una librería de JavaScript para crear interfaces de usuario con una estructura basada en componentes. Se usa mucho para aplicaciones web modernas porque facilita reutilizar bloques de interfaz y actualizar la vista con rapidez cuando cambian los datos.

## ¿Qué es un componente?

Un componente es una pieza reutilizable de la interfaz. Puede ser una tarjeta, un formulario, un menú o incluso una sección completa de una pantalla.

## Componente funcional sencillo

```jsx
function Saludo({ name }) {
  return <h2>Hola, {name}!</h2>;
}

export default function App() {
  return <Saludo name="Ana" />;
}
```

### Explicación

- `function Saludo({ name })` define un componente funcional.
- `name` es una prop: un valor que el componente recibe para personalizar su contenido.
- `return <h2>Hola, {name}!</h2>;` usa JSX para devolver una estructura visual.

## Uso básico de JSX y useState

```jsx
import { useState } from "react";

export default function Contador() {
  const [contador, setContador] = useState(0);

  return (
    <div>
      <p>Valor actual: {contador}</p>
      <button onClick={() => setContador(contador + 1)}>
        Incrementar
      </button>
    </div>
  );
}
```

En este ejemplo, useState guarda un valor y permite actualizar la interfaz cuando cambia.

## Ejercicio breve

Crea un componente que muestre un texto y un botón para cambiarlo de "Inactivo" a "Activo".

## Conclusión

React ayuda a organizar la interfaz en piezas pequeñas y reutilizables. Al aprender JSX, props y estado, ya puedes empezar a crear aplicaciones web más dinámicas y mantenibles.',
    NULL,
    2,
    TRUE
);
