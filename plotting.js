// import Plotly from "https://cdn.jsdelivr.net/npm/plotly.js-dist@3.1.0/+esm";
// import Plotly from "https://esm.run/plotly.js-dist";
import 'https://cdn.plot.ly/plotly-3.1.0.min.js';
// Plotly is defined as side-effect

export class ScrollingPlot {
    bufferLength = 300; // seconds: five minutes
    plotData = {
        type: "scatter",
        x: [], 
        y: [], 
        mode: "lines",
        name: "HR",
        line: { width: 2, color: "red" }
    };
    layout = {
      xaxis: {
        title: {
          text: "time (s)",
        },
        // type: log_x.value ? "log" : "linear",
        autorange: true,
        type: "linear",
      },
      yaxis: {
        title: { text: "Beats per minute" },
        // exponentformat: "power",
        // showexponent: "all",
        // type: log_y.value ? "log" : "linear",
        type: "linear",
        autorange: true,
      }
    };
    plotDiv = null; // HTML element

    constructor(target) {
        if (target instanceof HTMLBaseElement) {
            this.plotDiv = target;
        }
        else if (typeof target === 'string') {
            this.plotDiv = document.getElementById(target);
        }
        this.draw();
    }

    add_point(x, y) {
        this.plotData.x.push(x);
        this.plotData.y.push(y);
        this.draw();
    }

    draw() {
        console.log("x:", this.plotData?.x);
        Plotly.react(this.plotDiv, [this.plotData], this.layout, {responsive: true});
    }
}