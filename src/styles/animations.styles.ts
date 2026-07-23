import { css } from "lit";

export const animationStyles = css`
    .mower-body,
    .wheel,
    .lidar-ring {
        transform-box: fill-box;
        transform-origin: center;
    }

    .mowing .mower-body {
        animation: mower-drive 5s ease-in-out infinite;
    }

    .mowing .lidar-ring {
        animation: lidar-pulse 1.6s ease-in-out infinite;
    }

    .mowing .wheel-tread {
        animation: tread-pulse 0.55s linear infinite;
    }

    .returning .mower-body {
        animation: mower-returning 2.4s ease-in-out infinite;
    }

    .returning .lidar-ring {
        animation: lidar-pulse 1.2s ease-in-out infinite;
    }

    .returning .wheel-tread {
        animation: tread-pulse 0.7s linear infinite;
    }

    .docked .lidar-ring {
        animation: charge-pulse 2.4s ease-in-out infinite;
    }

    .paused .mower-body {
        opacity: 0.8;
    }

    .error .stop-button {
        animation: error-blink 0.8s ease-in-out infinite;
    }

    .error .orange-accent {
        animation: error-glow 1s ease-in-out infinite;
    }

    @keyframes mower-drive {
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

    @keyframes mower-returning {
        0%,
        100% {
            transform: translateY(0);
        }

        50% {
            transform: translateY(6px);
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

    @keyframes tread-pulse {
        0%,
        100% {
            opacity: 0.15;
        }

        50% {
            opacity: 1;
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
        .mowing .mower-body,
        .mowing .lidar-ring,
        .mowing .wheel-tread,
        .returning .mower-body,
        .returning .lidar-ring,
        .returning .wheel-tread,
        .docked .lidar-ring,
        .error .stop-button,
        .error .orange-accent {
            animation: none;
        }
    }
`;
