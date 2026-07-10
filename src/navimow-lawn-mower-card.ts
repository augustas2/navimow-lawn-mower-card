import {
  css,
  html,
  LitElement,
  nothing,
  type CSSResultGroup,
  type TemplateResult,
} from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { styleMap } from "lit/directives/style-map.js";
import type { HassEntity, HomeAssistant, LovelaceCardConfig } from "./types";

const CARD_VERSION = "0.2.0";
const CARD_TYPE = "navimow-lawn-mower-card";

const enum LawnMowerFeature {
  StartMowing = 1,
  Pause = 2,
  Dock = 4,
}

type VisualState = "mowing" | "docked" | "returning" | "paused" | "error" | "idle";

type CardAction = "start_mowing" | "pause" | "dock";

const stateLabelLt: Record<string, string> = {
  mowing: "Pjauna veją",
  docked: "Stovi prie stotelės",
  paused: "Pristabdyta",
  returning: "Grįžta į stotelę",
  error: "Klaida",
  unavailable: "Nepasiekiama",
  unknown: "Nežinoma",
  idle: "Laukia",
};

const visualStateColors: Record<VisualState, string> = {
  mowing: "var(--state-lawn_mower-mowing-color, var(--success-color, #43a047))",
  returning: "var(--state-lawn_mower-returning-color, var(--info-color, #039be5))",
  paused: "var(--state-lawn_mower-paused-color, var(--warning-color, #f9a825))",
  error: "var(--error-color, #db4437)",
  docked: "var(--state-inactive-color, #6f7287)",
  idle: "var(--state-inactive-color, #6f7287)",
};

const actionIcons: Record<CardAction, string> = {
  start_mowing: "M8 5v14l11-7z",
  pause: "M6 5h4v14H6zm8 0h4v14h-4z",
  dock: "M19 7v4h-7.17l2.88-2.88L13.29 6.7 8 12l5.29 5.3 1.42-1.42L11.83 13H21V7zM5 5h7V3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h7v-2H5z",
};

const actionLabels: Record<CardAction, string> = {
  start_mowing: "Pradėti",
  pause: "Pauzė",
  dock: "Į stotelę",
};

const disabledByAction: Record<CardAction, (visualState: VisualState) => boolean> = {
  start_mowing: (visualState) => visualState === "mowing" || visualState === "returning",
  pause: (visualState) => visualState !== "mowing" && visualState !== "returning",
  dock: (visualState) => visualState === "docked" || visualState === "returning",
};

const computeVisualState = (stateObj: HassEntity | undefined): VisualState => {
  if (!stateObj || stateObj.state === "unavailable" || stateObj.state === "unknown") {
    return "idle";
  }

  if (stateObj.state === "error") return "error";
  if (stateObj.state === "mowing") return "mowing";
  if (stateObj.state === "returning") return "returning";
  if (stateObj.state === "paused") return "paused";
  if (stateObj.state === "docked") return "docked";

  const rawMetric = stateObj.attributes.metrics?.raw_state;
  if (rawMetric === "isDocked") return "docked";
  if (rawMetric === "isMowing") return "mowing";
  if (rawMetric === "isReturning") return "returning";

  return "idle";
};

const supportedFeatures = (stateObj: HassEntity | undefined): number => {
  const value = stateObj?.attributes.supported_features;
  return typeof value === "number" ? value : 0;
};

const hasFeature = (
  stateObj: HassEntity | undefined,
  feature: LawnMowerFeature,
): boolean => (supportedFeatures(stateObj) & feature) !== 0;

const batteryLevel = (stateObj: HassEntity | undefined): number | undefined => {
  const battery = stateObj?.attributes.battery ?? stateObj?.attributes.battery_level;
  if (typeof battery !== "number" || Number.isNaN(battery)) return undefined;
  return Math.max(0, Math.min(100, Math.round(battery)));
};

const formatRelativeTime = (dateIso: string | undefined): string => {
  if (!dateIso) return "";

  const date = new Date(dateIso);
  const diffMs = Date.now() - date.getTime();
  if (Number.isNaN(diffMs)) return "";

  const minutes = Math.max(0, Math.round(diffMs / 60_000));
  if (minutes < 1) return "ką tik";
  if (minutes < 60) return "prieš " + String(minutes) + " min.";

  const hours = Math.round(minutes / 60);
  if (hours < 24) return "prieš " + String(hours) + " val.";

  const days = Math.round(hours / 24);
  return "prieš " + String(days) + " d.";
};

const iconForAction = (action: CardAction): string => actionIcons[action];

const actionLabel = (action: CardAction): string => actionLabels[action];

const actionDisabled = (action: CardAction, visualState: VisualState): boolean => {
  if (visualState === "idle") return true;
  return disabledByAction[action](visualState);
};

const openMoreInfo = (element: HTMLElement, entityId: string): void => {
  element.dispatchEvent(
    new CustomEvent("hass-more-info", {
      bubbles: true,
      composed: true,
      detail: { entityId },
    }),
  );
};

@customElement(CARD_TYPE)
export class NavimowLawnMowerCard extends LitElement {
  @property({ attribute: false }) public hass?: HomeAssistant;

  @state() private config?: LovelaceCardConfig;

  public setConfig(config: LovelaceCardConfig): void {
    if (!config.entity) {
      throw new Error(
        "Reikia nurodyti lawn_mower entity, pvz. lawn_mower.navimow_i210_lidar",
      );
    }

    if (!config.entity.startsWith("lawn_mower.")) {
      throw new Error("Ši kortelė skirta tik lawn_mower.* entity");
    }

    this.config = {
      show_battery: true,
      show_controls: true,
      show_last_changed: true,
      show_name: true,
      ...config,
    };
  }

  public getCardSize(): number {
    return 3;
  }

  public static getStubConfig(): Partial<LovelaceCardConfig> {
    return { entity: "lawn_mower.navimow_i210_lidar" };
  }

  public static getConfigForm(): object {
    return {
      schema: [
        {
          name: "entity",
          required: true,
          selector: { entity: { domain: "lawn_mower" } },
        },
        { name: "name", selector: { text: {} } },
        { name: "show_battery", selector: { boolean: {} } },
        { name: "show_last_changed", selector: { boolean: {} } },
        { name: "show_controls", selector: { boolean: {} } },
        { name: "show_name", selector: { boolean: {} } },
        { name: "color", selector: { text: {} } },
      ],
      computeLabel: (schema: { name: string }) => {
        const labels: Record<string, string> = {
          entity: "Robotas vejapjovė",
          name: "Pavadinimas",
          show_battery: "Rodyti bateriją",
          show_last_changed: "Rodyti paskutinį pokytį",
          show_controls: "Rodyti valdymo mygtukus",
          show_name: "Rodyti pavadinimą",
          color: "Akcento spalva, pvz. var(--primary-color)",
        };
        return labels[schema.name] ?? schema.name;
      },
    };
  }

  protected override render(): TemplateResult {
    const entityId = this.config?.entity;
    const stateObj = entityId ? this.hass?.states[entityId] : undefined;
    const visualState = computeVisualState(stateObj);
    const battery = batteryLevel(stateObj);
    const name =
      this.config?.name ?? stateObj?.attributes.friendly_name ?? entityId ?? "Vejapjovė";
    const stateText = this.computeStateText(stateObj, visualState);
    const lastChanged = formatRelativeTime(stateObj?.last_changed);
    const color = this.config?.color ?? this.computeStateColor(visualState);

    return html`
      <ha-card class=${visualState} style=${styleMap({ "--mower-color": color })}>
        <button
          class="content"
          type="button"
          aria-label=${"Atidaryti " + name}
          @click=${() => entityId && openMoreInfo(this, entityId)}
        >
          <div class="top-row">
            ${
              this.config?.show_battery !== false && battery !== undefined
                ? html`<div class="battery" title="Baterija">
                    <ha-icon
                      icon=${battery > 20 ? "mdi:battery" : "mdi:battery-alert"}
                    ></ha-icon>
                    <span>${battery}%</span>
                  </div>`
                : html`<span></span>`
            }
            <ha-icon class="menu" icon="mdi:dots-vertical"></ha-icon>
          </div>

          <div class="state-text">${stateText}</div>
          ${
            this.config?.show_last_changed !== false && lastChanged
              ? html`<div class="updated">${lastChanged}</div>`
              : nothing
          }
          ${this.renderMowerSvg(visualState)}
          ${this.config?.show_name !== false ? html`<div class="name">${name}</div>` : nothing}
          ${this.renderMetricLine(stateObj)}
        </button>

        ${
          this.config?.show_controls !== false && entityId
            ? html`<div class="actions">
                ${this.renderActions(stateObj, visualState, entityId)}
              </div>`
            : nothing
        }
      </ha-card>
    `;
  }

  private computeStateText(
    stateObj: HassEntity | undefined,
    visualState: VisualState,
  ): string {
    if (!stateObj) return "Entity nerastas";

    const localized = this.hass?.localize?.(
      "component.lawn_mower.entity_component._.state." + stateObj.state,
    );
    if (localized) return localized;

    return stateLabelLt[stateObj.state] ?? stateLabelLt[visualState] ?? stateObj.state;
  }

  private computeStateColor(visualState: VisualState): string {
    return visualStateColors[visualState];
  }

  private renderMetricLine(
    stateObj: HassEntity | undefined,
  ): TemplateResult | typeof nothing {
    const rawState = stateObj?.attributes.metrics?.raw_state;
    const status = stateObj?.attributes.status;
    const value =
      typeof rawState === "string"
        ? rawState
        : typeof status === "string"
          ? status
          : undefined;

    return value ? html`<div class="metric">${value}</div>` : nothing;
  }

  private renderActions(
    stateObj: HassEntity | undefined,
    visualState: VisualState,
    entityId: string,
  ): TemplateResult[] {
    const allActions: { action: CardAction; feature: LawnMowerFeature }[] = [
      { action: "start_mowing", feature: LawnMowerFeature.StartMowing },
      { action: "pause", feature: LawnMowerFeature.Pause },
      { action: "dock", feature: LawnMowerFeature.Dock },
    ];

    return allActions
      .filter(({ feature }) => hasFeature(stateObj, feature))
      .map(
        ({ action }) => html`
          <button
            class="action-button"
            type="button"
            title=${actionLabel(action)}
            aria-label=${actionLabel(action)}
            ?disabled=${actionDisabled(action, visualState)}
            @click=${(event: Event) => {
              void this.callLawnMowerService(event, action, entityId);
            }}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d=${iconForAction(action)}></path>
            </svg>
          </button>
        `,
      );
  }

  private async callLawnMowerService(
    event: Event,
    action: CardAction,
    entityId: string,
  ): Promise<void> {
    event.stopPropagation();
    if (!this.hass) return;
    await this.hass.callService("lawn_mower", action, { entity_id: entityId });
  }

  private renderMowerSvg(visualState: VisualState): TemplateResult {
    return html`
      <div class="svg-wrap ${visualState}">
        <svg
          viewBox="0 0 260 260"
          xmlns="http://www.w3.org/2000/svg"
          class="mower-svg navimow-svg"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="shellGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#c8ccd3" />
              <stop offset="55%" stop-color="#aeb3bc" />
              <stop offset="100%" stop-color="#8f949d" />
            </linearGradient>

            <linearGradient id="darkPanelGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#34373d" />
              <stop offset="100%" stop-color="#17191d" />
            </linearGradient>

            <linearGradient id="bumperGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#5b6069" />
              <stop offset="100%" stop-color="#30343a" />
            </linearGradient>

            <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="5" stdDeviation="5" flood-opacity="0.22" />
            </filter>
          </defs>

          <ellipse
            class="status-glow"
            cx="130"
            cy="138"
            rx="108"
            ry="105"
            fill="var(--mower-color)"
            opacity="0.08"
          />

          <g class="wheel wheel-left">
            <rect x="20" y="93" width="34" height="94" rx="15" fill="#23262b" />
            <path
              class="wheel-tread"
              d="M45 101 v78"
              stroke="#555b63"
              stroke-width="15"
              stroke-linecap="round"
              stroke-dasharray="7 8"
            />
            <path
              d="M27 104 h8 M27 139 h8 M27 174 h8"
              stroke="#ff5a1f"
              stroke-width="6"
              stroke-linecap="round"
            />
          </g>

          <g class="wheel wheel-right">
            <rect x="206" y="93" width="34" height="94" rx="15" fill="#23262b" />
            <path
              class="wheel-tread"
              d="M215 101 v78"
              stroke="#555b63"
              stroke-width="15"
              stroke-linecap="round"
              stroke-dasharray="7 8"
            />
            <path
              d="M225 104 h8 M225 139 h8 M225 174 h8"
              stroke="#ff5a1f"
              stroke-width="6"
              stroke-linecap="round"
            />
          </g>

          <path
            d="M39 105 C43 42 217 42 221 105 L234 184 C238 214 211 234 174 238 H86 C49 234 22 214 26 184 Z"
            fill="#15171a"
            opacity="0.18"
          />

          <g class="mower-body" filter="url(#softShadow)">
            <path
              class="outer-shell"
              d="M40 101 C45 39 215 39 220 101 L232 180 C237 213 210 231 174 234 H86 C50 231 23 213 28 180 Z"
              fill="url(#shellGradient)"
              stroke="#2f333a"
              stroke-width="2"
            />

            <path
              class="top-panel"
              d="M68 83 C78 45 182 45 192 83 L198 157 C199 178 179 190 155 192 H105 C81 190 61 178 62 157 Z"
              fill="url(#darkPanelGradient)"
              stroke="#101216"
              stroke-width="2"
            />

            <path
              d="M84 92 C91 66 169 66 176 92 L181 155 C182 169 168 177 151 178 H109 C92 177 78 169 79 155 Z"
              fill="none"
              stroke="#4b5057"
              stroke-width="1.2"
              opacity="0.8"
            />

            <path
              class="front-bumper"
              d="M31 176 C52 202 208 202 229 176 L233 192 C237 215 209 231 174 234 H86 C51 231 23 215 27 192 Z"
              fill="url(#bumperGradient)"
              stroke="#252930"
              stroke-width="2"
            />

            <rect
              x="106"
              y="185"
              width="48"
              height="22"
              rx="8"
              fill="#2b2f35"
              stroke="#797f89"
              stroke-width="2"
            />
            <rect x="114" y="189" width="32" height="14" rx="5" fill="#08090b" />
            <circle cx="121" cy="196" r="7" fill="#16191f" opacity="0.8" />

            <rect
              class="orange-accent"
              x="51"
              y="217"
              width="36"
              height="8"
              rx="4"
              fill="#ff5a1f"
              transform="rotate(8 69 221)"
            />
            <rect
              class="orange-accent"
              x="173"
              y="217"
              width="36"
              height="8"
              rx="4"
              fill="#ff5a1f"
              transform="rotate(-8 191 221)"
            />

            <g opacity="0.3">
              <line
                x1="111"
                y1="219"
                x2="111"
                y2="234"
                stroke="#1a1d21"
                stroke-width="2"
              />
              <line
                x1="121"
                y1="219"
                x2="121"
                y2="234"
                stroke="#1a1d21"
                stroke-width="2"
              />
              <line
                x1="131"
                y1="219"
                x2="131"
                y2="234"
                stroke="#1a1d21"
                stroke-width="2"
              />
              <line
                x1="141"
                y1="219"
                x2="141"
                y2="234"
                stroke="#1a1d21"
                stroke-width="2"
              />
              <line
                x1="151"
                y1="219"
                x2="151"
                y2="234"
                stroke="#1a1d21"
                stroke-width="2"
              />
            </g>

            <g class="lidar">
              <ellipse cx="130" cy="77" rx="40" ry="16" fill="#0e1014" opacity="0.65" />
              <ellipse
                class="lidar-blue-ring"
                cx="130"
                cy="77"
                rx="37"
                ry="13"
                fill="none"
                stroke="#3ba7ff"
                stroke-width="4"
                opacity="0.95"
              />
              <rect x="91" y="49" width="78" height="31" rx="14" fill="#1d2026" />
              <ellipse
                cx="130"
                cy="49"
                rx="39"
                ry="18"
                fill="#e4e7eb"
                stroke="#70757f"
                stroke-width="1.5"
              />
              <path d="M130 39 l7 7 h-14 z" fill="#8c929c" opacity="0.85" />
              <rect x="121" y="63" width="18" height="15" rx="4" fill="#2f3339" />
            </g>

            <rect
              class="stop-button"
              x="92"
              y="103"
              width="76"
              height="24"
              rx="12"
              fill="#ff3f18"
              stroke="#b92a11"
              stroke-width="2"
            />

            <rect
              x="96"
              y="143"
              width="68"
              height="25"
              rx="6"
              fill="#24282e"
              stroke="#555b64"
            />
            <g class="leds">
              <rect x="110" y="154" width="10" height="4" rx="2" fill="#ffffff" />
              <rect x="125" y="154" width="10" height="4" rx="2" fill="#ffffff" />
              <rect x="140" y="154" width="10" height="4" rx="2" fill="#ffffff" />
            </g>
          </g>

          <g class="blade-disc">
            <circle
              cx="130"
              cy="150"
              r="42"
              fill="none"
              stroke="var(--mower-color)"
              stroke-width="1.5"
              stroke-dasharray="7 6"
            />
            <circle cx="130" cy="150" r="5" fill="var(--mower-color)" />
            <line
              x1="130"
              y1="150"
              x2="130"
              y2="113"
              stroke="var(--mower-color)"
              stroke-width="2"
            />
            <line
              x1="130"
              y1="150"
              x2="162"
              y2="169"
              stroke="var(--mower-color)"
              stroke-width="2"
            />
            <line
              x1="130"
              y1="150"
              x2="98"
              y2="169"
              stroke="var(--mower-color)"
              stroke-width="2"
            />
          </g>
        </svg>
      </div>
    `;
  }

  static override styles: CSSResultGroup = css`
    :host {
      display: block;
    }

    ha-card {
      --mower-text-color: var(--primary-text-color, #4f5268);
      --mower-secondary-text-color: var(--secondary-text-color, #6b6f86);
      --mower-icon-button-bg: color-mix(in srgb, var(--mower-color) 10%, transparent);
      overflow: hidden;
      border-radius: var(--ha-card-border-radius, 14px);
      background: var(--ha-card-background, var(--card-background-color, #fff));
      color: var(--mower-text-color);
    }

    .content {
      appearance: none;
      border: 0;
      background: transparent;
      color: inherit;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 100%;
      padding: 14px 16px 8px;
      text-align: center;
      font: inherit;
    }

    .top-row {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      min-height: 28px;
    }

    .battery {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 15px;
      font-weight: 600;
      color: var(--mower-secondary-text-color);
    }

    .battery ha-icon {
      --mdc-icon-size: 18px;
    }

    .menu {
      --mdc-icon-size: 22px;
      color: var(--mower-secondary-text-color);
      opacity: 0.85;
    }

    .state-text {
      margin-top: 2px;
      font-size: clamp(24px, 4vw, 34px);
      line-height: 1.05;
      font-weight: 500;
      letter-spacing: -0.03em;
      color: var(--mower-text-color);
    }

    .updated {
      margin-top: 4px;
      color: var(--mower-secondary-text-color);
      font-weight: 700;
      font-size: 14px;
    }

    .svg-wrap {
      width: min(180px, 32vw);
      height: min(180px, 32vw);
      margin-top: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .mower-svg {
      width: 100%;
      height: 100%;
      overflow: visible;
    }

    .name {
      margin-top: 4px;
      font-size: 15px;
      line-height: 1.2;
      font-weight: 700;
      color: var(--mower-text-color);
    }

    .metric {
      margin-top: 5px;
      font-size: 12px;
      line-height: 1;
      color: var(--mower-secondary-text-color);
      opacity: 0.8;
    }

    .actions {
      display: flex;
      gap: 14px;
      align-items: center;
      padding: 10px 18px 14px;
      border-top: 1px solid var(--divider-color, rgba(0, 0, 0, 0.08));
    }

    .action-button {
      appearance: none;
      border: 0;
      border-radius: 14px;
      background: var(--mower-icon-button-bg);
      color: var(--mower-color);
      width: 48px;
      height: 48px;
      display: inline-grid;
      place-items: center;
      cursor: pointer;
      transition:
        transform 120ms ease,
        opacity 120ms ease,
        background-color 120ms ease;
    }

    .action-button:hover:not(:disabled) {
      transform: translateY(-1px);
      background: color-mix(in srgb, var(--mower-color) 16%, transparent);
    }

    .action-button:disabled {
      opacity: 0.35;
      cursor: not-allowed;
    }

    .action-button svg {
      width: 26px;
      height: 26px;
      fill: currentColor;
    }

    .navimow-svg .blade-disc {
      opacity: 0;
      transform-origin: 130px 150px;
      transition: opacity 250ms ease;
    }

    .navimow-svg .lidar-blue-ring {
      transform-origin: 130px 77px;
    }

    .navimow-svg .wheel-tread {
      transition: stroke-dashoffset 200ms linear;
    }

    .navimow-svg .status-glow {
      transition: opacity 250ms ease;
    }

    .mowing .navimow-svg .mower-body {
      animation: navimow-drive 5s ease-in-out infinite;
      transform-origin: 130px 140px;
    }

    .mowing .navimow-svg .blade-disc {
      opacity: 0.18;
      animation: navimow-blade-spin 0.6s linear infinite;
    }

    .mowing .navimow-svg .wheel-tread {
      animation: navimow-tread 0.45s linear infinite;
    }

    .mowing .navimow-svg .lidar-blue-ring {
      animation: navimow-lidar-pulse 1.7s ease-in-out infinite;
    }

    .mowing .navimow-svg .leds {
      animation: navimow-led-pulse 1.2s ease-in-out infinite;
    }

    .returning .navimow-svg .mower-body {
      animation: navimow-return 2.4s ease-in-out infinite;
      transform-origin: 130px 140px;
    }

    .returning .navimow-svg .wheel-tread {
      animation: navimow-tread 0.65s linear infinite;
    }

    .returning .navimow-svg .lidar-blue-ring {
      animation: navimow-lidar-pulse 1.2s ease-in-out infinite;
    }

    .docked .navimow-svg .status-glow {
      animation: navimow-docked-glow 3s ease-in-out infinite;
    }

    .docked .navimow-svg .lidar-blue-ring,
    .docked .navimow-svg .leds {
      animation: navimow-charge-pulse 2.4s ease-in-out infinite;
    }

    .paused .navimow-svg .mower-body {
      opacity: 0.78;
    }

    .error .navimow-svg .status-glow,
    .error .navimow-svg .orange-accent,
    .error .navimow-svg .stop-button {
      animation: navimow-error-pulse 0.9s ease-in-out infinite;
    }

    @keyframes navimow-drive {
      0%,
      100% {
        transform: translateY(0) rotate(0deg);
      }
      25% {
        transform: translateY(-5px) rotate(-1deg);
      }
      50% {
        transform: translateY(1px) rotate(0deg);
      }
      75% {
        transform: translateY(-4px) rotate(1deg);
      }
    }

    @keyframes navimow-return {
      0%,
      100% {
        transform: translateY(0) rotate(180deg);
      }
      50% {
        transform: translateY(6px) rotate(180deg);
      }
    }

    @keyframes navimow-blade-spin {
      to {
        transform: rotate(360deg);
      }
    }

    @keyframes navimow-tread {
      to {
        stroke-dashoffset: -15;
      }
    }

    @keyframes navimow-lidar-pulse {
      0%,
      100% {
        opacity: 0.55;
      }
      50% {
        opacity: 1;
      }
    }

    @keyframes navimow-led-pulse {
      0%,
      100% {
        opacity: 0.45;
      }
      50% {
        opacity: 1;
      }
    }

    @keyframes navimow-docked-glow {
      0%,
      100% {
        opacity: 0.06;
      }
      50% {
        opacity: 0.16;
      }
    }

    @keyframes navimow-charge-pulse {
      0%,
      100% {
        opacity: 0.35;
      }
      50% {
        opacity: 1;
      }
    }

    @keyframes navimow-error-pulse {
      0%,
      100% {
        opacity: 0.35;
      }
      50% {
        opacity: 1;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .mowing .navimow-svg .mower-body,
      .mowing .navimow-svg .blade-disc,
      .mowing .navimow-svg .wheel-tread,
      .mowing .navimow-svg .lidar-blue-ring,
      .mowing .navimow-svg .leds,
      .returning .navimow-svg .mower-body,
      .returning .navimow-svg .wheel-tread,
      .returning .navimow-svg .lidar-blue-ring,
      .docked .navimow-svg .status-glow,
      .docked .navimow-svg .lidar-blue-ring,
      .docked .navimow-svg .leds,
      .error .navimow-svg .status-glow,
      .error .navimow-svg .orange-accent,
      .error .navimow-svg .stop-button {
        animation: none;
      }
    }
  `;
}

window.customCards = window.customCards ?? [];
window.customCards.push({
  type: CARD_TYPE,
  name: "Navimow Lawn Mower Card",
  preview: true,
  description:
    "Kortelė lawn_mower entity su baterija, būsenos tekstu, Navimow stiliaus SVG animacija ir komandomis.",
  documentationURL:
    "https://developers.home-assistant.io/docs/frontend/custom-ui/custom-card/",
  getEntitySuggestion: (_hass: HomeAssistant, entityId: string) => {
    if (!entityId.startsWith("lawn_mower.")) return null;
    return { config: { type: "custom:" + CARD_TYPE, entity: entityId } };
  },
});

console.info(
  "%c" + CARD_TYPE + " " + CARD_VERSION,
  "color: var(--primary-color); font-weight: 700",
);

declare global {
  interface HTMLElementTagNameMap {
    [CARD_TYPE]: NavimowLawnMowerCard;
  }

  interface Window {
    customCards?: {
      type: string;
      name: string;
      preview?: boolean;
      description?: string;
      documentationURL?: string;
      getEntitySuggestion?: (
        hass: HomeAssistant,
        entityId: string,
      ) => { config: Record<string, string> } | null;
    }[];
  }
}
