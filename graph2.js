{
    const margin = {top: 20, right: 120, bottom: 30, left: 60},
        width = 960 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

    const parseTime = d3.timeParse("%Y");

    Array.prototype.diff = function(a) {
        return this.filter(function(i) {return a.indexOf(i) < 0;});
    };

    d3.csv('Emissies_naar_lucht__wegverkeer_20072018_135720.csv', (obj, idx) => {
            return {
                t: parseTime(obj["Perioden"]),
                soort: obj.Bronnen,
                CO: parseFloat(obj['Emissies/Emissie CO/Totaal (mln kg)']),
                VOS: parseFloat(obj['Emissies/Emissie VOS totaal/Totaal (mln kg)']),
                NOx: parseFloat(obj['Emissies/Emissie NOx/Totaal (mln kg)']),
                pm10: parseFloat(obj['Emissies/Emissie PM10 door verbranding/Totaal (mln kg)']),
                CO2: parseFloat(obj['Emissies/Emissie CO2/Totaal (mln kg)']),
                CH4: parseFloat(obj['Emissies/Emissie CH4/Totaal (mln kg)'])
            };
        })
        .then(data => {
            const consolidatedData = data
                .filter(x => x.soort == "Bromfietsen")
                .sort(x => - parseInt(x.t));

            var xScale = d3.scaleTime()
                .rangeRound([0, width])
                .domain(d3.extent(consolidatedData, d => d.t));

            const yScale = d3.scaleLinear()
                .range([0, height])
                .domain([4.5, 0]);

            const keyz = Object.keys(consolidatedData[0]).diff(['t', 'soort']);

            const zScale = d3.scaleOrdinal()
                .range(["#1b9e77", "#d95f02", "#7570b3", "#e7298a", "#66a61e", "#e6ab02"])
                .domain(keyz);

            const xAxis = d3.axisBottom(xScale);
            const yAxis = d3.axisLeft(yScale).tickFormat(d3.format(".0%"));
            const chart = d3.select("#chart2")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                    .attr("transform", `translate(${margin.left}, ${margin.top})`);

            // gridlines
            chart.append("g")
                .attr("class", "grid")
                .call(d3.axisBottom()
                        .tickFormat("")
                        .tickSize(height)
                        .scale(xScale));

            chart.append("g")
                .attr("class", "grid")
                .call(d3.axisLeft()
                        .tickFormat("")
                        .tickSize(-width)
                        .scale(yScale));

            for (const k of keyz) {
                chart.append("path")
                    .datum(consolidatedData)
                    .attr("fill", "none")
                    .attr("stroke", d => zScale(k))
                    .attr("stroke-linejoin", "round")
                    .attr("stroke-linecap", "round")
                    .attr("stroke-width", 1.5)
                    .attr("d", d3.line()
                        .x(d => xScale(d.t))
                        .y(d => yScale(d[k] / consolidatedData[0][k])));
            }

            chart.append("g")
                .attr("class", "y axis")
                .call(yAxis);                    

            chart.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis);

            const legend = chart.selectAll(".legend")
                .data(keyz)
                .enter().append("g")
                .attr("class", "legend")
                .attr("transform", (d, i) => `translate(0, ${+i * 20})`);

            legend.append("rect")
                .attr("x", width + 18)
                .attr("width", 18)
                .attr("height", 18)
                .attr("fill", zScale);

            legend.append("text")
                .attr("x", width + 44)
                .attr("y", 9)
                .attr("dy", ".35em")
                .attr("text-anchor", "start")
                .text(d => d);
        });
}