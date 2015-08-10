/*
 *  TO BE CALLED IN AN ANT SCRIPTDEF TASK
 *  Reads the @{input}, writes an xml string to the property named in 
 *  @{xmlproperty}, and writes a comma-delimited list of files to the property
 *  named in @{listproperty}.
 */

MetadataTypes = {
    //converts filesystem names into component names
    applications:       {name: "CustomApplication", ending: '.app'},
    classes:            {name: "ApexClass", meta: true, ending: '.cls'},
    components:         {name: "ApexComponent", meta: true, ending: '.component'},
    datacategorygroups: {name: "DataCategoryGroup"},
    documents:          {name: "Document", meta: true, ending: "*"},
    email:              {name: "EmailTemplate", meta: true, ending: '.email'},
    flows:              {name: "Flow"},
    groups:             {name: "Group", ending: ".group"},
    homePageComponents: {name: "HomePageComponent", ending: ".homePageComponent"},
    homePageLayouts:    {name: "HomePageLayout", ending: ".homePageLayout"},
    labels:             {name: "CustomLabels", ending: ".labels"},
    layouts:            {name: "Layout", ending: ".layout"},
    objects:            {name: "CustomObject", ending: ".object"},
    pages:              {name: "ApexPage", meta: true, ending: ".page"},
    permissionsets:     {name: "PermissionSet", ending: ".permissionset"},
    portals:            {name: "Portal", ending: ".portal"},
    profiles:           {name: "Profile", ending: ".profile"},
    queues:             {name: "Queue", ending: ".queue"},
	quickActions:       {name: "QuickAction", ending: ".quickAction"},
    reports:            {name: "Report", ending: ".report"},
    reportTypes:		{name: "ReportType", ending: ".reportType"},
    sites:              {name: "CustomSite", ending: ".site"},
    staticresources:    {name: "StaticResource", meta: true, ending: ".resource"},
    triggers:           {name: "ApexTrigger", meta: true, ending: ".trigger"},
    tabs:               {name: "CustomTab", ending: ".tab"},
    weblinks:           {name: "CustomPageWebLink", ending: ".weblink"},
    workflows:          {name: "Workflow", ending: ".workflow"},
    //subcomponents    
    fieldSets:          {name: "FieldSet"},
    listViews:          {name: "ListView"},
    recordTypes:        {name: "RecordType"},
    validationRules:    {name: "ValidationRule"},
    fields:             {name: "CustomField"},
    actionOverrides:    {name: "ActionOverride"},
    businessProcesses:  {name: "BusinessProcess"},
    webLinks:           {name: "WebLink"},
    fieldUpdates:       {name: "WorkflowFieldUpdate"},
    outboundMessages: 	{name: "WorkflowOutboundMessage"},
    rules:              {name: "WorkflowRule"},
    alerts:             {name: "WorkflowAlert"},
    tasks:              {name: "WorkflowTask"}
    
};

(function (rawinput) {

	function processLine(line, Files, Members) {
		/*
		 * given a string of the form type/[folder/]name[ending][-meta.xml]
		 * adds the appropriate file paths to the Files array and members
		 * to the Members array
		 */
		var folder, type, name;
		
		if (line.length == 2) {
			type = line[0];
			name = line[1];
		} else if (line.length == 3) {
			type = line[0];
			folder = line[1];
			name = line[2];
		} else  {
			throw "Invalid input: " + line
		}
		
		if (folder) {
			Members.push(folder);
			Files.push(type +'/' + folder + '-meta.xml');
		}
		
		if (MetadataTypes[type].meta) Files.push(type + '/'+ (folder ? folder +'/' : '') + name + '-meta.xml');
		
		Files.push(type + '/' + (folder ? folder + '/' : '') + name);
		var ending = (MetadataTypes[type].ending == '*' ? /.\w+$/ : MetadataTypes[type].ending );
		Members.push((folder ? folder + '/' : '') + name.replace(ending, ''));
	}

    //do nothing unless the input exists
    if (rawinput == null || rawinput == "null") {return;}
    
    //declare variables and read input as an array of arrays of filepath chunks
    var input       = rawinput.split("\n").map(function (e) {
        return e.trim().replace(/-meta\.xml/, "").split('/'); 
    }), Types       = [],
        xmldata     = "",
        filedata    = "",
        i, j, Files, Members;
    
    //list the metadata types i.e. folder names
    for (i = 0; i < input.length; i++) {
		var type = input[i][0]
        if (Types.indexOf(type) < 0 && type != "") Types.push(type);
    }
    
    //construct the xmldata and filedata strings
    for (i = 0; i < Types.length; i++) {

        if (Types[i] == "package.xml") { continue; } //ignore package.xml
	
		var pos,
			Files   = [],
			Members = [];
			
		for (j = 0; j < input.length; j++) {
			if (input[j][0] == Types[i]) processLine(input[j], Files, Members);
		}
			
		//dedupe Files and Members
		Files   = Files.sort().filter(function(e, i, array) {
			return array.indexOf(e) == i;
		});
		
		Members = Members.sort().filter(function(e, i, array) {
			return array.indexOf(e) == i;
		}).map(function (e) {
			return e.replace(':','.');
		});
		
		//write out the members to the xml object
		xmldata += "<types><name>" + MetadataTypes[Types[i]].name + "</name>";
		for (j = 0; j < Members.length; j++) xmldata += "<members>" + Members[j] + "</members>\n";
		xmldata += "</types>";
		
		for (j = 0; j < Files.length; j++) {filedata += Files[j] + '\n'; }
    }
    
    project.setProperty(attributes.get("xmlproperty"), xmldata);
    
    if (attributes.get("listproperty")) project.setProperty(attributes.get("listproperty"), filedata);
    
}(attributes.get("input")));
