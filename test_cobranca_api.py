#!/usr/bin/env python3
"""
Script para testar criação de cobrança via API tRPC do servidor
Simula o que o app faz quando cria uma cobrança PIX
"""

import requests
import json
from datetime import datetime, timedelta

# Configurações
API_URL = "http://127.0.0.1:3000"
TRPC_URL = f"{API_URL}/trpc"

print(f"🔧 Testando API tRPC para criar cobrança PIX")
print(f"API URL: {API_URL}")
print()

# ============================================================================
# 1. Testar se servidor está respondendo
# ============================================================================
print("=" * 70)
print("1️⃣  VERIFICANDO CONEXÃO COM SERVIDOR")
print("=" * 70)

try:
    response = requests.get(f"{API_URL}/api/health", timeout=5)
    print(f"Status: {response.status_code}")
    print(f"✅ Servidor respondendo!")
except Exception as e:
    print(f"❌ Erro ao conectar: {e}")
    print(f"Certifique-se que o servidor está rodando em {API_URL}")
    exit(1)

print()

# ============================================================================
# 2. Criar cobrança PIX via tRPC
# ============================================================================
print("=" * 70)
print("2️⃣  CRIANDO COBRANÇA PIX VIA tRPC")
print("=" * 70)

# Dados da cobrança
due_date = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")

cobranca_data = {
    "moradorId": 1,  # Ajuste conforme necessário
    "tipo": "PIX",
    "valor": 350.00,
    "vencimento": due_date,
    "descricao": "Teste PIX Script - Mensalidade 2026-04"
}

print(f"Dados da cobrança:")
print(json.dumps(cobranca_data, indent=2, ensure_ascii=False))
print()

# Endpoint tRPC para criar cobrança
# Formato: /trpc/cobrancas.create?input=<JSON>
try:
    # Preparar input como JSON
    input_json = json.dumps(cobranca_data)
    
    # Fazer requisição GET com input como query param
    url = f"{TRPC_URL}/cobrancas.create?input={requests.utils.quote(input_json)}"
    
    print(f"URL: {url[:100]}...")
    print()
    
    response = requests.get(url, timeout=30)
    print(f"Status: {response.status_code}")
    print(f"Response:")
    
    try:
        result = response.json()
        print(json.dumps(result, indent=2, ensure_ascii=False))
        
        if response.status_code == 200:
            result_data = result.get("result", {}).get("data", {})
            if result_data.get("success"):
                print(f"\n✅ Cobrança criada com sucesso!")
                print(f"   ID: {result_data.get('id')}")
                print(f"   Status: {result_data.get('status')}")
                print(f"   PIX Copy/Paste: {result_data.get('pixCopyPaste', 'N/A')[:50]}...")
            else:
                print(f"\n❌ Erro ao criar cobrança: {result_data.get('error')}")
        else:
            print(f"\n❌ Erro na requisição: {response.text}")
    except json.JSONDecodeError:
        print(f"Response (texto): {response.text}")
        
except Exception as e:
    print(f"❌ Erro na requisição: {e}")
    import traceback
    traceback.print_exc()

print()
print("=" * 70)
print("✅ TESTE CONCLUÍDO")
print("=" * 70)
