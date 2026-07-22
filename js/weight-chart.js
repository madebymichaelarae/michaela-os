<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>Weight Trend | Michaela OS</title>

    <link rel="stylesheet" href="/css/styles.css">
</head>

<body class="widget-page">
    <main class="widget-shell">
        <article class="widget-card">
            <header class="widget-header">
                <div>
                    <p class="widget-eyebrow">Health</p>
                    <h1 class="widget-title">Weight Trend</h1>
                </div>

                <span class="widget-icon" aria-hidden="true">⚖️</span>
            </header>

            <section class="widget-content">
                <div class="weight-summary">
                    <div>
                        <p class="weight-current-label">Current weight</p>

                        <p class="weight-current">
                            <span id="currentWeight">—</span>
                            <span class="weight-unit">lbs</span>
                        </p>
                    </div>

                    <div class="weight-details">
                        <p id="weightChange">Calculating progress…</p>
                        <p id="weightUpdated">Loading latest entry…</p>
                    </div>
                </div>

                <section class="weight-goal" aria-labelledby="weightGoalLabel">
                    <div class="weight-goal-header">
                        <p id="weightGoalLabel">Goal 1</p>
                        <p id="weightGoalRemaining">Calculating goal…</p>
                    </div>

                    <div
                        class="weight-progress-track"
                        role="progressbar"
                        aria-label="Progress toward 200 pound goal"
                        aria-valuemin="0"
                        aria-valuemax="100"
                        aria-valuenow="0"
                    >
                        <div
                            id="weightProgressBar"
                            class="weight-progress-bar"
                        ></div>
                    </div>

                    <p id="weightGoalDetails" class="weight-goal-details">
                        Loading progress…
                    </p>
                </section>

                <div class="chart-container">
                    <canvas
                        id="weightChart"
                        role="img"
                        aria-label="Line chart showing weight measurements over time."
                    ></canvas>
                </div>
            </section>
        </article>
    </main>

    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="/js/weight-chart.js"></script>
</body>

</html>
