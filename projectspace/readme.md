git & ant: SFDC Development Tools
=========================

----------
How to use
----------

This guide emphasises command-line tools. For a more rounded and gui-driven approach, see other relevant documentation.

### Prerequisites

1. Install git
2. Install apache ant
3. Add `C:\path-to-ant;C:\path-to-git;C:\path-to-git\bin` to your `PATH`
4. Call `git config --global core.safecrlf false` to remove some potentially script-breaking error messages
 
### Setup

1. Get a Jira ticket
2. Use it to create a branch
3. Clone the branch using: `git clone https://yourrepo/yourproject.git -b yourbranchnamehere`
4. Copy `build.properties` to `~/.ant.salesforce.properties`
5. Put your SFDC developer and UAT sandbox login details and branch name in the appropriate places in that file

### Development

Open your favourite editor and point it at your files:

- Make some changes
- Commit your changes (using your
- Use `ant deploy -De=<env>` to push your changes to your sandbox (see below for syntax)
- Test your changes

And/or open your favourite browser and point it at your dev sandbox:

- Make some config changes
- Test your changes
- Use `ant retrieve` retrieve a local copy of your changes

Use `git add -p` and `git commit -m <message>` to make a commit, then `git push` to move your changes to the server.

### Wrapping Up

1. Commit any uncommitted changes which you don't want to lose.
2. Merge the develop branch into your own branch with `git merge origin/develop`.
3. Remove any uncommitted changes with `git checkout`.
4. Call `ant deploy -Dt=1 -Dv=1` followed by `ant deploy -Dt=1` to push your changes to UAT.

Once you're through UAT make a pull request in Stash/Jira.


------------------
Configuration File
------------------

###File Locations and Precedence

There are 3 places that this tool will look for your config variables, in the following order:

- build.properties.local
- <your user directory>/.ant.salesforce.properties
- build.properties

###Properties

NB that below there are `env.x` variables. You should create a set for each environment that you use, for instance bau.username etc. These prefixes are specified using `-De=env` when calling the ant tool.

Variables           | &nbsp;
---                 | ---
`env.username`      | The org username
`env.password`      | The password + security token for the org - no characters in between the two
`env.url`           | The login URL for the org, usually https://test.salesforce.com
`env.endpoint`	    | The castiron endpoint for the org
                    | &nbsp;
`sf.maxPoll`        | The maximum number of times to poll the server
`sf.pollWait`       | The number of milliseconds between polls
                    | &nbsp;
`git.master`        | The name of the master branch, usually develop
`git.url`           | The URL for the master branch
                    | &nbsp;
`src.dir`*          | The folder in which metadata will be downloaded and stored.
`lib.dir`*          | The folder in which deployment scripts are stored.

\* You probably ought not to change these.

------------------
Commands and Usage
------------------

### help

Prints a help message and exits

### test

Runs some unit tests and exits

### retrieve
Pulls data from the SFDC org specified using `-De=<env>` into the working directory. Use this when you have made configuration changes in your org which you need to commit. By default, only pulls a subset of metadata - see below for a complete list.

Options             | &nbsp;
---                 | ---
`-De=<env>`         | Specify the environment (*required*)
`-Da=1`             | Retrieve all available metadata (this will take a little longer)
`-Df=<file-path>`   | Retrieve only a specified comma-, space-, or semicolon-delimited list of files, e.g. `folder/file1.type`. See the table below for which metadata types are supported.
`-Dtype=<type>`     | Bulk retrieve a specified metadata type. See the table below for a list of supported types
`-Dfolder=<folder>` | Specify the folder to retrieve if bulk-retrieving one of documents, email templates, or reports.

### deploy
Pushes all the changes in your branch since it was branched into the source org.

Options             | &nbsp;
---                 | ---
`-De=<env>`         | Specify the environment (*required*)
`-Da=1`*            | Push all files, not just changed files (this will take a while).
`-Df=<file-path>`*  | Deploy only a specified comma-, space-, or semicolon-delimited list of files, e.g. `folder/file1.type`
`-Dh=<int>`*        | Push only files changed since the n-th last commit. Set to 0 to push only uncommitted files.
`-Dv=1`             | Compile and test only

\* You should use 0 or 1 out of these options

### delete
Builds a deletion package in deployments/temp/data-deletion.xml comprising a package.xml and a destructivechanges.xml file, which includes components present on `${git.master}` but absent in the current HEAD.

Options            | &nbsp;
---                | ---
`-De=<env>`*       | Specify the environment (*required*)
`-Dv=1`*           | Compile and test only
`-Deploy=1`        | After building the .zip file, actually run the deployment

\* These only have an effect when delete has been called with `-Deploy=1`

### filter
This is a utility command to search all hunks for a given term. There are two algorithms to choose from:

If you have several fields, classes etc. added or removed adjacent to each other, you should specify whether the change you're looking for is an addition or a deletion. For instance, if you wanted just one of these fields, you'd call filter using something like `ant filter -Ddir="+" -Dq="Credential_Evaluation_Line_Junction__c.Evaluation_Expiry_Date__c"`
```
@@ -9498,6 +9612,26 @@
         <readable>true</readable>
     </fieldPermissions>
     <fieldPermissions>
+        <editable>false</editable>
+        <field>Credential_Evaluation_Line_Junction__c.Evaluation_Expiry_Date__c</field>
+        <readable>true</readable>
+    </fieldPermissions>
+    <fieldPermissions>
+        <editable>false</editable>
+        <field>Credential_Evaluation_Line_Junction__c.Evaluation_Start_Date__c</field>
+        <readable>true</readable>
+    </fieldPermissions>
+    <fieldPermissions>
+        <editable>false</editable>
+        <field>Credential_Evaluation_Line_Junction__c.Password__c</field>
+        <readable>true</readable>
+    </fieldPermissions>
+    <fieldPermissions>
+        <editable>false</editable>
+        <field>Credential_Evaluation_Line_Junction__c.Username__c</field>
+        <readable>true</readable>
+    </fieldPermissions>
+    <fieldPermissions>
         <editable>true</editable>
         <field>Credential_Usage__c.AV_HIPS_Endpoints__c</field>
         <readable>true</readable>
```

If your change is isolated, or if it's bound up as a removal and an addition, you'll need to omit the -Ddir argumnt, which will cause `filter` to use a more basic algorithm, taking the whole of any matching hunk.

Options             | &nbsp;
---                 | ---
`-Dq=<regex>`	    | Provides a filter term (*required*)
`-Ddir=[+|-]`	    | Filter only additions (`+`) or deletions (`-`)

--------------
Metadata Types
--------------

The following top-level metadata types are bulk-retrievable using `-Dtype=<type>` and will be downloaded by `ant retrieve -Da=1`; these types and their children will be detected missing and added to the deletion file when it is created. Types and/or folders not listed here are not under version control and *will not be retrieved or deployed*. When `Dtype=<type>` is used to retrieve metadata types which have folders, the folder must be specified.

Type                |   Folder  |   Children    | Folders
---                 |---        |---            |---
ApexComponent	    | components
ApexClass	    | classes
ApexPage            | pages
ApexTrigger         | triggers
CustomApplication   | applications
CustomLabels	    | labels
CustomObject        | objects   | ActionOverride<br/>BusinessProcess<br/>CustomField<br/>ListView<br/>NamedFilter<br/>RecordType<br/>SharingReason<br/>SharingRecalculation<br/>ValidationRule<br/>Weblink
CustomPageWebLink*  | weblinks
CustomSite*         | sites
CustomTab           | tabs
DataCategoryGroup*  | datacategorygroups
Document*           | documents |               | Apps <br/> Developer_Documents <br/> Documents <br/> Invoices <br/> Lead_Images <br/> Logos <br/> Partner_Portal_Branding <br/> SharedDocuments <br/> Tab_Images
EmailTemplate*      | emails    |               | Asset <br/> Conga_Templates <br/> Contact_User <br/> Error_Reporting <br/> Evaluation <br/> Installer_Email_Templates <br/> Marketing_Templates <br/> NEEMEA_Sales <br/> Partner_Templates <br/> Sales_NA_NSG_Renewal_Templates <br/> Sales_Templates <br/> StatusReportEmails <br/> Support_Templates <br/> UTM_DACH
Flow*               | flows
Group*              | groups
HomePageComponent*  | homePageComponents
HomePageLayout*     | homePageLayouts
Layout              | layouts
PermissionSet*      | permissionsets
Portal*             | portals
Profile**           | profiles
Queue*              | queues
QuickAction	    | quickActions
Report*             | reports   |               | Conga PointMerge Reports <br/> Conga Reports
Scontrol*           | scontrols
Workflow            | workflows | WorkflowAlert <br/> WorkflowFieldUpdate <br/> WorkflowRule <br/> WorkflowOutboundMessage <br/> WorkflowTask   
StaticResource      | staticresources

\* These are not retrieved unless `-Da=1` is specified

\** You must not retrieve profiles on their own. The way to retrieve profiles is to call `ant retrieve` or `ant retrieve -Da=1`. This is to ensure that complete profiles are returned.