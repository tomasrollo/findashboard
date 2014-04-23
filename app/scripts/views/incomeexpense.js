/*global findashboard, Backbone, JST*/

findashboard.Views = findashboard.Views || {};

// (function () {
// 	'use strict';

// 	findashboard.Views.IncomeexpenseView = Backbone.View.extend({

// 		template: JST['app/scripts/templates/incomeexpense.ejs'],

// 		chart1: null,
// 		chart2: null,
		
// 		rendered: false,
		
// 		events: {
// 			'tab_shown': 'show',
// 		},
		
// 		initialize: function() {
// 		},
		
// 		show: function() {
// 			if (!this.rendered) this.render();
// 		},
		
// 		render: function() {
// 			if (!fd.data.dataAvailable) {
// 				console.log('Skipping render as no data is available');
// 				return this;
// 			}
			
// 			function pluckDataForAccount(data, account) {
// 				return _(data).chain().where({'t1_account': account}).pluck('sum_amount').value();
// 			}
			
// 			var basis = SQLike.q({ // get all combinations of monthYears and accounts
// 				select: [function() { return this.t1_yearMonth; },'|as|','yearMonth', function() { return this.t2_account; },'|as|','account'],
// 				from: {t1:fd.data.months},
// 				join: {t2:fd.data.accounts},
// 				on: function() {return true;}
// 			});

// 			var expenses = SQLike.q({
// 				select: ['yearMonth','account','|sum|','amount'],
// 				from: fd.data.transactions,
// 				where: function() { return this.amount < 0 && this.transfers === ""; },
// 				groupby: ['yearMonth','account'],
// 				orderby: ['yearMonth','account'],
// 			});
// 			expenses = SQLike.q({
// 				select: ['t1_yearMonth','t1_account',function() { return this.t2_sum_amount === undefined ? 0 : Math.abs(this.t2_sum_amount)},'|as|','sum_amount'],
// 				from: {t1: basis},
// 				leftjoin: {t2: expenses},
// 				on: function() { return this.t1.yearMonth == this.t2.yearMonth && this.t1.account == this.t2.account; },
// 				orderby: ['t1_yearMonth','t1_account'],
// 			});
// 			var overallExpenses = SQLike.q({
// 				select: ['t1_yearMonth','|sum|','sum_amount'],
// 				from: expenses,
// 				groupby: ['t1_yearMonth'],
// 			});
			
// 			var incomes = SQLike.q({
// 				select: ['yearMonth','account','|sum|','amount'],
// 				from: fd.data.transactions,
// 				where: function() { return this.amount > 0 && this.transfers === ""; },
// 				groupby: ['yearMonth','account'],
// 				orderby: ['yearMonth','account'],
// 			});
// 			incomes = SQLike.q({
// 				select: ['t1_yearMonth','t1_account',function() { return this.t2_sum_amount === undefined ? 0 : Math.abs(this.t2_sum_amount)},'|as|','sum_amount'],
// 				from: {t1: basis},
// 				leftjoin: {t2: incomes},
// 				on: function() { return this.t1.yearMonth == this.t2.yearMonth && this.t1.account == this.t2.account; },
// 				orderby: ['t1_yearMonth','t1_account'],
// 			});
// 			var overallIncomes = SQLike.q({
// 				select: ['t1_yearMonth','|sum|','sum_amount'],
// 				from: incomes,
// 				groupby: ['t1_yearMonth'],
// 			});
			
// 			this.chart1 = new Highcharts.Chart({
// 				chart: {
// 					type: 'areaspline',
// 					renderTo: $('#incomeexpenseChart').get(0),
// 				},
// 				colors: [
// 					'#4BE662', // Income
// 					'#F04152', // Expense
// 				],
// 				plotOptions: {
// 					areaspline: {
// 						fillOpacity: 0.5,
// 					},
// 				},
// 				title: {
// 					text: 'Overall income and expense',
// 				},
// 				xAxis: {
// 					categories: _(fd.data.months).pluck('yearMonth'),
// 				},
// 				yAxis: {
// 					// min: 50000,
// 					// max: 250000,
// 					title: {
// 						text: 'CZK',
// 					},
// 				},
// 				series: [
// 					{
// 						name: 'Overall income',
// 						data: _(overallIncomes).pluck('sum_sum_amount'),
// 					},
// 					{
// 						name: 'Overall expense',
// 						data: _(overallExpenses).pluck('sum_sum_amount'),
// 					},
// 				],
// 			});
			
// 			this.chart2 = new Highcharts.Chart({
// 				chart: {
// 					type: 'column',
// 					renderTo: $('#incomeexpenseAccountChart').get(0),
// 				},
// 				colors: [
// 					'#D9F041', // Cash
// 					'#19F700', // ING
// 					'#F04152', // Iri KB
// 					'#4741F0', // Tomas KB
// 				],
// 				plotOptions: {
// 					column: {
// 						stacking: 'normal'
// 					}
// 				},
// 				title: {
// 					text: 'Account monthly incomes and expenses',
// 				},
// 				xAxis: {
// 					categories: _(fd.data.months).pluck('yearMonth'),
// 				},
// 				yAxis: {
// 					title: {
// 						text: 'CZK',
// 					},
// 				},
// 				series: [
// 					{
// 						name: 'Cash income',
// 						data: pluckDataForAccount(incomes, 'Cash'),
// 						stack: 'incomes',
// 					},
// 					{
// 						name: 'ING income',
// 						data: pluckDataForAccount(incomes, 'ING'),
// 						stack: 'incomes',
// 					},
// 					{
// 						name: 'Iri KB income',
// 						data: pluckDataForAccount(incomes, 'Iri KB'),
// 						stack: 'incomes',
// 					},
// 					{
// 						name: 'Tomas KB income',
// 						data: pluckDataForAccount(incomes, 'Tomas KB'),
// 						stack: 'incomes',
// 					},
// 					{
// 						name: 'Cash expense',
// 						data: pluckDataForAccount(expenses, 'Cash'),
// 						stack: 'expenses',
// 					},
// 					{
// 						name: 'ING expense',
// 						data: pluckDataForAccount(expenses, 'ING'),
// 						stack: 'expenses',
// 					},
// 					{
// 						name: 'Iri KB expense',
// 						data: pluckDataForAccount(expenses, 'Iri KB'),
// 						stack: 'expenses',
// 					},
// 					{
// 						name: 'Tomas KB expense',
// 						data: pluckDataForAccount(expenses, 'Tomas KB'),
// 						stack: 'expenses',
// 					},
// 				],
// 			});
			
// 			this.rendered = true;
// 			return this;
// 		},

// 	});

// })();

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
		
		updateChartData: function(months) {
			
			var overallIncomes = SQLike.q({
				select: [
					function() { return this.t1_yearMonth; },'|as|','yearMonth',
					function() { return this.t2_sum_sum_amount; },'|as|','sum_amount',
				],
				from: {t1: months},
				leftjoin: {t2: this.overallIncomes},
				on: function() { return this.t1.yearMonth == this.t2.yearMonth; },
			});
			console.table(overallIncomes);
			
			var overallExpenses = SQLike.q({
				select: [
					function() { return this.t1_yearMonth; },'|as|','yearMonth',
					function() { return this.t2_sum_sum_amount; },'|as|','sum_amount',
				],
				from: {t1: months},
				leftjoin: {t2: this.overallExpenses},
				on: function() { return this.t1.yearMonth == this.t2.yearMonth; },
			});
			console.table(overallExpenses);
			
			this.chart.xAxis[0].setCategories(_(months).pluck('yearMonth'), false);
			this.chart.series[0].setData(_(overallIncomes).pluck('sum_amount'), false, false, false);
			this.chart.series[1].setData(_(overallExpenses).pluck('sum_amount'), false, false, false);
			this.chart.redraw();
		}

	});

})();
