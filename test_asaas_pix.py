#!/usr/bin/env python3
"""
Script para testar geração de cobrança PIX via API Asaas
Testa: criar cliente, criar pagamento, buscar PIX QR Code
"""

import requests
import json
import os
from datetime import datetime, timedelta

# Configurações
ASAAS_API_KEY = os.getenv("ASAAS_API_KEY", "")
ASAAS_ENVIRONMENT = os.getenv("ASAAS_ENVIRONMENT", "sandbox")

# URLs da API
if ASAAS_ENVIRONMENT == "sandbox":
    BASE_URL = "https://sandbox.asaas.com/api/v3"
else:
    BASE_URL = "https://api.asaas.com/api/v3"

HEADERS = {
    "access_token": ASAAS_API_KEY,
    "Content-Type": "application/json"
}

print(f"🔧 Testando API Asaas")
print(f"Environment: {ASAAS_ENVIRONMENT}")
print(f"Base URL: {BASE_URL}")
print(f"API Key: {ASAAS_API_KEY[:20]}..." if ASAAS_API_KEY else "❌ API Key não configurada!")
print()

if not ASAAS_API_KEY:
    print("❌ ERRO: ASAAS_API_KEY não está configurada!")
    exit(1)

# ============================================================================
# 1. Criar Cliente (Customer)
# ============================================================================
print("=" * 70)
print("1️⃣  CRIANDO CLIENTE")
print("=" * 70)

customer_data = {
    "name": "Teste PIX Script",
    "email": "teste@example.com",
    "cpfCnpj": "12345678901",
    "phone": "11999999999",
    "mobilePhone": "11999999999",
    "address": "Rua Teste",
    "addressNumber": "123",
    "city": "São Paulo",
    "state": "SP",
    "postalCode": "01234567"
}

try:
    response = requests.post(
        f"{BASE_URL}/customers",
        headers=HEADERS,
        json=customer_data,
        timeout=10
    )
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
    
    if response.status_code in [200, 201]:
        customer = response.json()
        customer_id = customer.get("id")
        print(f"✅ Cliente criado: {customer_id}")
    else:
        print(f"❌ Erro ao criar cliente: {response.text}")
        exit(1)
except Exception as e:
    print(f"❌ Erro na requisição: {e}")
    exit(1)

print()

# ============================================================================
# 2. Criar Pagamento PIX
# ============================================================================
print("=" * 70)
print("2️⃣  CRIANDO PAGAMENTO PIX")
print("=" * 70)

due_date = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")

payment_data = {
    "customer": customer_id,
    "billingType": "PIX",
    "value": 350.00,
    "dueDate": due_date,
    "description": "Teste PIX - Mensalidade 2026-04"
}

try:
    response = requests.post(
        f"{BASE_URL}/payments",
        headers=HEADERS,
        json=payment_data,
        timeout=10
    )
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
    
    if response.status_code in [200, 201]:
        payment = response.json()
        payment_id = payment.get("id")
        print(f"✅ Pagamento criado: {payment_id}")
        print(f"   Status: {payment.get('status')}")
        print(f"   Valor: R$ {payment.get('value')}")
    else:
        print(f"❌ Erro ao criar pagamento: {response.text}")
        exit(1)
except Exception as e:
    print(f"❌ Erro na requisição: {e}")
    exit(1)

print()

# ============================================================================
# 3. Buscar PIX QR Code
# ============================================================================
print("=" * 70)
print("3️⃣  BUSCANDO PIX QR CODE")
print("=" * 70)

try:
    response = requests.get(
        f"{BASE_URL}/payments/{payment_id}/pixQrCode",
        headers=HEADERS,
        timeout=10
    )
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
    
    if response.status_code == 200:
        pix_data = response.json()
        print(f"✅ PIX QR Code obtido!")
        print(f"   QR Code: {pix_data.get('qrCode', 'N/A')[:50]}...")
        print(f"   Copia e Cola: {pix_data.get('copyPaste', 'N/A')[:50]}...")
    else:
        print(f"❌ Erro ao buscar PIX QR Code: {response.text}")
except Exception as e:
    print(f"❌ Erro na requisição: {e}")

print()

# ============================================================================
# 4. Buscar Dados do Pagamento (verificar status)
# ============================================================================
print("=" * 70)
print("4️⃣  VERIFICANDO STATUS DO PAGAMENTO")
print("=" * 70)

try:
    response = requests.get(
        f"{BASE_URL}/payments/{payment_id}",
        headers=HEADERS,
        timeout=10
    )
    print(f"Status: {response.status_code}")
    payment_full = response.json()
    print(f"Response: {json.dumps(payment_full, indent=2, ensure_ascii=False)}")
    
    if response.status_code == 200:
        print(f"✅ Dados do pagamento:")
        print(f"   ID: {payment_full.get('id')}")
        print(f"   Status: {payment_full.get('status')}")
        print(f"   Valor: R$ {payment_full.get('value')}")
        print(f"   Vencimento: {payment_full.get('dueDate')}")
        print(f"   PIX Copy/Paste: {payment_full.get('pixCopyPaste', 'N/A')[:50]}...")
        print(f"   PIX QR Code: {payment_full.get('pixQrCode', 'N/A')[:50]}...")
except Exception as e:
    print(f"❌ Erro na requisição: {e}")

print()
print("=" * 70)
print("✅ TESTE CONCLUÍDO")
print("=" * 70)
