/* eslint no-underscore-dangle: [ 'error', { 'allowAfterThis': true } ] */
const sys = require( 'system' ),
	loglevels = new Map(),
	loggerRegistry = new Map();

loglevels.set( 'DEBUG', 2 );
loglevels.set( 'INFO', 1 );
loglevels.set( 'WARN', 0 );
loglevels.set( 'ERROR', -1 );
loglevels.set( 'CRIT', -2 );

class Logger {
	constructor( name, verbosity ) {
		if ( loggerRegistry.has( name ) ) {
			throw new Error( `Duplicate logger '${name}'` );
		} else {
			loggerRegistry.set( name, this );
		}

		this.name = name;
		this.verbosity = verbosity;

		for ( let [ levelname, levelint ] of loglevels ) {
			this[ levelname ] = levelint;
		}
	}
	get parent() {
		var parent = ( function () {
			if ( this.name.length ) {
				let index = this.name.indexOf( '.' );
				if ( index < 0 ) {
					return module.exports;
				}
				return module.exports.getLogger( this.name.substr( 0, index ) );
			} else {
				return null;
			}
		}.call( this ) );
		delete this.parent;
		Object.defineProperty( this, 'parent', { get: function () { return parent; } } );
		return parent;
	}
	get verbosity() {
		if ( this._verbosity !== undefined ) {
			return this._verbosity;
		} else {
			return this.parent.verbosity;
		}
	}
	set verbosity( val ) {
		if ( val === undefined || val === null ) {
			if ( !this.name.length ) {
				throw new Error( 'Root logger cannot have undefined verbosity' );
			}
			this._verbosity = undefined;
		} else {
			this._verbosity = val;
		}
	}
	logmsg( message, loglevel = 0, component ) {
		if ( component && component.length ) {
			return this.getLogger( component ).logmsg( message, loglevel );
		}
		if ( loglevel <= this.verbosity ) {
			let color, type, prefix;
			switch ( loglevel ) {
				case this.DEBUG:
					type = 'DEBUG';
					color = '\x1b[34m';
					break;
				case this.INFO:
					type = 'INFO';
					color = '\x1b[36m';
					break;
				case this.WARN:
					type = 'WARN';
					color = '\x1b[33m';
					break;
				case this.ERROR:
					type = 'ERROR';
					color = '\x1b[31m';
					break;
				case this.CRIT:
					type = 'CRIT';
					color = '\x1b[35m';
					break;
			}
			prefix = `\x1b[1m${new Date().toISOString()} ${color}[${type}] `;

			if ( this.name.length ) {
				prefix += `[${this.name}] `;
			}

			if ( typeof message === 'function' ) {
				message = message();
			}
			message = `${message}`; // undefined.toString() errors :(

			for ( let line of message.replace( /[\r\n]+$/, '' ).split( /\r?\n/ ) ) {
				// Firefox non-debug mode closes stderr and redirects to /dev/null
				sys.stdout.write( `${prefix}${line}\x1b[0m\n` );
			}
		}
	}
	stdout( message ) {
		sys.stdout.write( message + '\n' );
	}

	debug( message, component ) { this.logmsg( message, this.DEBUG, component ); }
	info( message, component ) { this.logmsg( message, this.INFO, component ); }
	warn( message, component ) { this.logmsg( message, this.WARN, component ); }
	error( message, component ) { this.logmsg( message, this.ERROR, component ); }
	crit( message, component ) { this.logmsg( message, this.CRIT, component ); }
	getLogger( component, verbosity ) {
		var newname = '';
		if ( this.name.length && component.length ) {
			newname = `${this.name}.${component}`;
		} else if ( this.name.length || component.length ) {
			newname = `${this.name}${component}`;
		}

		if ( loggerRegistry.has( newname ) ) {
			return loggerRegistry.get( newname );
		}
		return new Logger( newname, verbosity );
	}
}

module.exports = new Logger( '', 0 );
