var configuration = chrome.extension.getBackgroundPage().configuration;
var checker= chrome.extension.getBackgroundPage().checker;
// Alert's color
var alertColor = {
	1: 'alert-red',
	0: 'alert-green'
};



$(document).ready(function() {
	//alert('INITTTT !!!!');
	// Start the checker
	$("#start").button({ text: false, disabled: true, icons: { primary: "ui-icon-play" } });
	$("#start").click(function() { checker.start(); $("#start").button("disable"); $("#stop").button("enable"); });

	// Stop the checker
	$("#stop").button({ text: false, icons: { primary: "ui-icon-stop" } });
	$("#stop").click(function() { checker.stop(); $("#start").button("enable"); $("#stop").button("disable"); });

	// Force check of all servers
	$("#recheck").button({ text: false, icons: { primary: "ui-icon-refresh" } });
	$("#recheck").click(function() { checker.restart(true); });

	// Go to options page
	$("#options").button({ text: false, icons: { primary: "ui-icon-wrench" } });
	$("#options").click(function() { window.open('/html/options.html'); });

	// Activate start or stop button regarding the checker status
	if(checker.started == true) { $("#start").button("disable"); $("#stop").button("enable"); }
	else { $("#stop").button("disable"); $("#start").button("enable"); }



	// Search input
	$("#search").keyup(function(event) {
		if (event.keyCode == '13') event.preventDefault();
		fillGrid($('#search').val());
	});

	generateGrid();

});

// Fil the grid
function fillGrid(filter) {
	$('#serverGrid').jqGrid('clearGridData');
	var i = 1;
	for(server in configuration.results) {
		// Add all hosts alerts
		for(host in configuration.results[server].hosts) {
			if(typeof(filter) == 'undefined' || (configuration.results[server].hosts[host].subject.toLowerCase().indexOf(filter.toLowerCase()) >= 0 )) {
				var row = configuration.results[server].hosts[host];
				row.date = row.date.replace(/(\d+)\.(\d+)\.(\d+)/gi, '$3-$2-$1');
				$('#serverGrid').jqGrid('addRowData', host, {
					num: i,
					dateSort: row.date,
					ticket:  '<div class="'+alertColor[row.status]+'"><b><a class="link_open" href="'+row.ticketLink+'" server="'+row.serverName+'">'+row.ticket+ '</a></b></div>',
					date:    '<div class="'+alertColor[row.status]+'">'+row.date+'</div>',
					subject: '<div class="'+alertColor[row.status]+'">'+row.subject+'</div>',
					priority:'<div class="'+alertColor[row.status]+'">'+row.priority+'</div>',
					from:    '<div class="'+alertColor[row.status]+'">'+row.from+'</div>',
					i_from:     row.from,
					i_subject:	row.subject,
					lastCheck:  row.lastCheck,
					serverName: row.serverName

				});
				$('#serverGrid tr#' + host + ' td').addClass(alertColor[row.status]);
				i++;
			}
		};

	};
	$('#serverGrid').setGridParam({ sortname: 'dateSort' }).sortGrid('dateSort');
	$('#serverGrid').sortGrid('dateSort');


}

// Refresh popup every second
function generateGrid() {
	$("#serverGrid").jqGrid({
		datatype: "local",
		height: 250,
		width:435,
		rowNum: 2048,
	   	colNames:['Num','',  'Ticket', 'Date','Subject', 'Priority', 'From'    , 'Info','Info','Last Check','Server Name'],
	   	colModel:[
	   		{name: 'num', index: 'num', hidden: true, sorttype: 'int'},
	   		{name: 'dateSort', index: 'dateSort', hidden: true, sorttype:'date',},

	   		{name: 'ticket', index: 'ticket', hidden: false, sortable: false},
	   		{name: 'date', index: 'dateSort', sortable: true},
	   		{name: 'subject', index: 'subject',  sortable: false},
	   		{name: 'priority', index: 'priority',  sortable: false},
	   		{name: 'from', index: 'from',  sortable: false},

	   		{name: 'i_from', index: 'i_from', hidden: true},
	   		{name: 'i_subject', index: 'i_from', hidden: true},
	   		{name: 'lastCheck', index: 'lastCheck', hidden: true},
	   		{name: 'serverName', index: 'serverName', hidden: true}
	   	],
	   	multiselect: false,
	   	caption: false,
	   	onSelectRow: function(ids) {
	   		text = '';
			text+= '<b><u>From:</u></b>'+$("#serverGrid").jqGrid('getCell', ids, 7);
			text+= '<br />';
			text+= '<b><u>Subject:</u></b>'+$("#serverGrid").jqGrid('getCell', ids, 8);
	   		$('#serverDetails').html(text);
	   	},
	   	sortname: 'dateSort',
	   	grouping: true,
		groupingView: {
			groupField: ['serverName'],
	   		groupColumnShow: [false],
	        groupDataSorted: true,
	   		groupText: ['<b>{0} - {1} Item(s)</b>']
		},
		gridComplete: function(){
			$('.link_open').on('click', function(e){
				e.preventDefault();

				var configuration = chrome.extension.getBackgroundPage().configuration;
				var server = $(this).attr('server');
				var url = configuration.getServerUrl(server) + $(this).attr('href'); 

				chrome.tabs.create({ url: url });
			})
		}
	});

	fillGrid();
};
