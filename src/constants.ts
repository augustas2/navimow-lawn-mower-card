import type { CardAction, VisualState } from './types';

export const CARD_TYPE = 'navimow-lawn-mower-card';

export const ENTITY_STATE_MAP: Partial<Record<string, VisualState>> = {
    mowing: 'mowing',
    docked: 'docked',
    returning: 'returning',
    paused: 'paused',
    error: 'error',
};

export const RAW_STATE_MAP: Partial<Record<string, VisualState>> = {
    isMowing: 'mowing',
    isDocked: 'docked',
    isReturning: 'returning',
};

export const ACTION_ICONS_MAP: Record<CardAction, string> = {
    start_mowing: 'mdi:play',
    pause: 'mdi:pause',
    dock: 'mdi:home-import-outline',
};

export const enum LawnMowerFeature {
    StartMowing = 1,
    Pause = 2,
    Dock = 4,
}
