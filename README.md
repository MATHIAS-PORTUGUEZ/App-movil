# Bravo Barbería

Aplicación móvil de ejemplo para una barbería, desarrollada con Expo, React Native y TypeScript. Incluye inicio de sesión de demostración, selección de Low Fade, Mullet, Taper o un corte personalizado; elección de Messi, Ronaldo o Neymar como barbero de demostración; promociones de ejemplo; calendario de próximos días y horarios para registrar una solicitud de cita.

## Requisitos

- Node.js LTS y npm
- Expo Go en un teléfono Android/iOS o un emulador Android configurado

## Instalación y ejecución

Clona el repositorio e instala sus dependencias:

```bash
git clone https://github.com/MATHIAS-PORTUGUEZ/App-movil.git
cd App-movil
npm install
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

## Validaciones

El primer inicio de sesión de cada nombre de usuario crea una cuenta local de demostración; los siguientes ingresos requieren su contraseña local. El perfil (nombre y foto) y las reservas se guardan en AsyncStorage; las contraseñas se guardan con SecureStore. La reserva permite elegir servicio, barbero, promoción opcional, fecha futura, horario libre, nombre, teléfono y descripción. Los nombres de barberos, promociones y horarios son de muestra. Los horarios ocupados se bloquean entre cuentas de esta instalación/dispositivo; el usuario que hizo una reserva puede tocar su horario y confirmar para cancelarla. Las reservas de fechas anteriores a hoy se eliminan automáticamente al iniciar la app, consultar/gestionar reservas y al llegar la medianoche mientras la app está abierta. No se sincronizan entre teléfonos porque no hay un servidor.

## Estructura del proyecto

```text
src/
  application/       Servicio de aplicación
  components/        Componentes reutilizables con Props y TypeScript
  domain/            Modelos, validaciones y contratos
  infrastructure/    Implementaciones de repositorios
  presentation/      Estado y acciones de interfaz mediante hooks
  screens/           Pantallas de Login, Home y Registro
```

Los estilos de interfaz se implementan con NativeWind.
