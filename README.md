# Barbería

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

Los clientes crean una cuenta local desde «Crear cuenta» con usuario y contraseña; el inicio de sesión solo autentica cuentas existentes. El usuario también se usa como nombre inicial del perfil y puede cambiarse después. El perfil (nombre y foto) y las reservas se guardan en AsyncStorage; las contraseñas se guardan con SecureStore. La reserva permite elegir servicio, barbero, promoción opcional, fecha futura, horario libre, nombre, teléfono y descripción. Los nombres de barberos, promociones y horarios son de muestra. Los horarios ocupados se bloquean entre cuentas de esta instalación/dispositivo; el usuario que hizo una reserva puede tocar su horario y confirmar para cancelarla. El botón «Actualizar» vuelve a consultar los horarios y elimina las reservas con fecha anterior a hoy; las reservas de hoy y las futuras siguen ocupando su hora. Las vencidas también se eliminan al iniciar la app y a medianoche mientras está abierta. No se sincronizan entre teléfonos porque no hay un servidor.

## Estructura del proyecto

```text
src/
  application/       Servicio de aplicación
  domain/            Modelos, validaciones y contratos
  infrastructure/    Implementaciones de repositorios
  presentation/      Pantallas, componentes y estado de la interfaz
    components/      Componentes reutilizables con Props y TypeScript
    screens/         Pantallas de Login, Crear cuenta, Home, Registro y Perfil
```

Los estilos de interfaz se implementan con NativeWind...
