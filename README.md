# **Deber #3**

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
