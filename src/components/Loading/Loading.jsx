import "./Loading.css";

const letters = ["F", "l", "o", "w", "o", "r", "a"];

const particles = [
    ["-44%", "-54%", "3px", "0s"],
    ["-29%", "-20%", "4px", ".08s"],
    ["-17%", "-62%", "2px", ".03s"],
    ["-4%", "-37%", "3px", ".14s"],
    ["11%", "-57%", "2px", ".05s"],
    ["23%", "-27%", "4px", ".17s"],
    ["39%", "-49%", "3px", ".1s"],
    ["48%", "-14%", "2px", ".2s"],
    ["-37%", "18%", "2px", ".16s"],
    ["-19%", "34%", "3px", ".23s"],
    ["-3%", "25%", "4px", ".08s"],
    ["17%", "41%", "2px", ".19s"],
    ["34%", "22%", "3px", ".12s"],
    ["52%", "38%", "2px", ".26s"],
];

function Loading() {
    return (
        <main className="loading-page" aria-label="Loading Flowora">
            <div className="loading-shape loading-shape--one" aria-hidden="true" />
            <div className="loading-shape loading-shape--two" aria-hidden="true" />

            <section className="loading-content">
                <div className="wordmark-stage">
                    <div className="wordmark-glow" aria-hidden="true" />
                    <svg className="light-trace" viewBox="0 0 700 140" preserveAspectRatio="none" aria-hidden="true">
                        <defs>
                            <linearGradient id="traceLine" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#ffffff" />
                                <stop offset="50%" stopColor="#c4b5fd" />
                                <stop offset="100%" stopColor="#ffffff" />
                            </linearGradient>
                        </defs>
                        <path d="M14 88 C86 111 112 43 177 77 S277 111 327 72 S427 34 476 81 S590 112 686 57" />
                    </svg>
                    <h1 className="flowora-wordmark" aria-label="Flowora">
                        {letters.map((letter, index) => (
                            <span key={`${letter}-${index}`} style={{ "--letter-index": index }}>{letter}</span>
                        ))}
                    </h1>
                    <div className="wordmark-particles" aria-hidden="true">
                        {particles.map(([x, y, size, delay]) => (
                            <i
                                key={`${x}-${y}`}
                                style={{ "--x": x, "--y": y, "--size": size, "--particle-delay": delay }}
                            />
                        ))}
                    </div>
                </div>

                <div className="loading-caption">
                    <span className="loading-caption__rule" aria-hidden="true" />
                    <p>مساحة عملك</p>
                    <span className="loading-caption__rule" aria-hidden="true" />
                </div>
            </section>

            <div className="loading-vignette" aria-hidden="true" />
        </main>
    );
}

export default Loading;