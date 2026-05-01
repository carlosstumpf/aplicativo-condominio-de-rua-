#!/usr/bin/env python3
"""
Script to generate a PIX charge and display QR Code + Copy-Paste code
Uses the tRPC API to create a charge and display the payment details
"""

import requests
import json
import sys
import os
from datetime import datetime, timedelta
import qrcode

# Configuration
API_URL = "http://127.0.0.1:3000"
MORADOR_ID = 1  # Change to the desired morador ID
VALOR = 35000  # Value in cents (R$ 350.00)
MES_REFERENCIA = "2026-04"
VENCIMENTO = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")

# Get auth token from environment or use a test token
AUTH_TOKEN = os.environ.get("AUTH_TOKEN", "")

def get_auth_headers():
    """Get headers with authentication if available"""
    headers = {"Content-Type": "application/json"}
    if AUTH_TOKEN:
        headers["Authorization"] = f"Bearer {AUTH_TOKEN}"
    return headers

def create_pix_charge():
    """Create a PIX charge via tRPC API"""
    print("🔄 Criando cobrança PIX...")
    print(f"   Morador ID: {MORADOR_ID}")
    print(f"   Valor: R$ {VALOR / 100:.2f}")
    print(f"   Vencimento: {VENCIMENTO}")
    print()

    # Prepare the tRPC call
    # tRPC uses JSON-RPC format
    payload = {
        "0": {
            "json": {
                "moradorId": MORADOR_ID,
                "tipo": "PIX",
                "mesReferencia": MES_REFERENCIA,
                "valor": VALOR,
                "vencimento": VENCIMENTO,
                "descricao": f"Mensalidade {MES_REFERENCIA}"
            }
        }
    }

    try:
        # Call the tRPC endpoint
        response = requests.post(
            f"{API_URL}/api/trpc/cobrancas.create",
            json=payload,
            headers=get_auth_headers(),
            timeout=30
        )

        if response.status_code == 401:
            print("❌ Erro de autenticação (401)")
            print("   Você precisa estar autenticado para criar cobranças.")
            print()
            print("   Opções:")
            print("   1. Use a interface web do admin para criar cobranças")
            print("   2. Configure AUTH_TOKEN com um token válido")
            print()
            return None

        if response.status_code != 200:
            print(f"❌ Erro na API: {response.status_code}")
            print(f"   Resposta: {response.text[:500]}")
            return None

        data = response.json()
        print(f"✅ Cobrança criada com sucesso!")
        print()

        # Extract the result
        if isinstance(data, list) and len(data) > 0:
            result = data[0]
            if "result" in result and "data" in result["result"]:
                charge_data = result["result"]["data"]
                return charge_data
            elif "result" in result:
                return result["result"]

        return data

    except requests.exceptions.RequestException as e:
        print(f"❌ Erro ao conectar com a API: {e}")
        return None

def display_pix_details(charge_data):
    """Display PIX details and generate QR Code"""
    if not charge_data:
        print(f"❌ Erro ao criar cobrança: dados vazios")
        return

    # Check if it's an error response
    if isinstance(charge_data, dict):
        if "success" in charge_data and not charge_data["success"]:
            print(f"❌ Erro ao criar cobrança: {charge_data.get('error', 'Erro desconhecido')}")
            return
        if "error" in charge_data:
            print(f"❌ Erro: {charge_data.get('error')}")
            return

    print("=" * 60)
    print("📱 DETALHES DO PIX")
    print("=" * 60)
    print()

    # Display payment ID
    payment_id = charge_data.get("paymentId")
    print(f"ID do Pagamento: {payment_id}")
    print()

    # Display copy-paste code
    copy_paste = charge_data.get("pixCopyPaste")
    if copy_paste:
        print("📋 CÓDIGO PIX (Copiar e Colar):")
        print("-" * 60)
        print(copy_paste)
        print("-" * 60)
        print()
    else:
        print("⚠️  Código PIX não disponível")
        print()

    # Display QR Code
    qr_code = charge_data.get("pixQrCode")
    if qr_code:
        print("📲 QR CODE (Escanear com celular):")
        print("-" * 60)
        
        try:
            # Generate QR Code image
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_L,
                box_size=10,
                border=2,
            )
            qr.add_data(qr_code)
            qr.make(fit=True)
            
            # Display QR Code in terminal
            qr.print_ascii()
        except Exception as e:
            print(f"Erro ao gerar QR Code: {e}")
            print(f"Dados do QR Code: {qr_code[:100]}...")
        
        print("-" * 60)
        print()
    else:
        print("⚠️  QR Code não disponível")
        print()

    # Display additional info
    print("📊 INFORMAÇÕES DA COBRANÇA:")
    print(f"   Valor: R$ {VALOR / 100:.2f}")
    print(f"   Vencimento: {VENCIMENTO}")
    print(f"   Referência: {MES_REFERENCIA}")
    print()

    # Save to file
    if payment_id:
        output_file = f"pix_charge_{payment_id}.json"
        with open(output_file, "w") as f:
            json.dump(charge_data, f, indent=2)
        print(f"💾 Detalhes salvos em: {output_file}")
        print()

    # Instructions
    print("=" * 60)
    print("✅ INSTRUÇÕES:")
    print("=" * 60)
    if copy_paste:
        print("1. Copie o código PIX acima (Copiar e Colar)")
        print("2. Abra seu app de banco ou WhatsApp")
        print("3. Cole o código no app de pagamento")
        print("4. Confirme o pagamento")
        print()
        print("OU")
        print()
    if qr_code:
        print("1. Escaneie o QR Code com seu celular")
        print("2. Confirme o pagamento no seu banco")
        print()

def main():
    """Main function"""
    print()
    print("🚀 GERADOR DE COBRANÇA PIX")
    print("=" * 60)
    print()

    # Create charge
    charge_data = create_pix_charge()

    if charge_data:
        display_pix_details(charge_data)
    else:
        print("❌ Falha ao criar cobrança PIX")
        print()
        print("💡 Dica: Para usar este script, você precisa:")
        print("   1. Estar autenticado no sistema")
        print("   2. Ter permissão de admin")
        print("   3. Ter um morador cadastrado com ID = 1")
        print()
        print("   Use a interface web para criar cobranças:")
        print("   http://localhost:8081 → Admin → Cobranças")
        sys.exit(1)

if __name__ == "__main__":
    main()
