# Barbería

Aplicación móvil para gestionar una barbería y reservar citas. Está desarrollada con Expo, React Native y TypeScript; usa Firebase Authentication, Cloud Firestore y SQLite local. También consulta una API REST de Wikimedia para mostrar información sobre el cabello.

## Integrantes del equipo

- Mathias Romario Portuguez Lobaton (cuenta de GitHub: [MATHIAS-PORTUGUEZ](https://github.com/MATHIAS-PORTUGUEZ)).

Agrega aquí a los demás integrantes, si corresponde, con sus nombres y usuarios de GitHub.

## Requisitos

- Windows, macOS o Linux con Node.js LTS y npm.
- Expo Go en un dispositivo Android/iOS, o Android Studio con un emulador iniciado.
- Conexión a internet para Firebase y la consulta REST.
- Un proyecto Firebase con Authentication, Cloud Firestore y sus reglas configuradas. Consulta las secciones de Firebase más abajo.

## Instalación y ejecución

Clona el repositorio e instala sus dependencias:

```bash
git clone https://github.com/MATHIAS-PORTUGUEZ/App-movil.git
cd App-movil
npm.cmd install
```

Inicia el servidor de Expo:

```bash
npx expo start
```

En Windows PowerShell, si la política de ejecución bloquea `npx.ps1`, usa:

```powershell
npx.cmd expo start
```

Escanea el código QR desde Expo Go en el teléfono o presiona `a` en la terminal para abrir la aplicación en el emulador Android.

Para iniciar Expo y abrir directamente un emulador Android ya iniciado, usa `npm.cmd run android` en PowerShell.

## Funcionalidades implementadas

- Registro, inicio y cierre de sesión con Firebase Authentication mediante correo y contraseña.
- Administración del catálogo de servicios, barberos y promociones: crear, listar, ver detalle, editar y eliminar en Firestore. El administrador también puede marcar barberos como ocupados o disponibles.
- Perfil, reservas y copia local del catálogo persistidos en SQLite.
- Creación, consulta, edición y cancelación de citas, vinculadas en Firestore al UID autenticado y sincronizadas con la copia local.
- Consulta REST de Wikimedia con indicador de carga, datos, mensaje de error y acción para reintentar.
- Formularios de acceso, cita, perfil y catálogo con validaciones y mensajes de campo.

## Configurar Firebase Authentication

1. Crea un proyecto en Firebase Console y registra una aplicación web para obtener la configuración del SDK.
2. En **Authentication → Sign-in method**, habilita **Correo electrónico/contraseña**.
3. Copia `.env.example` como `.env` y reemplaza los valores `tu-*` con la configuración de tu aplicación Firebase.
4. Reinicia Expo con `npx.cmd expo start` para cargar las variables `EXPO_PUBLIC_FIREBASE_*` en Windows PowerShell.

La configuración de Firebase que se incluye en una aplicación cliente es pública; las reglas de Firebase deben proteger los datos. No guardes credenciales de cuentas de servicio en la app.

## Estructura del proyecto

```text
src/
  application/       Servicio de aplicación
  domain/            Modelos, validaciones y contratos
  infrastructure/    Implementaciones de repositorios
  presentation/      Pantallas, componentes y estado de la interfaz
    components/      Componentes reutilizables con Props y TypeScript
    screens/         Login, Crear cuenta, Inicio, Reserva, Perfil y Administración del catálogo
```

Los estilos de interfaz se implementan con NativeWind. Las reglas de Firestore están en `firestore.rules` y las reglas de Storage, si se habilita ese producto, en `storage.rules`.

## Configurar Cloud Firestore

1. Crea la base de datos Cloud Firestore en edición Standard y modo de producción.
2. En **Firestore Database → Reglas**, reemplaza las reglas iniciales con el contenido de `firestore.rules` y pulsa **Publicar**.
3. La cuenta con UID configurado en `firestore.rules` y `src/domain/catalogAdmin.ts` verá el botón **Administrar negocio**. Al abrir cada categoría por primera vez, la app crea sus registros iniciales.
4. Los clientes pueden leer servicios, barberos y promociones; solo la cuenta administradora puede escribir o borrar esos registros.

## Persistencia local con SQLite

El perfil, las reservas y una copia local del catálogo se guardan en `barberia-local.db` mediante `expo-sqlite`, que conserva la base al cerrar y volver a abrir la aplicación. En el primer inicio, los perfiles y las reservas que hubiera en AsyncStorage se migran a SQLite; la sesión de Firebase Authentication sigue usando su propio mecanismo de persistencia.

### Cómo probar el CRUD de citas y su copia SQLite

1. Inicia sesión con una cuenta de Firebase y crea una cita desde la aplicación. Al guardar, la app la escribe en Firestore y en la base local `barberia-local.db`.
2. Abre **Mi perfil** y confirma que la cita aparezca en la lista. Esa consulta usa Firestore y actualiza la copia local; si no hay conexión, la app puede mostrar los datos que ya estén en SQLite.
3. Pulsa **Modificar**, cambia los datos de la cita y guarda. Después cancélala con **Cancelar cita**.
4. Cierra completamente la app, vuelve a abrirla e inicia sesión con la misma cuenta. Confirma que la cita actualizada se mantenga; una cita cancelada ya no debe aparecer.

Las operaciones de cita se sincronizan primero con Firestore y guardan/actualizan SQLite como persistencia local. Para probar escritura en el flujo normal se requiere conexión y una sesión autenticada.

## Consumo de API REST

La pantalla principal consulta el resumen en español del artículo «Cabello» mediante una solicitud HTTP GET a la API REST de Wikimedia. Muestra carga, errores con opción de reintento, el contenido recibido y su fuente. [Documentación de la API REST de Wikimedia](https://www.mediawiki.org/wiki/Wikimedia_REST_API/en).

### Cómo probar el consumo REST

1. Con internet disponible, abre la pantalla principal y busca la tarjeta **Dato sobre el cabello**. Debe mostrar el indicador de carga y, después, el título y resumen recibido.
2. Pulsa **Actualizar** para realizar otra consulta.
3. Para comprobar el error, desactiva temporalmente la conexión de red del emulador desde los ajustes rápidos y pulsa **Reintentar**. La tarjeta debe mostrar un mensaje entendible; vuelve a activar la red al terminar.

## Datos personales en Firestore

Las citas se guardan bajo `users/{uid}/appointments` usando el UID de Firebase Authentication. Los horarios reservados se registran en `appointmentSlots` para comprobar disponibilidad entre dispositivos. `SyncedRequestRepository` mantiene SQLite como copia local y sincroniza las citas locales existentes con Firestore al consultar el perfil. Para habilitar este acceso, publica las reglas completas de `firestore.rules` en la pestaña **Reglas** de Cloud Firestore.

# Compilar e instalar en Android

La aplicación usa Expo EAS Build para generar instalables de Android. Necesitas una cuenta de Expo y configurar en EAS las variables `EXPO_PUBLIC_FIREBASE_*` indicadas en `.env.example` (las variables del archivo `.env` local no se deben publicar en Git).

1. Instala Android Studio en tu equipo y verifica que la app pueda iniciarse en el emulador con `npm.cmd run android` en PowerShell.
2. Inicia sesión en Expo: `npx.cmd eas-cli login`.
3. Vincula este proyecto con tu cuenta de Expo: `npx.cmd eas-cli build:configure`.
4. En Expo, agrega las seis variables `EXPO_PUBLIC_FIREBASE_*` de `.env.example` al entorno `preview` y `production`.
5. Genera un APK instalable para pruebas: `npx.cmd eas-cli build --platform android --profile preview`.
6. Para distribuir en Google Play, genera un AAB: `npx.cmd eas-cli build --platform android --profile production`.

EAS mostrará el enlace para descargar el archivo al terminar cada compilación. El APK se puede instalar directamente en un Android; el AAB está destinado a Google Play.

## GitHub, colaboración y evidencias

El repositorio remoto es [App-movil en GitHub](https://github.com/MATHIAS-PORTUGUEZ/App-movil). El historial actual contiene commits de la cuenta de Mathias; para acreditar trabajo de varios integrantes, cada persona debe realizar sus propios cambios y commits usando su cuenta y correo de GitHub verificado. No se deben atribuir commits a integrantes que no los hicieron.

Flujo recomendado para cada integrante:

1. Clona el repositorio y crea una rama propia: `git switch -c feature/nombre-del-cambio`.
2. Configura su identidad de Git: `git config user.name "Nombre Apellido"` y `git config user.email "correo-verificado-de-GitHub"`.
3. Guarda cambios relacionados en commits descriptivos y súbelos: `git add <archivos>`, `git commit -m "Describe el cambio"` y `git push -u origin feature/nombre-del-cambio`.
4. Abre un Pull Request para revisar e integrar su rama.


