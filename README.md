# Toilet Finder

An application to find public toilets using OpenStreetMap data (Overpass API). Built with Vue 3, Vite, TypeScript, Leaflet, and configured as a Progressive Web App (PWA).

## Features
- **Interactive Map**: Built with Leaflet, centering on the user's geolocation and displaying nearby restrooms.
- **Modern Floating Filters**: Filter toilets based on features ("Free Toilets", "Wheelchair Accessible", "Drinking Water Nearby") using styled floating pills at the top.
- **Mobile-Friendly (PWA)**: Designed for mobile use, offering a native-like experience:
  - **Bottom Sheet**: When clicking a marker on mobile, details slide up from the bottom with a dimmed background overlay.
  - **Positioned Controls**: Zoom controls are positioned at the bottom left, keeping the top clear for filters.
  - **Centering FAB**: Quickly center the map back to your current position, shifting up dynamically when the bottom sheet is open.
- **Detailed Restroom Info**: Restrooms show customized details with icons (in desktop popups and the mobile bottom sheet):
  - Fee and accessibility status.
  - Changing table and drinking water availability.
  - Flush vs. squat position, disposal type, and unisex status.
  - Handwashing sink, toilet paper availability, and accepted payment methods (Cash, Cards, Contactless).
  - Calculated distance from your current position.
- **Universal Navigation Link**: Direction CTA buttons open native map apps depending on the device: Apple Maps on iOS, and Google Maps on Android and Desktop.


## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur) + [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin).

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin) to make the TypeScript language service aware of `.vue` types.

If the standalone TypeScript plugin doesn't feel fast enough to you, Volar has also implemented a [Take Over Mode](https://github.com/johnsoncodehk/volar/discussions/471#discussioncomment-1361669) that is more performant. You can enable it by the following steps:

1. Disable the built-in TypeScript Extension
    1) Run `Extensions: Show Built-in Extensions` from VSCode's command palette
    2) Find `TypeScript and JavaScript Language Features`, right click and select `Disable (Workspace)`
2. Reload the VSCode window by running `Developer: Reload Window` from the command palette.

## Customize configuration

See [Vite Configuration Reference](https://vitejs.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
npm run test:unit
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```
