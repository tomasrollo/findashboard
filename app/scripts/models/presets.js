/*global findashboard, Backbone*/

findashboard.Models = findashboard.Models || {};

(function () {
	'use strict';

	findashboard.Models.PresetsModel = Backbone.Model.extend({

		url: '',

		initialize: function() {
		},

		defaults: {
			name: 'Unnamed preset',
			cols: [],
			rows: [],
			vals: [],
			exclusions: {},
		},

		validate: function(attrs, options) {
		},

		parse: function(response, options)  {
			return response;
		},
		
		update: function(name, settings) {
			console.log(settings);
			this.set("name", name);
			this.set("cols", settings.cols);
			this.set("rows", settings.rows);
			this.set("vals", settings.vals);
			this.set("exclusions", settings.exclusions);
		},
		
		getOptions: function() {
			return {
				cols: this.get('cols'),
				rows: this.get('rows'),
				vals: this.get('vals'),
				exclusions: this.get('exclusions'),
			};
		},
	});

})();
