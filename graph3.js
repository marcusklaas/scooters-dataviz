const makeGeoPlot = () => {
    const margin = {top: 20, right: 120, bottom: 60, left: 60},
        width = 960 - margin.left - margin.right,
        height = 650 - margin.top - margin.bottom,
        scale = 70000,
        postcodeLowerLimit = 1000,
        postcodeUpperLimit = 1200;

    const projection = d3.geoMercator()
        .scale(scale)
        .translate([-0.08 * scale, 1.081 * scale]);
    const path = d3.geoPath().projection(projection);

    let chart = d3.select("#chart3")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const dataPromise = d3.csv('Motorvoertuigen__type__postcode__regio_s_20072018_140032.csv', (obj, idx) => {
        return {
            t: obj["Perioden"],
            regio: obj["Regio's"],
            bromfietskentekens: parseInt(obj["Wegvoertuigen per 1 januari/Voertuigen met bromfietskenteken/Alle voertuigen met bromfietskenteken (aantal)"])
        };
    }).then(data =>
        data.filter(d => {
                const parsed = parseInt(d.regio);

                return !isNaN(parsed) && parsed >= postcodeLowerLimit && parsed < postcodeUpperLimit;
            })
    );

    const polygonPromise = d3.json('polygon.json').then(data => 
        data.features.filter(d => parseInt(d.properties.PC4CODE) < postcodeUpperLimit));

    let paths = chart.selectAll("path");
    let currentYear = null;

    // FIXME: we should split this into a draw one function and an update function
    const drawMap = year =>
        Promise.all([dataPromise, polygonPromise]).then(([data, polygons]) => {
            // TODO: make number of scooters relative to number of inhabibants per postal code
            let filteredData = new Map(data.filter(d => d.t == year)
                .map(d => [d.regio, d.bromfietskentekens]));

            const colorScale = d3.scaleLinear().domain([0, d3.max(data, d => d.bromfietskentekens)])
                .interpolate(d3.interpolateHcl)
                .range([d3.rgb("#007AFF"), d3.rgb('#FFF500')]);

            // paths
            paths = paths.data(polygons, d => d.properties.PC4CODE);
            paths.exit().remove();
            paths = paths
                .enter()
                    .append("path")
                    .attr("d", path)
                    .on("mouseover", d => {
                        d3.select("#p" + d.properties.PC4CODE).style("display", "block");
                    })
                    .on("mouseout", d => {
                        d3.select("#p" + d.properties.PC4CODE).style("display", "none");
                    })
                    .merge(paths)

            paths.transition()
                .duration(100)
                .attr("fill", d => colorScale(filteredData.get(d.properties.PC4CODE)))

            // TODO: update labels

            // labels
            chart.selectAll("g")
                .data(polygons)
                .enter()
                    .append("g")
                    .attr("id", d => `p${d.properties.PC4CODE}`)
                    .attr("class", "postcode-label")
                    .attr("transform", d => `translate(${path.centroid(d)[0]}, ${path.centroid(d)[1] - 5})`)
                    .on("mouseover", function(d) {
                        d3.select(this).style("display", "block");
                    })
                    .on("mouseout", function(d) {
                        d3.select(this).style("display", "none");
                    })
                    .append("text")
                    .style("text-anchor", "middle")
                    .text(d => {
                        const count = filteredData.get(d.properties.PC4CODE);
                        return `${d.properties.PC4CODE}: ${count}`;
                    });
        });

    // slider
    dataPromise.then(d => {
        const years = Array.from(new Set(d.map(d => d.t)).values()).sort();
        const L = years.length;
        const dx = L/ (years.length - 1);
        const xticks = d3.range(0, L + dx, dx);

        const xScale = d3.scaleLinear()
            .domain([0, L])
            .range([0, width])
            .clamp(true);

        const slider = d3.select("#chart3").append("g")
            .attr("transform", `translate(${margin.left}, ${height + margin.top + 20})`);

        function hue(h) {
            handle.attr("cx", xScale(h));
        }

        slider.append("line")
            .attr("class", "track")
            .attr("x1", xScale.range()[0])
            .attr("x2", xScale.range()[1])
            .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
            .attr("class", "track-inset")
            .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
            .attr("class", "track-overlay")
            .call(d3.drag()
                .on("start.interrupt", () => slider.interrupt())
                .on("start drag", () => {
                    hue(xScale.invert(d3.event.x));
                    const year = Math.round(xScale.invert(d3.event.x) / dx);

                    if (year !== currentYear) {
                        currentYear = year;
                        drawMap(years[currentYear]);
                    }
                }))

        slider.insert("g", ".track-overlay")
            .attr("class", "ticks")
            .attr("transform", "translate(0,25)")
            .selectAll("text")
            .data(xticks)
            .enter().append("text")
            .attr("x", xScale)
            .attr("text-anchor", "middle")
            .text((d, i) => years[i]);

        var handle = slider.insert("circle", ".track-overlay")
            .attr("class", "handle")
            .attr("r", 9)
            .attr("cx", xScale.range()[0]);

        currentYear = years[0];
        drawMap(currentYear);
    })
};