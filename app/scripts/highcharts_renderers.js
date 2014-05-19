$.pivotUtilities.highChartRenderers = {
	"Column Chart": makeChart('column'),
	"Stacked Column Chart": makeChart('column',true),
	"Line Chart": makeChart('line'),
	"Area Chart": makeChart('area'),
	"Stacked Area Chart": makeChart('area',true),
	"Pie Chart": getPieChart,
};

function clippingFormatter() {
	return this.value.length > 10 ? this.value.substr(0,7) + "..." : this.value;
}

function makeChart(type, stacked) {
	return function(pivotData, rendererOptions) {
		var resultEl = $("<div></div>");
		
		var chartOptions = {
			chart: {
				type: type,
				renderTo: resultEl[0],
				plotBackgroundColor: null,
				plotBorderWidth: null,
				plotShadow: false,
				width: $(window).width() / 1.4,
				height: $(window).height(),
			},
			title: {
				text: pivotData.rowAttrs.join(', ') + ' by ' + pivotData.colAttrs.join(', '),
			},
			xAxis: {
				title: {
					text: pivotData.colAttrs.join(', '),
				},
				categories: pivotData.flatColKeys,
				labels: {
					formatter: clippingFormatter,
				}
			},
			yAxis: {
				title: {
					text: pivotData.aggregator().label,
				},
				labels: {
					formatter: clippingFormatter,
				}
			},
			plotOptions: {
				series: {
					shadow: true
				}
			},
			series: []
		};
		
		if (stacked) {
			chartOptions.plotOptions[type] = {stacking: 'normal'};
		}
		
		_(pivotData.getRowKeys()).each(function(rowKey) {
			var flatName = rowKey.join(', ');
			var seriesData = _(pivotData.getColKeys()).map(function(colKey) {
				return pivotData.getAggregator(rowKey, colKey).value();
			});
			chartOptions.series.push({'name': flatName, 'data': seriesData});
		});
		
		console.log(chartOptions);
		
		var chart = new Highcharts.Chart(chartOptions);
	
		return resultEl;
	}
}

function getPieChart(pivotData, rendererOptions) {
	var chartTitle = rendererOptions[0];
	var xAxisTitle = rendererOptions[1];
	var yAxisTitle = rendererOptions[2];
	
	
	// Radialize the colors
		/*Highcharts.getOptions().colors = Highcharts.map(Highcharts.getOptions().colors, function(color) {
			return {
				radialGradient: { cx: 0.5, cy: 0.3, r: 0.7 },
				stops: [
					[0, color],
					[1, Highcharts.Color(color).brighten(-0.3).get('rgb')] // darken
				]
			};
		});*/
	
	var myOptions = {
		chart: {
			renderTo: 'container',
			type: 'pie',
			plotBackgroundColor: null,
			plotBorderWidth: null,
			plotShadow: false
		},
		colors: Highcharts.map(Highcharts.getOptions().colors, function(color) {
			return {
				radialGradient: { cx: 0.5, cy: 0.3, r: 0.7 },
				stops: [
					[0, color],
					[1, Highcharts.Color(color).brighten(-0.3).get('rgb')] // darken
				]
			};
		}),
		title: {
			text: chartTitle
		},
		tooltip: {
			pointFormat: '{point.y:.2f}'
		},
		series:[],
		plotOptions: {
			pie: {
				allowPointSelect: true,
				cursor: 'pointer',
				dataLabels: {
					enabled: true,
					//color: '#000000',
					//connectorColor: '#000000',
					//format: '<b>{point.name}</b>: {point.percentage:.1f} %',
					formatter: function() {
						if (this.point.name.length > 10) {
							return '<b>' + this.point.name.substr(0,10) + "...:</b> " +
								Highcharts.numberFormat(this.point.percentage, 1, '.') + '%';
						} else {
							return this.point.name;
						}
					}
				}
			}
		}
	};
	
	var headers = new Array();
	
	headers = pivotData[0];
	for (var i = 1; i < pivotData.length; i++) {
		var currentArray = new Array();
		currentArray = pivotData[i];
		var categoryName = currentArray[0];
		var categoryData = new Array();
		
		for (var j = 1; j < currentArray.length; j++) {
			var piepivotData = new Array();
			piepivotData.push(headers[j], currentArray[j]);
			categoryData.push(piepivotData);
		}
		myOptions.series.push({'data': categoryData});
	}
	
	return myOptions;
}
