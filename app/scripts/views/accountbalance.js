/*global findashboard, Backbone, JST*/

findashboard.Views = findashboard.Views || {};

(function () {
	'use strict';

	findashboard.Views.AccountbalanceView = Backbone.View.extend({

		template: JST['app/scripts/templates/accountbalance.ejs'],
		
		chart: null,
		
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
			_(balances).each(function(pos, index, b) {
				b[index].sum_amount = tmpBal[pos.t1_account] = tmpBal[pos.t1_account] + pos.sum_amount;
				b[index].t1_date = new Date(b[index].t1_date).getTime();
			});

			this.chart = new Highcharts.StockChart({
				chart: {
					type: 'line',
					renderTo: $('#accountbalanceChart').get(0),
				},
				colors: [
					'#D9F041', // Cash
					'#19F700', // ING
					'#F04152', // Iri KB
					'#4741F0', // Tomas KB
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
				series: [
					{
						name: 'Cash balance',
						data: pluckDataForAccount(balances, 'Cash'),
					},
					{
						name: 'ING balance',
						data: pluckDataForAccount(balances, 'ING'),
					},
					{
						name: 'Iri KB balance',
						data: pluckDataForAccount(balances, 'Iri KB'),
					},
					{
						name: 'Tomas KB balance',
						data: pluckDataForAccount(balances, 'Tomas KB'),
					},
				],
			});
			
			this.rendered = true;
			return this;
		},

	});

})();
