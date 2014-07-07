/*global findashboard, Backbone*/

findashboard.Collections = findashboard.Collections || {};

(function () {
    'use strict';

    findashboard.Collections.PresetsCollection = Backbone.Collection.extend({

        model: findashboard.Models.PresetsModel,
		firebase: new Backbone.Firebase("https://radiant-fire-2965.firebaseio.com/findashboard/presets"),
		comparator: 'name',

		initialize: function() {
			this.on('all', fd.vent.setupTrigger('presets'));
		},

    });

})();
