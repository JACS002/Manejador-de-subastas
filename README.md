# **Proyecto Final**

Este README explica cómo levantar el sistema completo (manager + bidders) en **modo producción** usando Docker Compose.

---

## Preparar antes de ejecutar

1. Asegúrate de que las carpetas del proyecto estén así:
```
   ./manager-service
   ./bidders-service
   docker-compose.yml
```

2. Verifica que `manager-service` y `bidders-service` tengan los siguientes archivos:
   - `package.json`, `src/server/server.js`, `src/client` con su `package.json` y scripts `npm run build`
   - Las imágenes (thumbnails) deben estar en `manager-service/src/client/public/img`  y en `bidders-service/src/client/public/img`

3. En el **Manager UI** (después de levantar), después de editar la configuración pulsa **Guardar configuración** antes de iniciar el bidders.
---

## Levantar todo

Desde la raíz del repo:
```bash
docker-compose up --build -d
```

Esto:
- Construye `manager-service` y `bidders-service`
- Expone los puertos:
  - Manager API + UI: http://localhost:8080
  - Bidders API + UI: http://localhost:8081


## Parar cerrar todo
```bash
docker-compose down
```
## 🧩 Aportes de Integrantes – Proyecto Final
# Joel Cuascota – Servicio de Postores (Backend + WebSockets)

- Implementación del registro de postores en tiempo real

- Desarrollo de la función registerBidder(auctionId, bidder) en el backend del servicio de postores.

- Gestión interna del estado registrations[auctionId] para mantener los usuarios registrados en cada subasta.

- Validación de nombres de postores, evitando duplicados y registros inválidos.

- Integración con WebSockets para registro

- Emisión automática del estado actualizado a todos los clientes mediante Socket.io cada vez que un usuario se registra.

- Persistencia en memoria del estado de postores

- Diseño de la estructura interna que mantiene:

* Postores registrados,

* Precios actuales,

* Pujas realizadas,

* Ganador de cada subasta.

- Control de acceso a subastas

- Bloqueo de acceso a subastas que no están activas.

- Lógica del backend para garantizar que solo los postores registrados puedan pujar.

# Anahí Andrade – Frontend del Servicio de Postores (React + UI)

- Desarrollo completo de la interfaz para cada subasta

- Implementación de la vista /subasta/:id con:

Imagen de la obra,

Datos del autor, año, título,

Precios base, iniciales y mínimos incrementos,

Estado actual de la subasta.

- Renderizado dinámico con datos enviados por el manejador

- Integración con el estado emitido por WebSockets para mostrar:

Temporizador,

Precio actual,

Estado (pending, active, finished),

Ganador cuando corresponda.

Interfaz de registro y lista de postores

Inputs y botones para registrar postores.

Visualización en tiempo real de la lista registrations.

Mensajes de éxito y error estilizados.

Vista principal del servicio de postores

- Implementación de la pantalla / que lista todas las subastas en el orden definido por el manejador.

# Ahmed Puco – Temporizadores y Flujo de Subastas Automáticas

- Implementación del temporizador por subasta

- Cálculo de startTs y endTs según la configuración enviada por el manejador.

- Lógica secuencial automática:
cada subasta inicia cuando termina la anterior.

- Lógica del conteo regresivo

- Cálculo en tiempo real de:

secondsToStart,

secondsToEnd,

- Estado de cada subasta: pending, active, finished.

- Integración del temporizador con WebSockets

- Emisión del estado actualizado cada segundo.

- Manejo automático del paso de una subasta a la siguiente.

- Publicación del ganador inmediatamente al finalizar una subasta.

- Coordinación global del flujo

- Asegurar que todas las subastas comiencen automáticamente después de que el manejador guarda la configuración.

- Garantizar la sincronización entre backend y frontend para el tiempo restante de cada lote.
