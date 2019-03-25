# NPM-VersionEnforcer
Preinstall script for NodeJS packages that enforces dependency module versions across multiple projects.

## DESCRIPTION
This is designed as a utility script that will automatically enforce module versions across multiple Node projects.

It is intended to be invoked by the  *preinstall* hook of **node-install** found in a packages.json file.

## USAGE

### 1) Modify the PACKAGES associative array
Inside of the modules.js, modify the **RUN** function's argument to specify module names as keys with the version as their respective values.

Any package.json dependencies found that match anything found within **RUN** function's argument will be installed according to the specified version.

### 2) Add this script into packages.json of your project(s)
	...
	"scripts" {
				"preinstall": "node ../modules.js"
				...
			}
	...
	
#### OPTIONAL: You can pass in an array, delimited by commas, to specify modules that should be enforced
	...
	"scripts" {
				"preinstall": "node ../modules.js mobx,react-scripts,d3"
				...
			}
	...
	
### 3) Run normal node installs to execute (npm install)
