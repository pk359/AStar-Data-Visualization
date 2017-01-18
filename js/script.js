$('#menu-content').hide();
formDisplayer('wp2c01');
var menuContentHeight = $('#menu-content').height() / 1.5;
$(function () {
    //Set minimum height of result div to height of form
    $('.result-div').height(menuContentHeight);
    // $('#menu-content').hide(function(){
    //     $('.main-body').css('left', 0);
    // });
    $('.fa-bars').click(function () {
        adjustMenuBar();
    });
    $('#menu-content li').click(function () {
        var menuName = $(this).attr('id').split('-')[0];
        $('#formName-header').text(menuName.toUpperCase().split('C').join('C '));
        adjustMenuBar();
        $('.result-div').empty();
        formDisplayer(menuName);
        //$('.result-div').height();
    });
   
    $('input').filter(function () {
        return this.id.match();
    })
    $('input[id*=date]*[id$=wp2c01],input[id*=date]*[id$=wp2c02]').datepicker({
        maxDate: -1,
        dateFormat: "yy-mm-dd",
        changeYear: true,
        changeMonth: true
    });

    //On form submit button click
    var fields;
    $('form').submit(function () {
        event.preventDefault();
        var formId = $(this).attr('id').split('-')[0];

        fields = [];
        $('input[id$=-' + formId + ']').each(function () {
            fields.push($(this).val());
        });

        switch (formId) {
            case 'wp2c01':
                wp2c01(fields);
                break;
            case 'wp2c02':
                wp2c02(fields);
                break;
        }
    });
});

//Switch forms according to menu item click
function formDisplayer(menuName) {
    $('form[id$=-form]').hide();
    $('#' + menuName + '-form').show();
}

function adjustMenuBar() {
    var main_body_left = $('.main-body').css('left');
    if (main_body_left == '0px') {
        $('#menu-content').toggle('slide', 300);
    } else {
        $('#menu-content').toggle('slide', 300);
    }
}

//D3 scatterplot
function wp2c01(fields) {
    $('.result-div').empty();
    $('.result-div').append(`<svg height="${menuContentHeight-60}"></svg>`);
    $('svg').attr('width', $('.result-div').width());
    var url = `http://10.217.163.143:8080/wp2c1?start_date=${fields[0]}&end_date=${fields[1]}&option=${fields[2]}`;

    $.getJSON(url)
        .done(function (json) {
            data = json[0];
            console.log(data.length);
            if (data.length <= 0) {
                alert("No data available")
            } else {
                data = data.sort(function (a, b) {
                    return a['quantity'] - b['quantity'];
                })
                var svg = d3.select("svg")
                margin = {
                    top: 20,
                    right: 20,
                    bottom: 60,
                    left: 50
                }
                width = +svg.attr("width") - margin.left - margin.right,
                    height = +svg.attr("height") - margin.top - margin.bottom;

                var x = d3.scaleBand().rangeRound([0, width]).padding(.1),
                    y = d3.scaleLinear().rangeRound([height, 0]);

                x.domain(data.map(function (d, i) {
                    return d['materialNumber'];
                }));

                y.domain([0, d3.max(data, function (d) {
                    return d['quantity'];
                })]);

                var tip = d3.tip()
                    .attr('class', 'd3-tip')
                    .html(function (d) {
                        return `
                        <strong>Label:</strong> <span style='color:red'>${d['label']}</span><br>
                        <strong>MaterialDescriptor:</strong> <span style='color:red'>${d['materialDescriptor']}</span><br>
                        <strong>MaterialNumber:</strong> <span style='color:red'>${d['materialNumber']}</span><br>
                        <strong>Quantity:</strong> <span style='color:red'>${d['quantity']}</span>
                        `;
                    });
                svg.call(tip);
                var g = svg.append("g")
                    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

                var xaxis = g.append('g')
                    .attr('class', 'axis axis--x')
                    .attr('transform', 'translate(0,' + height + ')')
                    .call(d3.axisBottom(x));

                xaxis.selectAll("text")
                    .attr('x', '-22')
                    .attr('y', '-10')
                    .attr('dy', '.35em')
                    .attr("transform", "rotate(-90)")
                    .style({
                        "text-anchor": "start"
                    });

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
                    .text("Quantity")

                // add the X gridlines
                g.append("g")
                    .attr("class", "grid")
                    .attr("transform", "translate(0," + height + ")")
                    .call(make_x_gridlines(x)
                        .tickSize(-height)
                        .tickFormat("")
                    )

                // add the Y gridlines
                g.append("g")
                    .attr("class", "grid")
                    .call(make_y_gridlines(y)
                        .tickSize(-width)
                        .tickFormat("")
                    )

                g.selectAll('.circle')
                    .data(data)
                    .enter().append('circle')
                    .attr('class', 'circle')
                    .attr('cx', function (d) {
                        return x(d['materialNumber']);
                    })
                    .attr('cy', function (d) {
                        return y(d['quantity']);
                    })
                    .attr('r', 3)
                    .on('mouseover', tip.show)
                    .on('mouseenter', function () {
                        $(this).attr('r', 5);
                    })
                    .on('mouseout', tip.hide)
                    .on('mouseleave', function () {
                        $(this).attr('r', 3);
                    })

            }
        });
}

function wp2c02(fields) {
    $('.result-div').empty();
    $('.result-div').append(`<svg height="${menuContentHeight-60}"></svg>`);
    $('svg').attr('width', $('.result-div').width());
    var url = `http://10.217.163.143:8080/wp2c2?start_date=${fields[0]}&end_date=${fields[1]}&option=${fields[2]}&count=${fields[3]}`;
    var option = fields[2] == '2' ? "cost" : "quantity";
    $.getJSON(url)
        .done(function (json) {
            data = json[0];
            console.log(data.length);
            if (data.length <= 0) {
                alert("No data available")
            } else {
                data = data.sort(function (a, b) {
                    return a[option] - b[option];
                })
                var svg = d3.select("svg")
                margin = {
                    top: 20,
                    right: 20,
                    bottom: 60,
                    left: 50
                }
                width = +svg.attr("width") - margin.left - margin.right,
                    height = +svg.attr("height") - margin.top - margin.bottom;

                var x = d3.scaleBand().rangeRound([0, width]).padding(.1),
                    y = d3.scaleLinear().rangeRound([height, 0]);

                x.domain(data.map(function (d, i) {
                    return d['materialNumber'];
                }));

                y.domain([0, d3.max(data, function (d) {
                    return d[option];
                })]).nice();

                var tip = d3.tip()
                    .attr('class', 'd3-tip')
                    .html(function (d) {
                        return `
                        <strong>Label:</strong> <span style='color:red'>${d['label']}</span><br>
                        <strong>MaterialDescriptor:</strong> <span style='color:red'>${d['materialDescriptor']}</span><br>
                        <strong>MaterialNumber:</strong> <span style='color:red'>${d['materialNumber']}</span><br>
                        <strong>${option}:</strong> <span style='color:red'>${d[option]}</span>
                        `;
                    });
                svg.call(tip);
                var g = svg.append("g")
                    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

                var xaxis = g.append('g')
                    .attr('class', 'axis axis--x')
                    .attr('transform', 'translate(0,' + height + ')')
                    .call(d3.axisBottom(x));
                
                xaxis.selectAll("text")
                    .attr('x', '-3')
                    .attr('y', '-' + x.bandwidth()/4)
                    .attr("transform", "rotate(-90)")
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
                    // .attr('dy', '0.71em')
                    .attr('fill', '#000')
                    .text(option)

                // add the X gridlines
                g.append("g")
                    .attr("class", "grid")
                    .attr("transform", "translate(0," + height + ")")
                    .call(make_x_gridlines(x)
                        .tickSize(-height)
                        .tickFormat("")
                    )

                // add the Y gridlines
                g.append("g")
                    .attr("class", "grid")
                    .call(make_y_gridlines(y)
                        .tickSize(-width)
                        .tickFormat("")
                    )

                //2013-04-21
                //2014-12-02
                g.selectAll('.bar')

                    .data(data)
                    .enter().append('rect')
                    .attr('class', function(d, i){
                        if (i > 0) {
                            if (data[i - 1]['materialNumber'] == d['materialNumber']) {
                                return 'bar layover-bar'
                            }
                        }
                        return 'bar';
                    })
                    .attr('x', function (d) {
                        return x(d['materialNumber']);
                    })
                    .attr('y', function (d) {
                        return y(d[option]);
                    })
                    .attr('fill', function (d, i) {
                        if (i > 0) {
                            if (data[i - 1]['materialNumber'] == d['materialNumber']) {
                                return getRandomColor();
                            }
                        }
                    })

                    .attr('width', x.bandwidth())
                    .attr('height', function (d) {
                        return height - y(d[option]);
                    })
                    .on('mouseleave', function(d){
                        g.selectAll(".bar").sort(function (a, b) { // select the parent and sort the path's
                            if (a.id != d.id) return -1; // a is not the hovered element, send "a" to the back
                            else return 1; // a is the hovered element, bring "a" to the front
                        });
                    })
                    .on('mouseover', tip.show)
                    .on('mouseout', tip.hide);

            }
        });
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
// gridlines in x axis function
function make_x_gridlines(x) {
    return d3.axisBottom(x)
        .ticks(10)
}

// gridlines in y axis function
function make_y_gridlines(y) {
    return d3.axisLeft(y)
        .ticks(20)
}