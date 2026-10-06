# BookRank

Aplicación web que consume la **Books API del New York Times** para mostrar rankings de libros más vendidos, con personalización de preferencias, geolocalización para encontrar librerías cercanas, notificaciones y seguimiento de actividad del usuario.

**Autor:** Juan David Ferrer Castillo

## Demo en vivo

https://ferrer007.github.io/bookrank-app/

## Funcionalidades

- **Consumo en vivo de la NYT Books API** (`/lists/current/{list}.json`) para 5 categorías de ranking (Ficción, No ficción, Juvenil, Infantil, Consejos). Si la API no responde (clave sin activar, límite de uso, etc.), la app cae automáticamente a datos de ejemplo para no romperse, y lo avisa con un mensaje en pantalla.
- **Portadas reales de libros**, obtenidas por ISBN desde Google Books API.
- **Perfil editable**: géneros literarios favoritos y rango de edad, guardados en el navegador (`localStorage`) y modificables en cualquier momento desde Configuración, sin perder el historial de uso.
- **Geolocalización real del dispositivo** (`navigator.geolocation`): la app sí pide y usa tu ubicación real para calcular la distancia exacta a cada punto (fórmula de Haversine). El **directorio de librerías es un conjunto de datos de ejemplo** (nombres y direcciones simulados), porque la Books API del NYT no provee información de tiendas físicas ni existe ese dato dentro del alcance de la API asignada. En una versión de producción, ese directorio vendría de un servicio como Google Places API.
- **Notificaciones** del navegador (`Notification API`) cuando el permiso lo permite, con una vista interna de notificaciones como respaldo siempre visible.
- **Seguimiento de actividad del usuario**: pantallas visitadas, categorías consultadas, favoritos guardados y uso de GPS, registrado con fecha y hora en `localStorage` y resumido en un panel de "Actividad reciente" dentro de Configuración.
- Diseño responsive: marco de celular en pantallas grandes, pantalla completa en dispositivos móviles reales.

## Cómo correrlo localmente

Abre `index.html` directamente en el navegador, o usa la extensión "Live Server" de VS Code (clic derecho sobre index.html → "Open with Live Server").

## Tecnologías

HTML, CSS y JavaScript puro, sin frameworks ni paso de compilación (build step).

## Notas honestas sobre los datos

| Dato | ¿Es real? |
| --- | --- |
| Ranking de libros, autores, descripciones | Sí, directo de la NYT Books API |
| Portadas de libros | Sí, directo de Google Books API |
| Ubicación del usuario | Sí, GPS real del dispositivo |
| Distancia a cada librería | Sí, calculada con la ubicación real |
| Nombres y direcciones de librerías | No, son datos de ejemplo (la NYT Books API no provee este dato) |