# Navimow Lawn Mower Card

[![Release](https://github.com/augustas2/navimow-lawn-mower-card/actions/workflows/release.yml/badge.svg)](https://github.com/augustas2/navimow-lawn-mower-card/actions/workflows/release.yml)

A Home Assistant dashboard card for `lawn_mower.*` entities, designed for Navimow robotic lawn mowers. It shows the current mower state, battery level, update time, product image, and state-aware controls.

![Navimow Lawn Mower Card](https://raw.githubusercontent.com/augustas2/navimow-lawn-mower-card/main/src/assets/card.png)

## Features

- Localized English and Lithuanian interface
- Navimow product image with subtle state-specific visual feedback
- Battery level and relative last-updated time
- Optional mower name, battery, update time, and controls
- Start, pause, and dock controls based on the entity `supported_features` bit mask
- Duplicate-command protection while Home Assistant processes a mower action
- Visual editor and lawn-mower entity suggestion support
- `prefers-reduced-motion` support

## Installation

### HACS

1. In HACS, open **Dashboard** and choose **Download repositories**.
2. Search for **Navimow Lawn Mower Card**. Until it is included in the default HACS repository, add `augustas2/navimow-lawn-mower-card` as a custom repository with the **Dashboard** category.
3. Download the card.
4. Add the dashboard resource if HACS does not add it automatically:

    ```yaml
    url: /hacsfiles/navimow-lawn-mower-card/navimow-lawn-mower-card.js
    type: module
    ```

### Manual installation

1. Download `navimow-lawn-mower-card.js` from the latest release.
2. Copy it to `/config/www/navimow-lawn-mower-card.js`.
3. Add the dashboard resource:

    ```yaml
    url: /local/navimow-lawn-mower-card.js
    type: module
    ```

Refresh the browser after installing or updating the resource.

## Configuration

```yaml
type: custom:navimow-lawn-mower-card
entity: lawn_mower.navimow_i210_lidar
name: Navimow i210 LiDAR
show_battery: true
show_last_changed: true
show_controls: true
show_name: true
```

| Option              | Required | Description                                                             |
| ------------------- | -------- | ----------------------------------------------------------------------- |
| `entity`            | Yes      | A `lawn_mower.*` entity.                                                |
| `name`              | No       | Name shown below the mower image. Defaults to the entity friendly name. |
| `show_battery`      | No       | Shows the battery level. Defaults to `true`.                            |
| `show_last_changed` | No       | Shows the relative last-changed time. Defaults to `true`.               |
| `show_controls`     | No       | Shows mower control buttons. Defaults to `true`.                        |
| `show_name`         | No       | Shows the mower name. Defaults to `true`.                               |

## Controls and states

The card uses the standard Home Assistant lawn-mower services:

| Action | Service                   | Availability                                                           |
| ------ | ------------------------- | ---------------------------------------------------------------------- |
| Start  | `lawn_mower.start_mowing` | When the entity supports `StartMowing` and is not mowing or returning. |
| Pause  | `lawn_mower.pause`        | When the entity supports `Pause` and is mowing or returning.           |
| Dock   | `lawn_mower.dock`         | When the entity supports `Dock` and is not docked or returning.        |

Controls are disabled while a command is pending, then re-enabled after Home Assistant reports an entity state change. A failed service call re-enables them immediately.

Visual feedback is deliberately understated: mowing and returning have gentle motion, paused and error states show a centered state indicator, and docked is static. All animation is disabled when the user enables reduced motion.
