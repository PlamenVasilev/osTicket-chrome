$(document).ready(function() {
	// Load current configuration
	var configuration = chrome.extension.getBackgroundPage().configuration;
	var checker = chrome.extension.getBackgroundPage().checker;
	
	$('#Save').button({ icons: { primary: 'ui-icon-disk'} });
	
	$('#Save').on('click', function(){
		configuration.save();
		checker.restart(true);
	});
	
	// Apply current configuration
	$('#checkFrequency' + configuration.options.commun.checkFrequency).click();
	if(configuration.options.commun.sound) { $('#soundOn').click(); } else { $('#soundOff').click(); };
	if(configuration.options.commun.popup) { $('#popupOn').click(); } else { $('#popupOff').click(); };
	$('#popupDurationVal').html(configuration.options.commun.popupDuration == 301 ? '&#8734;' : configuration.options.commun.popupDuration + 's');
	
	
	// General
	$('#checkFrequency').buttonset();
	$('#checkFrequency30').click(function() { configuration.options.commun.checkFrequency = 30; configuration.save(); });
	$('#checkFrequency60').click(function() { configuration.options.commun.checkFrequency = 60; configuration.save(); });
	$('#checkFrequency120').click(function() { configuration.options.commun.checkFrequency = 120; configuration.save(); });
	$('#checkFrequency300').click(function() { configuration.options.commun.checkFrequency = 300; configuration.save(); });
	$('#checkFrequency600').click(function() { configuration.options.commun.checkFrequency = 600; configuration.save(); });
	
	// Notifications
	$('#soundOn').click(function() { configuration.options.commun.sound = true; configuration.save(); });
	$('#soundOff').click(function() { configuration.options.commun.sound = false; configuration.save(); });
	$('#popupOn').click(function() { configuration.options.commun.popup = true; configuration.save(); });
	$('#popupOff').click(function() { configuration.options.commun.popup = false; configuration.save(); });
	$('#sound').buttonset();
	$('#popup').buttonset();
	$('#popupDuration').slider({
		range: 'min',
		value: 15,
		min: 5,
		max: 301,
		value: configuration.options.commun.popupDuration,
		slide: function( event, ui ) {
			$('#popupDurationVal').html(ui.value == 301 ? '&#8734;' : ui.value + 's');
			configuration.options.commun.popupDuration = ui.value;
			configuration.save();
		}
	});
	
	//Server List 
	$('#serverAdd').button({ icons: { primary: "ui-icon-plusthick" }, text: false });
	$('#serverDel').button({ icons: { primary: "ui-icon-minusthick" }, text: false });
	$('#serverList').buttonset();
	$('#serverAdd').click(function() { $('#addserver-form').dialog('open'); });
	$('#serverDel').click(function() {
		$('#delserver-confirm').dialog('option', 'server', 'toto');
		$('#delserver-confirm').dialog('option', 'title', 'Delete server ' + $('#serverDetails').attr('nameSelected'));
		$('#delserver-confirm').dialog('open');
	});
	// Add server dialog
	var addServerName = $('#addServerName'), allFields = $( [] ).add( addServerName ), tips = $('.validateTips');
	$('#addserver-form').dialog({
		autoOpen: false,
		height: 200,
		width: 250,
		modal: true,
		buttons: {
			"Add new server": function() {
				var bValid = true;
				allFields.removeClass( "ui-state-error" );
				bValid = bValid && checkRegexp( addServerName, /^[a-z]([0-9a-z_])+$/i, "Server name may consist of a-z, 0-9, underscores, begin with a letter." );
				if(bValid) {
					configuration.addServer(addServerName.val());
					refreshServersList(addServerName.val());
					$(this).dialog("close");
				}
			},
			Cancel: function() {
				$(this).dialog("close");
			}
		},
		close: function() {
			allFields.val("").removeClass( "ui-state-error" );
		}
	});
	// Delete server dialog
	$( "#delserver-confirm" ).dialog({
		autoOpen: false,
		resizable: false,
		height:140,
		modal: true,
		buttons: {
			"Delete": function() {
				delete configuration.servers[$('#serverDetails').attr('nameSelected')];
				refreshServersList();
				$(this).dialog("close");
			},
			Cancel: function() {
				$(this).dialog("close");
			}
		}
	});
	
	
	
	
	// Tab creation
	$('#tabs').tabs();
	
	function updateTips( t ) {
		tips
			.text( t )
			.addClass( "ui-state-highlight" );
		setTimeout(function() {
			tips.removeClass( "ui-state-highlight", 1500 );
		}, 500 );
	}
	
	// Form validation
	function checkRegexp( o, regexp, n ) {
		if(!( regexp.test( o.val() ) ) ) {
			o.addClass( "ui-state-error" );
			updateTips( n );
			return false;
		} else {
			return true;
		}
	}
	
	
	// Refresh servers list
	function refreshServersList(nameSelected) {
		$('#serverList').empty();
		$('#serverDetails').empty();
		for(var name in configuration.servers) {
			$('#serverList').append('<input type="radio" name="serverList" id="server' + name + '" value="' + name +'" />');
			$('#server' + name).after('<label for="server' + name +'">' + name +'</label>');
			$('#server' + name).click(function() { displayServerDetails(this.value); });
			if(typeof(nameSelected) == 'undefined' || name == nameSelected) { nameSelected = name; }
		}
		if(typeof(nameSelected) != 'undefined') {
			$('#server' + nameSelected).attr('checked', 'checked');
			displayServerDetails(nameSelected);
		}
		configuration.save();
		$('#serverList').buttonset("refresh");
	}
	
	// Display server's details
	function displayServerDetails(nameSelected) {
		$('#serverDetails').empty();
		
		$('#serverDetails').attr('nameSelected', nameSelected);
		
		var details = '<table width="100%">';
		details+= '<tr><td>URL : </td><td>';
		details+= '<select name="protocol" id="serverDetailsProtocol" class="ui-widget-content ui-corner-all"><option value="http">http</option><option value="https">https</option></select>';
		details+= '://';
		details+= '<input type="text" name="url" id="serverDetailsUrl" size="40" class="text ui-widget-content ui-corner-all" />';
		details+= '</td></tr>';
		
		details+= '<tr><td>Account :</td><td>';
		details+= '<input type="text" name="username" id="serverDetailsUsername" size="12" class="text ui-widget-content ui-corner-all" />';
		details+= ':';
		details+= '<input type="password" name="password" id="serverDetailsPassword" size="12" class="text ui-widget-content ui-corner-all" />';
		details+= '</td></tr>';
		
		details+= '<tr><td>Service path :</td><td>';
		details+= '<input type="text" name="root" id="serverDetailsRoot" size="20" class="text ui-widget-content ui-corner-all" />';
		details+= '</td></tr>';
		
		details+= '<tr><td>Service detail path :</td><td>';
		details+= '<input type="text" name="servicesPath" id="serverDetailsServicesPath" size="40" class="text ui-widget-content ui-corner-all" />';
		details+= '</td></tr>';
		
		details+= '<tr><td>Enabled ?</td><td>';
		details+= '<div id="serverDetailsEnabled">';
		details+= '<input type="radio" name="enabled" id="serverDetailsEnabledYes" value="true" /><label for="serverDetailsEnabledYes">Yes</label>';
		details+= '<input type="radio" name="enabled" id="serverDetailsEnabledNo" value="false" /><label for="serverDetailsEnabledNo">No</label>';
		details+= '</div>';
		details+= '</td></tr>';
		details+= '</table>';
		
		$('#serverDetails').append(details);

		// Load configuration
		$('#serverDetailsProtocol').val(configuration.servers[nameSelected].protocol);
		$('#serverDetailsUsername').val(configuration.servers[nameSelected].username);
		$('#serverDetailsPassword').val(configuration.servers[nameSelected].password);
		$('#serverDetailsUrl').val(configuration.servers[nameSelected].url);
		$('#serverDetailsRoot').val(configuration.servers[nameSelected].root);
		$('#serverDetailsServicesPath').val(configuration.servers[nameSelected].servicesPath);
		if(configuration.servers[nameSelected].enabled == true) { $('#serverDetailsEnabledYes').attr('checked', 'checked'); } else { $('#serverDetailsEnabledNo').attr('checked', 'checked'); };
		$('#serverDetailsEnabled').buttonset();
		
		// Configuration change handling
		$('#serverDetailsProtocol').change(function() { configuration.servers[nameSelected].protocol = $('#serverDetailsProtocol').val(); configuration.save(); });
		$('#serverDetailsUsername').keyup(function() { configuration.servers[nameSelected].username = $('#serverDetailsUsername').val(); configuration.save(); });
		$('#serverDetailsPassword').keyup(function() { configuration.servers[nameSelected].password = $('#serverDetailsPassword').val(); configuration.save(); });
		$('#serverDetailsRoot').keyup(function() { configuration.servers[nameSelected].root = $('#serverDetailsRoot').val(); configuration.save(); });
		$('#serverDetailsUrl').keyup(function() { configuration.servers[nameSelected].url = $('#serverDetailsUrl').val(); configuration.save(); });
		$('#serverDetailsServicesPath').keyup(function() { configuration.servers[nameSelected].servicesPath = $('#serverDetailsServicesPath').val(); configuration.save(); });
		$('#serverDetailsEnabledYes').click(function() { configuration.servers[nameSelected].enabled = true; configuration.save(); });
		$('#serverDetailsEnabledNo').click(function() { configuration.servers[nameSelected].enabled = false; configuration.save(); delete configuration.results[nameSelected]; });
	};
	
	// Display servers list
	refreshServersList();
});