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

export const visualStateColors: Record<VisualState, string> = {
    mowing: 'var(--state-lawn_mower-mowing-color, var(--success-color, #43a047))',
    returning: 'var(--state-lawn_mower-returning-color, var(--info-color, #039be5))',
    paused: 'var(--state-lawn_mower-paused-color, var(--warning-color, #f9a825))',
    error: 'var(--error-color, #db4437)',
    docked: 'var(--state-inactive-color, #6f7287)',
    idle: 'var(--state-inactive-color, #6f7287)',
};

export const enum LawnMowerFeature {
    StartMowing = 1,
    Pause = 2,
    Dock = 4,
}