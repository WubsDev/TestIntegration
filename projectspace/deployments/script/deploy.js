(function deploy () {

    function execute (task) {
	task.setTaskName("SF deploy");
	task.setPassword(project.getProperty("password"));
	task.setUsername(project.getProperty("username"));
	task.setServerURL(project.getProperty("url"));
	task.setZipFile(project.getProperty("zipFile")+".zip");
	task.setProject(project);
	task.setMaxPoll(2000);
	task.execute();
    };

    (function main (){
	var task       = java.lang.Class.forName("com.salesforce.ant.DeployTask").newInstance();
	var tests      = [];
	var isValidate = project.getProperty("v");
	var t          = project.getProperty("t");
	var grepOutput = project.getProperty("grepoutput") || "";
	var includes   = project.getProperty("includes");
	includes = includes ? includes.split("\n") : [] ;

	if (isValidate) task.setCheckonly(true);

	if ( t && t != "none" ) {
	    if (t == "all") tests.push(grepOutput.split('\n'));
	    else tests.push(t.split(","));

	    tests.push  (includes.filter(function(e){ return grepOutput.indexOf(e)> -1 }))

	    tests = tests
		.map   (function(e,i,a){ return (m = /(\w+)\.cls/.exec(e)) ? m[0] : e;})
		.filter(function(e,i,a){ return a.indexOf(e) == i });

	    for each (test in tests) {
		var codeNameElement = java.lang.Class.forName(
		    "com.salesforce.ant.DeployTask$CodeNameElement"
		).newInstance();
		codeNameElement.addText(test);
		task.addRunTest(codeNameElement);
	    }
	}

	execute(task);
    })();

}());
