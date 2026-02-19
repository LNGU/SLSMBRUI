import subprocess, json, urllib.request, os

AZ_CMD = r"C:\Program Files\Microsoft SDKs\Azure\CLI2\wbin\az.cmd"
if not os.path.exists(AZ_CMD):
    AZ_CMD = "az"

def get_token(resource):
    r = subprocess.run([AZ_CMD, 'account', 'get-access-token', '--resource', resource, '--query', 'accessToken', '-o', 'tsv'], capture_output=True, text=True, shell=AZ_CMD.endswith('.cmd'))
    return r.stdout.strip()

token = get_token('https://analysis.windows.net/powerbi/api')
ws_id = 'd3c735d2-8f5c-4d1a-b825-0cc5353a8de2'
ds_id = 'b3bd822f-5f11-44c6-8ce2-c9d56bda271d'

req = urllib.request.Request(f'https://api.powerbi.com/v1.0/myorg/groups/{ws_id}/datasets/{ds_id}/refreshes?$top=5', headers={'Authorization': f'Bearer {token}'})
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read())
    print("Last 5 refreshes:")
    for r in data.get('value', []):
        print(f"  {r.get('status')}: {r.get('startTime')} -> {r.get('endTime')}")
