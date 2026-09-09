"""Local-only UI fixture server. Never deployed. No real accounts or API calls."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[2] / "frontend" / "out"
FIXTURE = """<script>
localStorage.setItem('pc_token','local-ui-fixture');
localStorage.setItem('pc_user',JSON.stringify({id:'fixture',full_name:'Test Student',email:'test@example.invalid',avatar_color:'#234734'}));
const realFetch=window.fetch.bind(window);let expenses=[],budget=null,placeCalls=0;
Object.defineProperty(navigator,'geolocation',{value:{
 watchPosition(success){setTimeout(()=>success({coords:{latitude:31.5204,longitude:74.3587,accuracy:25}}),10);return 1;},clearWatch(){}
}});
window.fetch=async (url,options={})=>{
 const path=new URL(url,location.origin).pathname;
 if(!path.startsWith('/api/'))return realFetch(url,options);
 let data;const method=options.method||'GET';
 if(path.endsWith('/places/nearby')){
  const scenario=new URLSearchParams(location.search).get('scenario');
  if(scenario==='retry' && placeCalls++===0)return new Response(JSON.stringify({detail:'The nearby places service is busy. Try again shortly.'}),{status:503,headers:{'Content-Type':'application/json'}});
  data=scenario==='empty'?[]:[{id:'node/1',name:'Campus Books',kind:'books',lat:31.521,lon:74.359,detail:'Books & stationery',distanceMeters:90},{id:'node/2',name:'Student Cafe',kind:'food',lat:31.519,lon:74.357,detail:'Cafe',distanceMeters:200}];
 }
 else if(path.includes('/budgets/')){if(method==='PUT')budget=JSON.parse(options.body).amount;const spent=expenses.reduce((s,e)=>s+e.amount,0);data={month:path.split('/').pop(),amount:budget,spent,remaining:budget===null?null:budget-spent,alert:budget!==null&&spent>=budget/2};}
 else if(path.endsWith('/expenses/summary'))data={total:expenses.reduce((s,e)=>s+e.amount,0),count:expenses.length,by_category:{}};
 else if(path.endsWith('/expenses')){if(method==='POST'){data={...JSON.parse(options.body),id:String(expenses.length+1),user_id:'fixture',created_at:new Date().toISOString()};expenses.push(data);}else data=expenses;}
 else data={id:'fixture',full_name:'Test Student',email:'test@example.invalid',avatar_color:'#234734'};
 return new Response(JSON.stringify(data),{status:method==='POST'?201:200,headers:{'Content-Type':'application/json'}});
};
</script>"""


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):
        route = urlsplit(self.path).path
        if route in ("/dashboard/", "/explore/"):
            html = (ROOT / route.strip("/") / "index.html").read_text(encoding="utf-8")
            body = html.replace("<head>", "<head>" + FIXTURE).encode()
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.end_headers()
            self.wfile.write(body)
        else:
            super().do_GET()


if __name__ == "__main__":
    ThreadingHTTPServer(("127.0.0.1", 4174), Handler).serve_forever()
