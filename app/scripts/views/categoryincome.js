/*global findashboard, Backbone, JST*/

findashboard.Views = findashboard.Views || {};

(function () {
    'use strict';

    findashboard.Views.CategoryincomeView = findashboard.Views.AbstractchartView.extend({

        tabName: 'percategory',
        
        render: function() {
			console.log('Rendering CategoryincomeView');
			
			findashboard.Views.AbstractchartView.prototype.render.apply(this);
			
			this.chart = new Highcharts.Chart({
				chart: {
					type: 'areaspline',
					renderTo: this.$el.find('.chart').get(0),
				},
				plotOptions: {
					areaspline: {
						stacking: 'normal'
					}
				},
				title: {
					text: 'Incomes per category',
				},
				yAxis: {
					title: {
						text: 'CZK',
					},
				},
				series: _(fd.data.mainCategories).map(function(cat) { return {name: cat.mainCategory, data: []}; }),
			});

			return this;
        },

		updateChartData: function() {
			
			var expenses = SQLike.q({
				select: [
					function() { return this.t1_yearMonth; },'|as|','yearMonth',
					function() { return this.t2_mainCategory; },'|as|','mainCategory',
					function() { return this.t2_sum_amount; },'|as|','sum_amount',
				],
				from: {t1: fd.util.pack('yearMonth', this.monthsShown)},
				leftjoin: {t2: fd.data.expensesPerYmC},
				on: function() { return this.t1.yearMonth == this.t2.yearMonth; },
			});
			console.table(expenses);
			
			this.chart.xAxis[0].setCategories(this.monthsShown, false);
			this.chart.series[0].setData(_(incomes).chain().where({'account': 'Cash'}).pluck('sum_amount').value(), false, false, false);
			this.chart.series[1].setData(_(incomes).chain().where({'account': 'ING'}).pluck('sum_amount').value(), false, false, false);
			this.chart.series[2].setData(_(incomes).chain().where({'account': 'Iri KB'}).pluck('sum_amount').value(), false, false, false);
			this.chart.series[3].setData(_(incomes).chain().where({'account': 'Tomas KB'}).pluck('sum_amount').value(), false, false, false);
			this.chart.series[4].setData(_(expenses).chain().where({'account': 'Cash'}).pluck('sum_amount').value(), false, false, false);
			this.chart.series[5].setData(_(expenses).chain().where({'account': 'ING'}).pluck('sum_amount').value(), false, false, false);
			this.chart.series[6].setData(_(expenses).chain().where({'account': 'Iri KB'}).pluck('sum_amount').value(), false, false, false);
			this.chart.series[7].setData(_(expenses).chain().where({'account': 'Tomas KB'}).pluck('sum_amount').value(), false, false, false);
			this.chart.redraw();
		}
    });

})();
