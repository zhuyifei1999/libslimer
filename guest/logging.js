const events = require( '../events.js' ),
	guest = require( '../guest.js' ),
	logging = require( '../logging.js' ).getLogger( 'guest.logging' );

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
							return require( 'callPhantom.js' )( [ 'logging', { logger: name, func: key, args: args } ] );
						};
				}
			}
		} );
	};
	module.exports = getLogger( '' );
}, undefined, false );

events.onCallback( function ( val ) {
	var type, msg;
	try {
		[ type, msg ] = val;
	} catch ( e ) {
		return;
	}
	if ( type === 'logging' ) {
		this.continuing = false;
		return logging.getLogger( msg.logger )[ msg.func ]( ...msg.args );
	}
} );
