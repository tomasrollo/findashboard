/*global findashboard, Backbone, JST*/

findashboard.Views = findashboard.Views || {};

(function () {
	'use strict';

	findashboard.Views.HomeView = Backbone.View.extend({

		template: JST['app/scripts/templates/home.ejs'],
		
		events: {
			
		},
		initialize: function() {
			this.listenTo(fd.data, 'load:start', function() {this.log('Loading data')});
			this.listenTo(fd.data, 'load:end', function() {this.log('Data loaded')});
		},
		log: function(message) {
			this.$el.append('<p>'+message+'</p>');
		},

	});

})();
