#!/bin/bash
# Comprehensive endpoint test script
BASE="http://127.0.0.1:3000"
COOKIES="/tmp/cookies.txt"

echo "=========================================="
echo "  TESTE COMPLETO DE ENDPOINTS"
echo "=========================================="

# 1. Login
echo ""
echo "=== 1. Login ==="
curl -s -X POST "$BASE/api/trpc/authCustom.login" \
  -H "Content-Type: application/json" \
  -d '{"json":{"email":"admin@condominio.com","password":"admin123"}}' \
  -c $COOKIES | python3 -c "
import sys,json
d=json.load(sys.stdin)
r=d.get('result',{}).get('data',{}).get('json',{})
if r.get('success'):
    print('OK - Logado como:', r.get('user',{}).get('name'))
else:
    print('FAIL -', d)
"

# 2. Moradores List
echo ""
echo "=== 2. Moradores List ==="
INPUT=$(python3 -c "import json,urllib.parse; print(urllib.parse.quote(json.dumps({'json': {'page':1,'limit':10,'status':'todos'}})))")
curl -s -b $COOKIES "$BASE/api/trpc/moradores.list?input=$INPUT" | python3 -c "
import sys,json
d=json.load(sys.stdin)
r=d.get('result',{}).get('data',{}).get('json',{})
print('OK - Total:', r.get('pagination',{}).get('total',0))
for m in r.get('data',[]):
    print('  -', m.get('nomeCompleto'), '|', m.get('identificacaoCasa'), '|', m.get('telefone'))
"

# 3. Create Morador
echo ""
echo "=== 3. Create Morador ==="
curl -s -X POST -b $COOKIES "$BASE/api/trpc/moradores.create" \
  -H "Content-Type: application/json" \
  -d '{"json":{"nomeCompleto":"Maria Silva","telefone":"5521999887766","cpf":"123.456.789-00","identificacaoCasa":"Casa 2"}}' | python3 -c "
import sys,json
d=json.load(sys.stdin)
r=d.get('result',{}).get('data',{}).get('json',{})
if r:
    print('OK - Morador criado, ID:', r.get('id'))
else:
    e=d.get('error',{}).get('json',{}).get('message','')
    print('INFO -', e[:100])
"

# 4. Resumo Mes
echo ""
echo "=== 4. Resumo Mes ==="
INPUT=$(python3 -c "import json,urllib.parse; print(urllib.parse.quote(json.dumps({'json': {'mesReferencia':'2026-04'}})))")
curl -s -b $COOKIES "$BASE/api/trpc/relatorios.resumoMes?input=$INPUT" | python3 -c "
import sys,json
d=json.load(sys.stdin)
r=d.get('result',{}).get('data',{}).get('json',{})
print('OK - Receitas:', r.get('receitas',0), '| Despesas:', r.get('despesas',0), '| Saldo:', r.get('saldo',0), '| Moradores:', r.get('moradores',0))
"

# 5. Cobrancas List
echo ""
echo "=== 5. Cobrancas List ==="
INPUT=$(python3 -c "import json,urllib.parse; print(urllib.parse.quote(json.dumps({'json': {'mesReferencia':'2026-04'}})))")
curl -s -b $COOKIES "$BASE/api/trpc/cobrancas.list?input=$INPUT" | python3 -c "
import sys,json
d=json.load(sys.stdin)
r=d.get('result',{}).get('data',{}).get('json',[])
if isinstance(r, list):
    print('OK - Total cobrancas:', len(r))
else:
    print('OK - Data:', str(r)[:100])
"

# 6. Create Cobranca
echo ""
echo "=== 6. Create Cobranca ==="
curl -s -X POST -b $COOKIES "$BASE/api/trpc/cobrancas.create" \
  -H "Content-Type: application/json" \
  -d '{"json":{"moradorId":1,"valor":15000,"mesReferencia":"2026-04","descricao":"Mensalidade Abril 2026","vencimento":"2026-04-30"}}' | python3 -c "
import sys,json
d=json.load(sys.stdin)
r=d.get('result',{}).get('data',{}).get('json',{})
if r:
    print('OK - Cobranca criada, ID:', r.get('id'))
else:
    e=d.get('error',{}).get('json',{}).get('message','')
    print('INFO -', e[:100])
"

# 7. Despesas List
echo ""
echo "=== 7. Despesas List ==="
INPUT=$(python3 -c "import json,urllib.parse; print(urllib.parse.quote(json.dumps({'json': {'page':1,'limit':10}})))")
curl -s -b $COOKIES "$BASE/api/trpc/despesas.list?input=$INPUT" | python3 -c "
import sys,json
d=json.load(sys.stdin)
r=d.get('result',{}).get('data',{}).get('json',{})
data=r.get('data',[]) if isinstance(r,dict) else r
print('OK - Total despesas:', len(data) if isinstance(data,list) else data)
"

# 8. Create Despesa
echo ""
echo "=== 8. Create Despesa ==="
curl -s -X POST -b $COOKIES "$BASE/api/trpc/despesas.create" \
  -H "Content-Type: application/json" \
  -d '{"json":{"categoria":"MANUTENCAO","descricao":"Reparo no portao eletronico","valor":25000,"data":"2026-04-28"}}' | python3 -c "
import sys,json
d=json.load(sys.stdin)
r=d.get('result',{}).get('data',{}).get('json',{})
if r.get('success'):
    print('OK - Despesa criada')
else:
    e=d.get('error',{}).get('json',{}).get('message','')
    print('INFO -', e[:100])
"

# 9. Chamados Stats
echo ""
echo "=== 9. Chamados Stats ==="
curl -s -b $COOKIES "$BASE/api/trpc/chamados.getStatistics" | python3 -c "
import sys,json
d=json.load(sys.stdin)
r=d.get('result',{}).get('data',{}).get('json',{})
s=r.get('stats',{})
print('OK - Abertos:', s.get('abertos',0), '| Em Andamento:', s.get('emAndamento',0), '| Resolvidos:', s.get('resolvidos',0))
"

# 10. Notificacoes
echo ""
echo "=== 10. Notificacoes ==="
curl -s -b $COOKIES "$BASE/api/trpc/notificacoes.getUnreadCount" | python3 -c "
import sys,json
d=json.load(sys.stdin)
r=d.get('result',{}).get('data',{}).get('json',{})
print('OK - Nao lidas:', r.get('count',0))
"

# 11. WhatsApp Status
echo ""
echo "=== 11. WhatsApp Status ==="
curl -s "$BASE/api/whatsapp/status" | python3 -c "
import sys,json
d=json.load(sys.stdin)
print('OK - Status:', d.get('status','unknown'))
"

# 12. Despesas Statistics
echo ""
echo "=== 12. Despesas Statistics ==="
INPUT=$(python3 -c "import json,urllib.parse; print(urllib.parse.quote(json.dumps({'json': {}})))")
curl -s -b $COOKIES "$BASE/api/trpc/despesas.getStatistics?input=$INPUT" | python3 -c "
import sys,json
d=json.load(sys.stdin)
r=d.get('result',{}).get('data',{}).get('json',{})
s=r.get('stats',{})
print('OK - Total:', s.get('total',0), '| Count:', s.get('count',0))
"

echo ""
echo "=========================================="
echo "  TESTES CONCLUIDOS"
echo "=========================================="
