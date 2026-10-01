import type { HomeAssistant, LovelaceCardConfig } from 'custom-card-helpers';

export type HassEntityAttributeValue =
    string | number | boolean | null | undefined | object;

export interface HassEntity {
    entity_id: string;
    state: string;
    last_changed: string;
    last_updated: string;
    attributes: Record<string, HassEntityAttributeValue> & {
        friendly_name?: string;
        battery?: number | string;
        battery_level?: number | string;
        status?: string;
        supported_features?: number;
        metrics?: {
            raw_state?: string;
            [key: string]: unknown;
        };
    };
}

export interface NavimowCardConfig extends LovelaceCardConfig {
    entity?: string;
    name?: string;
    show_name?: boolean;
    show_last_changed?: boolean;
    show_controls?: boolean;
    show_battery?: boolean;
}

interface CustomCardEntry {
    type: string;
    name: string;
    preview?: boolean;
    description?: string;
    documentationURL?: string;
    getEntitySuggestion?: (
        hass: HomeAssistant,
        entityId: string,
    ) => null | {
        config: LovelaceCardConfig;
        label?: string;
    };
}

export type VisualState = 'mowing' | 'docked' | 'returning' | 'paused' | 'error' | 'idle';

export type CardAction = 'start_mowing' | 'pause' | 'dock';

declare global {
    interface Window {
        customCards?: CustomCardEntry[];
    }
}
