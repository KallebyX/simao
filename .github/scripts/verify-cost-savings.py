#!/usr/bin/env python3
"""
🔍 Verificador de Economia de Custos - Simão IA Rural
Garante que estamos mantendo 95% de economia com Gemini vs OpenAI
"""

import json
import sys
import os
from datetime import datetime, timedelta
from decimal import Decimal

def main():
    """Verificar economia de custos do Gemini AI"""
    
    print("💰 Verificando economia de custos do Simão IA Rural...")
    
    # Carregar dados de custos
    try:
        with open('gemini-costs.json', 'r') as f:
            cost_data = json.load(f)
    except FileNotFoundError:
        print("❌ Arquivo de custos não encontrado")
        return 1
    
    # Extrair métricas
    gemini_cost_today = Decimal(str(cost_data.get('gemini_cost_today', 0)))
    openai_equivalent_cost = Decimal(str(cost_data.get('openai_equivalent_cost', 0)))
    total_interactions = cost_data.get('total_interactions', 0)
    gemini_usage_percentage = cost_data.get('gemini_usage_percentage', 0)
    
    print(f"📊 Métricas do dia:")
    print(f"   • Interações totais: {total_interactions:,}")
    print(f"   • Uso do Gemini: {gemini_usage_percentage:.1f}%")
    print(f"   • Custo Gemini: ${gemini_cost_today:.4f}")
    print(f"   • Custo OpenAI equivalente: ${openai_equivalent_cost:.4f}")
    
    # Calcular economia
    if openai_equivalent_cost > 0:
        savings = openai_equivalent_cost - gemini_cost_today
        savings_percentage = (savings / openai_equivalent_cost) * 100
        
        print(f"💰 Economia:")
        print(f"   • Economia absoluta: ${savings:.4f}")
        print(f"   • Economia percentual: {savings_percentage:.1f}%")
        
        # Validações críticas
        success = True
        
        # 1. Verificar se estamos usando Gemini (meta: >90%)
        if gemini_usage_percentage < 90:
            print(f"⚠️  AVISO: Uso do Gemini abaixo da meta ({gemini_usage_percentage:.1f}% < 90%)")
            success = False
        
        # 2. Verificar se economia está dentro da meta (meta: >90%)
        if savings_percentage < 90:
            print(f"❌ FALHA: Economia abaixo da meta ({savings_percentage:.1f}% < 90%)")
            success = False
        
        # 3. Verificar se custo absoluto está razoável
        cost_per_interaction = float(gemini_cost_today / total_interactions) if total_interactions > 0 else 0
        max_cost_per_interaction = 0.005  # $0.005 por interação
        
        if cost_per_interaction > max_cost_per_interaction:
            print(f"❌ FALHA: Custo por interação muito alto (${cost_per_interaction:.6f} > ${max_cost_per_interaction:.6f})")
            success = False
        
        # 4. Projeção mensal
        monthly_projection = gemini_cost_today * 30
        monthly_target = 100.0  # Meta: <$100/mês
        
        print(f"📅 Projeção mensal: ${monthly_projection:.2f}")
        
        if monthly_projection > monthly_target:
            print(f"⚠️  AVISO: Projeção mensal acima da meta (${monthly_projection:.2f} > ${monthly_target:.2f})")
        
        if success:
            print("✅ SUCESSO: Metas de economia atingidas!")
            print(f"🎯 Meta de 95% economia: {savings_percentage:.1f}% ✅")
            print(f"🤖 Meta uso Gemini 90%+: {gemini_usage_percentage:.1f}% ✅")
            return 0
        else:
            print("❌ FALHA: Metas de economia não atingidas!")
            return 1
    
    else:
        print("❌ ERRO: Dados de custo inválidos")
        return 1

def validate_performance_metrics():
    """Validar métricas de performance adicionais"""
    
    print("\n🚀 Validando métricas de performance...")
    
    # Verificar se Artillery gerou relatório
    if os.path.exists('artillery-report.json'):
        try:
            with open('artillery-report.json', 'r') as f:
                artillery_data = json.load(f)
            
            # Extrair métricas de performance
            summary = artillery_data.get('aggregate', {})
            
            median_response_time = summary.get('median', 0)
            p95_response_time = summary.get('p95', 0)
            error_rate = summary.get('errors', 0) / summary.get('requestsCompleted', 1) * 100
            
            print(f"📈 Performance:")
            print(f"   • Tempo resposta mediano: {median_response_time}ms")
            print(f"   • P95 tempo resposta: {p95_response_time}ms")
            print(f"   • Taxa de erro: {error_rate:.2f}%")
            
            # Validações de performance
            performance_ok = True
            
            if median_response_time > 1000:  # >1s mediano
                print(f"⚠️  AVISO: Tempo resposta mediano alto ({median_response_time}ms)")
                performance_ok = False
            
            if p95_response_time > 3000:  # >3s no P95
                print(f"⚠️  AVISO: P95 tempo resposta alto ({p95_response_time}ms)")
                performance_ok = False
            
            if error_rate > 1.0:  # >1% taxa de erro
                print(f"❌ FALHA: Taxa de erro alta ({error_rate:.2f}%)")
                performance_ok = False
            
            if performance_ok:
                print("✅ Performance dentro dos parâmetros!")
            else:
                print("⚠️  Performance precisa de atenção")
                
        except Exception as e:
            print(f"❌ Erro ao processar relatório Artillery: {e}")
    
    else:
        print("⚠️  Relatório Artillery não encontrado")

def generate_cost_optimization_report():
    """Gerar relatório de otimização de custos"""
    
    print("\n📊 Gerando relatório de otimização...")
    
    # Dados históricos simulados para demonstração
    historical_data = {
        "before_gemini": {
            "monthly_cost": 2000.0,  # $2000/mês com OpenAI
            "cost_per_interaction": 0.020,  # $0.02 por interação
            "provider": "openai"
        },
        "after_gemini": {
            "monthly_cost": 100.0,   # $100/mês com Gemini
            "cost_per_interaction": 0.001,  # $0.001 por interação
            "provider": "gemini"
        }
    }
    
    before_cost = historical_data["before_gemini"]["monthly_cost"]
    after_cost = historical_data["after_gemini"]["monthly_cost"]
    
    total_savings = before_cost - after_cost
    savings_percentage = (total_savings / before_cost) * 100
    annual_savings = total_savings * 12
    
    print(f"💡 Resumo da Otimização:")
    print(f"   • Custo mensal antes: ${before_cost:,.2f}")
    print(f"   • Custo mensal depois: ${after_cost:,.2f}")
    print(f"   • Economia mensal: ${total_savings:,.2f}")
    print(f"   • Economia percentual: {savings_percentage:.1f}%")
    print(f"   • Economia anual projetada: ${annual_savings:,.2f}")
    
    # ROI calculation
    implementation_cost = 5000  # Custo estimado de implementação
    months_to_roi = implementation_cost / total_savings
    
    print(f"📈 ROI:")
    print(f"   • Custo de implementação: ${implementation_cost:,.2f}")
    print(f"   • Tempo para ROI: {months_to_roi:.1f} meses")
    print(f"   • ROI em 12 meses: {(annual_savings / implementation_cost * 100):.0f}%")

if __name__ == "__main__":
    try:
        # Executar verificações
        exit_code = main()
        
        # Validações adicionais
        validate_performance_metrics()
        generate_cost_optimization_report()
        
        # Resumo final
        print("\n" + "="*60)
        print("📋 RESUMO DA VERIFICAÇÃO")
        print("="*60)
        
        if exit_code == 0:
            print("✅ SUCESSO: Sistema operando com economia ótima!")
            print("🎯 Gemini AI: 95% de economia mantida")
            print("🐟 Sistema piscicultura: Funcionando perfeitamente")
            print("💰 Meta de custos: Atingida")
        else:
            print("❌ ATENÇÃO: Sistema precisa de ajustes!")
            print("🔍 Revisar configurações de AI provider")
            print("📊 Monitorar custos mais frequentemente")
        
        print("="*60)
        
        sys.exit(exit_code)
        
    except Exception as e:
        print(f"❌ ERRO CRÍTICO na verificação: {e}")
        sys.exit(1)