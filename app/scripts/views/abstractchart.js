/*global findashboard, Backbone, JST*/

findashboard.Views = findashboard.Views || {};

(function () {
	'use strict';

	findashboard.Views.AbstractchartView = Backbone.View.extend({

		template: JST['app/scripts/templates/abstractchart.ejs'],
		
		chart: null,
		summaryTableView: null,
		monthsShown: [],
		seriesData: {},
		tabName: '',

		events: {
			'click .showAllSeries': 'showAllSeries',
			'click .hideAllSeries': 'hideAllSeries',
			'click .showLast3m': 'showLast3m',
			'click .showLast6m': 'showLast6m',
			'click .showLast12m': 'showLast12m',
			'click .showYTD': 'showYTD',
			'click .showYear2012': 'showYear2012',
			'click .showYear2013': 'showYear2013',
			'click .showYear2014': 'showYear2014',
			'click .shiftLeft3m': 'shiftLeft3m',
			'click .shiftLeft1m': 'shiftLeft1m',
			'click .shiftRight1m': 'shiftRight1m',
			'click .shiftRight3m': 'shiftRight3m',
		},
		
		initialize: function() {
			this.listenTo(fd.vent, 'navigation:tab_shown', this.show);
			this.listenTo(fd.vent, 'data:load_end', this.precomputeData);
		},
		render: function() {
			this.$el.append(this.template());
			this.summaryTableView = new fd.Views.SummarytableView({
				el: this.$el.find('.summaryTable').get(0),
			});
			this.summaryTableView.render();
		},
		prepareData: function() {},
		
		show: function(tabName) {
			if (tabName != '#'+this.tabName) return; // pass on tabs that are not mine
			if (!this.chart) this.render();
			if (!this.monthsShown.length) this.setChartView('ytd'); // set default chart view initially
		},
		
		showLast3m: function(e) { this.setChartView('last', 3); e.preventDefault(); },
		showLast6m: function(e) { this.setChartView('last', 6); e.preventDefault(); },
		showLast12m: function(e) { this.setChartView('last', 12); e.preventDefault(); },
		showYTD: function(e) { this.setChartView('ytd'); e.preventDefault(); },
		showYear2012: function(e) { this.setChartView('year', 2012); e.preventDefault(); },
		showYear2013: function(e) { this.setChartView('year', 2013); e.preventDefault(); },
		showYear2014: function(e) { this.setChartView('year', 2014); e.preventDefault(); },
		shiftLeft3m: function(e) { this.moveChartView(-3); e.preventDefault(); },
		shiftLeft1m: function(e) { this.moveChartView(-1); e.preventDefault(); },
		shiftRight1m: function(e) { this.moveChartView(1); e.preventDefault(); },
		shiftRight3m: function(e) { this.moveChartView(3); e.preventDefault(); },
		
		setChartView: function(viewType, viewLength) {
			console.log('Setting chart view to '+viewType);
			if (!fd.data.dataAvailable) {
				console.log('Skipping as no data is available');
				return this;
			}
			
			this.monthsShown = [];
			if (viewType == 'last') {
				var firstMonthIndex = 0;
				var lastMonthIndex = 0;
				// get the index of the current month in the list of months
				lastMonthIndex = fd.data.months.indexOf(fd.data.currentMonth);
				if (lastMonthIndex === -1) { // not found, such data not in the list
					lastMonthIndex = fd.data.months.length-1; // take the last element then
				}
				lastMonthIndex += 1; // adjust slightly so we're taking the last month in later in the slice
				firstMonthIndex = (lastMonthIndex - viewLength < 0 ? 0 : lastMonthIndex - viewLength);
				// console.log('firstMonthIndex='+firstMonthIndex+', lastMonthIndex='+lastMonthIndex);
				this.monthsShown = fd.data.months.slice(firstMonthIndex, lastMonthIndex);
			}
			if (viewType == 'ytd') {
				// get the index of the current month in the list of months
				var lastMonth;
				if (fd.data.months.indexOf(fd.data.currentMonth) === -1) { // not found, such data not in the list
					lastMonth = fd.data.months[fd.data.months.length-1]; // take the last element then
				} else {
					lastMonth = fd.data.currentMonth;
				}
				var chunks = lastMonth.split('-');
				var year = chunks[0];
				var month = parseInt(chunks[1]); // get just the month part
				this.monthsShown = _(fd.data.months).filter(function(ym) {
					var chunks = ym.split('-');
					return chunks[0] == year && parseInt(chunks[1]) <= month;
				});
			}
			if (viewType == 'year') {
				this.monthsShown = _(fd.data.months).filter(function(ym) {
					return ym.split('-')[0] == viewLength.toString(); // the viewLength parameter bears the year number in this case
				});
			}
			if (this.monthsShown.length === 0) {
				alert('There are no data from this period');
				console.log('No months is scope, not doing anything');
				return;
			}
			console.log('Setting chart views to show months '+this.monthsShown.join(', '));
			
			// now update the chart
			this.updateChartData();
		},
		
		moveChartView: function(delta) {
			console.log('Moving chart view by '+delta+' months');
			if (!fd.data.dataAvailable) {
				console.log('Skipping as no data is available');
				return;
			}
			var startMonth = this.monthsShown[0];
			var startMonthIndex = fd.data.months.indexOf(startMonth);
			console.log(startMonthIndex);
			if (startMonthIndex === -1) throw new Error('Unexpected - startMonth '+startMonth+' not found in fd.data.months');
			if (startMonthIndex + delta < 0) startMonthIndex = 0; // don't go past start of available data
			else if (startMonthIndex + this.monthsShown.length + delta >= fd.data.months.length) startMonthIndex = fd.data.months.length - this.monthsShown.length;
			else startMonthIndex += delta;
			this.monthsShown = fd.data.months.slice(startMonthIndex, startMonthIndex + this.monthsShown.length);
			console.log('Showing months: '+this.monthsShown.join(', '));
			
			// now update the chart
			this.updateChartData();
		},
		
		toggleSeries: function(action) {
			if (!this.chart) return;
			_(this.chart.series).each(function(serie) {
				console.log('Processing serie '+serie.name);
				serie.setVisible(action === 'show', false);
			});
			this.chart.redraw();
		},
		showAllSeries: function() {
			console.log('showing all series');
			this.toggleSeries('show');
		},
		hideAllSeries: function() {
			console.log('hiding all series');
			this.toggleSeries('hide');
		},
		
		updateChartData: function() {}, // to be overridden by extending chart classes
		precomputeData: function() {}, // to be overridden by extending chart classes

		pluckDataForAccount: function(data, account) {
			return _(data).chain().where({'account': account}).pluck('sum_amount').value();
		}
	});

})();
