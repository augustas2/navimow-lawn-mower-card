import { css } from "lit";

export const cardStyles = css`
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
        min-height: 30px;
    }

    .battery {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 15px;
        font-weight: var(--ha-font-weight-medium, 600);
        color: var(--mower-secondary-text-color);
    }

    .battery ha-icon {
        --mdc-icon-size: 18px;
        line-height: 1;
    }

    .state-text {
        font-style: normal;
        font-weight: var(--ha-font-weight-normal);
        font-size: clamp(22px, 4vw, 30px);
        line-height: var(--ha-line-height-condensed);
    }

    .updated {
        margin-top: var(--ha-space-1);
        font-style: normal;
        font-size: var(--ha-font-size-l);
        font-weight: var(--ha-font-weight-medium, 500);
        line-height: var(--ha-line-height-normal);
        letter-spacing: 0.1px;
        cursor: pointer;
        user-select: none;
        -webkit-tap-highlight-color: transparent;
    }

    .svg-wrap {
        width: min(200px, 32vw);
        height: min(200px, 32vw);
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
        font-size: 15px;
        line-height: 1.2;
        font-weight: var(--ha-font-weight-bold);
        color: var(--mower-text-color);
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
