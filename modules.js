/**
*	@file Preinstall script for NodeJS packages that enforces unified module versions across multiple projects.
*	
*	Usage:
*		1) Modify the PACKAGES hash object to set your desired modules and versions
*		2) Call this script as part of a package.json preinstall script:
*			"scripts" {
*				"preinstall": "node ../modules.js"
*				...
*			}
*		OPTIONAL) You can pass in a parameter list inside of the package.json to ignore version enforcement of modules so they won't get changed:
*			"scripts": {
*				"preinstall": "node ../modules.js mobx,d3,react-scripts"
*				...
*			}
*
*	@author Chris Hassebrook
*/

/**
*	Node shell for executing commands
*	@type {ChildProcess} 
*/
const EXEC = require( "child_process" ).exec;

/**
*	Associative array with module names as keys and their desired version numbers as values. Modify this for your own modules that you want to enforce.
*	@type {Object} 
*/
const PACKAGES =
{
	"mobx": "5.7.0"
};

/**
*	Associative array that gets populated with existing Node dependencies whenever "npm install" gets called from a project. Key is module name.
*	@type {Object} 
*/
var dependencies = null;

/**
*	Array that gets populated with module names that need to be installed recursively.
*	@type {string[]} 
*/
var moduleNames = null;

/**
*	Callback for returning the result of a shell command.
*	@callback shellCallback
*	@param {Object} result
*/

/**
*	Runs a shell command and then invokes a callback.
*	@param {string} tCommand Command to execute
*	@param {shellCallback} tCallback Callback for returning the result of the command
*/
function execute( tCommand, tCallback )
{
	console.log( "Executing: " + tCommand );
	
	EXEC( tCommand, { maxBuffer: 5000 * 1024 },
		( tError, tOut ) =>
		{
			tCallback( tOut );
		}
	);
};

/**
*	Handles the installation of specific module versions that were declared in the moduleNames array.
*/
function onDependency()
{
	if ( dependencies !== null && moduleNames !== null )
	{
		const tempLength = moduleNames.length;
		if ( tempLength > 0 )
		{
			const tempName = moduleNames[ tempLength - 1 ];
			const tempVersion = PACKAGES[ tempName ];
			--moduleNames.length;
			
			// Install if not already
			const tempModule = dependencies[ tempName ];
			if ( tempModule.version === undefined )
			{
				execute( "npm install --save-exact " + tempName + "@" + tempVersion, onDependency );
			}
			// Install correct version if it's wrong
			else if ( tempModule.version !== tempVersion )
			{
				execute( "npm remove " + tempName,
					( tOut ) =>
					{
						execute( "npm install --save-exact " + tempName + "@" + tempVersion, onDependency );
					}
				);
			}
		}
	}
};

/**
*	Sets up all of the necessary Node module dependencies that need to be installed or reinstalled, and then processes them.
*	@param {string} Raw text of Node package JSON
*/
function onNodeJSON( tOut )
{
	dependencies = JSON.parse( tOut ).dependencies;
	if ( dependencies != null )
	{
		// Create ignore list
		const tempIgnored = {};
		if ( process.argv.length === 3 )
		{
			const tempIgnoredArray = process.argv[2].split( "," );
			for ( let i = ( tempIgnoredArray.length - 1 ); i >= 0; --i )
			{
				tempIgnored[ tempIgnoredArray[i] ] = true;
			}
		}
		
		// Add modules if they aren't ignored and are defined in the packages
		for ( let tempName in dependencies )
		{
			if ( tempIgnored[ tempName ] === undefined && PACKAGES[ tempName ] !== undefined )
			{
				if ( moduleNames === null )
				{
					moduleNames = [];
				}
				
				moduleNames.push( tempName );
			}
		}
		
		// Process modules
		if ( moduleNames !== null )
		{
			onDependency();
		}
	}
};

// Run
execute( "npm ls --json --depth=0", onNodeJSON );