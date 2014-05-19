/*global findashboard, Backbone, JST*/

findashboard.Views = findashboard.Views || {};

(function () {
	'use strict';

	findashboard.Views.PivotView = Backbone.View.extend({

		template: JST['app/scripts/templates/pivot.ejs'],

		tabName: 'pivot',
		rendered: false,
		presets: [
			{
				name: 'Incomes by mainCategory and subCategory per yearMonths (year 2013)',
				cols: ['yearMonth'],
				rows: ['mainCategory', 'subCategory'],
				vals: ['amount'],
				exclusions: {
					'year': [2011,2012,2014],
					'transfers': ['Cash','Iri KB','Tomas KB','ING'],
					'I/E': ['Expense'],
				},
			},
			{
				name: 'Expenses by mainCategory and subCategory per yearMonths (year 2013)',
				cols: ['yearMonth'],
				rows: ['mainCategory', 'subCategory'],
				vals: ['amount'],
				exclusions: {
					'year': [2011,2012,2014],
					'transfers': ['Cash','Iri KB','Tomas KB','ING'],
					'I/E': ['Income'],
				},
			},
		],
		defaultOptions: {
			renderers: _.extend($.pivotUtilities.renderers,$.pivotUtilities.highChartRenderers,{
				"pokus": function(pivotData, opts) {
					window.pivotData = pivotData;
					console.log(window.pivotData);
					console.log(opts);
					return $('<div class="pokusRenderer"></div>')
				}
			}),
			aggregators: _($.pivotUtilities.aggregators).pick('intSum','count','sumAsFractionOfTotal','sumAsFractionOfRow','sumAsFractionOfCol'),
			cols: ["mainCategory"],
			rows: ["yearMonth"],
			vals: ['amount'],
			hiddenAttributes: ['category', 'date', 'description'],
			derivedAttributes: {'I/E': function(record) { return record.amount >= 0 ? 'Income' : 'Expense'}},
		},
		
		initialize: function() {
			this.listenTo(fd.vent, 'navigation:tab_shown', this.show);
		},
		
		show: function(tabName) {
			if (tabName != '#'+this.tabName) return; // pass on tabs that are not mine
			if (!this.rendered) this.render();
		},
		
		render: function() {
			this.setPreset(0);
			this.rendered = true;
		},
		
		makePivot: function(pivotOptions) {
			console.log('Making pivot with these options:');
			console.log(pivotOptions);
			this.$el.pivotUI(
				fd.data.transactions,
				pivotOptions,
				true
			);
		},
		
		setPreset: function(presetId) {
			if (this.presets[presetId] === undefined) {
				console.error('Unknown pivot presetId '+presetId);
				return;
			}
			var options = _.extend(this.defaultOptions, this.presets[presetId]);
			this.makePivot(options);
		},
	});

})();
