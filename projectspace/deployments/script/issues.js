// Usage: jjs -scripting issues.js <from> <to> <username> <password>
from     = arguments[0]
to       = arguments[1];
username = arguments[2];
password = arguments[3];
issues   = [];


masterCommits = $EXEC("git log --pretty=oneline " + to).split("\n");
for each (
    commit in $EXEC("git log --pretty=oneline " + from)
	.split("\n").filter(function(e){
	    return masterCommits.indexOf(e) < 0
	})
) {
    var sha1 = commit.slice(0,8);
    var curl = $EXEC("curl -ks -u "+username+":"+password+
		     " https://itstash.sophos.net/rest/api/1.0/projects/CORE/repos/core/commits/"
		     +sha1);
    //print(curl);
    var matches = curl.match(/\"jira-key\":\[(.*?)\]/);

    if(matches != null){ issues = issues.concat(matches[1].replaceAll('"','').split(',')); }
    
}

print(issues.filter(function(e,i,a){return a.indexOf(e)==i}).sort().join("\n"))
