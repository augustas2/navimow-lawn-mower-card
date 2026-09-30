import { css } from 'lit';

export const cardStyles = css`
    :host {
        display: block;
    }

    ha-card {
        overflow: hidden;
        color: var(--primary-text-color);
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

    .state-text--error {
        color: var(--error-color, #db4437);
    }

    .updated {
        margin-top: var(--ha-space-1);
        font-style: normal;
        font-size: var(--ha-font-size-l);
        font-weight: var(--ha-font-weight-medium);
        line-height: var(--ha-line-height-normal);
        letter-spacing: 0.1px;
    }

    .mower-image-wrap {
        width: min(100%, 300px);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        isolation: isolate;
    }

    .mower-image-wrap::before {
        content: '';
        position: absolute;
        z-index: -1;
        width: 78%;
        aspect-ratio: 1;
        border-radius: 50%;
        filter: blur(24px);
        opacity: 0;
    }

    .mower-image {
        width: 100%;
        height: 100%;
        object-fit: contain;
        filter: drop-shadow(0 14px 12px rgb(0 0 0 / 18%));
        transition: opacity 120ms ease-out;
    }

    .state-indicator {
        --state-indicator-color: var(--state-inactive-color, #6f7287);

        position: absolute;
        display: grid;
        place-items: center;
        width: 58px;
        aspect-ratio: 1;
        border: 2px solid color-mix(in srgb, var(--state-indicator-color) 70%, white);
        border-radius: 50%;
        background: color-mix(
            in srgb,
            var(--card-background-color, #fff) 98%,
            transparent
        );
        color: var(--state-indicator-color);
        box-shadow: 0 0 0 7px
            color-mix(in srgb, var(--state-indicator-color) 14%, transparent);
        backdrop-filter: blur(3px);
    }

    .state-indicator--error {
        --state-indicator-color: var(--error-color, #db4437);
    }

    .state-indicator ha-icon {
        --mdc-icon-size: 30px;
    }

    .name {
        margin-bottom: var(--ha-space-3);
        font-size: var(--ha-font-size-l);
        line-height: 1.2;
        font-weight: var(--ha-font-weight-medium);
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
        border-radius: var(--ha-border-radius-lg, 12px);
        background: color-mix(in srgb, var(--primary-color) 14%, transparent);
        color: var(--primary-color);
        width: 48px;
        height: 48px;
        display: inline-grid;
        place-items: center;
        cursor: pointer;
        transition:
            opacity 120ms ease,
            background-color 120ms ease;
    }

    .action-button:hover:not(:disabled) {
        background: color-mix(in srgb, var(--primary-color) 22%, transparent);
    }

    .action-button:disabled {
        opacity: 0.35;
        cursor: not-allowed;
    }

    .action-button ha-icon {
        --mdc-icon-size: 26px;
    }
`;
