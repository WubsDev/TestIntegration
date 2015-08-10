var tags = [ // subcomponents which can form a valid part of a deletion manifest
    "fieldUpdates",            "outboundMessages",
    "rules",                   "alerts",
    "tasks",                   "fieldSets",
    "sharingModel",            "listViews",
    "searchLayouts",           "recordTypes",
    "validationRules",         "fields",
    "compactLayoutAssignment", "actionOverrides",
    "webLinks",                "businessProcesses"
];

// regexes to identify subcomponents
var regexString = "<(" + tags.join("|") + ")>[\\s\\S]*?<(\\w+?[nN]ame)>(\\w+)<\\/\\2>[\\s\\S]*?<\\/\\1>";
var globalRegex = new RegExp(regexString,"g");
var localRegex  = new RegExp(regexString);

function extractComponents (string, fileName) {
    // uses the above regexes to search through a file and produce a list
    // of all subcomponents
    var result = [];
    for each (component in string.match(globalRegex)){
	var match = component.match(localRegex);
	result.push(match[1]+"/"+fileName+":"+match[3]);
    };
    return result;
}

(function(to){
    // print all deleted files
    print($EXEC("cmd /c git diff --name-only --diff-filter=D " + to + " HEAD src/"));

    // loop over modified files
    for each (file in 
        // list modified files
	$EXEC("cmd /c git diff --name-only --diff-filter=MR " + to + " HEAD src/").split("\n")
	// only workflows and objects have subcomponents
	    .filter(function(e){return e.match(/object|workflow/) != null}) 
    ) {
	// extract filename from file path
	var name     = file.match(/\/(\w+)\./)[1];

	// extract HEAD components
	var fromList = extractComponents($EXEC("git show HEAD:\""+file+"\""), name);

	// print 'to' components which aren't in HEAD components
	print(
	    extractComponents($EXEC("git show "+to+":\""+file+"\""), name)
		.filter(function(e){ return fromList.indexOf(e)<0})
	);
    }
}(arguments[0]))
