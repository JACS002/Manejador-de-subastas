# Manager Service (Manejador de Subastas)
🧩 Manager Service — Proyecto APPSD

Este servicio corresponde a la parte del manejador (puerto 8080) del proyecto de subastas distribuidas.
Su función principal es permitir al administrador o manejador configurar las subastas:

- Definir el orden de las obras,

- Establecer el mínimo incremento y la duración de cada subasta,

- Guardar y compartir esta configuración con el servicio de postores (puerto 8081).
---

⚙️ Tecnologías utilizadas

- Node.js + Express → servidor backend

- React + Vite → interfaz frontend

- CORS + Fetch API → comunicación entre cliente y servidor

- JavaScript ES Modules

- Memoria interna (sin base de datos)

---

🗂️ Estructura del proyecto

```bash
manager-service/
├─ src/
│  ├─ server/
│  │  ├─ app.js                # Configura Express, rutas y sirve el frontend
│  │  ├─ server.js             # Punto de arranque del servidor (puerto 8080)
│  │  ├─ controllers/          # Controladores que manejan las peticiones HTTP
│  │  │  ├─ auctions.controller.js
│  │  │  └─ config.controller.js
│  │  ├─ routes/               # Define las rutas /api/subastas y /api/config
│  │  ├─ services/             # Lógica de negocio (configuración y subastas)
│  │  ├─ data/                 # Datos iniciales (obras de arte del catálogo)
│  │  └─ models/               # Estructura del estado (configuración + catálogo)
│  └─ client/                  # Aplicación React (frontend del manejador)
│     ├─ vite.config.js        # Configura el proxy y la carpeta de build
│     ├─ index.html
│     └─ src/
│        ├─ App.jsx            # Página principal “Configurar Subastas”
│        ├─ api.js             # Funciones que llaman al backend
│        └─ main.jsx
├─ package.json                # Scripts e info del proyecto
├─ package-lock.json
└─ .gitignore

```

---

🚀 Funcionalidad

| Método   | Ruta            | Descripción                                               |
| -------- | --------------- | --------------------------------------------------------- |
| **GET**  | `/api/subastas` | Devuelve el catálogo de obras disponibles.                |
| **GET**  | `/api/config`   | Retorna la configuración actual de subastas.              |
| **POST** | `/api/config`   | Guarda una nueva configuración enviada desde el frontend. |

Los datos se mantienen en memoria (state.config), sin usar base de datos.

---

🔸 Frontend (React)

El cliente permite:

- Visualizar el listado de obras.

- Reordenarlas con las flechas ↑ y ↓.

- Modificar los valores de mínimo incremento y duración (segundos).

- Guardar la configuración en el servidor con el botón “Guardar Configuración”.

Al guardar correctamente, aparece el mensaje:

✅ “Configuración guardada”.

---

🧰 Instrucciones de instalación y ejecución

1. Clonar el repositorio

2. Instalar dependencias

    - Primero a nivel de manager-service
    ```bash
    npm i
    ```
    - Luego a nivel de src/client (frontend)
    ```bash
    npm i
    ```

3. Ejecutar en modo desarrollo

    En dos terminales y a nivel manager-service:

    - Backend (Express):
    ```bash
    npm run dev:server
    ```
    - Frontend (React):
    ```bash
    npm run dev:client
    ```
    Backend corre en 👉 http://localhost:8080

    Frontend corre en 👉 http://localhost:5173

4. Empaquetar y ejecutar todo en un solo puerto

    Para servir React desde el mismo servidor Express

    ``` bash
    # Generar build del frontend
    cd src/client
    npm run build
    cd ../..

    # Ejecutar el servidor
    npm start
    ```
    Ahora toda la aplicación se encuentra disponible en:
    👉 http://localhost:8080

---

### 📡 Comunicación entre servicios

El servicio Manager (8080) será consumido por el servicio de Postores (8081),
que consultará la configuración actual de subastas usando las rutas:

- GET /api/config → obtiene los parámetros y orden definidos.

- GET /api/subastas → muestra las obras que participarán.