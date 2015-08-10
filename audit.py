import json, subprocess, time, argparse
from email.utils import parsedate_tz, mktime_tz


# Set up command-line parameters using argparse module

parser = argparse.ArgumentParser(description='Generate an audit log for a change in source control.')

parser.add_argument(
    'path',
    help="The file for which you need an audit log")
parser.add_argument(
    '-q',
    '--query',
    default="",
    help="Only include changes which match the query")
parser.add_argument(
    "-u",
    "--auth",
    help = "SSO authentication details in the format username:password"
)
parser.add_argument(
    '-v',
    '--verbose',
    action="store_true",
    help="Show more info" )

args = parser.parse_args()


#Set up two useful date-time formatting one-liners

RFC2822toLOCAL = lambda t: time.ctime(mktime_tz(parsedate_tz(t)))

ISO1806toLOCAL = lambda t: RFC2822toLOCAL(
    time.strftime("%a %b %d %H:%M:%S %Y ",time.strptime(t[:19],'%Y-%m-%dT%H:%M:%S')) + t[23:]
)


#Initialise lots of variables

stashURL  = "https://itstash.sophos.net/rest/api/1.0/projects/CORE/repos/core/commits/"
jiraURL   = "https://jira.sophos.net/rest/api/2/issue/"
queryDate = ""
todayDate = time.ctime()
commits   = []
issueSet  = set() # this exists to de-duplicate the list of JIRA issues
issueList = []


# Call the git diff

diffArgs  = ["git", "log", "-p", "-w"]
if args.query: diffArgs += ["-G" + args.query]
rawdiff = subprocess.check_output(diffArgs + [args.path]).decode('utf-8').split("commit ")[1::]


# Go through the git diff output to extract the reporting data

for rawcommit in rawdiff:
    lines    = rawcommit.split("\n")
    diffLine = lines.index(filter(lambda x:'diff --git' in x, lines)[0])

    commit   = {
        'hash':    lines[0],
        'author':  lines[1][8::],
        'date':    RFC2822toLOCAL(lines[2][8::]),
        'message': "\n".join(lines[3:diffLine])
    }

    if diffLine > 3:
        commit['diff'] =  "\n".join(lines[diffLine::])
    else:
        commit['diff'] = ""

    # Query the stash REST API for the related JIRA items
    stashData = json.loads(
        subprocess.check_output([
            "curl", "-ks", "-u", args.auth, stashURL+commit['hash']
        ]).decode('utf-8')
    )

    if stashData.get('attributes'):
        stashIssues = stashData['attributes'].get('jira-key')
        issueSet  |= set(stashIssues)
        commit['issues'] =  ''.join(["<a href='%s'>%s</a>"%(a,a) for a in stashIssues])
    else: commit['issues'] = ''

    commits += [commit]


# Go through the set of jira items and extract comments, transitions etc

for data in [json.loads(
        subprocess.check_output(["curl", "-ks", "-u", args.auth, jiraURL+ID+"?expand=changelog"]).decode('utf-8')
    ) for ID in issueSet]:

    transitions = [{
        'to': t['items'][0]['toString'],
        'by': t['author']['displayName'],
        'date': ISO1806toLOCAL(t['created'])
    } for t in data['changelog']['histories'] if t['items'][0]['field'] == "status"]

    if data['fields']['comment']['total'] > 0:
        comments = [{
            'author': c['author']['displayName'],
            'body': c['body'],
            'date': ISO1806toLOCAL(c['created'])
        } for c in data['fields']['comment']['comments']]
    else:
        comments = []

    issueList += [{
        'key': data['key'],
        'reporter': data['fields']['reporter']['displayName'],
        'status': data['fields']['status']['name'],
        'description': data['fields']['description'],
        'comments': comments,
        'transitions': transitions
    }]


# Print the HTML document output

print ("""<!DOCTYPE html>
<html>
    <head>
        <meta charset='UTF-8'>
        <style>
            .comment, .transition {
                margin-left: 1em;
                border-top: 1px solid lightgrey;
            }

        </style>
    </head>
    <body>
        <h1>AUDIT LOG</h1>
        <dl>
            <dt>File Path</dt><dd>%s</dd>
            <dt>Search String</dt><dd>%s</dd>
            <dt>Today's Date</dt><dd>%s</dd>
        </dl>
"""%(args.path, args.query, todayDate)).encode('utf-8')

if args.verbose:
    print "    <h2>Commits</h2>"
    for commit in commits:
        print ("""
        <h3>%(hash)s</h3>
            <dl>
                <dt>Author</dt><dd>%(author)s</dd>
                <dt>Date</dt><dd>%(date)s</dd>
                <dt>Issues</dt><dd>%(issues)s</dd>
                <dt>Message</dt><dd>
                    <pre class = 'commitMessage'>%(message)s</pre>
                </dd>
                <dt>Diff</dt><dd>
                    <pre class='diff'>%(diff)s</pre>
                </dd>
            </dl>"""%commit).encode('utf-8')


print "<h2>Issues</h2>"
for issue in issueList:
    print ("""
        <h3 id="%(key)s">%(key)s</h3>
        <dl>
            <dt>Reporter</dt><dd>%(reporter)s</dd>
            <dt>Status</dt><dd>%(status)s</dd>
            <dt>Description</dt><dd><pre>%(description)s</pre></dd>
        </dl>
    """%issue).encode('utf-8')

    print "<h4>Transition History</h4>"
    for t in issue['transitions']:
        print ("""
        <dl class = 'transition'>
            <dt>To</dt><dd>%(to)s</dd>
            <dt>By</dt><dd>%(by)s</dd>
            <dt>Date</dt><dd>%(date)s</dd>
        </dl>
        """%t).encode('utf-8')
    if args.verbose:
        print "<h4>Comments</h4>"
        for c in issue['comments']:
            print ("""
            <dl class = 'comment'>
                <dt>Author</dt><dd>%(author)s</dd>
                <dt>Body</dt><dd>%(body)s</dd>
                <dt>Date</dt><dd>%(date)s</dd>
            </dl>
            """%c).encode('utf-8')

print """    </body>
</html>"""
