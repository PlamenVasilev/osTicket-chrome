/*
	Fonctions de gestion de la configuration
 */

function ncConfig() {
	this.options = {};
	this.servers = {};
	this.results = {};

	// Chargement de la configuration
	this.load = function() {
		//this.migrate();
		if(typeof(localStorage['ncConfig']) != 'undefined') {
			this.options = JSON.parse(localStorage['ncConfig']);
		} else {
			this.loadDefaults();
			this.save();
		}
		if(typeof(localStorage['ncServers']) != 'undefined') {
			this.servers = JSON.parse(localStorage['ncServers']);
		}
		return this.options;
	};

	// Sauvegarde de la configuration
	this.save = function() {
		localStorage['ncConfig'] = JSON.stringify(this.options);
		localStorage['ncServers'] = JSON.stringify(this.servers);
	};
	
	// Default options loading
	this.loadDefaults = function() {
		this.options = {
			commun : {
				checkFrequency : 60,
				sound : true,
				popup : true,
				popupDuration : 60,
/*
				displayProblemsAcknowledged : false,
				displayProblemsNotification : false,
				displayProblemsDowntimed : false,
				displayProblemsOthers : true,
				gridMode : 'Highlighted',
				iconFrequency : 2,
				newStateDuration : 600,
				
				
*/
			}
		};
	};


	// Add new server
	this.addServer = function(serverName) {
		if(typeof(this.servers[serverName]) == 'undefined'){
			this.servers[serverName] = {
				name: serverName,
				protocol: 'http',
				username: 'username',
				password: 'password',
				url: 'url_to_some_domain.com',
				servicesPath: '/scp/tickets.php',
				root: '/scp/',
				enabled: false
			};
		}
		return this.servers[serverName];
	};
	
	// Delete a server by name
	this.delServer = function(name) {
		if(typeof(this.servers[name]) != 'undefined') {
			delete this.servers[name];
		}
	};
	
	
	this.getServerUrl = function(serverName) {
		var url = this.servers[serverName].protocol;
		url+= '://';
		/*
if(this.servers[serverName].username != '') {
			url+= this.servers[serverName].username;
			if(this.servers[serverName].password != '') url+= ':' + this.servers[serverName].password;
			url+= '@';
		}
*/
		url+= this.servers[serverName].url;
		return url;
	};	

};
