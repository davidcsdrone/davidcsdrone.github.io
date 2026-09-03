(function () {
    if (typeof Chart === "undefined") {
        return;
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tickFont = {
        family: "Montserrat, sans-serif",
        size: 12,
    };
    const titleFont = {
        family: "Montserrat, sans-serif",
        size: 13,
        weight: "bold",
    };
    const animation = reduceMotion
        ? false
        : {
              duration: 900,
              easing: "easeOutCubic",
          };

    const formatMse = function (value) {
        return value
            .toFixed(8)
            .replace(/0+$/, "")
            .replace(/\.$/, "");
    };

    const joinedLabel = function (raw) {
        return Array.isArray(raw) ? raw.join(" ") : raw;
    };

    const watchChart = function (canvas, config) {
        if (!canvas) {
            return;
        }

        let chart = null;
        const createChart = function () {
            if (chart) {
                return;
            }
            chart = new Chart(canvas, config);
        };

        if (reduceMotion) {
            createChart();
            return;
        }

        const observer = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        createChart();
                        observer.disconnect();
                    }
                });
            },
            { threshold: 0.4 }
        );
        observer.observe(canvas);
    };

    const coverageCanvas = document.getElementById("coverageEfficiencyChart");
    watchChart(coverageCanvas, {
        type: "bar",
        data: {
            labels: ["200", "400", "600"],
            datasets: [
                {
                    label: "GIBHRA (our algorithm)",
                    data: [99.2, 63.0, 27.4],
                    backgroundColor: "#cd0100",
                    borderColor: "#111111",
                    borderWidth: 1,
                },
                {
                    label: "HCHA",
                    data: [36.9, 16.1, 8.1],
                    backgroundColor: "#0066cb",
                    borderColor: "#111111",
                    borderWidth: 1,
                },
                {
                    label: "HPA",
                    data: [50.8, 24.2, 8.6],
                    backgroundColor: "#188018",
                    borderColor: "#111111",
                    borderWidth: 1,
                },
                {
                    label: "NLCHR",
                    data: [18.0, 3.3, 0.5],
                    backgroundColor: "#9830c8",
                    borderColor: "#111111",
                    borderWidth: 1,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: animation,
            plugins: {
                legend: {
                    position: "top",
                    align: "end",
                    labels: {
                        boxWidth: 18,
                        boxHeight: 10,
                        font: tickFont,
                        color: "#212529",
                    },
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return context.dataset.label + ": " + context.parsed.y + "%";
                        },
                    },
                },
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: "Number of Deployed Nodes",
                        color: "#212529",
                        font: titleFont,
                    },
                    ticks: {
                        color: "#212529",
                        font: tickFont,
                    },
                    grid: {
                        display: false,
                    },
                },
                y: {
                    min: 0,
                    max: 100,
                    ticks: {
                        stepSize: 10,
                        color: "#212529",
                        font: tickFont,
                    },
                    title: {
                        display: true,
                        text: "Coverage Efficiency (%)",
                        color: "#212529",
                        font: titleFont,
                    },
                    grid: {
                        color: "rgba(0, 0, 0, 0.12)",
                    },
                    border: {
                        color: "#111111",
                    },
                },
            },
            datasets: {
                bar: {
                    categoryPercentage: 0.72,
                    barPercentage: 0.92,
                },
            },
        },
    });

    const weakFormZero = 9.864703e-9;
    const weakFormTen = 1.8144e-6;
    const singleLayerZero = 2.923511e-4;
    const singleLayerTen = 4.7e-4;
    const gnnZero = 2.777429e-4;
    const gnnTen = 5.24e-4;

    const predictionCanvas = document.getElementById("predictionErrorChart");
    watchChart(predictionCanvas, {
        type: "bar",
        data: {
            labels: [
                ["Weak-form SINDy", "(ours)"],
                ["Single-layer", "SINDy"],
                ["Graph neural", "ODE"],
            ],
            datasets: [
                {
                    label: "0% noise",
                    data: [weakFormZero, singleLayerZero, gnnZero],
                    backgroundColor: "#111111",
                    borderColor: "#111111",
                    borderWidth: 1,
                },
                {
                    label: "10% noise",
                    data: [weakFormTen, singleLayerTen, gnnTen],
                    backgroundColor: "#0066cb",
                    borderColor: "#111111",
                    borderWidth: 1,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: animation,
            plugins: {
                legend: {
                    position: "top",
                    align: "end",
                    labels: {
                        boxWidth: 18,
                        boxHeight: 10,
                        font: tickFont,
                        color: "#212529",
                    },
                },
                tooltip: {
                    callbacks: {
                        title: function (items) {
                            return joinedLabel(items[0].chart.data.labels[items[0].dataIndex]);
                        },
                        label: function (context) {
                            const value = context.parsed.y;
                            let text = context.dataset.label + ": " + formatMse(value);
                            if (context.datasetIndex === 1 && context.dataIndex > 0) {
                                const fold = Math.round(value / weakFormTen);
                                text += "  (about " + fold + "x the weak-form error)";
                            }
                            return text;
                        },
                    },
                },
            },
            scales: {
                x: {
                    ticks: {
                        color: "#212529",
                        font: tickFont,
                    },
                    grid: {
                        display: false,
                    },
                },
                y: {
                    type: "logarithmic",
                    min: 1e-9,
                    max: 1e-3,
                    ticks: {
                        color: "#212529",
                        font: tickFont,
                        callback: function (value) {
                            const allowed = [1e-8, 1e-6, 1e-4, 1e-3];
                            const match = allowed.find(function (tick) {
                                return Math.abs(value - tick) / tick < 1e-6;
                            });
                            if (!match) {
                                return "";
                            }
                            return formatMse(match);
                        },
                    },
                    title: {
                        display: true,
                        text: "Mean prediction error (log scale)",
                        color: "#212529",
                        font: titleFont,
                    },
                    grid: {
                        color: "rgba(0, 0, 0, 0.12)",
                    },
                    border: {
                        color: "#111111",
                    },
                },
            },
            datasets: {
                bar: {
                    categoryPercentage: 0.64,
                    barPercentage: 0.86,
                },
            },
        },
    });
})();
