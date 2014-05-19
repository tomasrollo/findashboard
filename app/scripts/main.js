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
			el: '#incomeexpenseView'
		});
		this.paincomeexpenseView = new this.Views.PaincomeexpenseView({
			el: '#paincomeexpenseView'
		});
		this.categoryspendView = new this.Views.CategoryspendView({
			el: '#categoryspendView'
		});
		this.categoryincomeView = new this.Views.CategoryincomeView({
			el: '#categoryincomeView'
		});
		this.pivotView = new this.Views.PivotView({
			el: '#pivot'
		});

		fd.data.initialize();
		fd.data.loadData();
	}
};

var DEBUG_VENT = true;
var DEBUG_RESULT = true;

window.fd.debug = function(name) {
	return function() {
		if (DEBUG_VENT) console.log(name+' '+arguments[0], Array.prototype.slice.apply(arguments, [1]));
	};
};

window.fd.vent = _.extend({}, Backbone.Events);
window.fd.vent.on('all', window.fd.debug("fd.vent")); // log all events by default
window.fd.vent.setupTrigger = function(name) {
	return function(eventName) {
		window.fd.vent.trigger.apply(window.fd.vent, _.flatten([name+':'+eventName, Array.prototype.slice.apply(arguments, [1])]));
	};
};


$(document).ready(function () {
	'use strict';
	findashboard.init();
});
