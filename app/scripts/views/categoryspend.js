/*global findashboard, Backbone, JST*/

findashboard.Views = findashboard.Views || {};

(function () {
    'use strict';

    findashboard.Views.CategoryspendView = Backbone.View.extend({

        template: JST['app/scripts/templates/categoryspend.ejs'],
        
		chart1: null,
		chart2: null,
		
		rendered: false,

		events: {
			'tab_shown': 'show',
		},
		
		initialize: function() {
		},
		
		show: function() {
			if (!this.rendered) this.render();
		},
		
		render: function() {
			if (!fd.data.dataAvailable) {
				console.log('Skipping render as no data is available');
				return this;
			}
			
			function pluckDataForCategory(data, category) {
				return _(data).chain().where({'t1_mainCategory':category}).pluck('sum_amount').value();
			}
			
			var basis = SQLike.q({ // get all combinations of dates and main categories
				select: [function() { return this.t1_yearMonth; },'|as|','yearMonth', function() { return this.t2_mainCategory; },'|as|','mainCategory'],
				from: {t1:fd.data.months},
				join: {t2:fd.data.mainCategories},
				on: function() {return true;}
			});

			var expenses = SQLike.q({
				select: ['yearMonth','mainCategory','|sum|','amount'],
				from: fd.data.transactions,
				where: function() { return this.amount < 0 && this.transfers === ""; },
				groupby: ['yearMonth','mainCategory'],
				orderby: ['yearMonth','mainCategory'],
			});
			expenses = SQLike.q({
				select: ['t1_yearMonth','t1_mainCategory',function() { return this.t2_sum_amount === undefined ? 0 : Math.abs(this.t2_sum_amount)},'|as|','sum_amount'],
				from: {t1: basis},
				leftjoin: {t2: expenses},
				on: function() { return this.t1.yearMonth == this.t2.yearMonth && this.t1.mainCategory == this.t2.mainCategory; },
				orderby: ['t1_yearMonth','t1_mainCategory'],
			});

			var incomes = SQLike.q({
				select: ['yearMonth','mainCategory','|sum|','amount'],
				from: fd.data.transactions,
				where: function() { return this.amount > 0 && this.transfers === ""; },
				groupby: ['yearMonth','mainCategory'],
				orderby: ['yearMonth','mainCategory'],
			});
			incomes = SQLike.q({
				select: ['t1_yearMonth','t1_mainCategory',function() { return this.t2_sum_amount === undefined ? 0 : Math.abs(this.t2_sum_amount)},'|as|','sum_amount'],
				from: {t1: basis},
				leftjoin: {t2: incomes},
				on: function() { return this.t1.yearMonth == this.t2.yearMonth && this.t1.mainCategory == this.t2.mainCategory; },
				orderby: ['t1_yearMonth','t1_mainCategory'],
			});

			function constructSeries(data, categories) {
				var series = [];
				var values;
				_(categories).each(function(category) {
					values = pluckDataForCategory(data, category.mainCategory);
					if (_(values).any(function(value) { return value !== 0; })) series.push({
						name: category.mainCategory,
						data: values,
					});
				});
				return series;
			}
			
			this.chart1 = new Highcharts.Chart({
				chart: {
					type: 'areaspline',
					renderTo: $('#categoryspendexpenseChart').get(0),
				},
				plotOptions: {
					areaspline: {
						stacking: 'normal'
					}
				},
				title: {
					text: 'Expenses per category',
				},
				xAxis: {
					categories: _(fd.data.months).pluck('yearMonth'),
				},
				yAxis: {
					title: {
						text: 'CZK',
					},
				},
				series: constructSeries(expenses, fd.data.mainCategories),
			});
			this.chart1 = new Highcharts.Chart({
				chart: {
					type: 'areaspline',
					renderTo: $('#categoryspendincomeChart').get(0),
				},
				plotOptions: {
					areaspline: {
						stacking: 'normal'
					}
				},
				title: {
					text: 'Incomes per category',
				},
				xAxis: {
					categories: _(fd.data.months).pluck('yearMonth'),
				},
				yAxis: {
					title: {
						text: 'CZK',
					},
				},
				series: constructSeries(incomes, fd.data.mainCategories),
			});

			this.rendered = true;
			return this;
		},

    });

})();
