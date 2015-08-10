(function retrieve (){

    var task;
    var manifest;
    
    if(type = project.getProperty("type")) {
	// bulk retrieve by metadata type
	task = java.lang.Class.forName("com.salesforce.ant.BulkRetrieveTask").newInstance();
	task.setMetadataType(type);
	task.setUnzip(true);
	if (folder = project.getProperty("folder")) { task.setContainingFolder(folder); }

    } else {
	// normal retrieve by manifest
	task = java.lang.Class.forName("com.salesforce.ant.RetrieveTask").newInstance();

	if (f = project.getProperty("f")) {
            project.setProperty("filesList",f.replace(/[;,]/g,"\n"));
            project.executeTarget("buildFilesManifest");
            task.setUnpackaged(project.getProperty("lib.dir")+"/manifest/files.xml");

	} else if (project.getProperty("a")){
	    var foldersTask = java.lang.Class.forName("com.salesforce.ant.RetrieveTask").newInstance();
	    foldersTask.setUnpackaged(project.getProperty("lib.dir")+"/manifest/folders.xml");
	    execute(foldersTask);
	    
            task.setUnpackaged(project.getProperty("lib.dir")+"/manifest/all.xml");

	} else {
            task.setUnpackaged(project.getProperty("lib.dir")+"/manifest/code.xml");
	}
    }

    execute(task);

}())

function execute (task) {
    task.setTaskName("SF retrieve");
    task.setPassword(project.getProperty("password"));
    task.setUsername(project.getProperty("username"));
    task.setServerURL(project.getProperty("url"));
    task.setProject(project);
    task.setMaxPoll(2000);
    task.setRetrieveTarget(project.getProperty("src.dir"));

    task.execute();
}
