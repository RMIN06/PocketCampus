"""Local-only UI fixture server. Never deployed. No real accounts or API calls."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2] / "frontend" / "out"
FIXTURE = """<script>
localStorage.setItem('pc_token','local-ui-fixture');
localStorage.setItem('pc_user',JSON.stringify({id:'fixture',full_name:'Test Student',email:'test@example.invalid',avatar_color:'#234734'}));
const realFetch=window.fetch.bind(window);let expenses=[],budget=null;
window.fetch=async (url,options={})=>{
 const path=new URL(url,location.origin).pathname;
 if(!path.startsWith('/api/'))return realFetch(url,options);
 let data;const method=options.method||'GET';
 if(path.includes('/budgets/')){if(method==='PUT')budget=JSON.parse(options.body).amount;const spent=expenses.reduce((s,e)=>s+e.amount,0);data={month:path.split('/').pop(),amount:budget,spent,remaining:budget===null?null:budget-spent,alert:budget!==null&&spent>=budget/2};}
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
        if self.path == "/dashboard/":
            html = (ROOT / "dashboard/index.html").read_text(encoding="utf-8")
            body = html.replace("<head>", "<head>" + FIXTURE).encode()
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.end_headers()
            self.wfile.write(body)
        else:
            super().do_GET()


if __name__ == "__main__":
    ThreadingHTTPServer(("127.0.0.1", 4174), Handler).serve_forever()
