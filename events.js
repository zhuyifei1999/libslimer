const logging = require( './logging.js' ).getLogger( 'events' ),
	eventReg = {},
	events = [
		'onAlert',
		'onAuthPrompt',
		'onCallback',
		'onClosing',
		'onConfirm',
		'onConsoleMessage',
		'onLongRunningScript',
		'onError',
		'onFileDownload',
		'onFileDownloadError',
		'onFilePicker',
		'onInitialized',
		'onLoadFinished',
		'onLoadStarted',
		'onNavigationRequested',
		'onPageCreated',
		'onPrompt',
		'onResourceError',
		'onResourceReceived',
		'onResourceRequested',
		'onResourceTimeout',
		'onUrlChanged'
	];

for ( let event of events ) {
	eventReg[ event ] = [];
	exports[ event ] = function ( f ) {
		eventReg[ event ].push( f );
	};
}

exports.init = function ( page ) {
	for ( let event of events ) {
		let obj = {
			page: page,
			returnVal: {
				onAuthPrompt: true,
				onConfirm: null,
				onFilePicker: [],
				onPrompt: null
			}[ event ],
			returnValSet: false,
			setReturnVal( val ) {
				if ( this.returnValSet ) {
					logging.warn( `Return value was set to ${this.returnVal}, overriding with ${val}`, event );
				}
				this.returnVal = val;
				this.returnValSet = true;
			}
		};
		page[ event ] = function ( ...args ) {
			for ( let f of eventReg[ event ] ) {
				f.apply( obj, args );
			}
			return obj.returnVal;
		};
	}
};
