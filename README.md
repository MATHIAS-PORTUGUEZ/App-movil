# Bravo Barbería

Aplicación móvil de ejemplo para una barbería, desarrollada con Expo, React Native y TypeScript. Incluye inicio de sesión de demostración, pantalla de inicio y formulario para registrar solicitudes de servicio.

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

La pantalla de inicio de sesión requiere usuario y contraseña no vacíos; es una demostración y no autentica contra un servidor. El formulario de solicitudes requiere nombre, teléfono válido, tipo de servicio y descripción. Las solicitudes se conservan solo en memoria mientras la aplicación está abierta.

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
