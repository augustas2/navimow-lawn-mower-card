import { css } from 'lit';

export const animationStyles = css`
    :is(.mowing, .returning) .mower-image {
        animation: mower-drive 1.8s ease-in-out infinite;
    }

    .mowing::before {
        animation: state-glow 2.4s ease-in-out infinite;
    }

    .returning::before {
        animation: state-glow 2.8s ease-in-out infinite;
    }

    .paused .mower-image {
        opacity: 0.72;
    }

    .error::before {
        background: var(--error-color, #db4437);
        animation: error-glow 1.4s ease-in-out infinite;
    }

    .error .mower-image {
        filter: drop-shadow(0 14px 12px rgb(219 68 55 / 35%));
    }

    @keyframes mower-drive {
        0%,
        100% {
            transform: translate3d(0, 0, 0) rotate(0deg);
        }

        25% {
            transform: translate3d(2px, -3px, 0) rotate(0.3deg);
        }

        75% {
            transform: translate3d(-2px, -2px, 0) rotate(-0.3deg);
        }
    }

    @keyframes state-glow {
        0%,
        100% {
            opacity: 0.08;
            transform: scale(0.88);
        }

        50% {
            opacity: 0.28;
            transform: scale(1);
        }
    }

    @keyframes error-glow {
        0%,
        100% {
            opacity: 0.12;
            transform: scale(0.9);
        }

        50% {
            opacity: 0.4;
            transform: scale(1);
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .mower-image,
        .mower-image-wrap::before {
            animation: none;
        }
    }
`;
