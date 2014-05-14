/*global findashboard, Backbone, JST*/

findashboard.Views = findashboard.Views || {};

(function () {
	'use strict';

	findashboard.Views.HomeView = Backbone.View.extend({

		template: JST['app/scripts/templates/home.ejs'],
		
		events: {
			
		},
		initialize: function() {
			this.listenTo(fd.vent, 'data:load_start', function() {this.log('Loading data')});
			this.listenTo(fd.vent, 'data:load_end', function() {this.log('Data loaded')});
			this.listenTo(fd.vent, 'data:load_failure', function() {this.log('Failed to load data')});
		},
		log: function(message) {
			this.$el.append('<p>'+message+'</p>');
		},

	});

})();
