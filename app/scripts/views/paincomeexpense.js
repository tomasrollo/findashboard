/*global findashboard, Backbone, JST*/

findashboard.Views = findashboard.Views || {};

(function () {
    'use strict';

    findashboard.Views.PaincomeexpenseView = findashboard.Views.AbstractchartView.extend({

        tabName: 'incomeexpense',
        
        render: function() {
			console.log('Rendering PaincomeexpenseView');
			
			findashboard.Views.AbstractchartView.prototype.render.apply(this);
			
			this.chart = new Highcharts.Chart({
				chart: {
					type: 'column',
					renderTo: this.$el.find('.chart').get(0),
				},
				colors: [
					'#D9F041', // Cash
					'#19F700', // ING
					'#F04152', // Iri KB
					'#4741F0', // Tomas KB
				],
				plotOptions: {
					column: {
						stacking: 'normal'
					}
				},
				title: {
					text: 'Account monthly incomes and expenses',
				},
				yAxis: {
					title: {
						text: 'CZK',
					},
				},
				series: [
					{
						name: 'Cash income',
						data: [],
						stack: 'incomes',
					},
					{
						name: 'ING income',
						data: [],
						stack: 'incomes',
					},
					{
						name: 'Iri KB income',
						data: [],
						stack: 'incomes',
					},
					{
						name: 'Tomas KB income',
						data: [],
						stack: 'incomes',
					},
					{
						name: 'Cash expense',
						data: [],
						stack: 'expenses',
					},
					{
						name: 'ING expense',
						data: [],
						stack: 'expenses',
					},
					{
						name: 'Iri KB expense',
						data: [],
						stack: 'expenses',
					},
					{
						name: 'Tomas KB expense',
						data: [],
						stack: 'expenses',
					},
				],
			});

			return this;
        },

		updateChartData: function() {
			
			var incomes = SQLike.q({
				select: [
					function() { return this.t1_yearMonth; },'|as|','yearMonth',
					function() { return this.t2_account; },'|as|','account',
					function() { return this.t2_sum_amount; },'|as|','sum_amount',
				],
				from: {t1: fd.util.pack('yearMonth', this.monthsShown)},
				leftjoin: {t2: fd.data.incomesPerYmA},
				on: function() { return this.t1.yearMonth == this.t2.yearMonth; },
			});
			// console.table(incomes);
			
			var expenses = SQLike.q({
				select: [
					function() { return this.t1_yearMonth; },'|as|','yearMonth',
					function() { return this.t2_account; },'|as|','account',
					function() { return this.t2_sum_amount; },'|as|','sum_amount',
				],
				from: {t1: fd.util.pack('yearMonth', this.monthsShown)},
				leftjoin: {t2: fd.data.expensesPerYmA},
				on: function() { return this.t1.yearMonth == this.t2.yearMonth; },
			});
			// console.table(expenses);
			
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
