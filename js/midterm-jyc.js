'use strict';
(function() {

  let data = "no data";
  let svgContainer = ""; // keep SVG reference in global scope

  // load data and make histogram after window loads
  window.onload = function() {
    svgContainer = d3.select('body')
      .append('svg')
      .attr('width', 1300)
      .attr('height', 600);

    // d3.csv is basically fetch but it can be be passed a csv file as a parameter
    d3.csv("data/Seasons.csv")
      .then(csvData => {
        data = csvData;
        makeBarChart(data);
      });
  }

  function makeBarChart(data) {

    // get arrays of years data and average viewers' data
    let season_year = data.map((row) => parseFloat(row["Year"]));
    let avg_viewer = data.map((row) => parseFloat(row["Avg. Viewers (mil)"]));
    console.log(season_year);
    console.log(avg_viewer);

    // find data limits
    let axesLimits = findMinMax(season_year, avg_viewer);
    console.log(axesLimits);

    // draw axes and return scaling + mapping functions
    //let mapFunctions = drawAxes(axesLimits, "Year", "Avg. Viewers (mil)", svgContainer);
    let mapFunctions = drawAxes(axesLimits, season_year, avg_viewer, svgContainer);
  
    // plot data as points and add tooltip functionality
    plotData(mapFunctions);

    // draw title and axes labels
    makeLabels();

    // draw the average line for this data visualization
    plotLine(avg_viewer, mapFunctions);
  }

  // make title and axes labels
  function makeLabels() {
    svgContainer.append('text')
      .attr('x', 500)
      .attr('y', 40)
      .style('font-size', '14pt')
      .text("Average Viewership By Season");

    svgContainer.append('text')
      .attr('x', 650)
      .attr('y', 550)
      .attr('text-anchor', 'middle')
      .style('font-size', '10pt')
      .style('font-weight', 'Bold')
      .text('Season Years');

    svgContainer.append('text')
      .attr('transform', 'translate(60, 380)rotate(-90)')
      .style('font-size', '10pt')
      .style('font-weight', 'Bold')
      .text('Avg. Viewer (in millions)');
    

    // make legend for this data visualization
    svgContainer.append("rect")
      .attr("x", 1000)
      .attr("y", 35)
      .attr("width", 150)
      .attr("height", 80)
      .style("stroke", "darkgray")
      .style("fill", "none")
      .style("stroke-width", 1);

    svgContainer.append("text")
      .attr("x", 1020)
      .attr("y", 60)
      .text("Viewership Data");

    svgContainer.append("rect")
      .attr("x", 1020)
      .attr("y", 70)
      .attr("width", 10)
      .attr("height", 10)
      .style("stroke", "black")
      .style("fill", "lightblue")
      .style("stroke-width", 1);

    svgContainer.append("rect")
      .attr("x", 1020)
      .attr("y", 90)
      .attr("width", 10)
      .attr("height", 10)
      .style("stroke", "black")
      .style("fill", "grey")
      .style("stroke-width", 1);

    svgContainer.append("text")
      .attr("x", 1040)
      .attr("y", 80)
      .text("Acutal");

    svgContainer.append("text")
      .attr("x", 1040)
      .attr("y", 100)
      .text("Estimated");
  }

  // plot all the data points on the SVG
  // and add tooltip functionality
  function plotData(map) {
    // mapping functions
    let xMap = map.x;
    let yMap = map.y;

    // make tooltip
    let div = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);

    let barColor = function (d) {
      if (d["Data"] == "Actual") {
        return "lightblue";
      } else {
        return "grey";
      }
    }
    console.log(data);

    svgContainer.selectAll(".bar")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr('x', function (d) {
        return xMap(d) + 50;
      })
      .attr('y', function (d) {
        return yMap(d);
      })
      .attr("width", map.xScale.bandwidth())
      .attr("height", function (d) {
        return 500 - yMap(d);
      })
      .style("fill", function (d) { return barColor(d) })
      // add tooltip functionality to points
      .on("mouseover", (d) => {
        d3.select(this)
        .transition()
        .duration(300)
        .attr('opacity', 0.6)

        div.transition()
          .duration(200)
          .style("opacity", .9);
        div.html("Season #" + d["Year"] +
          "<br/>Year: " + d["Year"] +
          "<br/>Episodes: " + d["Episodes"] +
          "<br/>Avg. Viewers (mil): " + d["Avg. Viewers (mil)"] +
          "<br/>Most watched episode: " + d["Most watched episode"] +
          "<br/>Viewers (mil): " + d["Viewers (mil)"])
          .style("left", (d3.event.pageX) + "px")
          .style("top", (d3.event.pageY - 40) + "px")
          .style("width", "200px")
          .style("height", "130px");
      })
      .on("mouseout", (d) => {
        div.transition()
          .duration(500)
          .style("opacity", 0);
      });

    svgContainer.selectAll(".text")
      .data(data)
      .enter().append("text")
      .attr("class", "bar")
      .attr("text-anchor", "middle")
      .attr("x", function (d) { return xMap(d) + map.xScale.bandwidth() / 2 + 50; })
      .attr("y", function (d) { return yMap(d) - 10; })
      .text(function (d) { return d["Avg. Viewers (mil)"]; });
  }

  function plotLine(avgView, scale) {

    let yScale = scale.yScale;
    let ave = avgView.reduce((total, amount) => total + amount) / avgView.length;
    ave = ave.toFixed(1);

    svgContainer.selectAll('line.avg')
      .data(ave)
      .enter()
      .append('line')
      .attr('x1', 100)
      .attr("y1", function (d) { return yScale(ave); })
      .attr("x2", 1200)
      .attr("y2", function (d) { return yScale(ave); })
      .style("stroke-dasharray", ("4, 4"));

    let yPosition = yScale(ave);

    svgContainer.append("text")
      .attr("x", 1000)
      .attr("y", yPosition - 5)
      .style('font-size', '12pt')
      .text("Average Viewers: " + ave);
  }

  // draw the axes and ticks
  function drawAxes(limits, x, y, svg) {
    // return x value from a row of data
    let xValue = function (d) { return d["Year"]; }

    // function to scale x value
    let xScale = d3.scaleBand()
      .range([50, 1200])
      .padding(0.3);
    xScale.domain(x);
    console.log(x);
1
    // xMap returns a scaled x value from a row of data
    let xMap = function(d) { return xScale(xValue(d)); };

    // plot x-axis at bottom of SVG
    let xAxis = d3.axisBottom().scale(xScale);
    svg.append("g")
      .attr('transform', 'translate(50, 500)')
      .call(xAxis);

    // return y value from a row of data
    let yValue = function(d) { 
      return +d["Avg. Viewers (mil)"]}

    // function to scale y
    let yScale = d3.scaleLinear()
      .domain([limits.yMax + 5, limits.yMin - 5]) // give domain buffer
      .range([50, 450]);

    // yMap returns a scaled y value from a row of data
    let yMap = function (d) { return yScale(yValue(d)); };

    // plot y-axis at the left of SVG
    let yAxis = d3.axisLeft().scale(yScale);
    svg.append('g')
      .attr('transform', 'translate(100, 50)')
      .call(yAxis);

    // return mapping and scaling functions
    return {
      x: xMap,
      y: yMap,
      xScale: xScale,
      yScale: yScale
    };
  }

  // find min and max for arrays of x and y
  function findMinMax(x, y) {

    // get min/max x values
    let xMin = d3.min(x);
    let xMax = d3.max(x);

    // get min/max y values
    let yMin = d3.min(y);
    let yMax = d3.max(y);

    // return formatted min/max data as an object
    return {
      xMin : xMin,
      xMax : xMax,
      yMin : yMin,
      yMax : yMax
    }
  }
})();
