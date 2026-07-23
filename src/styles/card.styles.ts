import { css } from 'lit';

export const cardStyles = css`
    :host {
        display: block;
    }

    ha-card {
        --mower-text-color: var(--primary-text-color, #4f5268);
        --mower-secondary-text-color: var(--secondary-text-color, #6b6f86);
        --mower-icon-button-bg: color-mix(in srgb, var(--mower-color) 10%, transparent);

        overflow: hidden;
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
        padding: var(--ha-space-4) var(--ha-space-4) var(--ha-space-2);
        text-align: center;
        font: inherit;
    }

    .top-row {
        width: 100%;
        display: flex;
        align-items: center;
        min-height: 30px;
    }

    .battery {
        display: inline-flex;
        align-items: center;
        gap: var(--ha-space-1);
        font-size: var(--ha-font-size-m);
        font-weight: var(--ha-font-weight-medium);
        color: var(--mower-secondary-text-color);
    }

    .battery ha-icon {
        --mdc-icon-size: 18px;
    }

    .state-text {
        font-style: normal;
        font-weight: var(--ha-font-weight-normal);
        font-size: clamp(22px, 4vw, 26px);
        line-height: var(--ha-line-height-condensed);
    }

    .updated {
        margin-top: var(--ha-space-1);
        font-style: normal;
        font-size: var(--ha-font-size-l);
        font-weight: var(--ha-font-weight-medium);
        line-height: var(--ha-line-height-normal);
        letter-spacing: 0.1px;
    }

    .svg-wrap {
        width: clamp(220px, 32vw, 220px);
        height: clamp(220px, 32vw, 220px);
        margin-top: var(--ha-space-4);
        margin-bottom: var(--ha-space-3);
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .svg-wrap > svg {
        width: 100%;
        height: 100%;
        overflow: visible;
        display: block;
    }

    .name {
        margin-bottom: var(--ha-space-3);
        font-size: var(--ha-font-size-m);
        line-height: 1.2;
        font-weight: var(--ha-font-weight-bold);
        color: var(--mower-text-color);
    }

    .actions {
        display: flex;
        gap: var(--ha-space-3);
        align-items: center;
        padding: var(--ha-space-3) var(--ha-space-4) var(--ha-space-3);
        border-top: 1px solid var(--divider-color, rgba(0, 0, 0, 0.08));
    }

    .action-button {
        appearance: none;
        border: 0;
        border-radius: var(--ha-border-radius-lg);
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
        background: color-mix(in srgb, var(--mower-color) 16%, transparent);
    }

    .action-button:disabled {
        opacity: 0.35;
        cursor: not-allowed;
    }

    .action-button ha-icon {
        --mdc-icon-size: 26px;
    }
`;
