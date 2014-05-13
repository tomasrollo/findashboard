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
				series: _(fd.data.MCtotalIn).map(function(cat) { return {name: cat.mainCategory, data: []}; }),
			});

			return this;
        },

		updateChartData: function() {
			
			var incomes = SQLike.q({
				select: [
					function() { return this.t1_yearMonth; },'|as|','yearMonth',
					function() { return this.t2_mainCategory; },'|as|','mainCategory',
					function() { return this.t2_sum_amount; },'|as|','sum_amount',
				],
				from: {t1: fd.util.pack('yearMonth', this.monthsShown)},
				leftjoin: {t2: fd.data.incomesPerYmC},
				on: function() { return this.t1.yearMonth == this.t2.yearMonth; },
			});
			// console.table(incomes);
			
			this.chart.xAxis[0].setCategories(this.monthsShown, false);
			this.chart.xAxis[0].setCategories(this.monthsShown, false);
			var self = this;
			_(fd.data.MCtotalIn).each(function(el, i) {
				self.chart.series[i].setData(_(incomes).chain().where({'mainCategory': el.mainCategory}).pluck('sum_amount').value(), false, false, false);
			});
			this.chart.redraw();
			
			this.summaryTableView.updateTable(this.chart);
		}
    });

})();
