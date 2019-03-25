/**
*	@file Preinstall script for NodeJS packages that enforces unified module versions across multiple projects.
*	
*	Usage:
*		1) Modify the Run function argument at the bottom of the file to set your desired modules and versions
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
*	Utility module required to transform the child process into a promise
*	@type {Function} 
*/
const UTIL = require( "util" );

/**
*	Node shell for executing commands
*	@type {Function} 
*/
const EXEC = UTIL.promisify( require( "child_process" ).exec );

/**
*	Runs a shell command and returns a Promise
*	@param {string} tCommand Command to execute
*	@return {object} Promise with stdout and stderror properties
*/
async function Execute( tCommand )
{
	console.log( "Executing: " + tCommand );
	
	return await EXEC( tCommand, { maxBuffer: 5000 * 1024 } );
};

/**
*	Enforces input package versions of packages that aren't marked for ignore
*	@param {object} tPackages Associative array of packages to enforce with the key as the package name and value as version
*/
async function Run( tPackages )
{
	var tempDependencies = null;
	try
	{
		const { stdout, stderr } = await Execute( "npm ls --json --depth=0" );
		tempDependencies = JSON.parse( stdout ).dependencies;
	}
	catch ( tError )
	{
		tempDependencies = JSON.parse( tError.stdout ).dependencies;
	}
	
	if ( tempDependencies != null )
	{
		// Create ignore list
		const tempIgnored = {};
		if ( process.argv.length >= 3 )
		{
			const tempIgnoredArray = process.argv[2].split( "," );
			for ( let i = ( tempIgnoredArray.length - 1 ); i >= 0; --i )
			{
				tempIgnored[ tempIgnoredArray[i] ] = true;
			}
		}
		
		// Add modules if they aren't ignored and are defined in the packages
		var tempModuleNames = null;
		for ( let tempName in tempDependencies )
		{
			if ( tempIgnored[ tempName ] === undefined && tPackages[ tempName ] !== undefined )
			{
				if ( tempModuleNames === null )
				{
					tempModuleNames = [];
				}
				
				tempModuleNames.push( tempName );
			}
		}
		
		// Process modules
		if ( tempModuleNames !== null )
		{
			const tempListLength = tempModuleNames.length;
			for ( let i = 0; i < tempListLength; ++i )
			{
				let tempName = tempModuleNames[i];
				let tempModule = tempDependencies[ tempName ];
				
				// Install if not already
				if ( tempModule.version === undefined )
				{
					try
					{
						await Execute( "npm install --save-exact " + tempName + "@" + tPackages[ tempName ] );
					}
					catch ( tError )
					{
						console.log( tError );
					}
				}
				// Install correct version if it's wrong
				else
				{
					let tempVersion = tPackages[ tempName ];
					if ( tempModule.version !== tempVersion )
					{
						try
						{
							await Execute( "npm remove " + tempName );
							await Execute( "npm install --save-exact " + tempName + "@" + tempVersion );
						}
						catch ( tError )
						{
							console.log( tError );
						}
					}
				}
			}
		}
	}
};

/*
*	EDIT THE PACKAGES AND VERSIONS INSIDE THE ASSOCIATIVE ARRAY BELOW
*/
Run(
	{
		"ajv": "6.6.1",
		"d3": "5.7.0",
		"d3-force-3d": "2.0.1",
		"file-saver": "2.0.0",
		"mobx": "5.7.0",
		"mobx-react": "5.4.2",
		"react": "16.6.3",
		"react-dom": "16.6.3",
		"react-router-dom": "4.3.1",
		"react-scripts": "2.1.2"
	}
);
