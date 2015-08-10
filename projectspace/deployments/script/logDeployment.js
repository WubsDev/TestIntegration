var HEAD    = `git rev-parse HEAD`,
endTime     = encodeURIComponent(`sh -c "date +%Y:%m:%d:%T:%z"`),
master      = arguments[0],
startTime   = encodeURIComponent(arguments[1]),
loginURL    = arguments[2],
username    = arguments[3],
password    = arguments[4],
deletion    = arguments[5] ? true : false,
castIronURL = "http://uk-devcastiron1b.brown.sophos";

orgID = (function getOrgID(){
    var loginData = '"<soapenv:Envelope ' 
    + 'xmlns:soapenv=\\"http://schemas.xmlsoap.org/soap/envelope/\\" ' 
    + 'xmlns:urn=\\"urn:partner.soap.sforce.com\\">' 
    + '<soapenv:Body><urn:login><urn:username>' + username
    + '</urn:username><urn:password>' + password
    + '</urn:password></urn:login></soapenv:Body></soapenv:Envelope>"';

    var request = $EXEC(
	'curl -H "Content-Type:text/xml" -H "SOAPAction:login" -d ' 
	    + loginData + ' --url ' + loginURL + '/services/Soap/u/30.0'
    );

    return request.match(/<organizationId>(\w+)<\/organizationId>/)[1];
}());

result = (function getRow(){
    var url = castIronURL
	+ "/ANT_LogSFDCDeployments?head=" + HEAD
	+ "&starttime=" + startTime
	+ "&master=" + master
	+ "&endtime=" + endTime
	+ "&username=" + encodeURIComponent(username)
	+ "&orgid=" + orgID
	+ "&isdeletion=" + deletion;

    return $EXEC('curl -X POST ' + url.replace(/\s/g,''));

}());

print(result);
