# Documentación API Backend - Dualex

Bienvenido a la documentación técnica del backend del proyecto **Dualex**. 
Esta documentación ha sido generada automáticamente a partir del código fuente en PHP.

## Estructura del Código

El backend de Dualex sigue un patrón **MVC** simplificado y expone una API RESTful que es consumida por la aplicación Angular.
Todas las clases se encuentran agrupadas por defecto bajo el namespace global (o paquete `Application`).

### Componentes Principales:

*   **Controladores (`src/controllers`)**: Gestionan las peticiones HTTP entrantes, la seguridad (`checkRole`) y devuelven respuestas JSON estructuradas. Ejemplos: `ConAlumnos`, `ConTareas`, `ConModulos`.
*   **Modelos (`src/models`)**: Contienen la lógica de negocio y las consultas a la base de datos (mediante PDO).
*   **Core (`src/core`)**: Elementos comunes como `BaseController`, `ConexionDB` y `JWTHelper` para la autenticación de usuarios.

### Navegación

Para explorar las clases y métodos documentados, utiliza el menú de navegación lateral:
- Navega a **Packages -> Application** para ver todas las clases disponibles.
- Usa la barra de búsqueda superior si necesitas encontrar un controlador o método específico rápidamente.
