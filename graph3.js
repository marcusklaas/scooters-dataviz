{
    const margin = {top: 20, right: 120, bottom: 30, left: 60},
        width = 960 - margin.left - margin.right,
        height = 600 - margin.top - margin.bottom,
        scale = 70000,
        postcodeLowerLimit = 1000,
        postcodeUpperLimit = 1200;

    const projection = d3.geoMercator()
        .scale(scale)
        .translate([-0.08 * scale, 1.081 * scale]);
    const path = d3.geoPath().projection(projection);

    const dataPromise = d3.csv('Motorvoertuigen__type__postcode__regio_s_20072018_140032.csv', (obj, idx) => {
        return {
            t: obj["Perioden"],
            regio: obj["Regio's"],
            bromfietskentekens: parseInt(obj["Wegvoertuigen per 1 januari/Voertuigen met bromfietskenteken/Alle voertuigen met bromfietskenteken (aantal)"])
        };
    }).then(data =>
        new Map(data.filter(d => d.t == "2018")
            .filter(d => {
                const parsed = parseInt(d.regio);

                return !isNaN(parsed) && parsed >= postcodeLowerLimit && parsed < postcodeUpperLimit;
            })
            .map(d => [d.regio, d.bromfietskentekens]))
    );

    const polygonPromise = d3.json('polygon.json').then(data => 
        data.features.filter(d => parseInt(d.properties.PC4CODE) < postcodeUpperLimit));

    Promise.all([dataPromise, polygonPromise]).then(([data, polygons]) => {
        const chart = d3.select("#chart3")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
                .attr("transform", `translate(${margin.left}, ${margin.top})`);

        // TODO: make number of scooters relative to number of inhabibants per postal code

        // TODO: determine domain limit dynamically
        const colorScale = d3.scaleLinear().domain([0, 1800])
            .interpolate(d3.interpolateHcl)
            .range([d3.rgb("#007AFF"), d3.rgb('#FFF500')]);

        // paths
        chart.selectAll("path")
            .data(polygons)
            .enter()
                .append("path")
                .attr("d", path)
                .attr("fill", d => colorScale(data.get(d.properties.PC4CODE)))
                .on("mouseover", d => {
                    d3.select("#p" + d.properties.PC4CODE).style("display", "block");
                })
                .on("mouseout", d => {
                    d3.select("#p" + d.properties.PC4CODE).style("display", "none");
                })

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
                    const count = data.get(d.properties.PC4CODE);
                    return `${d.properties.PC4CODE}: ${count}`;
                });
    });
}