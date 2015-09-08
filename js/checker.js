function checkerEngine(configuration) {
	this.loop = null;
	this.started = false;
	this.configuration = configuration;
	this.serial = 0;
	this.isRestart = false;
	this.sounds = Array( '', '/sound/critical.mp3', '/sound/hostdown.mp3', '/sound/warning.mp3' );
	this.notificationLevel = 0;
	this.notificationObjects = {};
	
	// Call only once !!!!
	this.init = function(){
		checker = this;
		chrome.notifications.onButtonClicked.addListener(function(notificationId, buttonIndex){
			if(buttonIndex == 0 && checker.notificationObjects[notificationId]){
				//chrome.windows.update({focused:true});
				chrome.tabs.create({ url: checker.notificationObjects[notificationId] });
				chrome.windows.getCurrent({}, function(window){
					chrome.windows.update(window.id, {drawAttention:true, focused:true }, function(){});
				})
			}
		});
	}
	
	// Start the engine
	this.start = function(silent) {
		if(!this.isRestart){
			chrome.browserAction.setBadgeText({text:''});
		}else{
			this.isRestart = false;
		}
		// If clone copy of config.servers is empty, re-fill it with enabled servers
		var i, serversList = [];
		for(i in this.configuration.servers) {
			if(this.configuration.servers[i].enabled == true) {
				if(this.configuration.servers[i].enabled == true){
					serversList.push(this.configuration.servers[i].name);
				}
			}
		};

		this.checkServers(serversList, silent);
		this.loop = setTimeout("chrome.extension.getBackgroundPage().checker.start();", this.configuration.options.commun.checkFrequency * 1000);
		this.started = true;
	};

	// Stop everything
	this.stop = function(silent) {
		clearTimeout(this.loop);
		this.started = false;
		if(!this.isRestart){
			chrome.browserAction.setBadgeText({text:'X'});
		}
	};

	// Stop...wait, no ! start !!
	this.restart = function(silent) {
		this.isRestart = true;
		this.stop(silent);
		this.start(silent);
	};
	
	this.playSound = function(sound, repeat) {
		var audio = new Audio(this.sounds[sound]);
		audio.play();
	};
	
	// Check all servers
	this.checkServers = function(list, silent) {
		// No servers ? Get out !
		if(list.length == 0) return;
		
		for(var serverIndex = 0; serverIndex<list.length; serverIndex++){
			var serverName = list[serverIndex];
			
			console.info('Server: '+serverName);
			
			var url = this.configuration.getServerUrl(serverName) + this.configuration.servers[serverName].servicesPath;
			var login_params = {
				'do':'scplogin',
				'__CSRFToken__':'',
				'userid': this.configuration.servers[serverName].username,
				'passwd': this.configuration.servers[serverName].password,
				// old osticket
				'username': this.configuration.servers[serverName].username,
				'passwd': this.configuration.servers[serverName].password,
			};
			// get new OSticket CSRF token
			$.ajax({
				url: url,
				type: "GET",
				async: false,
				serverName: serverName,
				checker: this,
				success: function(data, status, jqXHR) {
					console.info('LOGIN CHECK: '+this.serverName);
					login_params.__CSRFToken__ = $('input[name="__CSRFToken__"]', $(data)).val();
				}
			});
			
			$.ajax({
				url: url,
				type: "POST",
				data: login_params,
				serverName: serverName,
				checker: this,
				success: function(data, status, jqXHR) {
					var checker = this.checker;
					var serverName = this.serverName;
					checker.configuration.results[serverName] = { hosts: {} };
					var haveNewTickets = false;
					
					if(data.toString().match(/Authentication Required/i) || data.toString().match(/Access denied/i)){
						console.info('Error login ...');
						notID = this.checker.showNotification('Cannot login into server: '+serverName);
						return;
					}
					
					if($('table[class=dtable]', $(data)).length>0){
						var table = $('table[class=dtable]', $(data));
						
					}else if($('table[class=list]', $(data)).length>0){
						var table = $('table[class=list]', $(data));
						
					}else{
						console.info('Error load table ...');
						notID = this.checker.showNotification('Cannot load tickets data from server: '+this.serverName);
						return;
					}
					
					$('tr[class*=row], tbody>tr', table).filter(function(){
						return this.id.match(/\d+/);
					}).each(function(){
						var ticket = 0;
						var t_href = '';
						var status = 0;
						
						if($(this).find('a:first>b').length){
							ticket = $(this).find('a:first>b').html();
							t_href = $(this).find('a:first').attr('href');
							haveNewTickets = true;
							checker.notificationLevel = 1;
							status = 1;
						}else{
							ticket = $(this).find('a:first').html();
							t_href = $(this).find('a:first').attr('href');
						}
						
						var entry_id = serverName+'_'+ticket;
						
						checker.configuration.results[serverName].hosts[entry_id] = 
							checker.configuration.results[serverName].hosts[entry_id] ? 
							checker.configuration.results[serverName].hosts[entry_id] : {};
						var e = checker.configuration.results[serverName].hosts[entry_id];
						
						e.id			= entry_id;
						e.ticket 		= ticket;
						e.ticketLink	= t_href;
						e.status		= status;
						e.date			= $($(this).children()[3]).html();
						e.subject		= $($(this).children()[5]).find('a').html();
						e.priority		= $($(this).children()[7]).html();
						e.from			= $($(this).children()[6]).html();
						e.info			= '';
						e.serverName	= serverName;
					});
					
					if(haveNewTickets && !silent == true){
						if(checker.configuration.options.commun.sound == true){
							checker.playSound(checker.notificationLevel);
						}
						
						notificationItems = Array();
						lastLink = '';
						for(host in checker.configuration.results[serverName]) {
							for(a in checker.configuration.results[serverName][host]) {
								var alerte = checker.configuration.results[serverName][host][a];
								if(alerte.status == 1 && checker.notificationLevel < 1)	{
									checker.notificationLevel = 1;
								};
								if(alerte.status == 0){
									continue;
								}
								notificationItems.push({
									'title': '#'+alerte.ticket,
									'message': (alerte.subject?alerte.subject:'No Subject')
								});
								lastLink = checker.configuration.getServerUrl(serverName)+checker.configuration.servers[serverName].servicesPath;
							}
						}
						
						var notID = (Math.floor(Math.random() * 9007199254740992) + 1).toString();
						chrome.notifications.create(notID,{
							type: "list",
							title: "["+serverName+"] NEW Tickets",
							message: "New tickets!",
							iconUrl: "icons/48.png",
							priority: 2,
							isClickable: true,
							items: notificationItems,
							buttons: [
								{ title: 'View tickets', iconUrl: 'icons/kenguru.png'},
								{ title: 'Close', iconUrl: 'icons/kenguru.png'},

			                ]
						}, function(notification){
							if(checker.configuration.options.commun.popupDuration != 301){
								setTimeout(function() {
									chrome.notifications.clear(notification, function(){ });
								}, checker.configuration.options.commun.popupDuration * 1000);
							}
						} );
						
						checker.notificationObjects[notID] = lastLink;
						
						
					}
					if(chrome.extension.getViews({type:'popup'}) && chrome.extension.getViews({type:'popup'})[0]){
						chrome.extension.getViews({type:'popup'})[0].generateGrid()
					}
				}
			});
			
		}
		
	};
	
	this.showNotification = function(notificationBody){
		try {
			var notID = (Math.floor(Math.random() * 9007199254740992) + 1).toString();
			var checker = this;
			chrome.notifications.create(notID,{
				type: "basic",
				title: "osTicket Notification",
				message: notificationBody,
				iconUrl: "icons/48.png",
				priority: 2,
				isClickable: false,
			}, function(notification){
				if(checker.configuration.options.commun.popupDuration != 301){
					setTimeout(function() {
						chrome.notifications.clear(notification, function(){ });
					}, checker.configuration.options.commun.popupDuration * 1000);
				}
			} );
			return notID;
		} catch (e) {
			console.error('Notification Error: '+e.message);
		}
	}
}
