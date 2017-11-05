const GUEST_CM_TOKEN = Math.random().toString( 36 ).substr( 2 ),
	events = require( './events.js' ),
	logging = require( './logging.js' ).getLogger( 'guestlog' ),
	guest = require( './guest.js' );

guest.registerModule( 'logging', function () {
	var getLogger = function ( name ) {
		return new Proxy( { name: name }, {
			get: function ( name, key ) {
				name = name.name;
				switch ( key ) {
					case 'name':
						return name;
					case 'getLogger':
						return function ( component ) {
							let newname = '';
							if ( name.length && component.length ) {
								newname = `${this.name}.${component}`;
							} else if ( name.length || component.length ) {
								newname = `${this.name}${component}`;
							}
							return getLogger( newname );
						};
					default:
						return function ( ...args ) {
							console.log( GUEST_CM_TOKEN + JSON.stringify( { logger: name, func: key, args: args } ) );
						};
				}
			}
		} );
	};
	module.exports = getLogger( '' );
}, {
	GUEST_CM_TOKEN: JSON.stringify( GUEST_CM_TOKEN )
} );

events.onConsoleMessage( function ( msg ) {
	try {
		if ( msg.startsWith( GUEST_CM_TOKEN ) ) {
			msg = JSON.parse( msg.substr( GUEST_CM_TOKEN.length ) );
			logging.getLogger( msg.logger )[ msg.func ]( ...msg.args );
			this.continuing = false;
		}
	} catch ( e ) {
		logging.error( e );
	}
} );
