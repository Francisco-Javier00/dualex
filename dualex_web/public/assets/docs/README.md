# 📚 Manual del Programador - Dualex

¡Bienvenido al portal del programador de **Dualex**! Este directorio aloja la documentación técnica de referencia autogenerada para los dos componentes principales del ecosistema: el backend en PHP y el frontend en Angular.

---

## 📂 Estructura de la Documentación

La documentación se organiza en dos subportales interactivos:

1. **[Frontend (Angular / TypeScript)](./frontend/index.html)**
   - Generada automáticamente con **Compodoc**.
   - Incluye mapas interactivos de módulos, dependencias de inyección, flujo de rutas y documentación de componentes/servicios.
2. **[Backend (PHP API)](./backend/index.html)**
   - Generada automáticamente con **phpDocumentor**.
   - Incluye la referencia técnica de clases, métodos, namespaces, excepciones y visibilidad del código de la API.

---

## 🛠️ Cómo regenerar la documentación

Si realizas cambios en el código o añades nuevos comentarios descriptivos, puedes compilar de nuevo la documentación con los siguientes comandos:

### 1. Frontend (`dualex_web`)

Desde la carpeta raíz del frontend (`dualex_web`), ejecuta:

```bash
# Instalar dependencias de desarrollo (solo la primera vez)
npm install --legacy-peer-deps

# Generar la documentación
npm run doc:generate
```
La salida se compilará automáticamente en `public/assets/docs/frontend/`.

---

### 2. Backend (`dualex_back`)

Dado que el backend de PHP se ejecuta de forma segura dentro de un contenedor Docker, debes ejecutar el generador de la siguiente manera:

1. Generar la documentación **dentro del contenedor** Apache/PHP (esto compilará la documentación en la carpeta compartida `/var/www/html/docs/backend`):
   ```bash
   docker exec php-api-dualex php phpDocumentor.phar -d src -t docs/backend --no-interaction
   ```

2. Copiar los archivos generados al directorio de assets públicos de Angular (**desde PowerShell en el host**):
   ```powershell
   Copy-Item -Path ../dualex_back/docs/backend -Destination public/assets/docs/backend -Recurse -Force
   ```

---

## ✍️ Buenas prácticas de documentación en el código

Para mantener el manual siempre al día y con el mayor detalle posible, utiliza los formatos de comentarios estándar al programar:

* **En TypeScript (Frontend):** Utiliza bloques de comentario `/** ... */` con etiquetas de TSDoc como `@param` y `@returns`.
* **En PHP (Backend):** Utiliza bloques de comentario `/** ... */` con etiquetas de PHPDoc como `@param`, `@return`, y `@throws`.
