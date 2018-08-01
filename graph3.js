{
    const margin = {top: 20, right: 120, bottom: 30, left: 60},
        width = 960 - margin.left - margin.right,
        height = 600 - margin.top - margin.bottom;

    const scale = 70000;

    const projection = d3.geoMercator()
        .scale(scale)
        .translate([-0.08 * scale, 1.081 * scale]);
    const path = d3.geoPath().projection(projection);

    d3.json('polygon.json').then(data => {
        const damskoAreaFeatures = data.features.filter(d => parseInt(d.properties.PC4CODE) < 1200)

        const chart = d3.select("#chart3")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
                .attr("transform", `translate(${margin.left}, ${margin.top})`);

        chart.selectAll("path")
            .data(damskoAreaFeatures)
            .enter()
                .append("path")
                .attr("d", path);

        chart.append("g").attr("class", "yolo");
    });
}