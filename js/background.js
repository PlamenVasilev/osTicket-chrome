$(document).ready(function() {    
	// Chargement et gestion de la configuration
	configuration = new ncConfig();
	configuration.load();

	// Server's chercker object
	checker = new checkerEngine(configuration);
	checker.start();
});
