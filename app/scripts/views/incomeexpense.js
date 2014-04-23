/*global findashboard, Backbone, JST*/

findashboard.Views = findashboard.Views || {};

(function () {
	'use strict';

	findashboard.Views.IncomeexpenseView = findashboard.Views.AbstractchartView.extend({
		
		tabName: 'incomeexpense',

		render: function() {
			console.log('Rendering IncomeexpenseView');
			
			findashboard.Views.AbstractchartView.prototype.render.apply(this);
			
			this.chart = new Highcharts.Chart({
				chart: {
					type: 'areaspline',
					renderTo: this.$el.find('.chart').get(0),
				},
				colors: [
					'#4BE662', // Income
					'#F04152', // Expense
				],
				plotOptions: {
					areaspline: {
						fillOpacity: 0.5,
					},
				},
				title: {
					text: 'Overall income and expense',
				},
				yAxis: {
					// min: 50000,
					// max: 250000,
					title: {
						text: 'CZK',
					},
				},
				series: [
					{
						name: 'Overall income',
						data: [],
					},
					{
						name: 'Overall expense',
						data: [],
					},
				],
			});
			
			return this;
		},
		
		precomputeData: function() {
			this.overallExpenses = SQLike.q({
				select: ['yearMonth','|sum|','sum_amount'],
				from: fd.data.expenses,
				groupby: ['yearMonth'],
			});
			this.overallIncomes = SQLike.q({
				select: ['yearMonth','|sum|','sum_amount'],
				from: fd.data.incomes,
				groupby: ['yearMonth'],
			});
		},
		
		updateChartData: function() {
			
			var overallIncomes = SQLike.q({
				select: [
					function() { return this.t1_yearMonth; },'|as|','yearMonth',
					function() { return this.t2_sum_sum_amount; },'|as|','sum_amount',
				],
				from: {t1: fd.util.pack('yearMonth', this.monthsShown)},
				leftjoin: {t2: this.overallIncomes},
				on: function() { return this.t1.yearMonth == this.t2.yearMonth; },
			});
			console.table(overallIncomes);
			
			var overallExpenses = SQLike.q({
				select: [
					function() { return this.t1_yearMonth; },'|as|','yearMonth',
					function() { return this.t2_sum_sum_amount; },'|as|','sum_amount',
				],
				from: {t1: fd.util.pack('yearMonth', this.monthsShown)},
				leftjoin: {t2: this.overallExpenses},
				on: function() { return this.t1.yearMonth == this.t2.yearMonth; },
			});
			console.table(overallExpenses);
			
			this.chart.xAxis[0].setCategories(this.monthsShown, false);
			this.chart.series[0].setData(_(overallIncomes).pluck('sum_amount'), false, false, false);
			this.chart.series[1].setData(_(overallExpenses).pluck('sum_amount'), false, false, false);
			this.chart.redraw();
		}

	});

})();
