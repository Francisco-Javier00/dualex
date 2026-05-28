# Dualex Web 🎓

Bienvenido al repositorio frontend de **Dualex**, una aplicación web diseñada para la gestión integral de módulos, tareas, empresas, profesores y alumnos en el entorno educativo (Formación Profesional Dual).

Este proyecto está construido con **Angular** (Stand-alone Components) y se integra con un backend API REST (PHP) y un sistema de autenticación Single Sign-On (SSO).

---

## 🛠️ Tecnologías Principales

*   **Framework:** Angular 17+
*   **Lenguaje:** TypeScript
*   **Estilos:** CSS / Bootstrap (utilizado para el sistema de grid y componentes de UI)
*   **Editor Enriquecido:** CKEditor 5
*   **Gestión de Estado y Reactividad:** RxJS
*   **Rendimiento:** Implementación de Lazy Loading en rutas y estrategias `OnPush` para optimización de renderizado.

---

## 🚀 Instalación y Arranque Rápido

Para trabajar con este proyecto en tu máquina local, sigue estos pasos:

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Arrancar el servidor de desarrollo:**
   ```bash
   npm run dev
   # o alternativamente: ng serve -o
   ```
   La aplicación estará disponible en `http://localhost:4200/`. La página se recargará automáticamente si realizas cambios en el código.

---

## 💻 Modo Desarrollador (Developer Mode)

Para facilitar el desarrollo local sin depender del sistema SSO externo en producción, el proyecto incluye un **Modo Desarrollador**.

### ¿Cómo funciona?
Al arrancar la aplicación en local (`ng serve`), Angular utiliza la configuración del archivo `src/environments/environment.development.ts`, donde la bandera `developerMode` está activada (`true`).

Esto habilita automáticamente el panel de **Pruebas del Sistema** (un pequeño menú flotante) que te permite:
*   Bypasear la redirección al login externo (SSO).
*   Inyectar tokens JWT simulados para iniciar sesión instantáneamente.
*   Alternar de forma rápida entre los roles de la aplicación: **Coordinador**, **Profesor** y **Alumno**.

> **Nota de Seguridad:** Este código simulador y la bandera de desarrollo se eliminan automáticamente (Dead Code Elimination) cuando compilas la aplicación para producción (`ng build`), garantizando que la aplicación sea 100% segura en el entorno real.

---

## 📁 Estructura del Proyecto

*   `src/app/components/`: Contiene todos los componentes visuales agrupados por entidad (`dashboard`, `tareas`, `modulos`, `alumnos`, etc.).
*   `src/app/services/`: Servicios inyectables encargados de la comunicación HTTP con el backend (API REST).
*   `src/app/auth/`: Lógica de autenticación, *Guards* de rutas y gestión de cookies y JWT.
*   `src/app/dto/`: Interfaces de TypeScript que definen la estructura de datos (Data Transfer Objects) que se espera del backend.
*   `src/environments/`: Variables de entorno para separar la configuración de local, pre-producción y producción.

---

## 📦 Compilación para Producción

Para generar el build final optimizado (minificado y empaquetado para el servidor), ejecuta:

```bash
ng build
```

Los archivos generados se ubicarán en el directorio `dist/dualex_web/`. Estos son los archivos estáticos que deben subirse al servidor web (Nginx, Apache, etc.).

---

## 📝 Convenciones y Buenas Prácticas

*   **Rendimiento (Lazy Loading):** Todas las rutas principales están configuradas usando `loadComponent` en `app.routes.ts` para dividir la carga de la aplicación.
*   **Fugas de Memoria:** Al utilizar suscripciones `RxJS` en los componentes, se debe implementar `takeUntilDestroyed()` para evitar *Memory Leaks*.
*   **Core Web Vitals:** Las imágenes críticas deben tener atributos `width` y `height` (o gestionarse por CSS robusto) y los assets secundarios deben cargarse de forma diferida (`loading="lazy"`).
