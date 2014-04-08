/*global findashboard, $*/


window.fd = window.findashboard = {
	Models: {},
	Collections: {},
	Views: {},
	Routers: {},
	init: function () {
		'use strict';
		console.log('Hello from Findashboard!');
		
		this.homeView = new this.Views.HomeView({
			el: '#home'
		});
		this.navigationView = new this.Views.NavigationView({
			el: '#navigation'
		});
		this.accountbalanceView = new this.Views.AccountbalanceView({
			el: '#accountbalance'
		});
		this.incomeexpenseView = new this.Views.IncomeexpenseView({
			el: '#incomeexpense'
		});
		this.incomeexpenseView = new this.Views.CategoryspendView({
			el: '#categoryspend'
		});
		
		fd.data.loadData();
	}
};

$(document).ready(function () {
	'use strict';
	findashboard.init();
});
