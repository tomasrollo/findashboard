/*global findashboard, Backbone, JST*/

findashboard.Views = findashboard.Views || {};

(function () {
	'use strict';

	findashboard.Views.NavigationView = Backbone.View.extend({

		template: JST['app/scripts/templates/navigation.ejs'],
		
		initialize: function() {
			$('#navigation a[data-toggle="pill"]').on('shown.bs.tab', function (e) {
				// console.log($(e.target).attr('href'));
				$($(e.target).attr('href')).trigger('tab_shown'); // activated tab
			});
		}

	});

})();
