/*global findashboard, Backbone*/

findashboard.Collections = findashboard.Collections || {};

(function () {
    'use strict';

    findashboard.Collections.PresetsCollection = Backbone.Collection.extend({

        model: findashboard.Models.PresetsModel,
		localStorage: new Backbone.LocalStorage('Presets'),
		comparator: 'name',
		url: '/presets',

		initialize: function() {
			this.on('all', fd.vent.setupTrigger('presets'));
		},

    });

})();
