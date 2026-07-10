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

const CARD_VERSION = "0.1.0";
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

const computeVisualState = (stateObj: HassEntity | undefined): VisualState => {
  if (!stateObj || stateObj.state === "unavailable" || stateObj.state === "unknown")
    return "idle";
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

const iconForAction = (action: CardAction): string => actionIcons[action];

const actionLabel = (action: CardAction): string => actionLabels[action];

const actionDisabled = (action: CardAction, visualState: VisualState): boolean => {
  if (visualState === "idle") return true;

  switch (action) {
    case "start_mowing":
      return visualState === "mowing" || visualState === "returning";
    case "pause":
      return visualState !== "mowing" && visualState !== "returning";
    case "dock":
      return visualState === "docked" || visualState === "returning";
  }
};

const openMoreInfo = (element: HTMLElement, entityId: string): void => {
  const event = new Event("hass-more-info", {
    bubbles: true,
    composed: true,
  }) as Event & {
    detail?: { entityId: string };
  };
  event.detail = { entityId };
  element.dispatchEvent(event);
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
    return 5;
  }

  public getGridOptions(): {
    rows: number;
    columns: number;
    min_rows: number;
    min_columns: number;
  } {
    return {
      columns: 12,
      min_columns: 6,
    };
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
        return labels[schema.name];
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
    switch (visualState) {
      case "mowing":
        return "var(--state-lawn_mower-mowing-color, var(--success-color, #43a047))";
      case "returning":
        return "var(--state-lawn_mower-returning-color, var(--info-color, #039be5))";
      case "paused":
        return "var(--state-lawn_mower-paused-color, var(--warning-color, #f9a825))";
      case "error":
        return "var(--error-color, #db4437)";
      case "docked":
      case "idle":
        return "var(--state-inactive-color, #6f7287)";
    }
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
            @click=${(event: Event) => this.callLawnMowerService(event, action, entityId)}
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
        <svg viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg" class="mower-svg">
          <circle
            cx="120"
            cy="120"
            r="110"
            class="glow"
            fill="var(--mower-color)"
            opacity="0.06"
          />

          <g class="dock-indicator">
            <rect
              x="80"
              y="188"
              width="80"
              height="24"
              rx="7"
              fill="var(--card-background-color, #fff)"
              stroke="var(--mower-color)"
              stroke-width="2"
            />
          </g>

          <g class="return-path">
            <polygon
              points="120,220 110,208 130,208"
              fill="var(--mower-color)"
              stroke="var(--mower-color)"
              stroke-width="2"
              stroke-linejoin="round"
              opacity="0.55"
            />
          </g>

          <g class="mower-body-rotate">
            <g class="mower-body">
              <g class="blade-disc">
                <circle
                  cx="120"
                  cy="130"
                  r="46"
                  fill="none"
                  stroke="var(--mower-color)"
                  stroke-width="1.5"
                  stroke-dasharray="8 6"
                />
                <circle cx="120" cy="130" r="6" fill="var(--mower-color)" />
                <line
                  x1="120"
                  y1="130"
                  x2="120"
                  y2="88"
                  stroke="var(--mower-color)"
                  stroke-width="2"
                  stroke-linecap="round"
                />
                <line
                  x1="120"
                  y1="130"
                  x2="156"
                  y2="151"
                  stroke="var(--mower-color)"
                  stroke-width="2"
                  stroke-linecap="round"
                />
                <line
                  x1="120"
                  y1="130"
                  x2="84"
                  y2="151"
                  stroke="var(--mower-color)"
                  stroke-width="2"
                  stroke-linecap="round"
                />
              </g>

              <g class="wheel wheel-left">
                <rect
                  x="50"
                  y="144"
                  width="12"
                  height="40"
                  rx="5"
                  fill="var(--card-background-color, #fff)"
                  stroke="var(--mower-color)"
                  stroke-width="1.5"
                  opacity="0.7"
                />
                <line
                  class="tread"
                  x1="56"
                  y1="148"
                  x2="56"
                  y2="180"
                  stroke="var(--mower-color)"
                  stroke-width="6"
                  stroke-dasharray="3 3"
                  stroke-linecap="butt"
                  opacity="0.12"
                />
              </g>
              <g class="wheel wheel-right">
                <rect
                  x="178"
                  y="144"
                  width="12"
                  height="40"
                  rx="5"
                  fill="var(--card-background-color, #fff)"
                  stroke="var(--mower-color)"
                  stroke-width="1.5"
                  opacity="0.7"
                />
                <line
                  class="tread"
                  x1="184"
                  y1="148"
                  x2="184"
                  y2="180"
                  stroke="var(--mower-color)"
                  stroke-width="6"
                  stroke-dasharray="3 3"
                  stroke-linecap="butt"
                  opacity="0.12"
                />
              </g>

              <path
                d="M 64,98 C 64,50 176,50 176,98 L 176,168 C 176,180 168,186 158,186 L 82,186 C 72,186 64,180 64,168 Z"
                fill="var(--card-background-color, #fff)"
                stroke="var(--mower-color)"
                stroke-width="2"
                class="body-shell"
              />

              <path
                d="M 74,102 C 74,60 166,60 166,102 L 166,162 C 166,172 160,176 152,176 L 88,176 C 80,176 74,172 74,162 Z"
                fill="none"
                stroke="var(--mower-color)"
                stroke-width="0.8"
                opacity="0.2"
              />

              <path
                d="M 64,102 C 64,52 176,52 176,102"
                fill="none"
                stroke="var(--mower-color)"
                stroke-width="4"
                stroke-linecap="round"
                class="bumper"
              />
              <path
                d="M 72,100 C 72,58 168,58 168,100"
                fill="none"
                stroke="var(--mower-color)"
                stroke-width="1"
                stroke-linecap="round"
                opacity="0.15"
              />

              <circle cx="92" cy="68" r="1.5" fill="var(--mower-color)" opacity="0.15" />
              <circle cx="120" cy="60" r="1.5" fill="var(--mower-color)" opacity="0.15" />
              <circle cx="148" cy="68" r="1.5" fill="var(--mower-color)" opacity="0.15" />

              <circle
                cx="120"
                cy="78"
                r="4"
                fill="var(--mower-color)"
                opacity="0.08"
                class="led-ring"
              />
              <circle
                cx="120"
                cy="78"
                r="2.5"
                fill="var(--mower-color)"
                opacity="0.5"
                class="led-dot"
              />

              <circle
                cx="120"
                cy="148"
                r="8"
                fill="var(--mower-color)"
                opacity="0.06"
                class="power-ring"
              />
              <circle
                cx="120"
                cy="148"
                r="4"
                fill="var(--mower-color)"
                opacity="0.2"
                class="power-dot"
              />

              <mask id="outside-body">
                <rect width="240" height="240" fill="white" />
                <path
                  d="M 60,98 C 60,46 180,46 180,98 L 180,170 C 180,182 172,190 160,190 L 80,190 C 68,190 60,182 60,170 Z"
                  fill="black"
                />
              </mask>
              <g class="particles" mask="url(#outside-body)">
                <path
                  class="grass g1"
                  d="M64,110 q-3,4 -1,8"
                  fill="none"
                  stroke="var(--mower-color)"
                  stroke-width="1.4"
                  stroke-linecap="round"
                />
                <path
                  class="grass g2"
                  d="M63,126 q-4,3 -2,8"
                  fill="none"
                  stroke="var(--mower-color)"
                  stroke-width="1.2"
                  stroke-linecap="round"
                />
                <path
                  class="grass g3"
                  d="M64,140 q-4,3 -2,8"
                  fill="none"
                  stroke="var(--mower-color)"
                  stroke-width="1.5"
                  stroke-linecap="round"
                />
                <path
                  class="grass g4"
                  d="M64,154 q-3,4 -1,8"
                  fill="none"
                  stroke="var(--mower-color)"
                  stroke-width="1.1"
                  stroke-linecap="round"
                />
                <path
                  class="grass g5"
                  d="M66,168 q-3,3 -1,8"
                  fill="none"
                  stroke="var(--mower-color)"
                  stroke-width="1.3"
                  stroke-linecap="round"
                />
                <path
                  class="grass g6"
                  d="M176,110 q3,4 1,8"
                  fill="none"
                  stroke="var(--mower-color)"
                  stroke-width="1.4"
                  stroke-linecap="round"
                />
                <path
                  class="grass g7"
                  d="M177,126 q4,3 2,8"
                  fill="none"
                  stroke="var(--mower-color)"
                  stroke-width="1.2"
                  stroke-linecap="round"
                />
                <path
                  class="grass g8"
                  d="M176,140 q4,3 2,8"
                  fill="none"
                  stroke="var(--mower-color)"
                  stroke-width="1.5"
                  stroke-linecap="round"
                />
                <path
                  class="grass g9"
                  d="M176,154 q3,4 1,8"
                  fill="none"
                  stroke="var(--mower-color)"
                  stroke-width="1.1"
                  stroke-linecap="round"
                />
                <path
                  class="grass g10"
                  d="M174,168 q3,3 1,8"
                  fill="none"
                  stroke="var(--mower-color)"
                  stroke-width="1.3"
                  stroke-linecap="round"
                />
                <path
                  class="grass g11"
                  d="M90,68 q-3,-4 -1,-8"
                  fill="none"
                  stroke="var(--mower-color)"
                  stroke-width="1.3"
                  stroke-linecap="round"
                />
                <path
                  class="grass g12"
                  d="M120,54 q1,-4 -1,-8"
                  fill="none"
                  stroke="var(--mower-color)"
                  stroke-width="1.2"
                  stroke-linecap="round"
                />
                <path
                  class="grass g13"
                  d="M150,68 q3,-4 1,-8"
                  fill="none"
                  stroke="var(--mower-color)"
                  stroke-width="1.3"
                  stroke-linecap="round"
                />
                <path
                  class="grass g14"
                  d="M92,186 q-3,4 -1,8"
                  fill="none"
                  stroke="var(--mower-color)"
                  stroke-width="1.3"
                  stroke-linecap="round"
                />
                <path
                  class="grass g15"
                  d="M120,186 q2,4 0,9"
                  fill="none"
                  stroke="var(--mower-color)"
                  stroke-width="1.1"
                  stroke-linecap="round"
                />
                <path
                  class="grass g16"
                  d="M148,186 q3,4 1,8"
                  fill="none"
                  stroke="var(--mower-color)"
                  stroke-width="1.3"
                  stroke-linecap="round"
                />
              </g>
            </g>
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
      height: 100%;
      min-height: 340px;
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
      min-height: 284px;
      padding: 16px 18px 8px;
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
      margin-top: 4px;
      font-size: clamp(30px, 7vw, 44px);
      line-height: 1.05;
      font-weight: 500;
      letter-spacing: -0.03em;
      color: var(--mower-text-color);
    }

    .updated {
      margin-top: 8px;
      color: var(--mower-secondary-text-color);
      font-weight: 700;
      font-size: 16px;
    }

    .svg-wrap {
      width: min(220px, 54vw);
      height: min(220px, 54vw);
      margin-top: 18px;
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
      margin-top: 8px;
      font-size: 18px;
      line-height: 1.2;
      font-weight: 700;
      color: var(--mower-text-color);
    }

    .metric {
      margin-top: 6px;
      font-size: 13px;
      line-height: 1;
      color: var(--mower-secondary-text-color);
      opacity: 0.8;
    }

    .actions {
      display: flex;
      gap: 16px;
      align-items: center;
      padding: 12px 22px 18px;
      border-top: 1px solid var(--divider-color, rgba(0, 0, 0, 0.08));
    }

    .action-button {
      appearance: none;
      border: 0;
      border-radius: 14px;
      background: var(--mower-icon-button-bg);
      color: var(--mower-color);
      width: 52px;
      height: 52px;
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
      width: 28px;
      height: 28px;
      fill: currentColor;
    }

    .dock-indicator,
    .return-path,
    .particles {
      opacity: 0;
      transition: opacity 400ms ease;
    }

    .blade-disc {
      opacity: 0;
      transition: opacity 400ms ease;
    }

    .mowing .mower-body {
      animation: mower-wander 12s ease-in-out infinite;
      transform-origin: 120px 120px;
    }

    .mowing .blade-disc {
      opacity: 0.15;
      animation: blade-spin 0.8s linear infinite;
      transform-origin: 120px 130px;
    }

    .mowing .particles {
      opacity: 1;
    }

    .mowing .grass {
      animation: grass-eject var(--g-dur, 2s) ease-out infinite;
      animation-delay: var(--g-delay, 0s);
    }

    .mowing .g1 {
      --g-x: -36px;
      --g-y: -14px;
      --g-rot: -25deg;
      --g-dur: 1.8s;
      --g-delay: 0s;
    }
    .mowing .g2 {
      --g-x: -40px;
      --g-y: 6px;
      --g-rot: 18deg;
      --g-dur: 2.1s;
      --g-delay: -0.7s;
    }
    .mowing .g3 {
      --g-x: -34px;
      --g-y: 16px;
      --g-rot: 32deg;
      --g-dur: 1.9s;
      --g-delay: -1.3s;
    }
    .mowing .g4 {
      --g-x: -30px;
      --g-y: 22px;
      --g-rot: -15deg;
      --g-dur: 2.3s;
      --g-delay: -1.8s;
    }
    .mowing .g5 {
      --g-x: 36px;
      --g-y: -14px;
      --g-rot: 25deg;
      --g-dur: 1.8s;
      --g-delay: -0.3s;
    }
    .mowing .g6 {
      --g-x: 40px;
      --g-y: 6px;
      --g-rot: -18deg;
      --g-dur: 2.1s;
      --g-delay: -1s;
    }
    .mowing .g7 {
      --g-x: 34px;
      --g-y: 16px;
      --g-rot: -32deg;
      --g-dur: 1.9s;
      --g-delay: -1.6s;
    }
    .mowing .g8 {
      --g-x: 30px;
      --g-y: 22px;
      --g-rot: 15deg;
      --g-dur: 2.3s;
      --g-delay: -0.5s;
    }
    .mowing .g9 {
      --g-x: -28px;
      --g-y: -30px;
      --g-rot: -40deg;
      --g-dur: 2s;
      --g-delay: -0.4s;
    }
    .mowing .g10 {
      --g-x: -12px;
      --g-y: -34px;
      --g-rot: -20deg;
      --g-dur: 1.8s;
      --g-delay: -1.1s;
    }
    .mowing .g11 {
      --g-x: 3px;
      --g-y: -36px;
      --g-rot: 8deg;
      --g-dur: 1.7s;
      --g-delay: -1.7s;
    }
    .mowing .g12 {
      --g-x: 14px;
      --g-y: -34px;
      --g-rot: 20deg;
      --g-dur: 1.8s;
      --g-delay: -0.2s;
    }
    .mowing .g13 {
      --g-x: 28px;
      --g-y: -30px;
      --g-rot: 40deg;
      --g-dur: 2s;
      --g-delay: -0.9s;
    }
    .mowing .g14 {
      --g-x: -16px;
      --g-y: 28px;
      --g-rot: 22deg;
      --g-dur: 2.2s;
      --g-delay: -0.8s;
    }
    .mowing .g15 {
      --g-x: 5px;
      --g-y: 30px;
      --g-rot: -8deg;
      --g-dur: 1.6s;
      --g-delay: -1.5s;
    }
    .mowing .g16 {
      --g-x: 16px;
      --g-y: 28px;
      --g-rot: -22deg;
      --g-dur: 2.2s;
      --g-delay: -0.4s;
    }

    .mowing .tread {
      animation: tread-scroll 0.4s linear infinite;
    }

    .mowing .led-dot {
      animation: led-pulse 2s ease-in-out infinite;
    }

    .mower-body-rotate {
      transform-origin: 120px 120px;
      transform: rotate(0deg);
      transition: transform 600ms ease-in-out;
    }

    .returning .mower-body-rotate {
      transform: rotate(180deg);
    }

    .returning .mower-body {
      animation: returning-drift 3s ease-in-out infinite;
    }

    .returning .return-path {
      opacity: 1;
      animation: return-arrow 1.6s ease-in-out infinite;
      transform-origin: 120px 210px;
    }

    .returning .blade-disc {
      opacity: 0.06;
    }

    .returning .tread {
      animation: tread-scroll-reverse 0.6s linear infinite;
    }

    .docked .dock-indicator {
      opacity: 1;
    }

    .docked .mower-body {
      opacity: 0.75;
    }

    .docked .glow {
      animation: docked-glow 4s ease-in-out infinite;
    }

    .docked .power-ring,
    .docked .led-dot {
      animation: charge-pulse 2.5s ease-in-out infinite;
    }

    .paused .mower-body,
    .idle .mower-body {
      opacity: 0.7;
    }

    .paused .blade-disc {
      opacity: 0.04;
    }

    .error .glow {
      animation: error-glow 1.8s ease-in-out infinite;
    }

    .error .led-dot {
      animation: error-led 0.8s ease-in-out infinite;
    }

    @keyframes mower-wander {
      0% {
        transform: rotate(0deg) translate(0, 0);
      }
      15% {
        transform: rotate(0deg) translate(0, -30px);
      }
      25% {
        transform: rotate(0deg) translate(0, 0);
      }
      32% {
        transform: rotate(-18deg) translate(0, 0);
      }
      47% {
        transform: rotate(-18deg) translate(0, -28px);
      }
      57% {
        transform: rotate(-18deg) translate(0, 0);
      }
      63% {
        transform: rotate(12deg) translate(0, 0);
      }
      78% {
        transform: rotate(12deg) translate(0, -25px);
      }
      88% {
        transform: rotate(12deg) translate(0, 0);
      }
      95%,
      100% {
        transform: rotate(0deg) translate(0, 0);
      }
    }

    @keyframes blade-spin {
      to {
        transform: rotate(360deg);
      }
    }
    @keyframes tread-scroll {
      to {
        stroke-dashoffset: -6;
      }
    }
    @keyframes tread-scroll-reverse {
      to {
        stroke-dashoffset: 6;
      }
    }

    @keyframes grass-eject {
      0% {
        opacity: 0;
        transform: translate(0, 0) rotate(0deg) scale(0.7);
      }
      12% {
        opacity: 0.65;
        transform: translate(calc(var(--g-x) * 0.12), calc(var(--g-y) * 0.12))
          rotate(calc(var(--g-rot) * 0.1)) scale(1);
      }
      55% {
        opacity: 0.35;
        transform: translate(calc(var(--g-x) * 0.7), calc(var(--g-y) * 0.7))
          rotate(calc(var(--g-rot) * 0.7)) scale(0.8);
      }
      100% {
        opacity: 0;
        transform: translate(var(--g-x), var(--g-y)) rotate(var(--g-rot)) scale(0.4);
      }
    }

    @keyframes led-pulse {
      0%,
      100% {
        opacity: 0.3;
      }
      50% {
        opacity: 0.8;
      }
    }
    @keyframes returning-drift {
      0%,
      100% {
        transform: translateY(-6px);
      }
      50% {
        transform: translateY(4px);
      }
    }
    @keyframes return-arrow {
      0%,
      100% {
        transform: translateY(-6px);
        opacity: 0.3;
      }
      50% {
        transform: translateY(4px);
        opacity: 0.85;
      }
    }
    @keyframes docked-glow {
      0%,
      100% {
        opacity: 0.06;
      }
      50% {
        opacity: 0.14;
      }
    }
    @keyframes charge-pulse {
      0%,
      100% {
        opacity: 0.08;
      }
      50% {
        opacity: 0.25;
      }
    }
    @keyframes error-glow {
      0%,
      100% {
        opacity: 0.08;
      }
      50% {
        opacity: 0.35;
      }
    }
    @keyframes error-led {
      0%,
      100% {
        opacity: 0.2;
      }
      50% {
        opacity: 0.9;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .mowing .mower-body,
      .mowing .blade-disc,
      .mowing .grass,
      .mowing .tread,
      .mowing .led-dot,
      .returning .mower-body,
      .returning .return-path,
      .returning .tread,
      .docked .glow,
      .docked .power-ring,
      .docked .led-dot,
      .error .glow,
      .error .led-dot {
        animation: none;
      }

      .mower-body-rotate {
        transition: none;
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
    "Kortelė lawn_mower entity su baterija, būsenos tekstu, SVG animacija ir komandomis.",
  documentationURL:
    "https://developers.home-assistant.io/docs/frontend/custom-ui/custom-card/",
  getEntitySuggestion: (_hass, entityId) => {
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
}
