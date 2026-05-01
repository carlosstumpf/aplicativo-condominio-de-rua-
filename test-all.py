#!/usr/bin/env python3
"""Comprehensive endpoint test for Gestão de Condomínio"""
import requests
import json

BASE = "http://127.0.0.1:3000"
session = requests.Session()

def test(name, method, url, data=None, params=None):
    try:
        if method == "GET":
            r = session.get(url, params=params, timeout=10)
        else:
            r = session.post(url, json=data, timeout=10)
        
        if r.status_code == 200:
            d = r.json()
            if "result" in d:
                result = d["result"]["data"].get("json", d["result"]["data"])
                print(f"  OK  {name}: {json.dumps(result, default=str)[:120]}")
                return result
            else:
                print(f"  OK  {name}: {json.dumps(d, default=str)[:120]}")
                return d
        else:
            print(f"  FAIL {name}: HTTP {r.status_code} - {r.text[:100]}")
            return None
    except Exception as e:
        print(f"  FAIL {name}: {e}")
        return None

print("=" * 60)
print("  TESTE COMPLETO DE ENDPOINTS")
print("=" * 60)

# 1. Login
print("\n--- Autenticação ---")
r = test("Login", "POST", f"{BASE}/api/trpc/authCustom.login", 
         {"json": {"email": "admin@condominio.com", "password": "admin123"}})

# 2. Moradores
print("\n--- Moradores ---")
test("Moradores List", "GET", f"{BASE}/api/trpc/moradores.list",
     params={"input": json.dumps({"json": {"page": 1, "limit": 10, "status": "todos"}})})

test("Inadimplentes", "GET", f"{BASE}/api/trpc/moradores.getInadimplentes",
     params={"input": json.dumps({"json": {"page": 1, "limit": 10}})})

# 3. Relatórios
print("\n--- Relatórios ---")
test("Resumo Mês", "GET", f"{BASE}/api/trpc/relatorios.resumoMes",
     params={"input": json.dumps({"json": {"mesReferencia": "2026-04"}})})

# 4. Cobranças
print("\n--- Cobranças ---")
test("Cobranças List", "GET", f"{BASE}/api/trpc/cobrancas.list",
     params={"input": json.dumps({"json": {"mesReferencia": "2026-04"}})})

# 5. Despesas
print("\n--- Despesas ---")
test("Despesas List", "GET", f"{BASE}/api/trpc/despesas.list",
     params={"input": json.dumps({"json": {"page": 1, "limit": 10}})})

test("Despesas Stats", "GET", f"{BASE}/api/trpc/despesas.getStatistics",
     params={"input": json.dumps({"json": {}})})

# 6. Chamados
print("\n--- Chamados ---")
test("Chamados Stats", "GET", f"{BASE}/api/trpc/chamados.getStatistics")

# 7. Notificações
print("\n--- Notificações ---")
test("Unread Count", "GET", f"{BASE}/api/trpc/notificacoes.getUnreadCount")

test("Notificações List", "GET", f"{BASE}/api/trpc/notificacoes.list",
     params={"input": json.dumps({"json": {"page": 1, "limit": 10}})})

# 8. WhatsApp
print("\n--- WhatsApp ---")
test("WhatsApp Status", "GET", f"{BASE}/api/whatsapp/status")

# 9. Create operations
print("\n--- Operações de Criação ---")
test("Create Despesa", "POST", f"{BASE}/api/trpc/despesas.create",
     {"json": {"categoria": "MANUTENCAO", "descricao": "Teste reparo portao", "valor": 15000, "data": "2026-04-28"}})

test("Create Cobrança", "POST", f"{BASE}/api/trpc/cobrancas.create",
     {"json": {"moradorId": 1, "valor": 15000, "mesReferencia": "2026-04", "descricao": "Mensalidade Abril", "vencimento": "2026-04-30"}})

# 10. Webhook Admin
print("\n--- Webhook Admin ---")
test("Webhook Stats", "GET", f"{BASE}/api/trpc/webhookAdmin.getStatistics",
     params={"input": json.dumps({"json": {"days": 30}})})

print("\n" + "=" * 60)
print("  TESTES CONCLUÍDOS")
print("=" * 60)
