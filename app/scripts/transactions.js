/*global findashboard */

(function () {
	'use strict';

	var dataLoader = {
		baseURL: 'https://script.google.com/macros/s/AKfycbyWY2E74XSY_AIAQs9OolQaWHtoFbslCgUwgxx4PZBB8WoQzzU/exec?id=0AjYPHQBQOQ-sdHNFcmNWamMzTFR2Y1kxSUpLWDFNbGc&sheet=Transactions',
		key: '0AjYPHQBQOQ-sdHNFcmNWamMzTFR2Y1kxSUpLWDFNbGc',
		sheet: 'Transactions',
		loadData: function(success, fail) {
			var url = this.baseURL+'?id='+this.key+'&sheet='+this.sheet;
			console.log('Loading data from url='+url);
			$.ajax({url: this.url, dataType: 'json'}).done(success).fail(fail).always(function() { console.log('Finished requests to load data from url='+url); });
		},
	};
	
	var mockDataLoader = {
		url: '/scripts/rawData2.js',
		loadData: function(success, fail) {
			var url = this.url;
			console.log('Loading data from url='+url);
			$.ajax({url: this.url, dataType: 'json'}).done(success).fail(fail).always(function() { console.log('Finished requests to load data from url='+url); });
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
			
			// prepare data for charts showing data per account
			
			// get all combinations of monthYears and accounts
			var basisMyA = SQLike.q({
				select: [function() { return this.t1_yearMonth; },'|as|','yearMonth', function() { return this.t2_account; },'|as|','account'],
				from: {t1:months},
				join: {t2:this.accounts},
				on: function() {return true;}
			});

			// first sum expenses per yearMonth and account
			var expensesPerYmA = SQLike.q({
				select: ['yearMonth','account','|sum|','amount'],
				from: this.transactions,
				where: function() { return this.amount < 0 && this.transfers === ""; },
				groupby: ['yearMonth','account'],
				orderby: ['yearMonth','account'],
			});
			// then join them with the basis to get numbers (0) even for yearMonth&account combinations where there are no expenses
			this.expensesPerYmA = SQLike.q({
				select: [
					function() { return this.t1_yearMonth; },'|as|','yearMonth',
					function() { return this.t1_account; },'|as|','account',
					function() { return this.t2_sum_amount === undefined ? 0 : Math.abs(this.t2_sum_amount)},'|as|','sum_amount'
				],
				from: {t1: basisMyA},
				leftjoin: {t2: expensesPerYmA},
				on: function() { return this.t1.yearMonth == this.t2.yearMonth && this.t1.account == this.t2.account; },
				orderby: ['yearMonth','account'],
			});

			// first sum incomes per yearMonth and account
			var incomesPerYmA = SQLike.q({
				select: ['yearMonth','account','|sum|','amount'],
				from: this.transactions,
				where: function() { return this.amount > 0 && this.transfers === ""; },
				groupby: ['yearMonth','account'],
				orderby: ['yearMonth','account'],
			});
			// then join them with the basis to get numbers (0) even for yearMonth&account combinations where there are no incomes
			this.incomesPerYmA = SQLike.q({
				select: [
					function() { return this.t1_yearMonth; },'|as|','yearMonth',
					function() { return this.t1_account; },'|as|','account',
					function() { return this.t2_sum_amount === undefined ? 0 : Math.abs(this.t2_sum_amount)},'|as|','sum_amount'
				],
				from: {t1: basisMyA},
				leftjoin: {t2: incomesPerYmA},
				on: function() { return this.t1.yearMonth == this.t2.yearMonth && this.t1.account == this.t2.account; },
				orderby: ['yearMonth','account'],
			});
			
			// prepare data for charts showing data per category
			
			// helper function to filter out all main categories which do not have any non-zero value in the dataset
			function filterCategories(dataset) {
				return _(fd.data.mainCategories).filter(function(cat) {
					return _(dataset).chain().where({mainCategory: cat.mainCategory}).pluck('sum_amount').reduce(function(m,n){ return m+n;},0).value() !== 0;
				});
			}
			
			function sumAmountPerCategory(dataset) {
				return _(fd.data.mainCategories).chain().map(function(cat) {
					return {
						mainCategory: cat.mainCategory,
						totalAmount: _(dataset).chain().where({mainCategory: cat.mainCategory}).pluck('sum_amount').reduce(function(m,n){ return m+n;},0).value(),
					};
				})
				.filter(function(el) { return el.totalAmount > 1000; })
				.sortBy(function(el) { return 1*el.totalAmount; })
				.value();
			}
			
			// get all combinations of monthYears and mainCategories
			var basisMyC = SQLike.q({
				select: [function() { return this.t1_yearMonth; },'|as|','yearMonth', function() { return this.t2_mainCategory; },'|as|','mainCategory'],
				from: {t1: fd.util.pack('yearMonth',fd.data.months)},
				join: {t2: this.mainCategories},
				on: function() {return true;}
			});
			// console.table(basisMyC);

			// first sum expenses per yearMonth and mainCategory
			var expensesPerYmC = SQLike.q({
				select: ['yearMonth','mainCategory','|sum|','amount'],
				from: this.transactions,
				where: function() { return this.amount < 0 && this.transfers === ""; },
				groupby: ['yearMonth','mainCategory'],
				orderby: ['yearMonth','mainCategory'],
			});
			// then join them with the basis to get numbers (0) even for yearMonth&mainCategory combinations where there are no expenses
			expensesPerYmC = SQLike.q({
				select: [
					function() { return this.t1_yearMonth; },'|as|','yearMonth',
					function() { return this.t1_mainCategory; },'|as|','mainCategory',
					function() { return this.t2_sum_amount === undefined ? 0 : Math.abs(this.t2_sum_amount)},'|as|','sum_amount'
				],
				from: {t1: basisMyC},
				leftjoin: {t2: expensesPerYmC},
				on: function() { return this.t1.yearMonth == this.t2.yearMonth && this.t1.mainCategory == this.t2.mainCategory; },
				orderby: ['yearMonth','mainCategory'],
			});
			// now filter out all mainCategories that have no or minimal expense
			this.MCtotalEx = sumAmountPerCategory(expensesPerYmC);
			// console.table(mCsummed);
			// and get rid of the non-relevant data in the expenses table
			this.expensesPerYmC = SQLike.q({
				select: [
					function() { return this.t2_yearMonth; },'|as|','yearMonth',
					function() { return this.t2_mainCategory; },'|as|','mainCategory',
					function() { return this.t2_sum_amount; },'|as|','sum_amount',
				],
				from: {t1: this.MCtotalEx},
				join: {t2: expensesPerYmC},
				on: function() { return this.t1.mainCategory == this.t2.mainCategory; },
			});
			// console.table(this.expensesPerYmC);

			// first sum incomes per yearMonth and mainCategory
			var incomesPerYmC = SQLike.q({
				select: ['yearMonth','mainCategory','|sum|','amount'],
				from: this.transactions,
				where: function() { return this.amount > 0 && this.transfers === ""; },
				groupby: ['yearMonth','mainCategory'],
				orderby: ['yearMonth','mainCategory'],
			});
			// then join them with the basis to get numbers (0) even for yearMonth&mainCategory combinations where there are no incomes
			incomesPerYmC = SQLike.q({
				select: [
					function() { return this.t1_yearMonth; },'|as|','yearMonth',
					function() { return this.t1_mainCategory; },'|as|','mainCategory',
					function() { return this.t2_sum_amount === undefined ? 0 : Math.abs(this.t2_sum_amount)},'|as|','sum_amount'
				],
				from: {t1: basisMyC},
				leftjoin: {t2: incomesPerYmC},
				on: function() { return this.t1.yearMonth == this.t2.yearMonth && this.t1.mainCategory == this.t2.mainCategory; },
				orderby: ['yearMonth','mainCategory'],
			});
			// now filter out all mainCategories that have no income
			this.MCtotalIn = sumAmountPerCategory(incomesPerYmC);
			// console.table(mCsummed);
			// and get rid of the non-relevant data in the incomes table
			this.incomesPerYmC = SQLike.q({
				select: [
					function() { return this.t2_yearMonth; },'|as|','yearMonth',
					function() { return this.t2_mainCategory; },'|as|','mainCategory',
					function() { return this.t2_sum_amount; },'|as|','sum_amount',
				],
				from: {t1: this.MCtotalIn},
				leftjoin: {t2: incomesPerYmC},
				on: function() { return this.t1.mainCategory == this.t2.mainCategory; },
			});

			this.dataAvailable = true;
			this.trigger('load_end');
		},
		_loadFailure: function(error) {
			console.log(error);
			this.trigger('load_failure');
		},
	};
	fd.data.parseData = fd.data._parseData.bind(fd.data);
	fd.data.loadFailure = fd.data._loadFailure.bind(fd.data);
	
	_.extend(fd.data, Backbone.Events);

	// use mock data for local development
	if (window.location.hostname === 'localhost') fd.data.setDataLoader(mockDataLoader);
	else fd.data.setDataLoader(dataLoader);
	
	fd.util = {
		pack: function(colName, ar) { return _(ar).map(function(el) { var o = {}; o[colName] = el; return o; }); },
		CZKFormatter: Intl.NumberFormat('cs-cz'),
	};
})();
