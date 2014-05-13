/*global findashboard, Backbone, JST*/

findashboard.Views = findashboard.Views || {};

(function () {
	'use strict';

	findashboard.Views.SummarytableView = Backbone.View.extend({

		template: JST['app/scripts/templates/summarytable.ejs'],
		
		initialize: function() {
		},
		
		render: function() {
			this.$el.append('<table></table>');
			this.$el = this.$el.find('table');
			return this;
		},
		
		updateTable: function(chart) {
			var htmlString = '<tr><th>Series</th>';
			_(chart.xAxis[0].categories).each(function(cat) {
				htmlString += '<th>'+cat+'</th>';
			});
			htmlString += '<th>Avg / Sum</th></tr>';
			_(chart.series).each(function(serie) {
				htmlString += '<tr><td>'+serie.name+'</td>';
				var sum = 0;
				_(serie.data).each(function(point) {
					htmlString += '<td>'+fd.util.CZKFormatter.format(point.y)+'</td>';
					sum += point.y;
				});
				htmlString += '<td>S: '+fd.util.CZKFormatter.format(Math.round(sum))+'<br>A: '+fd.util.CZKFormatter.format(Math.round(sum/serie.data.length))+'</td>';
				htmlString += '</tr>';
			});
			console.log(htmlString);
			this.$el.empty().append(htmlString);
		}

	});

})();
