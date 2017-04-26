$('#menu-content').show();
$('#help-content').hide();
formDisplayer('componentScatterPlotAll');
$('.start_date').val('2013-04-21');
$('.end_date').val('2014-12-02');
// $('.result-div').height($('.input-forms').height() * 1.61);

$(function () {
    $(document).ajaxStart(function () {
        $('#loadingModal').modal({
            keyboard: false,
            backdrop: 'static'
        })
    });
    $(document).ajaxComplete(function () {
        $('#loadingModal').modal('toggle')
    });
    $('#menu-button').click(function () {
        adjustMenuBar();
    });
    $('#menu-question').click(function () {
        adjustHelpBar();
    });
    $('[id$=-menuitem]').click(function () {
        adjustMenuBar();
        $('.result-div').empty();
        $('#data-table-tbody').empty();
        $('#data-table-thead').empty();
        var menuName = $(this).attr('id').split('-')[0];
        formDisplayer(menuName);
    });

    $('input[id*=date]').datepicker({
        maxDate: -1,
        dateFormat: "yy-mm-dd",
        changeYear: true,
        changeMonth: true
    });

    //On form submit button click
    var fields;
    $('form').submit(function (event) {
        event.preventDefault();

        $('#data-table-tbody').empty();
        $('#data-table-thead').empty();

        $('.result-div').empty();
        $('.result-div').height($('div.row.main-body').height());
        $('.result-div').append(`<svg height="${$('.result-div').height()}" width="${$('.result-div').width()}"></svg>`);
        $('#data-table-tbody').height($('.result-div').height());

        var formId = $(this).attr('id').split('-')[0];
        fields = [];
        $(`input[id$=-${formId}],select[id$=-${formId}]`).each(function () {
            fields.push($(this).val());
        });
        //Call function using form id
        window[formId](fields); // It looks for a function with name formId and passes fields as argument to it.
    });
});

//Switch forms according to menu item click
function formDisplayer(menuName) {
    $('form[id$=-form]').hide();
    $(`#${menuName}-form`).show();
    $('#formName-header').text(menuName);
    $('.result-div').height($('.input-forms').height() * 1.61);
}

function adjustMenuBar() {
    $('#menu-content').toggle('slide')
}

function adjustHelpBar() {
    $('#help-content').toggle('slide');
    // $('#help-content').css('right', '200px')
}

//D3 scatterplot
function componentScatterPlotAll(fields) {

    var url = `http://10.217.163.85:8080/api/component-scatter-plot-all?start-date=${fields[0]}&end-date=${fields[1]}&option=${fields[2]}`;
    $.getJSON(url)
        .done(function (data) {

            if (data.length <= 0) {
                alert("No data available")
            } else {

                var option = fields[2] == '2' ? "TotCost" : "TotQuant";
                var headers = data[0];
                var str = "<tr><th>#</th>";

                var length = $('#data-table-tbody').width() / Object.keys(headers).length;
                Object.keys(headers).forEach(function (k) {
                    str += `<th style='width: ${length}px'> ${k}</th>`;
                })
                $("#data-table-thead").append(str + "</tr>");
                data = data.sort(function (a, b) {
                    return a[option] - b[option];
                });
                data.forEach(function (d, i) {
                    d[option] = +d[option];
                    str = `<tr class='data${i}'><td>${i + 1}</td>`
                    Object.keys(d).forEach(function (k, i) {
                        str += `<td style='width: ${length}px'> ${d[k]} </td>`;
                    })
                    $("#data-table-tbody").append(str + "</tr>");
                });

                var svg = d3.select("svg"),
                    margin = {
                        top: 20,
                        right: 20,
                        bottom: 60,
                        left: 50
                    },
                    width = +svg.attr("width") - margin.left - margin.right,
                    height = +svg.attr("height") - margin.top - margin.bottom;


                var x = d3.scaleBand().rangeRound([0, width]).padding(.1);
                //y = d3.scaleLinear().rangeRound([height, 0]);

                var y = d3.scaleLog()
                    .rangeRound([height, 0]);

                x.domain(data.map(function (d, i) {
                    return d['MaterialNo'];
                }));

                y.domain([0.1, d3.max(data, function (d) {
                    return d[option];
                })]);
                //y.domain([0.1, data[data.length -1]]);

                var div = d3.select("body").append("div")
                    .attr("class", "tooltip")
                    .style("opacity", 0);
                var g = svg.append("g")
                    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

                var xaxis = g.append('g')
                    .attr('class', 'axis axis--x')
                    .style('font-size', '8px')
                    .attr('transform', 'translate(0,' + height + ')')
                    .call(d3.axisBottom(x));

                xaxis.selectAll("text")
                    .attr('x', '-8')
                    .attr("transform", "rotate(-60)")
                    .attr('text-anchor', 'end')
                // .attr('dy', '.35em')


                xaxis.append('text')
                    .attr('fill', '#000')
                    .attr('transform', 'translate(' + width / 2 + ',' + margin.bottom + ')')
                    .text('Material Number');

                //For Y axis
                g.append('g')
                    .attr('class', 'axis axis--y')
                    .call(d3.axisLeft(y))
                    .append("text")
                    .attr('transform', 'translate(-' + margin.left + ',' + height / 2 + ')rotate(-90)')
                    .attr('dy', '0.71em')
                    .attr('fill', '#000')
                    .text(option);

                g.selectAll('.circle')
                    .data(data)
                    .enter().append('circle')
                    .attr('class', function (d, i) {
                        return "circle data" + i;
                    })
                    .attr('style', 'cursor:pointer')
                    .attr('fill', getRandomColor())
                    .attr('cx', function (d) {
                        return x(d['MaterialNo']);
                    })
                    .attr('cy', function (d) {
                        if (d[option] <= 0) {
                            return 0;
                        } else {
                            return y(d[option]);
                        }

                    })
                    .attr('r', 3)
                    .on('mouseover', function (d, i) {
                        div.transition()
                            .duration(200)
                            .style("opacity", .9);
                        div.html(`<strong>#:</strong><span style='color:blue'>${i + 1}</span><br>
                        <strong>${option}:</strong> <span style='color:red'>${d[option]}</span><br>
                        <strong>Material:</strong> <span style='color:red'>${d['MaterialNo']}</span>`)
                            .style("left", (d3.event.pageX) + "px")
                            .style("top", (d3.event.pageY - 28) + "px");

                        var className = $(this).attr('class');
                        highlightData(className.split(" ")[1]);
                        addScrollableIfWindowIsLarge(className.split(" ")[1]);
                    })
                    .on('mouseout', function () {
                        div.transition()
                            .duration(500)
                            .style("opacity", 0);
                        var className = $(this).attr('class');
                        removeHighlight(className.split(" ")[1]);
                    })
                $('.result-div').append(`<h5 style="text-align:center">Sorted on <span style="font-size: 16px; color:red">${option}</span> in <strong>ascending order</strong></h5>`);

                $('[class^=data]').on('mouseover', function () {
                    var className = $(this).attr('class');
                    highlightData(className.split(" "));
                })
                $('[class^=data]').on('mouseout', function () {
                    var className = $(this).attr('class');
                    removeHighlight(className.split(" ")[0]);
                })
            }
        });
}

function componentBarPlotCm(fields) {
    var url = `http://10.217.163.85:8080/api/component-bar-plot-cm?start-date=${fields[0]}&end-date=${fields[1]}&option=${fields[2]}&no-of-rows=${fields[3]}`;
    $.getJSON(url)
        .done(function (data) {
            if (data.length <= 0) {
                alert("No data available")
            } else {
                var option = fields[2] == '2' ? "TotCost" : "TotQuant";
                var headers = data[0];
                var str = "<tr><th>#</th>";
                var length = $('#data-table-tbody').width() / Object.keys(headers).length;
                Object.keys(headers).forEach(function (k) {
                    str += `<th style='width: ${length}px'> ${k}</th>`;
                })
                $("#data-table-thead").append(str + "</tr>");

                data = data.sort(function (a, b) {
                    return a[option] - b[option];
                });
                data.forEach(function (d, i) {
                    d[option] = +d[option];
                    str = `<tr class='data${i}'><td>${i + 1}</td>`
                    Object.keys(d).forEach(function (k, i) {
                        str += `<td style='width: ${length}px'>${d[k]}</td>`;
                    })
                    $("#data-table-tbody").append(str + "</tr>");
                });


                var svg = d3.select("svg"),
                    margin = {
                        top: 20,
                        right: 20,
                        bottom: 60,
                        left: 50
                    },
                    width = +svg.attr("width") - margin.left - margin.right,
                    height = +svg.attr("height") - margin.top - margin.bottom;


                var x = d3.scaleBand().rangeRound([0, width]).padding(0.1);
                //y = d3.scaleLinear().rangeRound([height, 0]);

                var y = d3.scaleLinear()
                    .rangeRound([height, 0]);

                x.domain(data.map(function (d, i) {
                    return d['MaterialNo'];
                }));

                y.domain([0.1, d3.max(data, function (d) {
                    return d[option];
                })]);
                //y.domain([0.1, data[data.length -1]]);

                var div = d3.select("body").append("div")
                    .attr("class", "tooltip")
                    .style("opacity", 0);

                var g = svg.append("g")
                    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

                var xaxis = g.append('g')
                    .attr('class', 'axis axis--x')
                    .style('font-size', '8px')
                    .attr('transform', 'translate(0,' + height + ')')
                    .call(d3.axisBottom(x));

                xaxis.selectAll("text")
                    .attr('x', '-8')
                    .attr("transform", "rotate(-60)")
                    .attr('text-anchor', 'end')
                // .attr('dy', '.35em')


                xaxis.append('text')
                    .attr('fill', '#000')
                    .attr('transform', 'translate(' + width / 2 + ',' + margin.bottom + ')')
                    .text('Material Number');

                //For Y axis
                g.append('g')
                    .attr('class', 'axis axis--y')
                    .call(d3.axisLeft(y))
                    .append("text")
                    .attr('transform', 'translate(-' + margin.left + ',' + height / 2 + ')rotate(-90)')
                    .attr('dy', '0.71em')
                    .attr('fill', '#000')
                    .text(option);

                g.selectAll('.bar')
                    .data(data)
                    .enter().append('rect')
                    .attr('class', function (d, i) {
                        return "bar data" + i;
                    })
                    .attr('x', function (d) {
                        return x(d['MaterialNo']);
                    })
                    .attr('style', 'cursor:pointer')
                    .attr('y', function (d, i) {
                        if (i > 0) {
                            //If lastmaterial number is same as new one set sameAsLast to true 
                            if (data[i - 1]['MaterialNo'] == d['MaterialNo']) {
                                return y(d[option]) - y(data[i - 1][option]);
                            }
                        }
                        return y(d[option]);
                    })
                    .attr('fill', function (d, i) {
                        // if (i > 0) {
                        //     //If lastmaterial number is same as new one set sameAsLast to true 
                        //     if (data[i - 1]['MaterialNo'] == d['MaterialNo']) {
                        //         return getRandomColor();
                        //     }
                        // }
                        return getRandomColor();
                    })
                    .attr('width', x.bandwidth())
                    .attr('height', function (d, i) {
                        if (i > 0) {
                            //If lastmaterial number is same as new one set sameAsLast to true 
                            if (data[i - 1]['MaterialNo'] == d['MaterialNo']) {
                                return height - y(d[option]) - y(data[i - 1][option]);
                            }
                        }
                        return height - y(d[option]);
                    })
                    .on('mouseover', function (d, i) {
                        div.transition()
                            .duration(200)
                            .style("opacity", .9);
                        div.html(`<strong>#</strong><span style='color:yellow'>${i + 1}</span><br>
                        <strong>${option}:</strong> <span style='color:red'>${d[option]}</span><br>
                        <strong>Material:</strong> <span style='color:red'>${d['MaterialNo']}</span>`)
                            .style("left", (d3.event.pageX) + "px")
                            .style("top", (d3.event.pageY - 28) + "px");

                        var className = $(this).attr('class');
                        highlightData(className.split(" ")[1]);
                        addScrollableIfWindowIsLarge(className.split(" ")[1]);
                    })
                    .on('mouseout', function () {
                        div.transition()
                            .duration(500)
                            .style("opacity", 0);
                        var className = $(this).attr('class');
                        removeHighlight(className.split(" ")[1]);
                    })
                $('.result-div').append(`<h5 style="text-align:center">Sorted on <span style="font-size: 16px; color:red">${option}</span> in <strong>ascending order</strong></h5>`);

                $('[class^=data]').on('mouseover', function () {
                    var className = $(this).attr('class');
                    highlightData(className.split(" "));
                })
                $('[class^=data]').on('mouseout', function () {
                    var className = $(this).attr('class');
                    removeHighlight(className.split(" ")[0]);
                })
            }
        });
}

function generalScatterPlotMileage(fields) {
    var url = `http://10.217.163.85:8080/api/general-scatter-plot-mileage?start-date=${fields[0]}&end-date=${fields[0]}`;
    $.getJSON(url)
        .done(function (data) {
            if (data.length <= 0) {
                alert("No data available")
            } else {
                var headers = data[0];
                var str = "<tr><th>#</th>";
                var length = $('#data-table-tbody').width() / Object.keys(headers).length;
                Object.keys(headers).forEach(function (k) {
                    str += `<th style='width: ${length}px'> ${k}</th>`;
                })
                $("#data-table-thead").append(str + "</tr>");

                // data = data.sort(function (a, b) {
                //     return +a['MeanMileage'] - +b['MeanMileage'];
                // });
                data.forEach(function (d, i) {
                    d['MeanMileage'] = +d['MeanMileage'];
                    str = `<tr class='data${i}'><td>${i + 1}</td>`
                    Object.keys(d).forEach(function (k, i) {
                        str += `<td style='width: ${length}px'>${d[k]}</td>`;
                    })
                    $("#data-table-tbody").append(str + "</tr>");
                });
                var svg = d3.select("svg"),
                    margin = {
                        top: 20,
                        right: 20,
                        bottom: 60,
                        left: 50
                    },
                    width = +svg.attr("width") - margin.left - margin.right,
                    height = +svg.attr("height") - margin.top - margin.bottom;

                var x = d3.scaleLinear().rangeRound([0, width]);
                x.domain([1, data.length]);

                var y = d3.scaleLinear()
                    .rangeRound([height, 0]);
                y.domain([0.1, d3.max(data, function (d) {
                    return d['MeanMileage'];
                })]);
                var div = d3.select("body").append("div")
                    .attr("class", "tooltip")
                    .style("opacity", 0);
                var g = svg.append("g")
                    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

                var xaxis = g.append('g')
                    .attr('class', 'axis axis--x')
                    .style('font-size', '8px')
                    .attr('transform', 'translate(0,' + height + ')')
                    .call(d3.axisBottom(x).ticks(5));

                xaxis.selectAll("text")
                    .attr('x', '-8')
                    .attr("transform", "rotate(-60)")
                    .attr('text-anchor', 'end')
                    .attr('dy', '.35em')


                xaxis.append('text')
                    .attr('fill', '#000')
                    .attr('transform', 'translate(' + width / 2 + ',' + margin.bottom + ')')
                    .text('Material Number');

                //For Y axis
                g.append('g')
                    .attr('class', 'axis axis--y')
                    .call(d3.axisLeft(y).ticks(5, "s"))
                    .append("text")
                    .attr('transform', 'translate(-' + margin.left + ',' + height / 2 + ')rotate(-90)')
                    .attr('dy', '0.71em')
                    .attr('fill', '#000')
                    .text("MeanMileage");

                g.selectAll('.circle')
                    .data(data)
                    .enter().append('circle')
                    .attr('class', function (d, i) {
                        return "circle data" + i;
                    })
                    .attr('style', 'cursor:pointer')
                    .attr('fill', getRandomColor())
                    .attr('cx', function (d, i) {
                        return x(i + 1);
                    })
                    .attr('cy', function (d) {
                        if (d['MeanMileage'] <= 0) {
                            return 0;
                        } else {
                            return y(d['MeanMileage']);
                        }

                    })
                    .attr('r', 3)
                    .on('mouseover', function (d, i) {
                        div.transition()
                            .duration(200)
                            .style("opacity", .9);
                        div.html(`<strong>#:</strong><span style='color:blue'>${i + 1}</span><br>
                        <strong>MeanMileage</strong> <span style='color:red'>${d['MeanMileage']}</span><br>
                        <strong>Material:</strong> <span style='color:red'>${d['VehID']}</span>`)
                            .style("left", (d3.event.pageX) + "px")
                            .style("top", (d3.event.pageY - 28) + "px");

                        var className = $(this).attr('class');
                        highlightData(className.split(" ")[1]);
                        addScrollableIfWindowIsLarge(className.split(" ")[1]);

                    })
                    .on('mouseout', function () {
                        div.transition()
                            .duration(500)
                            .style("opacity", 0);
                        var className = $(this).attr('class');
                        removeHighlight(className.split(" ")[1]);
                    })
                // $('.result-div').append(`<h5 style="text-align:center">Sorted on <span style="font-size: 16px; color:red">MeanMileage</span> in <strong>ascending order</strong></h5>`);

                $('[class^=data]').on('mouseover', function () {
                    var className = $(this).attr('class');
                    highlightData(className.split(" "));
                })
                $('[class^=data]').on('mouseout', function () {
                    var className = $(this).attr('class');
                    removeHighlight(className.split(" ")[0]);
                })
            }
        });
}

function componentBarPlotMttfAll(fields) {
    var url = `http://10.217.163.85:8080/api/component-bar-plot-mttf-all?option=${fields[0]}&no-of-rows=${fields[1]}`;
    $.getJSON(url)
        .done(function (data) {
            if (data.length <= 0) {
                alert("No data available")
            } else {

                var headers = data[0];

                data = data.sort(function (a, b) {
                    return a['MTTF'] - b['MTTF'];
                });

                var str = "<tr><th>#</th>";
                var length = $('#data-table-tbody').width() / Object.keys(headers).length;
                Object.keys(headers).forEach(function (k) {
                    str += `<th style='width: ${length}px'> ${k}</th>`;
                })
                $("#data-table-thead").append(str + "</tr>");
                data.forEach(function (d, i) {
                    d['MTTF'] = +d['MTTF'];
                    str = `<tr class='data${i}'><td>${i + 1}</td>`
                    Object.keys(d).forEach(function (k, i) {
                        str += `<td  style='width: ${length}px'>${d[k]}</td>`;
                    })
                    $("#data-table-tbody").append(str + "</tr>");
                });


                var svg = d3.select("svg"),
                    margin = {
                        top: 20,
                        right: 20,
                        bottom: 60,
                        left: 50
                    },
                    width = +svg.attr("width") - margin.left - margin.right,
                    height = +svg.attr("height") - margin.top - margin.bottom;


                var x = d3.scaleBand().rangeRound([0, width]).padding(.1);
                //y = d3.scaleLinear().rangeRound([height, 0]);

                var y = d3.scaleLinear()
                    .rangeRound([height, 0]);

                x.domain(data.map(function (d, i) {
                    return d['MaterialNo'];
                }));

                y.domain([0.1, d3.max(data, function (d) {
                    return d['MTTF'];
                })]);
                //y.domain([0.1, data[data.length -1]]);

                var div = d3.select("body").append("div")
                    .attr("class", "tooltip")
                    .style("opacity", 0);

                var g = svg.append("g")
                    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

                var xaxis = g.append('g')
                    .attr('class', 'axis axis--x')
                    .style('font-size', '8px')
                    .attr('transform', 'translate(0,' + height + ')')
                    .call(d3.axisBottom(x));

                xaxis.selectAll("text")
                    .attr('x', '-8')
                    .attr("transform", "rotate(-60)")
                    .attr('text-anchor', 'end')
                // .attr('dy', '.35em')


                xaxis.append('text')
                    .attr('fill', '#000')
                    .attr('transform', 'translate(' + width / 2 + ',' + margin.bottom + ')')
                    .text('Material Number');

                //For Y axis
                g.append('g')
                    .attr('class', 'axis axis--y')
                    .call(d3.axisLeft(y))
                    .append("text")
                    .attr('transform', 'translate(-' + margin.left + ',' + height / 2 + ')rotate(-90)')
                    .attr('dy', '0.71em')
                    .attr('fill', '#000')
                    .text('MTTF');

                g.selectAll('.bar')
                    .data(data)
                    .enter().append('rect')
                    .attr('class', function (d, i) {
                        return "bar data" + i;
                    })
                    .attr('x', function (d) {
                        return x(d['MaterialNo']);
                    })
                    .attr('style', 'cursor:pointer')
                    .attr('y', function (d, i) {
                        if (i > 0) {
                            //If lastmaterial number is same as new one set sameAsLast to true 
                            if (data[i - 1]['MaterialNo'] == d['MaterialNo']) {
                                return y(d['MTTF']) - y(data[i - 1]['MTTF']);
                            }
                        }
                        return y(d['MTTF']);
                    })
                    .attr('fill', function (d, i) {
                        return getRandomColor();
                        // if (i > 0) {
                        //     //If lastmaterial number is same as new one set sameAsLast to true 
                        //     if (data[i - 1]['MaterialNo'] == d['MaterialNo']) {
                        //         return getRandomColor();
                        //     }
                        // }
                    })
                    .attr('width', x.bandwidth())
                    .attr('height', function (d, i) {
                        if (i > 0) {
                            //If lastmaterial number is same as new one set sameAsLast to true 
                            if (data[i - 1]['MaterialNo'] == d['MaterialNo']) {
                                return height - y(d['MTTF']) - y(data[i - 1]['MTTF']);
                            }
                        }
                        return height - y(d['MTTF']);
                    })
                    .on('mouseover', function (d, i) {
                        div.transition()
                            .duration(200)
                            .style("opacity", .9);
                        div.html(`<strong>#</strong><span style='color:yellow'>${i + 1}</span><br>
                        <strong>${'MTTF'}:</strong> <span style='color:red'>${d['MTTF']}</span><br>
                        <strong>Material:</strong> <span style='color:red'>${d['MaterialNo']}</span>`)
                            .style("left", (d3.event.pageX) + "px")
                            .style("top", (d3.event.pageY - 28) + "px");

                        var className = $(this).attr('class');
                        highlightData(className.split(" ")[1]);
                        addScrollableIfWindowIsLarge(className.split(" ")[1]);

                    })
                    .on('mouseout', function () {
                        div.transition()
                            .duration(500)
                            .style("opacity", 0);
                        var className = $(this).attr('class');
                        removeHighlight(className.split(" ")[1]);
                    })
                $('.result-div').append(`<h5 style="text-align:center">Sorted on <span style="font-size: 16px; color:red">${'MTTF'}</span> in <strong>ascending order</strong></h5>`);

                $('[class^=data]').on('mouseover', function () {
                    var className = $(this).attr('class');
                    highlightData(className.split(" "));
                })
                $('[class^=data]').on('mouseout', function () {
                    var className = $(this).attr('class');
                    removeHighlight(className.split(" ")[0]);
                })
            }
        });
}

function componentBarPlotMttfCritical(fields) {

    var url = `http://10.217.163.85:8080/api/component-bar-plot-mttf-critical?start-date=${fields[0]}&end-date=${fields[1]}&option=${fields[2]}&no-of-rows=${fields[3]}`;
    $.getJSON(url)
        .done(function (data) {
            if (data.length <= 0) {
                alert("No data available")
            } else {

                var headers = data[0];
                data = data.sort(function (a, b) {
                    return a['MTTF'] - b['MTTF'];
                });

                var str = "<tr><th>#</th>";
                var length = $('#data-table-tbody').width() / Object.keys(headers).length;
                Object.keys(headers).forEach(function (k) {
                    str += `<th style='width: ${length}px'> ${k}</th>`;
                })
                $("#data-table-thead").append(str + "</tr>");

                data.forEach(function (d, i) {
                    d['MTTF'] = +d['MTTF'];
                    str = `<tr class='data${i}'><td>${i + 1}</td>`
                    Object.keys(d).forEach(function (k, i) {
                        str += `<td style='width: ${length}px'>${d[k]}</td>`;
                    })
                    $("#data-table-tbody").append(str + "</tr>");
                });


                var svg = d3.select("svg"),
                    margin = {
                        top: 20,
                        right: 20,
                        bottom: 60,
                        left: 50
                    },
                    width = +svg.attr("width") - margin.left - margin.right,
                    height = +svg.attr("height") - margin.top - margin.bottom;


                var x = d3.scaleBand().rangeRound([0, width]).padding(.1);
                //y = d3.scaleLinear().rangeRound([height, 0]);

                var y = d3.scaleLinear()
                    .rangeRound([height, 0]);

                x.domain(data.map(function (d, i) {
                    return d['MaterialNo'];
                }));

                y.domain([0.1, d3.max(data, function (d) {
                    return d['MTTF'];
                })]);

                var div = d3.select("body").append("div")
                    .attr("class", "tooltip")
                    .style("opacity", 0);

                var g = svg.append("g")
                    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

                var xaxis = g.append('g')
                    .attr('class', 'axis axis--x')
                    .style('font-size', '8px')
                    .attr('transform', 'translate(0,' + height + ')')
                    .call(d3.axisBottom(x));

                xaxis.selectAll("text")
                    .attr('x', '-8')
                    .attr("transform", "rotate(-60)")
                    .attr('text-anchor', 'end')
                // .attr('dy', '.35em')


                xaxis.append('text')
                    .attr('fill', '#000')
                    .attr('transform', 'translate(' + width / 2 + ',' + margin.bottom + ')')
                    .text('Material Number');

                //For Y axis
                g.append('g')
                    .attr('class', 'axis axis--y')
                    .call(d3.axisLeft(y))
                    .append("text")
                    .attr('transform', 'translate(-' + margin.left + ',' + height / 2 + ')rotate(-90)')
                    .attr('dy', '0.71em')
                    .attr('fill', '#000')
                    .text('MTTF');

                g.selectAll('.bar')
                    .data(data)
                    .enter().append('rect')
                    .attr('class', function (d, i) {
                        return "bar data" + i;
                    })
                    .attr('x', function (d) {
                        return x(d['MaterialNo']);
                    })
                    .attr('style', 'cursor:pointer')
                    .attr('y', function (d, i) {
                        if (i > 0) {
                            //If lastmaterial number is same as new one set sameAsLast to true 
                            if (data[i - 1]['MaterialNo'] == d['MaterialNo']) {
                                return y(d['MTTF']) - y(data[i - 1]['MTTF']);
                            }
                        }
                        return y(d['MTTF']);
                    })
                    .attr('fill', function (d, i) {
                        // if (i > 0) {
                        //     //If lastmaterial number is same as new one set sameAsLast to true 
                        //     if (data[i - 1]['MaterialNo'] == d['MaterialNo']) {
                        //         return getRandomColor();
                        //     }
                        // }
                        return getRandomColor();
                    })
                    .attr('width', x.bandwidth())
                    .attr('height', function (d, i) {
                        if (i > 0) {
                            //If lastmaterial number is same as new one set sameAsLast to true 
                            if (data[i - 1]['MaterialNo'] == d['MaterialNo']) {
                                return height - y(d['MTTF']) - y(data[i - 1]['MTTF']);
                            }
                        }
                        return height - y(d['MTTF']);
                    })
                    .on('mouseover', function (d, i) {
                        div.transition()
                            .duration(200)
                            .style("opacity", .9);
                        div.html(`<strong>#</strong><span style='color:yellow'>${i + 1}</span><br>
                        <strong>${'MTTF'}:</strong> <span style='color:red'>${d['MTTF']}</span><br>
                        <strong>Material:</strong> <span style='color:red'>${d['MaterialNo']}</span>`)
                            .style("left", (d3.event.pageX) + "px")
                            .style("top", (d3.event.pageY - 28) + "px");

                        var className = $(this).attr('class');
                        highlightData(className.split(" ")[1]);
                        addScrollableIfWindowIsLarge(className.split(" ")[1]);

                    })
                    .on('mouseout', function () {
                        div.transition()
                            .duration(500)
                            .style("opacity", 0);
                        var className = $(this).attr('class');
                        removeHighlight(className.split(" ")[1]);
                    })
                $('.result-div').append(`<h5 style="text-align:center">Sorted on <span style="font-size: 16px; color:red">${'MTTF'}</span> in <strong>ascending order</strong></h5>`);

                $('[class^=data]').on('mouseover', function () {
                    var className = $(this).attr('class');
                    highlightData(className.split(" "));
                })
                $('[class^=data]').on('mouseout', function () {
                    var className = $(this).attr('class');
                    removeHighlight(className.split(" ")[0]);
                })
            }
        });
}

//Using D3
function componentBarPlotAll(fields) {

    var url = `http://10.217.163.85:8080/api/component-bar-plot-all?start-date=${fields[0]}&end-date=${fields[1]}&option=${fields[2]}&no-of-rows=${fields[3]}`;
    $.getJSON(url)
        .done(function (data) {
            if (data.length <= 0) {
                alert("No data available")
            } else {

                var option = fields[2] == '2' ? "TotCost" : "TotQuant";
                var headers = data[0];
                data = data.sort(function (a, b) {
                    return a[option] - b[option];
                });

                var str = "<tr><th>#</th>";
                var length = $('#data-table-tbody').width() / Object.keys(headers).length;
                Object.keys(headers).forEach(function (k) {
                    str += `<th style='width: ${length}px'> ${k}</th>`;
                })
                $("#data-table-thead").append(str + "</tr>");

                data.forEach(function (d, i) {
                    d[option] = +d[option];
                    str = `<tr class='data${i}'><td>${i + 1}</td>`
                    Object.keys(d).forEach(function (k, i) {
                        str += `<td style='width: ${length}px'> ${d[k]}</td>`;
                    })
                    $("#data-table-tbody").append(str + "</tr>");
                });


                var svg = d3.select("svg"),
                    margin = {
                        top: 20,
                        right: 20,
                        bottom: 60,
                        left: 50
                    },
                    width = +svg.attr("width") - margin.left - margin.right,
                    height = +svg.attr("height") - margin.top - margin.bottom;


                var x = d3.scaleBand().rangeRound([0, width]).padding(.1);
                //y = d3.scaleLinear().rangeRound([height, 0]);

                var y = d3.scaleLinear()
                    .rangeRound([height, 0]);

                x.domain(data.map(function (d, i) {
                    return d['MaterialNo'];
                }));

                y.domain([0.1, d3.max(data, function (d) {
                    return d[option];
                })]);
                //y.domain([0.1, data[data.length -1]]);

                var div = d3.select("body").append("div")
                    .attr("class", "tooltip")
                    .style("opacity", 0);

                var g = svg.append("g")
                    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

                var xaxis = g.append('g')
                    .attr('class', 'axis axis--x')
                    .style('font-size', '8px')
                    .attr('transform', 'translate(0,' + height + ')')
                    .call(d3.axisBottom(x));

                xaxis.selectAll("text")
                    .attr('x', '-8')
                    .attr("transform", "rotate(-60)")
                    .attr('text-anchor', 'end')
                // .attr('dy', '.35em')


                xaxis.append('text')
                    .attr('fill', '#000')
                    .attr('transform', 'translate(' + width / 2 + ',' + margin.bottom + ')')
                    .text('Material Number');

                //For Y axis
                g.append('g')
                    .attr('class', 'axis axis--y')
                    .call(d3.axisLeft(y))
                    .append("text")
                    .attr('transform', 'translate(-' + margin.left + ',' + height / 2 + ')rotate(-90)')
                    .attr('dy', '0.71em')
                    .attr('fill', '#000')
                    .text(option);

                g.selectAll('.bar')
                    .data(data)
                    .enter().append('rect')
                    .attr('class', function (d, i) {
                        return "bar data" + i;
                    })
                    .attr('x', function (d) {
                        return x(d['MaterialNo']);
                    })
                    .attr('style', 'cursor:pointer')
                    .attr('y', function (d, i) {
                        if (i > 0) {
                            //If lastmaterial number is same as new one set sameAsLast to true 
                            if (data[i - 1]['MaterialNo'] == d['MaterialNo']) {
                                return y(d[option]) - y(data[i - 1][option]);
                            }
                        }
                        return y(d[option]);
                    })
                    .attr('fill', function (d, i) {
                        return getRandomColor();
                    })
                    .attr('width', x.bandwidth())
                    .attr('height', function (d, i) {
                        if (i > 0) {
                            //If lastmaterial number is same as new one set sameAsLast to true 
                            if (data[i - 1]['MaterialNo'] == d['MaterialNo']) {
                                return height - y(d[option]) - y(data[i - 1][option]);
                            }
                        }
                        return height - y(d[option]);
                    })
                    .on('mouseover', function (d, i) {
                        div.transition()
                            .duration(200)
                            .style("opacity", .9);
                        div.html(`<strong>#</strong><span style='color:yellow'>${i + 1}</span><br>
                        <strong>${option}:</strong> <span style='color:red'>${d[option]}</span><br>
                        <strong>Material:</strong> <span style='color:red'>${d['MaterialNo']}</span>`)
                            .style("left", (d3.event.pageX) + "px")
                            .style("top", (d3.event.pageY - 28) + "px");

                        var className = $(this).attr('class');
                        highlightData(className.split(" ")[1]);
                        addScrollableIfWindowIsLarge(className.split(" ")[1]);

                    })
                    .on('mouseout', function () {
                        div.transition()
                            .duration(500)
                            .style("opacity", 0);
                        var className = $(this).attr('class');
                        removeHighlight(className.split(" ")[1]);
                    })
                $('.result-div').append(`<h5 style="text-align:center">Sorted on <span style="font-size: 16px; color:red">${option}</span> in <strong>ascending order</strong></h5>`);

                $('[class^=data]').on('mouseover', function () {
                    var className = $(this).attr('class');
                    highlightData(className.split(" "));
                })
                $('[class^=data]').on('mouseout', function () {
                    var className = $(this).attr('class');
                    removeHighlight(className.split(" ")[0]);
                })
            }
        });
}

//Using D3
function componentBarPlotCritical(fields) {
    var url = `http://10.217.163.85:8080/api/component-bar-plot-critical?start-date=${fields[0]}&end-date=${fields[1]}&option=${fields[2]}&no-of-rows=${fields[3]}`;
    $.getJSON(url)
        .done(function (data) {
            if (data.length <= 0) {
                alert("No data available")
            } else {

                var option = fields[2] == '2' ? "TotCost" : "TotQuant";
   
                var headers = data[0];
                data = data.sort(function (a, b) {
                    return a[option] - b[option];
                });
                var str = "<tr><th>#</th>";
                var length = $('#data-table-tbody').width() / Object.keys(headers).length;
                Object.keys(headers).forEach(function (k) {
                    str += `<th style='width: ${length}px'> ${k}</th>`;
                })
                $("#data-table-thead").append(str + "</tr>");

                data.forEach(function (d, i) {
                    d[option] = +d[option];
                    str = `<tr class='data${i}'><td>${i + 1}</td>`
                    Object.keys(d).forEach(function (k, i) {
                        str += `<td style='width: ${length}px'> ${d[k]}</td>`;
                    })
                    $("#data-table-tbody").append(str + "</tr>");
                });


                var svg = d3.select("svg"),
                    margin = {
                        top: 20,
                        right: 20,
                        bottom: 60,
                        left: 50
                    },
                    width = +svg.attr("width") - margin.left - margin.right,
                    height = +svg.attr("height") - margin.top - margin.bottom;


                var x = d3.scaleBand().rangeRound([0, width]).padding(.1);
                //y = d3.scaleLinear().rangeRound([height, 0]);

                var y = d3.scaleLinear()
                    .rangeRound([height, 0]);

                x.domain(data.map(function (d, i) {
                    return d['MaterialNo'];
                }));

                y.domain([0.1, d3.max(data, function (d) {
                    return d[option];
                })]);
                //y.domain([0.1, data[data.length -1]]);

                var div = d3.select("body").append("div")
                    .attr("class", "tooltip")
                    .style("opacity", 0);

                var g = svg.append("g")
                    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

                var xaxis = g.append('g')
                    .attr('class', 'axis axis--x')
                    .style('font-size', '8px')
                    .attr('transform', 'translate(0,' + height + ')')
                    .call(d3.axisBottom(x).ticks(5));

                xaxis.selectAll("text")
                    .attr('x', '-8')
                    .attr("transform", "rotate(-60)")
                    .attr('text-anchor', 'end')
                // .attr('dy', '.35em')


                xaxis.append('text')
                    .attr('fill', '#000')
                    .attr('transform', 'translate(' + width / 2 + ',' + margin.bottom + ')')
                    .text('Material Number');

                //For Y axis
                g.append('g')
                    .attr('class', 'axis axis--y')
                    .call(d3.axisLeft(y))
                    .append("text")
                    .attr('transform', 'translate(-' + margin.left + ',' + height / 2 + ')rotate(-90)')
                    .attr('dy', '0.71em')
                    .attr('fill', '#000')
                    .text(option);

                g.selectAll('.bar')
                    .data(data)
                    .enter().append('rect')
                    .attr('class', function (d, i) {
                        return "bar data" + i;
                    })
                    .attr('x', function (d) {
                        return x(d['MaterialNo']);
                    })
                    .attr('style', 'cursor:pointer')
                    .attr('y', function (d, i) {
                        if (i > 0) {
                            //If lastmaterial number is same as new one set sameAsLast to true 
                            if (data[i - 1]['MaterialNo'] == d['MaterialNo']) {
                                return y(d[option]) - y(data[i - 1][option]);
                            }
                        }
                        return y(d[option]);
                    })
                    .attr('fill', function (d, i) {
                        // if (i > 0) {
                        //     //If lastmaterial number is same as new one set sameAsLast to true 
                        //     if (data[i - 1]['MaterialNo'] == d['MaterialNo']) {
                        //         return getRandomColor();
                        //     }
                        // }

                        return getRandomColor();
                    })
                    .attr('width', x.bandwidth())
                    .attr('height', function (d, i) {
                        if (i > 0) {
                            //If lastmaterial number is same as new one set sameAsLast to true 
                            if (data[i - 1]['MaterialNo'] == d['MaterialNo']) {
                                return height - y(d[option]) - y(data[i - 1][option]);
                            }
                        }
                        return height - y(d[option]);
                    })
                    .on('mouseover', function (d, i) {
                        div.transition()
                            .duration(200)
                            .style("opacity", .9);
                        div.html(`<strong>#</strong><span style='color:yellow'>${i + 1}</span><br>
                        <strong>${option}:</strong> <span style='color:red'>${d[option]}</span><br>
                        <strong>Material:</strong> <span style='color:red'>${d['MaterialNo']}</span>`)
                            .style("left", (d3.event.pageX) + "px")
                            .style("top", (d3.event.pageY - 28) + "px");

                        var className = $(this).attr('class');
                        highlightData(className.split(" ")[1]);
                        addScrollableIfWindowIsLarge(className.split(" ")[1]);

                    })
                    .on('mouseout', function () {
                        div.transition()
                            .duration(500)
                            .style("opacity", 0);
                        var className = $(this).attr('class');
                        removeHighlight(className.split(" ")[1]);
                    })
                $('.result-div').append(`<h5 style="text-align:center">Sorted on <span style="font-size: 16px; color:red">${option}</span> in <strong>ascending order</strong></h5>`);

                $('[class^=data]').on('mouseover', function () {
                    var className = $(this).attr('class');
                    highlightData(className.split(" "));
                })
                $('[class^=data]').on('mouseout', function () {
                    var className = $(this).attr('class');
                    removeHighlight(className.split(" ")[0]);
                })
            }
        });
}

function pmTracking(fields) {

    var url = `http://10.217.163.85:8080/api/pm-tracking?registration-batch-year=${fields[0]}&daily-mileage=${fields[1]}`;
    $.getJSON(url)
        .done(function (data) {

            if (data.length <= 0) {
                alert("No data available")
            } else {
                $('.result-div').empty();
                $('.result-div').height($('div.row.main-body').height());
                $('.result-div').append(`<svg height="${$('.result-div').height()}" width="${$('.result-div').width()}"></svg>`);
                $('#data-table-tbody').height($('.result-div').height());
  
                //Create array
                var records = pm_and_cm_TrackingHelperCreateArray(data);

                var svg = d3.select("svg"),
                    margin = {
                        top: 20,
                        right: 20,
                        bottom: 50,
                        left: 40
                    },
                    width = +svg.attr("width") - margin.left - margin.right,
                    height = +svg.attr("height") - margin.top - margin.bottom;



                var x = d3.scaleLinear().rangeRound([0, width]);
                var y = d3.scaleLinear().rangeRound([height, 0]);

                var color = d3.scaleLinear().domain([0, records.length])
                    .interpolate(d3.interpolateHcl)
                    .range([d3.rgb("#007AFF"), d3.rgb('#FFF500')]);

                var maxJobIndex = d3.max(records, function (c) {
                    return d3.max(c.values, function (v) {
                        return v.Job_Index;
                    });
                });
                var maxAccMileage = d3.max(records, function (c) {
                    return d3.max(c.values, function (v) {
                        return v.Acc_Mileage;
                    });
                });

                x.domain([
                    d3.min(records, function (c) {
                        return d3.min(c.values, function (v) {
                            return v.Acc_Mileage;
                        });
                    }),
                    maxAccMileage
                ]);


                y.domain([
                    0,
                    // d3.min(stocks, function(c) { return d3.min(c.values, function(v) { return v.close; }); }),
                    maxJobIndex
                ]);

                var div = d3.select("body").append("div")
                    .attr("class", "tooltip")
                    .style("opacity", 0);


                // set the line attributes
                var line = d3.line()
                    .x(function (d) {
                        return x(d.Acc_Mileage);
                    })
                    .y(function (d) {
                        return y(d.Job_Index);
                    });


                var g = svg.append("g")
                    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');


                // add the x axis
                var xaxis = g.append("g")
                    .attr("class", "x axis")
                    .style('font-size', '8px')
                    .attr("transform", "translate(0," + height + ")")
                    .call(d3.axisBottom(x));
                xaxis.selectAll("text")
                    .attr('x', '-8')
                    .attr("transform", "rotate(-60)")
                    .attr('text-anchor', 'end')

                xaxis.append('text')
                    .attr('fill', '#000')
                    .style('font-size', '12px')
                    .attr('transform', 'translate(' + width / 2 + ',' + margin.bottom + ')')
                    .text('Acc_Mileage');

                //For Y axis
                g.append('g')
                    .attr('class', 'y axis')
                    .call(d3.axisLeft(y))
                    .append("text")
                    .attr('transform', 'translate(-' + margin.left + ',' + height / 2 + ')rotate(-90)')
                    .attr('dy', '0.71em')
                    .attr('fill', '#000')
                    .text('Job Index');

                // add the line groups
                var paths = g.selectAll(".pmTracking")
                    .data(records)
                    .enter().append("g")
                    .attr("class", "pmTracking");

                // add  paths
                paths.append("path")
                    .attr("class", "line")
                    .attr("id", function (d, i) {
                        return "id" + i;
                    })
                    .attr("d", function (d) {
                        return line(d.values);
                    })
                    .attr("stroke-width", "2")
                    .attr("fill", "none")
                    .style("stroke", function (d, i) {
                        return color(i);
                    });

                var countOfDots = 0;
                var TDwidth = $('#data-table-tbody').width() / 5;
                $("#data-table-thead").append(`
        <th>#</th>
       <th width='${TDwidth}'>JobIndex</th>
        <th width='${TDwidth}'>Mileage</th>
         <th width='${TDwidth}'>VehNum</th>
        <th width='${TDwidth}'>VehID</th>
        `)
                var tbody = ``;
                records.forEach(function (d, key) {
                    var vehNum = d.VehNum;
                    var vehID = d.VehID;
                    //Add data to table

                    d.values.forEach(function (k, i) {
                        $("#data-table-tbody").append(`<tr class='data${i + countOfDots}'>
                <td>${i + countOfDots + 1}</td>
                 <td width='${TDwidth}'>${k.Job_Index}</td>
                <td width='${TDwidth}'>${k.Acc_Mileage}</td>
                <td width='${TDwidth}'>${vehNum}</td>
                <td width='${TDwidth}'>${vehID}</td>
            </tr>`);

                    })
                    //Create dots
                    g.selectAll('.circle')
                        .data(d.values)
                        .enter().append('circle')
                        .attr('class', function (k, i) {
                            return "data" + (i + countOfDots);
                        })
                        .attr('style', 'cursor:pointer')
                        .attr('fill', getRandomColor())
                        .attr('cx', function (pair) {
                            return x(pair.Acc_Mileage);
                        })
                        .attr('cy', function (pair) {
                            return y(pair.Job_Index);

                        })
                        .attr('r', 3)
                        .on('mouseover', function (d, i) {
                            div.transition()
                                .duration(200)
                                .style("opacity", .9);
                            div.html(`<strong>VehNum:</strong><span style='color:blue'>${vehNum}</span><br>
                        <strong>Acc_Mileage:</strong> <span style='color:red'>${d.Acc_Mileage}</span><br>
                        <strong>JobIndex:</strong> <span style='color:red'>${d.Job_Index}</span>`)
                                .style("left", (d3.event.pageX) + "px")
                                .style("top", (d3.event.pageY - 28) + "px")

                            var className = $(this).attr('class');
                            highlightData(className.split(" ")[1]);
                            addScrollableIfWindowIsLarge(className);
                        })
                        .on('mouseout', function () {
                            div.transition()
                                .duration(500)
                                .style("opacity", 0);
                            var className = $(this).attr('class');
                            removeHighlight(className.split(" ")[1]);
                        });
                    countOfDots += d.values.length;
                })
                $('[class^=data]').on('mouseover', function () {
                    var className = $(this).attr('class');
                    highlightData(className.split(" "));
                })
                $('[class^=data]').on('mouseout', function () {
                    var className = $(this).attr('class');
                    removeHighlight(className.split(" ")[0]);
                })
            }
        });

}

function costing(fields) {
    var url = `http://10.217.163.85:8080/api/costing?material-type=${fields[0]}&vehicle-registration-batch=${fields[1]}&vehicle-lifespan=${fields[2]}&inflation-rate=${fields[3]}&min-vehicle-record=${fields[4]}`;
    $.getJSON(url)
        .done(function (data) {
            if (data.length <= 0) {
                alert("No data available")
            } else {

                var option = "Value";
                var headers = data[0];
                data = data.sort(function (a, b) {
                    return a[option] - b[option];
                });
                var str = "<tr><th>#</th>";
                var length = $('#data-table-tbody').width() / Object.keys(headers).length;
                Object.keys(headers).forEach(function (k) {
                    str += `<th style='width: ${length}px'> ${k}</th>`;
                })
                $("#data-table-thead").append(str + "</tr>");

                data.forEach(function (d, i) {
                    d[option] = +d[option];
                    str = `<tr class='data${i}'><td>${i + 1}</td>`
                    Object.keys(d).forEach(function (k, i) {
                        str += `<td style='width: ${length}px'> ${d[k]}</td>`;
                    })
                    $("#data-table-tbody").append(str + "</tr>");
                });


                var svg = d3.select("svg"),
                    margin = {
                        top: 20,
                        right: 20,
                        bottom: 60,
                        left: 50
                    },
                    width = +svg.attr("width") - margin.left - margin.right,
                    height = +svg.attr("height") - margin.top - margin.bottom;

                var x = d3.scaleBand().rangeRound([0, width]).padding(0.1);
                //y = d3.scaleLinear().rangeRound([height, 0]);

                var y = d3.scaleLinear()
                    .rangeRound([height, 0]);

                x.domain(data.map(function (d, i) {
                    return d['Cost Type'];
                }));

                y.domain([0.1, d3.max(data, function (d) {
                    return d[option];
                })]);
                //y.domain([0.1, data[data.length -1]]);

                var div = d3.select("body").append("div")
                    .attr("class", "tooltip")
                    .style("opacity", 0);

                var g = svg.append("g")
                    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

                var xaxis = g.append('g')
                    .attr('class', 'axis axis--x')
                    .style('font-size', '8px')
                    .attr('transform', 'translate(0,' + height + ')')
                    .call(d3.axisBottom(x));

                xaxis.selectAll("text")
                    .attr('x', '-8')
                    .attr("transform", "rotate(-60)")
                    .attr('text-anchor', 'end')
                // .attr('dy', '.35em')


                xaxis.append('text')
                    .attr('fill', '#000')
                    .attr('transform', 'translate(' + width / 2 + ',' + margin.bottom + ')')
                    .text('Yearly Cost');

                //For Y axis
                g.append('g')
                    .attr('class', 'axis axis--y')
                    .call(d3.axisLeft(y))
                    .append("text")
                    .attr('transform', 'translate(-' + margin.left + ',' + height / 2 + ')rotate(-90)')
                    .attr('dy', '0.71em')
                    .attr('fill', '#000')
                    .text(option);

                g.selectAll('.bar')
                    .data(data)
                    .enter().append('rect')
                    .attr('class', function (d, i) {
                        return "bar data" + i;
                    })
                    .attr('x', function (d) {
                        return x(d['Cost Type']);
                    })
                    .attr('style', 'cursor:pointer')
                    .attr('y', function (d, i) {
                        return y(d[option]);
                    })
                    .attr('fill', function (d, i) {
                        // if (i > 0) {
                        //     //If lastmaterial number is same as new one set sameAsLast to true 
                        //     if (data[i - 1]['Cost Type'] == d['Cost Type']) {
                        //         return getRandomColor();
                        //     }
                        // }
                        return getRandomColor();
                    })
                    .attr('width', x.bandwidth())
                    .attr('height', function (d, i) {
                        if (i > 0) {
                            //If lastmaterial number is same as new one set sameAsLast to true 
                            if (data[i - 1]['Cost Type'] == d['Cost Type']) {
                                return height - y(d[option]) - y(data[i - 1][option]);
                            }
                        }
                        return height - y(d[option]);
                    })
                    .on('mouseover', function (d, i) {
                        div.transition()
                            .duration(200)
                            .style("opacity", .9);
                        div.html(`<strong>#</strong><span style='color:yellow'>${i + 1}</span><br>
                        <strong>${option}:</strong> <span style='color:red'>${d[option]}</span><br>
                        <strong>Cost Type:</strong> <span style='color:red'>${d['Cost Type']}</span>`)
                            .style("left", (d3.event.pageX) + "px")
                            .style("top", (d3.event.pageY - 28) + "px");

                        var className = $(this).attr('class');
                        highlightData(className.split(" ")[1]);
                        addScrollableIfWindowIsLarge(className.split(" ")[1]);
                    })
                    .on('mouseout', function () {
                        div.transition()
                            .duration(500)
                            .style("opacity", 0);
                        var className = $(this).attr('class');
                        removeHighlight(className.split(" ")[1]);
                    })
                $('.result-div').append(`<h5 style="text-align:center">Sorted on <span style="font-size: 16px; color:red">${option}</span> in <strong>ascending order</strong></h5>`);

                $('[class^=data]').on('mouseover', function () {
                    var className = $(this).attr('class');
                    highlightData(className.split(" "));
                })
                $('[class^=data]').on('mouseout', function () {
                    var className = $(this).attr('class');
                    removeHighlight(className.split(" ")[0]);
                })
            }
        });
}

function technicians(fields) {
    var url = `http://10.217.163.85:8080/api/technicians?start-date=${fields[0]}&end-date=${fields[1]}`;
    $.getJSON(url)
        .done(function (data) {

            if (data.length <= 0) {
                alert("No data available")
            } else {

                var data = techniciansHelper(data);
                var div = d3.select("body").append("div")
                    .attr("class", "tooltip")
                    .style("opacity", 0);

                var svg = d3.select("svg"),
                    margin = {
                        top: 20,
                        right: 20,
                        bottom: 60,
                        left: 50
                    },
                    width = +svg.attr("width") - margin.left - margin.right,
                    height = +svg.attr("height") - margin.top - margin.bottom,
                    g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
                var x = d3.scaleBand()
                    .rangeRound([0, width])
                    .padding(0.3)
                    .align(0.3);

                var y = d3.scaleLinear()
                    .rangeRound([height, 0]);

                var z = d3.scaleOrdinal()
                    .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);
                var stack = d3.stack();

                data.sort(function (a, b) {
                    return b.total - a.total;
                });


                var keys = Object.keys(data[0]);
                keys.splice(keys.indexOf('EmployeeNo'), 1);
                keys.splice(keys.indexOf('total'), 1);

                x.domain(data.map(function (d) {
                    return d.EmployeeNo;
                }));
                var maxY = d3.max(data, function (d) {
                    return d.total;
                })
                y.domain([0, maxY]).nice();
                z.domain(keys);


                g.append("g")
                    .selectAll("g")
                    .data(d3.stack().keys(keys)(data))
                    .enter().append("g")
                    .attr("fill", function (d) {
                        return z(d.key);
                    })
                    .selectAll("rect")
                    .data(function (d) {
                        return d;
                    })
                    .enter().append('rect')
                    .attr("x", function (d) {
                        return x(d.data.EmployeeNo);
                    })
                    .attr("y", function (d) {
                        return y(d[1]);
                    })
                    .attr('class', function (d, i) {

                        return 'rect data' + i;
                    })
                    .attr("height", function (d) {
                        // debugger
                        // console.log(d[0] + " " + d[1])
                        return y(d[0]) - y(d[1]);
                    })
                    .attr("width", x.bandwidth())
                    .on('mouseover', function (d, i) {
                        div.transition()
                            .duration(200)
                            .style("opacity", .9);
                        var str = ``;
                        var tempD = d.data;
                        Object.keys(tempD).forEach(function (k, i) {
                            str += `<strong>${k}</strong> <span style='color:red'>${tempD[k]}</span><br>`
                        })
                        div.html(str)
                            .style("left", (d3.event.pageX) + "px")
                            .style("top", (d3.event.pageY - 28) + "px");

                        var className = $(this).attr('class');
                        highlightData(className.split(" ")[1]);
                        addScrollableIfWindowIsLarge(className.split(" ")[1]);

                    })
                    .on('mouseout', function () {
                        div.transition()
                            .duration(500)
                            .style("opacity", 0);
                        var className = $(this).attr('class');
                        removeHighlight(className.split(" ")[1]);
                    });

                var xaxis = g.append('g')
                    .attr('class', 'axis axis--x')
                    .style('font-size', '8px')
                    .attr('transform', 'translate(0,' + height + ')')
                    .call(d3.axisBottom(x).ticks(5));

                xaxis.selectAll("text")
                    .attr('x', '-8')
                    .attr("transform", "rotate(-60)")
                    .attr('text-anchor', 'end')
                    .attr('dy', '.35em')


                xaxis.append('text')
                    .attr('fill', '#000')
                    .attr('transform', 'translate(' + width / 2 + ',' + margin.bottom + ')')
                    .text('Employee Number');

                //For Y axis
                g.append('g')
                    .attr('class', 'axis axis--y')
                    .call(d3.axisLeft(y).ticks(5, "s"))
                    .append("text")
                    .attr('transform', 'translate(-' + margin.left + ',' + height / 2 + ')rotate(-90)')
                    .attr('dy', '0.71em')
                    .attr('fill', '#000')
                    .text("No of repeated jobs");

                var legend = g.append("g")
                    .attr("font-family", "sans-serif")
                    .attr("font-size", 10)
                    .attr("text-anchor", "end")
                    .selectAll("g")
                    .data(keys.slice().reverse())
                    .enter().append("g")
                    .attr("transform", function (d, i) {
                        return "translate(0," + i * 20 + ")";
                    });

                legend.append("rect")
                    .attr("x", width - 19)
                    .attr("width", 19)
                    .attr("height", 19)
                    .attr("fill", z);

                legend.append("text")
                    .attr("x", width - 24)
                    .attr("y", 9.5)
                    .attr("dy", "0.32em")
                    .text(function (d) {
                        return d;
                    });

                var headers = data[0];
                var str = "<tr><th>#</th>";
                var length = $('#data-table-tbody').width() / Object.keys(headers).length;
                Object.keys(headers).forEach(function (k) {
                    str += `<th style='width: ${length}px'> ${k}</th>`;
                })
                $("#data-table-thead").append(str + "</tr>");

                data.forEach(function (d, i) {
                    str = `<tr class='data${i}'><td>${i + 1}</td>`
                    Object.keys(d).forEach(function (k, i) {
                        str += `<td style='width: ${length}px'> ${d[k]} </td>`;
                    })
                    $("#data-table-tbody").append(str + "</tr>");
                });

                $('[class^=data]').on('mouseover', function () {
                    var className = $(this).attr('class');
                    highlightData(className.split(" "));
                })
                $('[class^=data]').on('mouseout', function () {
                    var className = $(this).attr('class');
                    removeHighlight(className.split(" ")[0]);
                })
            }
        });

}


function ive(fields) {
    var ive = `http://10.217.163.85:8080/api/ive?vehicle-number=${fields[0]}`;
    $.getJSON(url)
        .done(function (data) {

            if (data.length <= 0) {
                alert("No data available")
            } else {

                $('.result-div').empty();
                $('.result-div').height($('div.row.main-body').height());
                $('.result-div').append(`<svg height="${$('.result-div').height()}" width="${$('.result-div').width()}"></svg>`);
                $('#data-table-tbody').height($('.result-div').height());
   
                //Create array
                var data = iveHelper(data);
                console.log(data)
                // data.sort(function (a, b) {
                //     return a.Acc_Mileage - b.Acc_Mileage;
                // })

                var headers = data[0];
                var str = "<tr><th>#</th>";
                var length = $('#data-table-tbody').width() / Object.keys(headers).length;
                Object.keys(headers).forEach(function (k) {
                    str += `<th style='width: ${length}px'> ${k}</th>`;
                })
                $("#data-table-thead").append(str + "</tr>");

                data.forEach(function (d, i) {
                    str = `<tr class='data${i}'><td>${i + 1}</td>`
                    Object.keys(d).forEach(function (k, i) {
                        str += `<td style='width: ${length}px'> ${d[k]} </td>`;
                    })
                    $("#data-table-tbody").append(str + "</tr>");
                });

                var svg = d3.select("svg"),
                    margin = {
                        top: 20,
                        right: 20,
                        bottom: 60,
                        left: 50
                    },
                    width = +svg.attr("width") - margin.left - margin.right,
                    height = +svg.attr("height") - margin.top - margin.bottom;


                var x = d3.scaleBand().rangeRound([0, width]).padding(.1);
                var y = d3.scaleLinear().rangeRound([height, 0]);


                x.domain(data.map(function (d, i) {
                    return d.Acc_Mileage;
                }));

                y.domain([1, d3.max(data, function (d) {
                    return d.Job_Index;
                })]);

                var div = d3.select("body").append("div")
                    .attr("class", "tooltip")
                    .style("opacity", 0);


                var g = svg.append("g")
                    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

                var xaxis = g.append('g')
                    .attr('class', 'axis axis--x')
                    .style('font-size', '8px')
                    .attr('transform', 'translate(0,' + height + ')')
                    .call(d3.axisBottom(x));

                xaxis.selectAll("text")
                    .attr('x', '-8')
                    .attr("transform", "rotate(-60)")
                    .attr('text-anchor', 'end')
                // .attr('dy', '.35em')


                xaxis.append('text')
                    .attr('fill', '#000')
                    .attr('transform', 'translate(' + width / 2 + ',' + margin.bottom + ')')
                    .text('Acc Mileage');

                //For Y axis
                g.append('g')
                    .attr('class', 'axis axis--y')
                    .call(d3.axisLeft(y))
                    .append("text")
                    .attr('transform', 'translate(-' + margin.left + ',' + height / 2 + ')rotate(-90)')
                    .attr('dy', '0.71em')
                    .attr('fill', '#000')
                    .text('Job Index');

                g.selectAll('.circle')
                    .data(data)
                    .enter().append('circle')
                    .attr('class', function (d, i) {
                        return "circle data" + i;
                    })
                    .attr('style', 'cursor:pointer')
                    .attr('fill', function (d) {
                        return d.Contains_IVE ? "blue" : "green"
                    })
                    .attr('cx', function (d) {
                        return x(d.Acc_Mileage);
                    })
                    .attr('cy', function (d) {
                        return y(d.Job_Index)
                    })
                    .attr('r', 3)
                    .on('mouseover', function (d, i) {
                        div.transition()
                            .duration(200)
                            .style("opacity", .9);

                        var str = ``;
                        Object.keys(d).forEach(function (k, i) {
                            str += `<strong>${k}</strong> <span style='color:red'>${d[k]}</span><br>`
                        })
                        div.html(str)
                            .style("left", (d3.event.pageX) + "px")
                            .style("top", (d3.event.pageY - 28) + "px");

                        var className = $(this).attr('class');
                        highlightData(className.split(" ")[1]);
                        addScrollableIfWindowIsLarge(className.split(" ")[1]);

                    })
                    .on('mouseout', function () {
                        div.transition()
                            .duration(500)
                            .style("opacity", 0);
                        var className = $(this).attr('class');
                        removeHighlight(className.split(" ")[1]);
                    })

                $('[class^=data]').on('mouseover', function () {
                    var className = $(this).attr('class');
                    highlightData(className.split(" "));
                })
                $('[class^=data]').on('mouseout', function () {
                    var className = $(this).attr('class');
                    removeHighlight(className.split(" ")[0]);
                })


                //This is the accessor function we talked about above
                var lineFunction = d3.line()
                    .x(function (d) {
                        return x(d.Acc_Mileage);
                    })
                    .y(function (d) {
                        return y(d.Job_Index);
                    })
                //    .curve(d3.curveBundle)

                //The line SVG Path we draw
                var lineGraph = g.append("path")
                    .attr("d", lineFunction(data))
                    .attr('class', 'line')
                    .attr("stroke", "red")
                    .attr("stroke-width", 2)
                    .attr("fill", "none");

            }
        });
}

function vehicleGrouping(fields) {
    var url = `http://10.217.163.85:8080/api/vehicle-grouping?type=${fields[0]}`;
    $.getJSON(url)
        .done(function (data) {
            if (data.length <= 0) {
                alert("No data available")
            } else {

                var option = "Count";
                var headers = data[0];
                var str = "<tr><th>#</th>";
                var length = $('#data-table-tbody').width() / Object.keys(headers).length;
                Object.keys(headers).forEach(function (k) {
                    str += `<th style='width: ${length}px'> ${k}</th>`;
                })

                $("#data-table-thead").append(str + "</tr>");
                data.forEach(function (d, i) {
                    d.Count = +d.Count
                    d.Perc = +d.Perc
                    str = `<tr class='data${i}'><td>${i + 1}</td>`
                    Object.keys(d).forEach(function (k, i) {
                        str += `<td style='width: ${length}px'> ${d[k]} </td>`;
                    })
                    $("#data-table-tbody").append(str + "</tr>");
                });
                console.log(data)
                var svg = d3.select("svg"),
                    margin = {
                        top: 20,
                        right: 20,
                        bottom: 60,
                        left: 50
                    },
                    width = +svg.attr("width") - margin.left - margin.right,
                    height = +svg.attr("height") - margin.top - margin.bottom;


                var x = d3.scaleBand().rangeRound([0, width]).padding(.2);
                //y = d3.scaleLinear().rangeRound([height, 0]);

                var y = d3.scaleLinear()
                    .rangeRound([height, 0]);

                x.domain(data.map(function (d, i) {
                    return d['Group'];
                }));

                y.domain([0, d3.max(data, function (d) {
                    return d[option];
                })]);
                //y.domain([0.1, data[data.length -1]]);

                var div = d3.select("body").append("div")
                    .attr("class", "tooltip")
                    .style("opacity", 0);

                var g = svg.append("g")
                    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

                var xaxis = g.append('g')
                    .attr('class', 'axis axis--x')
                    .style('font-size', '8px')
                    .attr('transform', 'translate(0,' + height + ')')
                    .call(d3.axisBottom(x));

                xaxis.selectAll("text")
                    .attr('x', '-8')
                    .attr("transform", "rotate(-60)")
                    .attr('text-anchor', 'end')
                // .attr('dy', '.35em')


                xaxis.append('text')
                    .attr('fill', '#000')
                    .attr('transform', 'translate(' + width / 2 + ',' + margin.bottom + ')')
                    .text('@Vehicle Group');

                //For Y axis
                g.append('g')
                    .attr('class', 'axis axis--y')
                    .call(d3.axisLeft(y))
                    .append("text")
                    .attr('transform', 'translate(-' + margin.left + ',' + height / 2 + ')rotate(-90)')
                    .attr('dy', '0.71em')
                    .attr('fill', '#000')
                    .text(option);

                var bars = g.selectAll('.bar')
                    .data(data)
                    .enter().append('g');
                bars.append('rect')
                    .attr('class', function (d, i) {
                        return "bar data" + i;
                    })
                    .attr('x', function (d) {
                        return x(d['Group']);
                    })
                    .attr('style', 'cursor:pointer')
                    .attr('y', function (d, i) {
                        return y(d[option]);
                    })
                    .attr('fill', function (d, i) {
                        return getRandomColor();
                    })
                    .attr('width', x.bandwidth())
                    .attr('height', function (d, i) {
                        return height - y(d[option])
                    })
                    .on('mouseover', function (d, i) {
                        div.transition()
                            .duration(200)
                            .style("opacity", .9);
                        var str = ``;
                        Object.keys(d).forEach(function (k, i) {
                            str += `<strong>${k}</strong> <span style='color:red'>${d[k]}</span><br>`
                        })
                        div.html(str)
                            .style("left", (d3.event.pageX) + "px")
                            .style("top", (d3.event.pageY - 28) + "px");

                        var className = $(this).attr('class');
                        highlightData(className.split(" ")[1]);
                        addScrollableIfWindowIsLarge(className.split(" ")[1]);

                    })
                    .on('mouseout', function () {
                        div.transition()
                            .duration(500)
                            .style("opacity", 0);
                        var className = $(this).attr('class');
                        removeHighlight(className.split(" ")[1]);
                    })

                bars.append("text")
                    .attr("x", function (d) {
                        return x(d.Group) + x.bandwidth() / 3;
                    })
                    .attr("y", function (d) {
                        return y(d.Count) - 10
                    })
                    .attr("dy", ".35em")
                    .text(function (d) {
                        return "(" + d.Count + ") " + d.Perc.toFixed(2) + " %";
                    });

                $('[class^=data]').on('mouseover', function () {
                    var className = $(this).attr('class');
                    highlightData(className.split(" "));
                })
                $('[class^=data]').on('mouseout', function () {
                    var className = $(this).attr('class');
                    removeHighlight(className.split(" ")[0]);
                })
            }
        });
}

function cmTracking(fields) {
    var url = `http://10.217.163.85:8080/api/cm-tracking?registration-batch=${fields[0]}&daily-mileage-group=${fields[1]}`;
    $.getJSON(url)
        .done(function (data) {

            if (data.length <= 0) {
                alert("No data available")
            } else {

                $('.result-div').empty();
                $('.result-div').height($('div.row.main-body').height());
                $('.result-div').append(`<svg height="${$('.result-div').height()}" width="${$('.result-div').width()}"></svg>`);
                $('#data-table-tbody').height($('.result-div').height());
         
                //Create array
                var records = pm_and_cm_TrackingHelperCreateArray(data);

                var svg = d3.select("svg"),
                    margin = {
                        top: 20,
                        right: 20,
                        bottom: 50,
                        left: 40
                    },
                    width = +svg.attr("width") - margin.left - margin.right,
                    height = +svg.attr("height") - margin.top - margin.bottom;



                var x = d3.scaleLinear().rangeRound([0, width]);
                var y = d3.scaleLinear().rangeRound([height, 0]);

                var color = d3.scaleLinear().domain([0, records.length])
                    .interpolate(d3.interpolateHcl)
                    .range([d3.rgb("#007AFF"), d3.rgb('#FFF500')]);

                var maxJobIndex = d3.max(records, function (c) {
                    return d3.max(c.values, function (v) {
                        return v.Job_Index;
                    });
                });
                var maxAccMileage = d3.max(records, function (c) {
                    return d3.max(c.values, function (v) {
                        return v.Acc_Mileage;
                    });
                });

                x.domain([
                    d3.min(records, function (c) {
                        return d3.min(c.values, function (v) {
                            return v.Acc_Mileage;
                        });
                    }),
                    maxAccMileage
                ]);


                y.domain([
                    0,
                    // d3.min(stocks, function(c) { return d3.min(c.values, function(v) { return v.close; }); }),
                    maxJobIndex
                ]);

                var div = d3.select("body").append("div")
                    .attr("class", "tooltip")
                    .style("opacity", 0);


                // set the line attributes
                var line = d3.line()
                    .x(function (d) {
                        return x(d.Acc_Mileage);
                    })
                    .y(function (d) {
                        return y(d.Job_Index);
                    });


                var g = svg.append("g")
                    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');


                // add the x axis
                var xaxis = g.append("g")
                    .attr("class", "x axis")
                    .style('font-size', '8px')
                    .attr("transform", "translate(0," + height + ")")
                    .call(d3.axisBottom(x));
                xaxis.selectAll("text")
                    .attr('x', '-8')
                    .attr("transform", "rotate(-60)")
                    .attr('text-anchor', 'end')

                xaxis.append('text')
                    .attr('fill', '#000')
                    .style('font-size', '12px')
                    .attr('transform', 'translate(' + width / 2 + ',' + margin.bottom + ')')
                    .text('Acc_Mileage');

                //For Y axis
                g.append('g')
                    .attr('class', 'y axis')
                    .call(d3.axisLeft(y))
                    .append("text")
                    .attr('transform', 'translate(-' + margin.left + ',' + height / 2 + ')rotate(-90)')
                    .attr('dy', '0.71em')
                    .attr('fill', '#000')
                    .text('Job Index');

                // add the line groups
                var paths = g.selectAll(".pmTracking")
                    .data(records)
                    .enter().append("g")
                    .attr("class", "pmTracking");

                // add  paths
                paths.append("path")
                    .attr("class", "line")
                    .attr("id", function (d, i) {
                        return "id" + i;
                    })
                    .attr("d", function (d) {
                        return line(d.values);
                    })
                    .attr("stroke-width", "2")
                    .attr("fill", "none")
                    .style("stroke", function (d, i) {
                        return color(i);
                    });

                var countOfDots = 0;
                var TDwidth = $('#data-table-tbody').width() / 4;
                $("#data-table-thead").append(`
        <tr><th>#</th>
       <th width='${TDwidth}'>JobIndex</th>
        <th width='${TDwidth}'>Mileage</th>
         <th width='${TDwidth}'>VehNum</th>
        <th width='${TDwidth}'>VehID</th></tr>
        `)
                var tbody = ``;
                records.forEach(function (d, key) {
                    var vehNum = d.VehNum;
                    var vehID = d.VehID;
                    //Add data to table

                    d.values.forEach(function (k, i) {
                        $("#data-table-tbody").append(`<tr class='data${i + countOfDots}'>
                <td>${i + countOfDots + 1}</td>
                 <td width='${TDwidth}'>${k.Job_Index}</td>
                <td width='${TDwidth}'>${k.Acc_Mileage}</td>
                <td width='${TDwidth}'>${vehNum}</td>
                <td width='${TDwidth}'>${vehID}</td>
            </tr>`);

                    })
                    //Create dots
                    g.selectAll('.circle')
                        .data(d.values)
                        .enter().append('circle')
                        .attr('class', function (k, i) {
                            return "data" + (i + countOfDots);
                        })
                        .attr('style', 'cursor:pointer')
                        .attr('fill', getRandomColor())
                        .attr('cx', function (pair) {
                            return x(pair.Acc_Mileage);
                        })
                        .attr('cy', function (pair) {
                            return y(pair.Job_Index);

                        })
                        .attr('r', 3)
                        .on('mouseover', function (d, i) {
                            div.transition()
                                .duration(200)
                                .style("opacity", .9);
                            div.html(`<strong>VehNum:</strong><span style='color:blue'>${vehNum}</span><br>
                        <strong>Acc_Mileage:</strong> <span style='color:red'>${d.Acc_Mileage}</span><br>
                        <strong>JobIndex:</strong> <span style='color:red'>${d.Job_Index}</span>`)
                                .style("left", (d3.event.pageX) + "px")
                                .style("top", (d3.event.pageY - 28) + "px")

                            var className = $(this).attr('class');
                            highlightData(className.split(" ")[1]);
                            addScrollableIfWindowIsLarge(className);
                        })
                        .on('mouseout', function () {
                            div.transition()
                                .duration(500)
                                .style("opacity", 0);
                            var className = $(this).attr('class');
                            removeHighlight(className.split(" ")[1]);
                        });
                    countOfDots += d.values.length;
                })
                $('[class^=data]').on('mouseover', function () {
                    var className = $(this).attr('class');
                    highlightData(className.split(" "));
                })
                $('[class^=data]').on('mouseout', function () {
                    var className = $(this).attr('class');
                    removeHighlight(className.split(" ")[0]);
                })


            }
        });
}

function techniciansHelper(data) {
    var uniqueEmployees = []

    var uniqueMaterialNumber = []
    data.forEach(function (d, i) {
        empNo = d.EmployeeNo;
        materialNum = d.MaterialNo
        if ($.inArray(empNo, uniqueEmployees) == -1) {
            uniqueEmployees.push(d.EmployeeNo);
        }
        if ($.inArray(materialNum, uniqueMaterialNumber) == -1) {
            uniqueMaterialNumber.push(materialNum)
        }
    })

    //Reform data
    var newData = []
    var empData = {}
    for (var i = 0; i < uniqueEmployees.length; i++) {
        var empNo = uniqueEmployees[i];
        empData = {
            EmployeeNo: empNo
        }
        data.forEach(function (d, i) {
            if (empNo === d.EmployeeNo) {
                var materialNo = d.MaterialNo;
                empData[`${materialNo}`] = +d.NBadJobs;
            }
        })

        uniqueMaterialNumber.forEach(function (d, i) {
            if (!(d in empData)) {
                empData[`${d}`] = 0;
            }
        })
        newData.push(empData);
    }

    newData.forEach(function (d, i) {
        d = type(d, i, Object.keys(d));
    })

    return newData;
}

function type(d, i, columns) {
    for (i = 0, t = 0; i < columns.length; ++i)
        if (columns[i] != 'EmployeeNo') {
            t += d[columns[i]] = +d[columns[i]];
        }

    d.total = t;
    return d;
}

function pm_and_cm_TrackingHelperCreateArray(data) {

    var newData = []
    data.forEach(function (d) {

        var Acc_Mileage = JSON.parse(d.Acc_Mileage);
        var Job_Index = JSON.parse(d.Job_Index);

        var pair = []
        Acc_Mileage.forEach(function (e, i) {
            pair.push({
                Acc_Mileage: e,
                Job_Index: Job_Index[i]
            })
        })
        newData.push({
            VehID: d.VehID,
            VehNum: d.VehNum,
            values: pair
        })

    })
    return newData;
}

function iveHelper(data) {
    var newData = []

    var d = data[0];
    var Acc_Mileage = JSON.parse(d.Acc_Mileage);
    var Contains_IVE = JSON.parse(d.Contains_IVE);
    var Job_Index = JSON.parse(d.Job_Index);

    Acc_Mileage.forEach(function (k, i) {
        newData.push({
            Acc_Mileage: k.toFixed(2),
            Contains_IVE: +Contains_IVE[i],
            Job_Index: +Job_Index[i],
        })
    })
    return newData;
}
//Get random color
function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}


function highlightData(className) {
    $(`.${className}`).addClass('highlight-data');
}

function removeHighlight(className) {
    $(`.${className}`).removeClass('highlight-data');
}

function addScrollableIfWindowIsLarge(className) {
    //$('.device-' + 'lg').is(':visible') || $('.device-' + 'md').is(':visible')
    console.log('scrollable')
    if (window.innerWidth > 767) {
        console.log('if scrollable')
        $(`#data-table-tbody tr.${className}`)[0].scrollIntoView();
    }
}