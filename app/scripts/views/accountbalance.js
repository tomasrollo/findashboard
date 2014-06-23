/*global findashboard, Backbone, JST*/

findashboard.Views = findashboard.Views || {};

(function () {
	'use strict';

	findashboard.Views.AccountbalanceView = Backbone.View.extend({

		template: JST['app/scripts/templates/accountbalance.ejs'],
		
		chart: null,
        tabName: 'accountbalance',
        
		initialize: function() {
			this.listenTo(fd.vent, 'navigation:tab_shown', this.show);
		},
		
		show: function(tabName) {
			if (tabName != this.tabName) return; // pass on tabs that are not mine
			if (!this.chart) this.render();
		},
		
		render: function() {
			if (!fd.data.dataAvailable) {
				console.log('Skipping render as no data is available');
				return this;
			}
			
			console.log('Rendering chart');
			this.$el.append(this.template());
			
			function pluckDataForAccount(data, account) {
				return _(data).chain().where({'t1_account':account}).map(function(pos) { return [pos.t1_date, pos.sum_amount]; }).value();
			}
			
			var basis = SQLike.q({ // get all combinations of dates and accounts
				select: [function() { return this.t1_date; },'|as|','date', function() { return this.t2_account; },'|as|','account'],
				from: {t1:fd.data.dates},
				join: {t2:fd.data.accounts},
				on: function() {return true;}
			});

			var balances = SQLike.q({
				select: ['date','account','|sum|','amount'],
				from: fd.data.transactions,
				groupby: ['date','account'],
				orderby: ['date','account'],
			});
			balances = SQLike.q({
				select: ['t1_date','t1_account',function() { return this.t2_sum_amount === undefined ? 0 : this.t2_sum_amount},'|as|','sum_amount'],
				from: {t1: basis},
				leftjoin: {t2: balances},
				on: function() { return this.t1.date == this.t2.date && this.t1.account == this.t2.account; },
				orderby: ['t1_date','t1_account'],
			});
			var tmpBal = _(fd.data.accounts).reduce(function(memo, account) { memo[account.account] = 0; return memo;}, {});
			_(balances).each(function(pos, index, b) { // roll the balance over time (per each account)
				b[index].sum_amount = tmpBal[pos.t1_account] = tmpBal[pos.t1_account] + pos.sum_amount;
			});
			var totalNetWorth = SQLike.q({
				select: ['t1_date','|sum|','sum_amount'],
				from: balances,
				groupby: ['t1_date'],
				orderby: ['t1_date'],
			});
			console.log(balances);

			this.chart = new Highcharts.StockChart({
				chart: {
					type: 'line',
					renderTo: this.$el.find('.chart').get(0),
				},
				colors: [
					'#D9F041', // Cash
					'#19F700', // ING
					'#F04152', // Iri KB
					'#4741F0', // Tomas KB
					'#000000', // Total net worth
				],
				rangeSelector: {
					selected: 1,
					inputEnabled: $('#accountbalanceChart').width() > 480
				},
				title: {
					text : 'Accounts balance'
				},
				yAxis: {
					title: {
						text: 'CZK',
					},
				},
				legend: {
					enabled: true,
				},
				series: [
					{
						name: 'Cash balance',
						data: pluckDataForAccount(balances, 'Cash'),
						type: 'spline',
					},
					{
						name: 'ING balance',
						data: pluckDataForAccount(balances, 'ING'),
						type: 'spline',
					},
					{
						name: 'Iri KB balance',
						data: pluckDataForAccount(balances, 'Iri KB'),
						type: 'spline',
					},
					{
						name: 'Tomas KB balance',
						data: pluckDataForAccount(balances, 'Tomas KB'),
						type: 'spline',
					},
					{
						name: 'Total net worth',
						data: _(totalNetWorth).map(function(pos) { return [pos.t1_date, pos.sum_sum_amount]; }),
						type: 'spline',
					},
				],
			});
			
			return this;
		},

	});

})();
