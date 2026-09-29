import {
    html,
    LitElement,
    nothing,
    type CSSResultGroup,
    type PropertyValues,
    type TemplateResult,
} from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { HomeAssistant } from 'custom-card-helpers';
import { getCurrentDocumentLanguage, localize } from './translations/localize';
import mowerImage from './assets/210_lidar_pro.png';
import { animationStyles, cardStyles } from './styles';
import {
    ACTION_ICONS_MAP,
    CARD_TYPE,
    ENTITY_STATE_MAP,
    LawnMowerFeature,
    RAW_STATE_MAP,
} from './constants';
import type { CardAction, HassEntity, NavimowCardConfig, VisualState } from './types';

const disabledByAction: Record<CardAction, (visualState: VisualState) => boolean> = {
    start_mowing: (visualState) =>
        visualState === 'mowing' || visualState === 'returning',
    pause: (visualState) => visualState !== 'mowing' && visualState !== 'returning',
    dock: (visualState) => visualState === 'docked' || visualState === 'returning',
};

const actionFeatures: Record<CardAction, LawnMowerFeature> = {
    start_mowing: LawnMowerFeature.StartMowing,
    pause: LawnMowerFeature.Pause,
    dock: LawnMowerFeature.Dock,
};

const computeVisualState = (stateObj: HassEntity | undefined): VisualState => {
    if (!stateObj) return 'idle';

    const rawState = stateObj.attributes.metrics?.raw_state;

    return (
        ENTITY_STATE_MAP[stateObj.state] ??
        (typeof rawState === 'string' ? RAW_STATE_MAP[rawState] : undefined) ??
        'idle'
    );
};

const supportedFeatures = (stateObj: HassEntity | undefined): number => {
    const value = stateObj?.attributes.supported_features;

    return typeof value === 'number' ? value : 0;
};

const hasFeature = (
    stateObj: HassEntity | undefined,
    feature: LawnMowerFeature,
): boolean => (supportedFeatures(stateObj) & feature) !== 0;

const batteryIcon = (battery: number): string => {
    if (battery <= 5) return 'mdi:battery-outline';

    if (battery >= 95) return 'mdi:battery';

    const level = Math.ceil(battery / 10) * 10;

    return `mdi:battery-${String(level)}`;
};

const batteryLevel = (stateObj: HassEntity | undefined): number | undefined => {
    const battery = stateObj?.attributes.battery ?? stateObj?.attributes.battery_level;

    if (typeof battery !== 'number' || Number.isNaN(battery)) return undefined;

    return Math.max(0, Math.min(100, Math.round(battery)));
};

const formatRelativeTime = (dateIso: string | undefined, language?: string): string => {
    if (!dateIso) return '';

    const date = new Date(dateIso);
    const diffMs = Date.now() - date.getTime();

    if (Number.isNaN(diffMs)) return '';

    const minutes = Math.max(0, Math.round(diffMs / 60_000));

    if (minutes < 1) {
        return localize('card.just_now', language);
    }

    if (minutes < 60) {
        return localize('card.minutes_ago', language, {
            count: minutes,
        });
    }

    const hours = Math.round(minutes / 60);

    if (hours < 24) {
        return localize('card.hours_ago', language, {
            count: hours,
        });
    }

    const days = Math.round(hours / 24);

    return localize('card.days_ago', language, {
        count: days,
    });
};

const iconForAction = (action: CardAction): string => ACTION_ICONS_MAP[action];

const actionLabel = (action: CardAction, language?: string): string =>
    localize(`actions.${action}`, language);

const actionDisabled = (action: CardAction, visualState: VisualState): boolean => {
    if (visualState === 'idle') return true;

    return disabledByAction[action](visualState);
};

const openMoreInfo = (element: HTMLElement, entityId: string): void => {
    element.dispatchEvent(
        new CustomEvent('hass-more-info', {
            bubbles: true,
            composed: true,
            detail: { entityId },
        }),
    );
};

@customElement(CARD_TYPE)
export class NavimowLawnMowerCard extends LitElement {
    @property({ attribute: false }) public hass?: HomeAssistant;

    @state() private config?: NavimowCardConfig;

    @state() private isCallingService = false;

    private pendingEntityState: string | undefined;

    private static readonly DEFAULT_CONFIG = {
        show_battery: true,
        show_controls: true,
        show_last_changed: true,
        show_name: true,
    } satisfies Partial<NavimowCardConfig>;

    public setConfig(config: NavimowCardConfig): void {
        const language = getCurrentDocumentLanguage();

        if (!config.entity) {
            throw new Error(localize('errors.entity_required', language));
        }

        if (!config.entity.startsWith('lawn_mower.')) {
            throw new Error(localize('errors.invalid_entity', language));
        }

        this.config = {
            ...NavimowLawnMowerCard.DEFAULT_CONFIG,
            ...config,
        };
    }

    public getCardSize(): number {
        return 3;
    }

    public static getStubConfig(
        hass: HomeAssistant,
        entities: string[] = [],
        entitiesFallback: string[] = [],
    ): Partial<NavimowCardConfig> {
        const lawnMowerEntity =
            entities.find((entityId) => entityId.startsWith('lawn_mower.')) ??
            entitiesFallback.find((entityId) => entityId.startsWith('lawn_mower.')) ??
            Object.keys(hass.states).find((entityId) =>
                entityId.startsWith('lawn_mower.'),
            ) ??
            '';

        return {
            entity: lawnMowerEntity,
            ...NavimowLawnMowerCard.DEFAULT_CONFIG,
        };
    }

    public static getConfigForm(): object {
        const language = getCurrentDocumentLanguage();

        return {
            schema: [
                {
                    name: 'entity',
                    required: true,
                    selector: { entity: { domain: 'lawn_mower' } },
                },
                { name: 'name', selector: { text: {} } },
                { name: 'show_battery', selector: { boolean: {} } },
                { name: 'show_last_changed', selector: { boolean: {} } },
                { name: 'show_controls', selector: { boolean: {} } },
                { name: 'show_name', selector: { boolean: {} } },
            ],
            computeLabel: (schema: { name: string }): string => {
                const translationKeys: Record<string, string> = {
                    entity: 'common.entity',
                    name: 'common.name',
                    show_battery: 'config.show_battery',
                    show_last_changed: 'config.show_last_changed',
                    show_controls: 'config.show_controls',
                    show_name: 'config.show_name',
                };

                const translationKey = translationKeys[schema.name];

                return translationKey ? localize(translationKey, language) : schema.name;
            },
        };
    }

    protected override render(): TemplateResult {
        const entityId = this.config?.entity;
        const stateObj = entityId ? this.hass?.states[entityId] : undefined;
        const visualState = computeVisualState(stateObj);
        const battery = batteryLevel(stateObj);
        const name = this.config?.name ?? stateObj?.attributes.friendly_name ?? entityId;
        const stateText =
            this.hass && stateObj
                ? (
                      this.hass as HomeAssistant & {
                          formatEntityState(stateObj: HassEntity, state?: string): string;
                      }
                  ).formatEntityState(stateObj)
                : localize('card.entity_not_found', this.hass?.language);
        const lastChanged = formatRelativeTime(
            stateObj?.last_changed,
            this.hass?.language,
        );

        return html`
            <ha-card>
                <button
                    class="content"
                    type="button"
                    aria-label=${localize('card.open_more_info', this.hass?.language, {
                        name: name ?? '',
                    })}
                    @click=${() => entityId && openMoreInfo(this, entityId)}
                >
                    <div class="top-row">
                        ${
                            this.config?.show_battery !== false && battery !== undefined
                                ? html`<div
                                      class="battery"
                                      title=${localize('card.battery', this.hass?.language)}
                                  >
                                      <ha-icon icon=${batteryIcon(battery)}></ha-icon>
                                      <span>${battery}%</span>
                                  </div>`
                                : html`<span></span>`
                        }
                    </div>
                    <div class="state-text">${stateText}</div>
                    ${
                        this.config?.show_last_changed !== false && lastChanged
                            ? html`<div class="updated">${lastChanged}</div>`
                            : nothing
                    }
                    ${this.renderMowerImage(visualState)}
                    ${this.config?.show_name !== false ? html`<div class="name">${name}</div>` : nothing}
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

    private renderActions(
        stateObj: HassEntity | undefined,
        visualState: VisualState,
        entityId: string,
    ): TemplateResult[] {
        const allActions: { action: CardAction; feature: LawnMowerFeature }[] = [
            { action: 'start_mowing', feature: LawnMowerFeature.StartMowing },
            { action: 'pause', feature: LawnMowerFeature.Pause },
            { action: 'dock', feature: LawnMowerFeature.Dock },
        ];

        return allActions
            .filter(({ feature }) => hasFeature(stateObj, feature))
            .map(({ action }) => {
                const label = actionLabel(action, this.hass?.language);

                return html`
                    <button
                        class="action-button"
                        type="button"
                        title=${label}
                        aria-label=${label}
                        ?disabled=${this.isCallingService || actionDisabled(action, visualState)}
                        @click=${(event: Event) => {
                            void this.callLawnMowerService(event, action, entityId);
                        }}
                    >
                        <ha-icon icon=${iconForAction(action)}></ha-icon>
                    </button>
                `;
            });
    }

    private async callLawnMowerService(
        event: Event,
        action: CardAction,
        entityId: string,
    ): Promise<void> {
        event.stopPropagation();

        const hass = this.hass;

        if (!hass || !this.canCallLawnMowerService(action, entityId)) return;

        this.pendingEntityState = hass.states[entityId]?.state;
        this.isCallingService = true;

        try {
            await hass.callService('lawn_mower', action, { entity_id: entityId });
        } catch (error) {
            this.isCallingService = false;
            this.pendingEntityState = undefined;
            throw error;
        }
    }

    private canCallLawnMowerService(action: CardAction, entityId: string): boolean {
        if (!this.hass || this.isCallingService) return false;

        const stateObj = this.hass.states[entityId];

        return (
            hasFeature(stateObj, actionFeatures[action]) &&
            !actionDisabled(action, computeVisualState(stateObj))
        );
    }

    protected override updated(changedProperties: PropertyValues<this>): void {
        if (!changedProperties.has('hass') || !this.isCallingService) return;

        const currentState = this.hass?.states[this.config?.entity ?? '']?.state;

        if (currentState !== this.pendingEntityState) {
            this.isCallingService = false;
            this.pendingEntityState = undefined;
        }
    }

    private renderMowerImage(visualState: VisualState): TemplateResult {
        return html`
            <div class="mower-image-wrap ${visualState}">
                <img
                    class="mower-image"
                    src=${mowerImage}
                    alt=${localize('card.mower_image', this.hass?.language)}
                />
                ${
                    visualState === 'paused'
                        ? html`<div class="paused-indicator" aria-hidden="true">
                              <ha-icon icon="mdi:pause"></ha-icon>
                          </div>`
                        : html`<div class="paused-indicator" aria-hidden="true">
                              <ha-icon icon="mdi:pause"></ha-icon>
                          </div>`
                }
            </div>
        `;
    }

    public static override styles: CSSResultGroup = [cardStyles, animationStyles];
}

window.customCards = window.customCards ?? [];
window.customCards.push({
    type: CARD_TYPE,
    name: 'Navimow Lawn Mower Card',
    preview: true,
    description:
        'Navimow lawn mower card with battery, translated state, SVG animation and controls.',
    documentationURL: 'https://github.com/augustas2/navimow-lawn-mower-card',
    getEntitySuggestion: (_hass: HomeAssistant, entityId: string) => {
        if (!entityId.startsWith('lawn_mower.')) return null;

        return {
            config: {
                type: `custom:${CARD_TYPE}`,
                entity: entityId,
            },
        };
    },
});

declare global {
    interface HTMLElementTagNameMap {
        [CARD_TYPE]: NavimowLawnMowerCard;
    }
}
