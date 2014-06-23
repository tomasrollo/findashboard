/*global findashboard */

(function () {
	'use strict';

	var dataLoader = {
		// fullURL: 'https://script.google.com/macros/s/AKfycbyWY2E74XSY_AIAQs9OolQaWHtoFbslCgUwgxx4PZBB8WoQzzU/exec?id=0AjYPHQBQOQ-sdHNFcmNWamMzTFR2Y1kxSUpLWDFNbGc&sheet=Transactions',
		baseURL: 'https://script.google.com/macros/s/AKfycbyWY2E74XSY_AIAQs9OolQaWHtoFbslCgUwgxx4PZBB8WoQzzU/exec',
		key: '0AjYPHQBQOQ-sdHNFcmNWamMzTFR2Y1kxSUpLWDFNbGc',
		sheet: 'Transactions',
		loadData: function(success, fail) {
			var url = this.baseURL+'?id='+this.key+'&sheet='+this.sheet;
			console.log('Loading data from url='+url);
			$.ajax({url: url, dataType: 'json'}).done(success).fail(fail).always(function() { console.log('Finished requests to load data from url='+url); });
		},
	};
	
	var mockDataLoader = {
		url: '/scripts/rawData2.js',
		loadData: function(success, fail) {
			var url = this.url;
			console.log('Loading mock data from url='+url);
			$.ajax({url: url, dataType: 'json'}).done(success).fail(fail).always(function() { console.log('Finished requests to load data from url='+url); });
		},
	};
	
	fd.data = {
		transactions: [],
		dataLoader: null,
		dataAvailable: false,
		initialize: function() {
			this.on('all', fd.vent.setupTrigger('data'));
		},
		setDataLoader: function(dataLoader) {
			this.dataLoader = dataLoader;
		},
		loadData: function() {
			if (!this.dataLoader) throw new Error('Cannot load data, dataLoader is not set!');
			this.trigger('load_start');
			this.dataLoader.loadData(this.parseData, this.loadFailure);
		},
		_parseData: function(data) {
			function getQuarter(month) {
				if (month < 0 || month > 12) throw new Error('Month must be within 1..12 range, given: '+month);
				if (month <= 3) return 'Q1';
				if (month <= 6) return 'Q2';
				if (month <= 9) return 'Q3';
				return 'Q4';
			}
			function splitCategory(cat, pos) {
				var chunks = cat.split(' > ');
				if (pos == 1) return chunks.length < 2 ? '' : chunks[1];
				else return chunks[0];
			}
			function formatDate(year, month, day) {
				// cast everything to string just in case the parameters are passed as numbers
				year = year.toString();
				month = month.toString();
				day = day.toString();
				return year + '/' + (month.length == 1 ? '0' : '') + month + '/' + (day.length == 1 ? '0' : '') + day;
			}
			console.log('parsing received transactions');
			// console.log(data);
			var transactions = _(data.Transactions).map(function(transaction) {
				var td = new Date(transaction.date);
				var year = td.getFullYear();
				var month = td.getMonth()+1;
				return {
					account: transaction.account,
					amount: parseFloat(transaction.amount),
					category: transaction.category,
					mainCategory: splitCategory(transaction.category, 0),
					subCategory: splitCategory(transaction.category, 1),
					date: td.getTime(),
					yearMonth: year + '-' + (month.toString().length == 1 ? '0' : '') + month,
					month: month,
					quarter: getQuarter(month),
					year: year,
					description: transaction.description,
					payee: transaction.payee,
					transfers: transaction.transfers,
					type: transaction.type,
				};
			});
			this.transactions = transactions;

			var monthsOfYear = [
				{'month': '01'},
				{'month': '02'},
				{'month': '03'},
				{'month': '04'},
				{'month': '05'},
				{'month': '06'},
				{'month': '07'},
				{'month': '08'},
				{'month': '09'},
				{'month': '10'},
				{'month': '11'},
				{'month': '12'},
			];
			
			// prepare LOV's
			// list of accounts
			this.accounts = SQLike.q({selectdistinct: ['account'], from: transactions, orderby: ['account']});
			// list of main categories
			this.mainCategories = SQLike.q({selectdistinct: ['mainCategory'], from: transactions, orderby: ['mainCategory']});
			// list of available years
			this.years = SQLike.q({selectdistinct: ['year'], from: transactions, orderby: ['year']});
			// list of available year quarters
			this.qs = SQLike.q({selectdistinct: ['yearQ'], from: transactions, orderby: ['yearQ']});
			// list of available yearMonths
			this.months = SQLike.q({ // get all combinations of years and months
				select: [function() { return this.t2_year.toString()+'-'+this.t1_month; },'|as|','yearMonth'],
				from: {t1:monthsOfYear},
				join: {t2:this.years},
				on: function() {return true;}
			});
			var months = this.months;
			this.months = _(this.months).pluck('yearMonth');
			// list of all dates (days) between the minimum and maximum available dates
			this.dates = [];
			var ds = _(transactions).pluck('date');
			var minDate = new Date(_(ds).min());
			var maxDate = new Date(_(ds).max());
			var d = minDate;
			while (d <= maxDate) {
				this.dates.push({'date': d.getTime()});
				d.setDate(d.getDate() + 1);
			}
			// the current yearMonth
			d = new Date();
			this.currentMonth = d.getFullYear().toString() + '-' + ((d.getMonth()+1).toString().length == 1 ? '0' : '') + (d.getMonth()+1);
			
			this.dataAvailable = true;
			this.trigger('load_end');
		},
		_loadFailure: function(jqXHR, textStatus, errorThrown) {
			fd.jqXHR = jqXHR;
			console.log('Loading data failed with status '+textStatus);
			console.log(errorThrown);
			this.trigger('load_failure');
		},
	};
	fd.data.parseData = fd.data._parseData.bind(fd.data);
	fd.data.loadFailure = fd.data._loadFailure.bind(fd.data);
	
	_.extend(fd.data, Backbone.Events);

	// use mock data for local development
	fd.data.setDataLoader(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? mockDataLoader : dataLoader);
	// fd.data.setDataLoader(dataLoader);
	
	fd.util = {
		pack: function(colName, ar) { return _(ar).map(function(el) { var o = {}; o[colName] = el; return o; }); },
	};
})();
