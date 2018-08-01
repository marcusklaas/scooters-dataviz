const makeScooterCountPlot = () => {
    const margin = {top: 20, right: 120, bottom: 30, left: 60},
        width = 960 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

    const stack = d3.stack();

    d3.csv('Personen_in_bezit_van_bromfiets_20072018_135942.csv', (obj, idx) => {
            return {
                tipe: obj.Bromfietssoort,
                t: obj["Perioden"],
                soort: obj.Persoonskenmerken,
                yVal: parseInt(obj["Personen in bezit van voertuigen (aantal)"].trim())
            };
        })
        .then(data => {
            const consolidatedData = data
                .filter(x => x.soort == "Totaal persoonskenmerken");

            consolidatedData.sort(x => x.t);

            const nested = d3.nest().key(d => d.t).entries(consolidatedData);
            const layers = d3.stack().keys([0, 1, 2]).value((d, key) => d.values[key].yVal)(nested); 
            const transposed = d3.transpose(layers);

            const onlyUnique = (value, index, self) => self.indexOf(value) === index;
            const keys = consolidatedData.map(x => x.tipe).filter(onlyUnique);
            const xAxisKeys = consolidatedData.map(x => x.t);

            var xScale = d3.scaleBand()
                .domain(xAxisKeys)
                .range([0, width])
                .padding(.1)

            const yScale = d3.scaleLinear()
                .range([0, height])
                .domain([d3.max(transposed, d => d.slice(-1)[0][1]), 0]);

            const zScale = d3.scaleOrdinal()
                .range(["#98abc5", "#8a89a6", "#7b6888"])
                .domain(keys);

            const xAxis = d3.axisBottom(xScale).ticks(5);
            const yAxis = d3.axisLeft(yScale).ticks(10);
            const chart = d3.select("#chart1")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                    .attr("transform", `translate(${margin.left}, ${margin.top})`);

            const bar = chart
                .selectAll("g")
                .data(transposed)
                    .enter()
                    .append("g")
                        .attr("transform", (d, i) => `translate(${xScale(xAxisKeys[i])}, 0)`)

            const rektCont = bar
                .selectAll("rect")
                .data(d => d)
                .enter()
                .append("g")
                    .attr("class", "bar");

            rektCont.append("rect")              
                .attr("y", d => yScale(d[1]))
                .attr("height", d => yScale(d[0]) - yScale(d[1]))
                .attr("width", xScale.bandwidth())
                .attr("fill", zScale);

            rektCont.append("text")
                .attr("y", d => 0.5 * (yScale(d[1]) + yScale(d[0])))
                .attr("dy", ".35em")
                .attr("dx", xScale.bandwidth() / 2)
                .text(d => d[1] - d[0]);

            chart.append("g")
                .attr("class", "y axis")
                .call(yAxis);                    

            chart.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis);

            const legend = chart.selectAll(".legend")
                .data(keys.reverse())
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
};
