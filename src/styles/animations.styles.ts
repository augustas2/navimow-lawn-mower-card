import { css } from 'lit';

export const animationStyles = css`
    .mower-assembly,
    .mower-body,
    .lidar-ring {
        transform-box: fill-box;
        transform-origin: center;
    }

    .mowing .mower-assembly {
        animation: mower-drive 1.4s ease-in-out infinite;
    }

    .mowing .lidar-ring {
        animation: lidar-pulse 1.6s ease-in-out infinite;
    }

    .mowing .wheel-tread {
        animation: wheel-tread-up 2.5s linear infinite;
    }

    .returning .mower-assembly {
        animation: mower-drive 1.4s ease-in-out infinite;
    }

    .returning .lidar-ring {
        animation: lidar-pulse 1.6s ease-in-out infinite;
    }

    .returning .wheel-tread {
        animation: wheel-tread-down 2.5s linear infinite;
    }

    .docked .lidar-ring {
        animation: charge-pulse 2.4s ease-in-out infinite;
    }

    .paused .mower-assembly {
        opacity: 0.6;
    }

    .error .leds {
        animation: error-blink 1.6s ease-in-out infinite;
    }

    .error .lidar-ring {
        animation: lidar-pulse 1.6s ease-in-out infinite;
        stroke: var(--ha-color-on-danger-normal);
    }

    .error .led {
        fill: var(--ha-color-on-danger-normal);
    }

    @keyframes wheel-tread-up {
        from {
            translate: 0 0;
        }

        to {
            translate: 0 -35px;
        }
    }

    @keyframes wheel-tread-down {
        from {
            translate: 0 0;
        }

        to {
            translate: 0 35px;
        }
    }

    @keyframes mower-drive {
        0%,
        100% {
            transform: translate3d(0, 0, 0) rotate(0deg);
        }

        15% {
            transform: translate3d(0.7px, -0.4px, 0) rotate(0.18deg);
        }

        30% {
            transform: translate3d(-0.5px, 0.5px, 0) rotate(-0.15deg);
        }

        45% {
            transform: translate3d(0.4px, 0.2px, 0) rotate(0.12deg);
        }

        60% {
            transform: translate3d(-0.7px, -0.3px, 0) rotate(-0.18deg);
        }

        75% {
            transform: translate3d(0.5px, 0.4px, 0) rotate(0.14deg);
        }
    }

    @keyframes lidar-pulse {
        0%,
        100% {
            opacity: 0.35;
            transform: scale(0.98);
        }

        50% {
            opacity: 1;
            transform: scale(1.03);
        }
    }

    @keyframes charge-pulse {
        0%,
        100% {
            opacity: 0.25;
        }

        50% {
            opacity: 1;
        }
    }

    @keyframes error-glow {
        0%,
        100% {
            opacity: 0.35;
        }

        50% {
            opacity: 1;
        }
    }

    @keyframes error-blink {
        0%,
        100% {
            opacity: 0.25;
        }

        50% {
            opacity: 1;
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .mowing .mower-assembly,
        .mowing .lidar-ring,
        .mowing .wheel-tread,
        .returning .mower-assembly,
        .returning .lidar-ring,
        .returning .wheel-tread,
        .docked .lidar-ring,
        .error .leds {
            animation: none;
        }
    }
`;
