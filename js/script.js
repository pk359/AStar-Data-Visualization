$('#menu-content').show();
$('#help-content').hide();
formDisplayer('componentScatterPlotAll');
$('.start_date').val('2013-04-21');
$('.end_date').val('2014-12-02');
$('.result-div').height($('.input-forms').height() * 1.61);
$(function () {
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
        $('.result-div').empty();
        $('#data-table-tbody').empty();
        $('#data-table-thead').empty();
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
    // var main_body_left = $('.main-body').css('left');
    // if (main_body_left == '0px') {
    //     $('#menu-content').toggle('slide', 300);
    // } else {
    //     $('#menu-content').toggle('slide', 300);
    // }
}

function adjustHelpBar() {
    $('#help-content').toggle('slide');
    // $('#help-content').css('right', '200px')
}

//D3 scatterplot
function componentScatterPlotAll(fields) {
    // var url = `http://10.217.163.77:8080/api/component-scatter-plot-all?start-date=${fields[0]}&end-date=${fields[1]}&option=${fields[2]}`;
    // $.getJSON(url)
    //     .done(function (data) {

    //         if (data.length <= 0) {
    //             alert("No data available")
    //         } else {
    $('.result-div').append(`<svg height="${$('.result-div').height()}" width="${$('.result-div').width()}"></svg>`);
    $('#data-table-tbody').height($('.result-div').height());
    //$('#data-table-tbody').width($('.data-table').width()-29);
    var option = fields[2] == '2' ? "TotCost" : "TotQuant";
    var data = cspa;
    var headers = data[0];
    var str = "<tr><th>#</th>";
    Object.keys(headers).forEach(function (k) {
        str += "<th>" + k + "</th>";
    })
    $("#data-table-thead").append(str + "</tr>");
    data = data.sort(function (a, b) {
        return a[option] - b[option];
    });
    data.forEach(function (d, i) {
        d[option] = +d[option];
        str = `<tr class='data${i}'><td>${i + 1}</td>`
        Object.keys(d).forEach(function (k, i) {
            str += "<td>" + d[k] + "</td>";
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
            //$(`#data-table-tbody tr.${className.split(" ")[1]}`)[0].scrollIntoView();

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
    //     }
    // });
}

function componentBarPlotCm(fields) {
    // var url = `http://10.217.163.77:8080/api/component-bar-plot-cm?start-date=${fields[0]}&end-date=${fields[1]}&option=${fields[2]}&no-of-rows=${fields[3]}`;
    // $.getJSON(url)
    //     .done(function (data) {
    //         if (data.length <= 0) {
    //             alert("No data available")
    //         } else {
    $('.result-div').append(`<svg height="${$('.result-div').height()}" width="${$('.result-div').width()}"></svg>`);
    $('#data-table-tbody').height($('.result-div').height());
    //$('#data-table-tbody').width($('.data-table').width()-29);
    var option = fields[2] == '2' ? "TotCost" : "TotQuant";
    var data = cbpc;
    var headers = data[0];
    var str = "<tr><th>#</th>";
    Object.keys(headers).forEach(function (k) {
        str += "<th>" + k + "</th>";
    })
    $("#data-table-thead").append(str + "</tr>");

    data = data.sort(function (a, b) {
        return a[option] - b[option];
    });
    data.forEach(function (d, i) {
        d[option] = +d[option];
        str = `<tr class='data${i}'><td>${i + 1}</td>`
        Object.keys(d).forEach(function (k, i) {
            str += "<td>" + d[k] + "</td>";
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
            //$(`#data-table-tbody tr.${className.split(" ")[1]}`)[0].scrollIntoView();

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
    //     }
    // });
}

function generalScatterPlotMileage(fields) {
    // var url = `http://10.217.163.77:8080/api/general-scatter-plot-mileage?start-date=${fields[0]}&end-date=${fields[0]}`;
    // $.getJSON(url)
    //     .done(function (data) {
    //         if (data.length <= 0) {
    //             alert("No data available")
    //         } else {
    $('.result-div').append(`<svg height="${$('.result-div').height()}" width="${$('.result-div').width()}"></svg>`);
    $('#data-table-tbody').height($('.result-div').height());
    var data = gmData;
    var headers = data[0];
    var str = "<tr><th>#</th>";
    Object.keys(headers).forEach(function (k) {
        str += "<th>" + k + "</th>";
    })
    $("#data-table-thead").append(str + "</tr>");

    // data = data.sort(function (a, b) {
    //     return +a['MeanMileage'] - +b['MeanMileage'];
    // });
    data.forEach(function (d, i) {
        d['MeanMileage'] = +d['MeanMileage'];
        str = `<tr class='data${i}'><td>${i + 1}</td>`
        Object.keys(d).forEach(function (k, i) {
            str += "<td>" + d[k] + "</td>";
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
            //$(`#data-table-tbody tr.${className.split(" ")[1]}`)[0].scrollIntoView();

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
    //     }
    // });
}

function componentBarPlotMttfAll(fields) {
    // var url =  `http://10.217.163.77:8080/api/component-bar-plot-mttf-critical?option=${fields[0]}&no-of-rows=${fields[1]}`;
    // $.getJSON(url)
    //     .done(function (data) {
    //         if (data.length <= 0) {
    //             alert("No data available")
    //         } else {
    $('.result-div').append(`<svg height="${$('.result-div').height()}" width="${$('.result-div').width()}"></svg>`);
    $('#data-table-tbody').height($('.result-div').height());
    var data = cbpma;
    var headers = data[0];

    var str = "<tr><th>#</th>";
    Object.keys(headers).forEach(function (k) {
        str += "<th>" + k + "</th>";
    })
    $("#data-table-thead").append(str + "</tr>");

    data = data.sort(function (a, b) {
        return a['MTTF'] - b['MTTF'];
    });
    data.forEach(function (d, i) {
        d['MTTF'] = +d['MTTF'];
        str = `<tr class='data${i}'><td>${i + 1}</td>`
        Object.keys(d).forEach(function (k, i) {
            str += "<td>" + d[k] + "</td>";
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
            //$(`#data-table-tbody tr.${className.split(" ")[1]}`)[0].scrollIntoView();

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
    //     }
    // });
}

function componentBarPlotMttfCritical(fields) {

    // var url = `http://10.217.163.77:8080/api/component-bar-plot-all?start-date=${fields[0]}&end-date=${fields[1]}&option=${fields[2]}&no-of-rows=${fields[3]}`;
    // $.getJSON(url)
    //     .done(function (data) {
    //         if (data.length <= 0) {
    //             alert("No data available")
    //         } else {
    $('.result-div').append(`<svg height="${$('.result-div').height()}" width="${$('.result-div').width()}"></svg>`);
    $('#data-table-tbody').height($('.result-div').height());
    var data = cbpmc;

    var headers = data[0];

    var str = "<tr><th>#</th>";
    Object.keys(headers).forEach(function (k) {
        str += "<th>" + k + "</th>";
    })
    $("#data-table-thead").append(str + "</tr>");

    data = data.sort(function (a, b) {
        return a['MTTF'] - b['MTTF'];
    });
    data.forEach(function (d, i) {
        d['MTTF'] = +d['MTTF'];
        str = `<tr class='data${i}'><td>${i + 1}</td>`
        Object.keys(d).forEach(function (k, i) {
            str += "<td>" + d[k] + "</td>";
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
            //$(`#data-table-tbody tr.${className.split(" ")[1]}`)[0].scrollIntoView();

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
    //     }
    // });
}

//Using D3
function componentBarPlotAll(fields) {

    // var url = `http://10.217.163.77:8080/api/component-bar-plot-all?start-date=${fields[0]}&end-date=${fields[1]}&option=${fields[2]}&no-of-rows=${fields[3]}`;
    // $.getJSON(url)
    //     .done(function (data) {
    //         if (data.length <= 0) {
    //             alert("No data available")
    //         } else {
    $('.result-div').append(`<svg height="${$('.result-div').height()}" width="${$('.result-div').width()}"></svg>`);
    $('#data-table-tbody').height($('.result-div').height());
    //$('#data-table-tbody').width($('.data-table').width()-29);
    var data = cbpa;
    var option = fields[2] == '2' ? "TotCost" : "TotQuant";
    var headers = data[0];

    var str = "<tr><th>#</th>";
    Object.keys(headers).forEach(function (k) {
        str += "<th>" + k + "</th>";
    })
    $("#data-table-thead").append(str + "</tr>");

    data = data.sort(function (a, b) {
        return a[option] - b[option];
    });
    data.forEach(function (d, i) {
        d[option] = +d[option];
        str = `<tr class='data${i}'><td>${i + 1}</td>`
        Object.keys(d).forEach(function (k, i) {
            str += "<td>" + d[k] + "</td>";
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
            //$(`#data-table-tbody tr.${className.split(" ")[1]}`)[0].scrollIntoView();

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
    //     }
    // });
}

//Using D3
function componentBarPlotCritical(fields) {
    // var url = `http://10.217.163.77:8080/api/component-bar-plot-critical?start-date=${fields[0]}&end-date=${fields[1]}&option=${fields[2]}&no-of-rows=${fields[3]}`;
    // $.getJSON(url)
    //     .done(function (data) {
    //         if (data.length <= 0) {
    //             alert("No data available")
    //         } else {
    $('.result-div').append(`<svg height="${$('.result-div').height()}" width="${$('.result-div').width()}"></svg>`);
    $('#data-table-tbody').height($('.result-div').height());
    var option = fields[2] == '2' ? "TotCost" : "TotQuant";
    var data = cbpc;
    var headers = data[0];

    var str = "<tr><th>#</th>";
    Object.keys(headers).forEach(function (k) {
        str += "<th>" + k + "</th>";
    })
    $("#data-table-thead").append(str + "</tr>");

    data = data.sort(function (a, b) {
        return a[option] - b[option];
    });
    data.forEach(function (d, i) {
        d[option] = +d[option];
        str = `<tr class='data${i}'><td>${i + 1}</td>`
        Object.keys(d).forEach(function (k, i) {
            str += "<td>" + d[k] + "</td>";
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
            //$(`#data-table-tbody tr.${className.split(" ")[1]}`)[0].scrollIntoView();

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
    //     }
    // });
}

function pmTracking(fields) {

    // var url = `http://10.217.163.77:8080/api/pm-tracking?registration-batch-year=${fields[0]}&daily-mileage=${fields[1]}`;
    // $.getJSON(url)
    //     .done(function (data) {

    //         if (data.length <= 0) {
    //             alert("No data available")
    //         } else {
    $('.result-div').height($('.result-div').height());
    $('.result-div').append(`<svg height="${$('.result-div').height()}" width="${$('.result-div').width()}"></svg>`);
    $('#data-table-tbody').height($('.result-div').height());
    //$('#data-table-tbody').width($('.data-table').width()-29);

    var data = pmt;
    //Create array
    var records = pmTrackingHelperCreateArray(data);

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
    $("#data-table-thead").append(`
        <th>#</th>
       <th>JobIndex</th>
        <th>Mileage</th>
         <th>VehNum</th>
        <th>VehID</th>
        `)
    var tbody = ``;
    records.forEach(function (d, key) {
        var vehNum = d.VehNum;
        var vehID = d.VehID;
        //Add data to table

        d.values.forEach(function (k, i) {
            $("#data-table-tbody").append(`<tr class='data${i + countOfDots}'>
                <td>${i + countOfDots + 1}</td>
                 <td>${k.Job_Index}</td>
                <td>${k.Acc_Mileage}</td>
                <td>${vehNum}</td>
                <td>${vehID}</td>
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
                $(`#data-table-tbody tr.${className}`)[0].scrollIntoView();
            })
            .on('mouseout', function () {
                div.transition()
                    .duration(500)
                    .style("opacity", 0);
                var className = $(this).attr('class');
                removeHighlight(className.split(" ")[1]);
            });
        countOfDots += d.values.length;

        // var bar = g.append('rect')
        //     .attr("class", "bar")
        //     .attr("x", width - 70)
        //     .attr("y", height - 20 - key * 10)
        //     .attr('fill', color(key))
        //     .attr("width", '20px')
        //     .attr("height", '9px')
        //     .attr("id", 'text_id' + key)

        //     .on("mouseover", function () {
        //         for (j = 0; j < maxJobIndex; j++) {
        //             if (key !== j) {
        //                 d3.select("#id" + key).style("opacity", 0.1);
        //                 d3.select("#text_id" + key).style("opacity", 0.2);
        //             }
        //         };
        //     })
        //     .on("mouseout", function () {
        //         for (j = 0; j < maxJobIndex; j++) {
        //             d3.select("#id" + j).style("opacity", 1);
        //             d3.select("#text_id" + j).style("opacity", 1);
        //         };
        //     })
        // bar.append('text')
        //     .attr("x", width - 49)
        //     .attr("y", height - 20 - key * 10)
        //     .attr("dy", ".35em")
        //     .attr('fill', '#000')
        //     .style('font-size', '12px')
        //     .text(d.VehNum)
    })
    $('[class^=data]').on('mouseover', function () {
        var className = $(this).attr('class');
        highlightData(className.split(" "));
    })
    $('[class^=data]').on('mouseout', function () {
        var className = $(this).attr('class');
        removeHighlight(className.split(" ")[0]);
    })
    console.log(records);


    //     }
    // });

}

function survivalAnalysis(fields) {
    // var url = `http://10.217.163.77:8080/api/component-bar-plot-critical?start-date=${fields[0]}&end-date=${fields[1]}&option=${fields[2]}&no-of-rows=${fields[3]}`;
    // $.getJSON(url)
    //     .done(function (data) {
    //         if (data.length <= 0) {
    //             alert("No data available")
    //         } else {

    $('.result-div').append(`<svg height="${$('.result-div').height()}" width="${$('.result-div').width()}"></svg>`);
    $('#data-table-tbody').height($('.result-div').height());
    var data = saAll;

    if (fields[1] === 'All') {
        var pathsJSON = survivalAnalysisHelperAll(data);
        console.log(pathsJSON);
    } else {
        survivalAnalysisHelperNotAll()
    }

    var headers = data[0];

    var str = "<tr><th>#</th>";
    Object.keys(headers).forEach(function (k) {
        str += "<th>" + k + "</th>";
    })

    $("#data-table-thead").append(str + "</tr>");

    data = data.sort(function (a, b) {
        return a['MTTF'] - b['MTTF'];
    });
    data.forEach(function (d, i) {
        d['MTTF'] = +d['MTTF'];
        str = `<tr class='data${i}'><td>${i + 1}</td>`
        Object.keys(d).forEach(function (k, i) {
            str += "<td>" + d[k] + "</td>";
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
    // }
    // });
}

function pmTrackingHelperCreateArray(data) {

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

//Create new array of points for Survival Analysis
function survivalAnalysisHelperAll(data) {
    var pathsJSON = {}

    pathsJSON.AVLC = []
    pathsJSON.AVLCLower = []
    pathsJSON.AVLCUpper = []

    data.forEach(function (d) {
        if (Object.keys(d).length == 2) {
            pathsJSON.AVLC.push({ x: d["All vehicle, all cause"], y: d["timeline"] });
            pathsJSON.AVLCLower.push({ x: d["All vehicle, all cause"], y: d["timeline"] });
            pathsJSON.AVLCUpper.push({ x: d["All vehicle, all cause"], y: d["timeline"] });
        } else {
            pathsJSON.AVLC.push({ x: d["All vehicle, all cause"], y: d["timeline"] });
            pathsJSON.AVLCLower.push({ x: d[`All vehicle, all cause_lower_0.95`], y: d["timeline"] });
            pathsJSON.AVLCUpper.push({ x: d[`All vehicle, all cause_upper_0.95`], y: d["timeline"] });
        }
    })
    return pathsJSON;

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