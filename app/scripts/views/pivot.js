/*global findashboard, Backbone, JST*/

findashboard.Views = findashboard.Views || {};

(function () {
	'use strict';

	findashboard.Views.PivotView = Backbone.View.extend({

		template: JST['app/scripts/templates/pivot.ejs'],

		tabName: 'pivot',
		rendered: false,
		presets: null,
		defaultOptions: {
			renderers: _.extend($.pivotUtilities.renderers,$.pivotUtilities.highChartRenderers,{
				"pokus": function(pivotData, opts) {
					window.pivotData = pivotData;
					console.log(window.pivotData);
					console.log(opts);
					return $('<div class="pokusRenderer"></div>');
				}
			}),
			aggregators: _($.pivotUtilities.aggregators).pick('intSum','count','sumAsFractionOfTotal','sumAsFractionOfRow','sumAsFractionOfCol'),
			cols: [],
			rows: [],
			vals: ['amount'],
			hiddenAttributes: ['date', 'description'],
			derivedAttributes: {'I/E': function(record) { return record.amount >= 0 ? 'Income' : 'Expense'}},
		},
		
		events: {
			"click .btnPresetLoad": "loadPreset",
			"click .btnPresetSave": "savePreset",
			"click .btnPresetDelete": "deletePreset",
		},
		
		initialize: function() {
			this.listenTo(fd.vent, 'navigation:tab_shown', this.show);
			this.listenTo(fd.vent, 'presets:sync', this.refreshPresetList);
		},
		
		show: function(tabName) {
			if (tabName != '#'+this.tabName) return; // pass on tabs that are not mine
			if (!this.rendered) {
				this.$el.html(this.template());
				this.presets = new findashboard.Collections.PresetsCollection();
				this.presets.fetch();
				this.makePivot(this.defaultOptions);
				this.rendered = true;
			}
		},
		
		makePivot: function(pivotOptions) {
			console.log('Making pivot with these options:');
			console.log(pivotOptions);
			this.$el.find('.pivotArea').pivotUI(
				fd.data.transactions,
				pivotOptions,
				true
			);
		},
		
		detectPresetSettings: function() {
			function processAxisFactory(settings, containerName) {
				return function(index, axisEl) {
					if (containerName) settings[containerName].push(getAxisName($(axisEl)));
				};
			}
			function getAxisName($el) {
				return $el.find('span:first').clone().children().remove().end().text();
			}
			function processExclusionsFactory(settings) {
				var rg = /(.*) \(.*\)/;
				return function(index, filterEl) {
					filterEl = $(filterEl);
					var name = filterEl.find('h4:first').text();
					// console.log(name);
					name = rg.exec(name)[1];
					// console.log(name);
					filterEl.find('.pvtCheckContainer label').each(function(index, el2) {
						var checked = $(el2).find('input[type=checkbox]').attr('checked') === 'checked';
						if (!checked) {
							if (!settings.exclusions[name]) settings.exclusions[name] = [];
							var itemName = rg.exec($(el2).find('span').text())[1];
							// console.log(itemName);
							settings.exclusions[name].push(itemName);
						}
					});
				};
			}
			var settings = {
				cols: [],
				rows: [],
				vals: [],
				exclusions: {},
			};
			this.$el.find('.pvtRows li').each(processAxisFactory(settings, 'rows'));
			this.$el.find('.pvtCols li').each(processAxisFactory(settings, 'cols'));
			this.$el.find('.pvtVals li').each(processAxisFactory(settings, 'vals'));
			this.$el.find('.pvtFilterBox').each(processExclusionsFactory(settings));
			return settings;
		},
		
		loadPreset: function() {
			var presetId = $('.presetListSelect').val();
			console.log('Loading presetId '+presetId);
			var options = _.extend(this.defaultOptions, this.presets.get(presetId).getOptions());
			this.makePivot(options);
		},
		
		savePreset: function() {
			var name = prompt('Name the preset:');
			if (!name) {
				alert('Empty name given, preset not saved.');
				return;
			}
			var existingPreset = this.presets.findWhere({name: name});
			if (existingPreset) { // just update the existing preset
				console.log('Overwriting existing preset');
				existingPreset.update(name, this.detectPresetSettings());
			} else { // add new preset
				console.log('Saving new preset');
				var newPreset = new findashboard.Models.PresetsModel({});
				newPreset.update(name, this.detectPresetSettings());
				this.presets.add(newPreset);
				newPreset.save();
			}
		},
		
		deletePreset: function() {
			var presetId = $('.presetListSelect').val();
			console.log('Deleting presetId '+presetId);
			this.presets.get(presetId).destroy();
		},
		
		refreshPresetList: function() {
			$('.presetListSelect').empty();
			this.presets.each(function(preset) {
				$('.presetListSelect').append('<option value="'+preset.id+'">'+preset.get('name')+'</option>');
			});
		}
	});

})();
