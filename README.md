# Navimow Lawn Mower Card

Home Assistant Lovelace custom card for `lawn_mower.*` entities. It is built with **Lit + TypeScript + Vite** and reuses the mower SVG/animation that you provided.

## Features

- Big state text, similar to the screenshot: `Stovi prie stotelės`, `Pjauna veją`, `Grįžta į stotelę`, etc.
- Battery level in the top-left corner.
- Animated mower SVG below the state text.
- Friendly name and raw metric/status line.
- Start, pause, and dock buttons based on the entity `supported_features` bit mask.
- Home Assistant visual editor support through `getConfigForm()`.
- Home Assistant 2026.6+ entity suggestion support through `window.customCards.getEntitySuggestion()`.
- `prefers-reduced-motion` support.

## Project structure

```text
navimow-lawn-mower-card/
├─ src/
│  ├─ navimow-lawn-mower-card.ts
│  └─ types.ts
├─ package.json
├─ tsconfig.json
├─ vite.config.ts
├─ eslint.config.js
├─ .prettierrc.json
├─ .gitignore
├─ hacs.json
└─ README.md
```

## Development in IntelliJ IDEA

1. Open the `navimow-lawn-mower-card` folder in IntelliJ IDEA.
2. Use Node.js 20+.
3. Install dependencies:

```bash
npm install
```

4. Run checks:

```bash
npm run typecheck
npm run lint
npm run format:check
npm run check
```

5. Start dev server:

```bash
npm run dev
```

6. Build production file:

```bash
npm run build
```

The build output will be:

```text
dist/navimow-lawn-mower-card.js
```

## Install in Home Assistant

Copy this file:

```text
dist/navimow-lawn-mower-card.js
```

to:

```text
/config/www/navimow-lawn-mower-card.js
```

Then add a dashboard resource:

```yaml
url: /local/navimow-lawn-mower-card.js
type: module
```

## Lovelace YAML example

```yaml
type: custom:navimow-lawn-mower-card
entity: lawn_mower.navimow_i210_lidar
name: Roborock Qrevo Edge Series
show_battery: true
show_last_changed: true
show_controls: true
show_name: true
```

For your mower, use:

```yaml
type: custom:navimow-lawn-mower-card
entity: lawn_mower.navimow_i210_lidar
name: Navimow i210 LiDAR
```

## Optional config

| Option              | Type    | Default              | Description                       |
| ------------------- | ------- | -------------------- | --------------------------------- |
| `entity`            | string  | required             | Must be a `lawn_mower.*` entity.  |
| `name`              | string  | entity friendly name | Card name under SVG.              |
| `show_battery`      | boolean | `true`               | Shows battery in top-left corner. |
| `show_last_changed` | boolean | `true`               | Shows relative last changed time. |
| `show_controls`     | boolean | `true`               | Shows start/pause/dock buttons.   |
| `show_name`         | boolean | `true`               | Shows friendly name under SVG.    |

## Services used

The action buttons call standard Home Assistant services:

- `lawn_mower.start_mowing`
- `lawn_mower.pause`
- `lawn_mower.dock`

They are shown only when the entity reports the matching `supported_features` flag.
