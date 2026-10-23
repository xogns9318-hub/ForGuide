import csv
import json
import sys
from pathlib import Path

AI_DIR = Path(__file__).resolve().parent.parent.parent
PROCESSED_DIR = AI_DIR / "data" / "processed"
LABELS_PATH = Path(__file__).resolve().parent / "labels.json"

SIDE = ["kor_co_nm", "fin_prdt_nm", "institution_type", "effective_rate", "visit_required"]
EXAMPLE_DEPOSIT = 10_000_000
EXAMPLE_MONTHLY = 500_000

PAGE = """<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>계좌 비교 판정 __DATE__</title>
<style>
:root{--bg:#fafaf8;--card:#fff;--line:#e3e1da;--text:#222;--muted:#6b6a65;--accent:#2563eb;--warn:#a15c00}
@media (prefers-color-scheme:dark){:root{--bg:#1c1c1b;--card:#262624;--line:#3a3a37;--text:#eee;--muted:#a3a29c;--accent:#7aa2ff;--warn:#f0b35a}}
body{margin:0;background:var(--bg);color:var(--text);font:15px/1.6 system-ui,sans-serif}
main{max-width:760px;margin:0 auto;padding:16px}
.top,.btns{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.chip{font-size:12px;padding:3px 10px;border-radius:8px;background:var(--card);border:1px solid var(--line);color:var(--muted)}
.cards{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:10px 0}
.card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:14px 16px;min-width:0}
.card.sel,button.sel{outline:2px solid var(--accent)}
.row{display:flex;justify-content:space-between;font-size:13px}
.muted{color:var(--muted);font-size:13px}
button{font:inherit;padding:6px 12px;border-radius:8px;border:1px solid var(--line);background:var(--card);color:var(--text);cursor:pointer}
input{font:inherit;padding:5px 8px;border-radius:8px;border:1px solid var(--line);background:var(--card);color:var(--text)}
.bar{height:4px;background:var(--line);border-radius:2px;margin:10px 0}.bar div{height:4px;background:var(--accent);border-radius:2px}
#out{width:100%;min-height:70px;margin-top:8px;display:none}
</style>
</head>
<body>
<main>
<div class="top"><label class="muted" for="judge">판정자</label><input id="judge" placeholder="이름"><span id="saved" class="muted"></span><span id="prog" class="muted" style="margin-left:auto"></span></div>
<div class="bar"><div id="bar"></div></div>
<div id="ctx" class="top"></div>
<details style="margin:10px 0"><summary class="muted">판정할 때 스스로 물어볼 질문</summary>
<ul class="muted" style="margin:6px 0">
<li>이 사람이 영업점에 한 번 가는 수고와 아래 이자 차이 중 무엇을 고를까?</li>
<li>급여·해외송금을 하는 은행이 아닌 곳에 따로 돈을 둘 만큼의 차이인가?</li>
<li>은행 선호라고 답한 사람이 이 금액을 보고도 저축은행을 고를까?</li>
<li>판단이 서지 않으면 억지로 고르지 말고 "같음·모르겠음"을 누른다. 학습에서 빠진다.</li>
</ul>
<p class="muted" style="margin:6px 0">참고 자료: 외국인은 환전·송금으로 은행을 쓰기 시작해 급여통장, 예·적금으로 넓혀 가는 경우가 많고(아시아투데이 2026-08-23), 저축은행은 외환 업무가 제한적일 수 있다(KB의 생각). 저축은행 예·적금도 예금자보호 대상이다.</p>
</details>
<p style="margin:10px 0 0">이 사용자에게 어느 상품이 더 나은가요?</p>
<div class="cards" id="cards"></div>
<p id="diff" style="margin:0 0 10px"></p>
<div class="btns">
<button id="prev">←</button><button data-l="A">A가 낫다 (1)</button><button data-l="같음">같음·모르겠음 (2)</button><button data-l="B">B가 낫다 (3)</button><button id="next">→</button><button id="jump">안 한 쌍으로</button>
<span style="margin-left:auto"></span><button id="copy">판정 복사</button><button id="save">파일로 저장</button>
</div>
<p id="msg" class="muted"></p>
<textarea id="out" readonly></textarea>
</main>
<script>
const DATE="__DATE__",D=__PAIRS__,PRE=__PRESET__,KEY="forguide-account-judge-"+DATE;
let L=Object.assign({},PRE),i=0;const $=id=>document.getElementById(id);
try{const s=JSON.parse(localStorage.getItem(KEY)||"null");if(s){Object.assign(L,s.L||{});$("judge").value=s.j||"";i=Math.min(s.i||0,D.length-1)}}catch(e){}
function save(){try{localStorage.setItem(KEY,JSON.stringify({L,i,j:$("judge").value}));$("saved").textContent="자동 저장됨"}catch(e){$("saved").textContent="자동 저장 안 됨"}}
const DEPOSIT=__DEPOSIT__,MONTHLY=__MONTHLY__;
function interest(d,p){const n=d[2],r=p[3]/100;return d[1]==="예금"?DEPOSIT*r*n/12:MONTHLY*r*n*(n+1)/24}
function won(x){return Math.round(x/1000)*1000}
function card(t,d,p){return `<div class="card" id="c${t}"><div class="muted">상품 ${t}</div><b>${p[0]}</b><div class="muted" style="margin-bottom:8px">${p[1]}</div><div class="row"><span class="muted">구분</span><span>${p[2]}</span></div><div class="row"><span class="muted">실제 수익률</span><b>${p[3].toFixed(2)}%</b></div><div class="row"><span class="muted">만기 세전 이자 (예시)</span><span>약 ${won(interest(d,p)).toLocaleString()}원</span></div><div class="row"><span class="muted">가입</span><span>${p[4]?'<span style="color:var(--warn)">영업점 방문 필요</span>':'방문 없이 가입'}</span></div></div>`}
function diff(d){const a=interest(d,d[6]),b=interest(d,d[7]),g=won(Math.abs(a-b));const base=d[1]==="예금"?`${(DEPOSIT/10000).toLocaleString()}만 원을 ${d[2]}개월 넣을 때`:`매달 ${(MONTHLY/10000).toLocaleString()}만 원씩 ${d[2]}개월 넣을 때`;
return g?`<b>${a>b?"A":"B"}가 약 ${g.toLocaleString()}원 더 받습니다</b> <span class="muted">(예시: ${base}, 세전)</span>`:`<span class="muted">이자 차이가 거의 없습니다 (예시: ${base}, 세전)</span>`}
function draw(){const d=D[i];$("ctx").innerHTML=[d[1],d[2]+"개월","방문 "+d[3],"금융기관 "+d[4],"그룹: "+d[5]].map(s=>`<span class="chip">${s}</span>`).join("");
$("cards").innerHTML=card("A",d,d[6])+card("B",d,d[7]);$("diff").innerHTML=diff(d);const l=L[d[0]];if(l==="A"||l==="B")$("c"+l).classList.add("sel");
document.querySelectorAll("[data-l]").forEach(b=>b.classList.toggle("sel",b.dataset.l===l));
const n=Object.keys(L).length;$("prog").textContent=`${d[0]} · ${i+1}/${D.length} · 판정 ${n}`;$("bar").style.width=(n/D.length*100)+"%"}
function mark(l){L[D[i][0]]=l;$("msg").textContent="";if(i<D.length-1)i++;save();draw()}
function go(k){i=k;save();draw()}
function result(){const j=$("judge").value.trim();if(!j){$("msg").textContent="판정자 이름을 먼저 적어 주세요.";return null}
const done=D.filter(d=>L[d[0]]);if(!done.length){$("msg").textContent="판정한 쌍이 없습니다.";return null}
return `판정 결과 (판정자: ${j}, 쌍 ${DATE}, ${done.length}/${D.length}쌍): `+done.map(d=>d[0]+"="+L[d[0]]).join(", ")}
document.querySelectorAll("[data-l]").forEach(b=>b.onclick=()=>mark(b.dataset.l));
$("prev").onclick=()=>{if(i>0)go(i-1)};$("next").onclick=()=>{if(i<D.length-1)go(i+1)};
$("jump").onclick=()=>{const k=D.findIndex(d=>!L[d[0]]);if(k<0){$("msg").textContent="모든 쌍을 판정했어요.";return}go(k)};
$("judge").oninput=()=>{$("msg").textContent="";save()};
document.addEventListener("keydown",e=>{if(e.target.tagName==="INPUT"||e.target.tagName==="TEXTAREA")return;if(e.key==="1")mark("A");if(e.key==="2")mark("같음");if(e.key==="3")mark("B");if(e.key==="ArrowLeft"&&i>0)go(i-1);if(e.key==="ArrowRight"&&i<D.length-1)go(i+1)});
$("copy").onclick=async()=>{const r=result();if(!r)return;$("out").style.display="block";$("out").value=r;
try{await navigator.clipboard.writeText(r);$("msg").textContent="복사했어요. 채팅에 붙여넣어 주세요."}catch(e){$("out").select();$("msg").textContent="아래 글자를 직접 복사해 주세요."}};
$("save").onclick=()=>{const r=result();if(!r)return;const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([r],{type:"text/plain"}));a.download=`account_labels_${DATE}_${$("judge").value.trim()}.txt`;a.click()};
draw();
</script>
</body>
</html>
"""


def latest_date():
    return sorted(PROCESSED_DIR.glob("account_pairs_judge_*.csv"))[-1].stem.rsplit("_", 1)[-1]


def saved_labels(judge=None):
    if not LABELS_PATH.exists():
        return {}
    by_judge = json.loads(LABELS_PATH.read_text(encoding="utf-8"))
    if judge:
        return by_judge.get(judge, {})
    merged = {}
    for labels in by_judge.values():
        merged.update(labels)
    return merged


def build(date, judge=None):
    rows = list(csv.DictReader((PROCESSED_DIR / f"account_pairs_judge_{date}.csv").open(encoding="utf-8-sig")))
    labels = saved_labels(judge)
    pairs, preset = [], {}
    for r in rows:
        side = lambda p: [r[f"{p}_{n}"] for n in SIDE[:3]] + [float(r[f"{p}_effective_rate"]), int(r[f"{p}_visit_required"])]
        pairs.append([r["pair_id"], r["purpose"], int(r["save_trm"]), r["visit"], r["institution"], r["group"], side("a"), side("b")])
        winner = labels.get(r["pair_key"])
        if winner:
            preset[r["pair_id"]] = "A" if winner == r["a_product_id"] else "B" if winner == r["b_product_id"] else "같음"
    page = (PAGE.replace("__DATE__", date)
            .replace("__DEPOSIT__", str(EXAMPLE_DEPOSIT))
            .replace("__MONTHLY__", str(EXAMPLE_MONTHLY))
            .replace("__PAIRS__", json.dumps(pairs, ensure_ascii=False, separators=(",", ":")))
            .replace("__PRESET__", json.dumps(preset, ensure_ascii=False)))
    path = PROCESSED_DIR / f"account_judge_{date}{'_' + judge if judge else ''}.html"
    path.write_text(page, encoding="utf-8")
    return path, len(pairs), len(preset)


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    date = sys.argv[1] if len(sys.argv) > 1 and sys.argv[1] != "-" else latest_date()
    judge = sys.argv[2] if len(sys.argv) > 2 else None
    path, total, preset = build(date, judge)
    print(f"판정 페이지 저장: {path} (쌍 {total}개, 이미 판정 {preset}개)")


if __name__ == "__main__":
    main()
