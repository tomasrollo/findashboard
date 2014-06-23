/*global findashboard, Backbone, JST*/

findashboard.Views = findashboard.Views || {};

(function () {
	'use strict';

	findashboard.Views.NavigationView = Backbone.View.extend({

		template: JST['app/scripts/templates/navigation.ejs'],
		
		initialize: function() {
			var self = this;
			this.on('all', fd.vent.setupTrigger('navigation'));
			$('#navigation').tabs({
				beforeActivate: function(event, ui) {
					self.trigger('tab_shown', ui.newPanel[0].id);
				}
			});
		}

	});

})();
