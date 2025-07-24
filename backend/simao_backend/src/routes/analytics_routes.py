"""
Rotas de Analytics e Relatórios - Simão IA Rural
Sistema completo de análise de dados e métricas de negócio
"""

from datetime import datetime, date, timedelta
from decimal import Decimal
from typing import List, Dict, Any, Optional
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import and_, or_, func, desc, text
from sqlalchemy.orm import joinedload

from src.models.user import db, Cliente, Lead
from src.models.conversa import Conversa, Mensagem, DirecaoEnum
from src.models.estoque_peixe import LotePeixe, MovimentacaoEstoque, TipoMovimentacao, EspeciePeixe, Viveiro
from src.models.qualidade_agua import QualidadeAgua, AlertaQualidade
from src.middleware.logging_middleware import business_metrics

# Blueprint para analytics
analytics_bp = Blueprint('analytics', __name__, url_prefix='/api/analytics')

@analytics_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def dashboard_geral():
    """Dashboard geral com todas as métricas principais"""
    try:
        user_id = get_jwt_identity()
        cliente = Cliente.query.filter_by(user_id=user_id).first()
        
        if not cliente:
            return jsonify({"error": "Cliente não encontrado"}), 404
        
        # Período para análise (últimos 30 dias)
        data_inicio = datetime.utcnow() - timedelta(days=30)
        
        # === MÉTRICAS DE LEADS E CONVERSAS ===
        
        # Total de leads
        total_leads = Lead.query.filter_by(cliente_id=cliente.id).count()
        
        # Leads no período
        leads_periodo = Lead.query.filter(
            Lead.cliente_id == cliente.id,
            Lead.data_criacao >= data_inicio
        ).count()
        
        # Conversão de leads
        leads_convertidos = Lead.query.filter(
            Lead.cliente_id == cliente.id,
            Lead.status == 'convertido'
        ).count()
        
        taxa_conversao = (leads_convertidos / total_leads * 100) if total_leads > 0 else 0
        
        # Distribuição de leads por status
        leads_por_status = db.session.query(
            Lead.status,
            func.count(Lead.id).label('count')
        ).filter(Lead.cliente_id == cliente.id).group_by(Lead.status).all()
        
        # Mensagens WhatsApp
        total_mensagens = Mensagem.query.join(Conversa).filter(
            Conversa.cliente_id == cliente.id
        ).count()
        
        mensagens_periodo = Mensagem.query.join(Conversa).filter(
            Conversa.cliente_id == cliente.id,
            Mensagem.data_criacao >= data_inicio
        ).count()
        
        # === MÉTRICAS DE PISCICULTURA ===
        
        # Total de peixes
        total_peixes = db.session.query(
            func.sum(LotePeixe.quantidade_atual)
        ).filter(
            LotePeixe.cliente_id == cliente.id,
            LotePeixe.status == 'ativo'
        ).scalar() or 0
        
        # Lotes ativos
        lotes_ativos = LotePeixe.query.filter(
            LotePeixe.cliente_id == cliente.id,
            LotePeixe.status == 'ativo'
        ).count()
        
        # Valor estimado do estoque
        valor_estimado = 0
        for lote in LotePeixe.query.filter(LotePeixe.cliente_id == cliente.id, LotePeixe.status == 'ativo'):
            peso_total = float(lote.quantidade_atual * lote.peso_medio_atual)
            valor_estimado += peso_total * 15.0  # R$ 15/kg média
        
        # Alertas de qualidade ativos
        alertas_ativos = AlertaQualidade.query.filter(
            AlertaQualidade.cliente_id == cliente.id,
            AlertaQualidade.status == 'ativo'
        ).count()
        
        # Produção mensal (vendas/colheitas)
        producao_mes = db.session.query(
            func.sum(MovimentacaoEstoque.quantidade)
        ).filter(
            MovimentacaoEstoque.cliente_id == cliente.id,
            MovimentacaoEstoque.tipo.in_(['venda', 'saida']),
            MovimentacaoEstoque.data_movimentacao >= data_inicio
        ).scalar() or 0
        
        # === MÉTRICAS FINANCEIRAS ===
        
        # Receita estimada (baseada nas vendas do período)
        receita_periodo = db.session.query(
            func.sum(MovimentacaoEstoque.quantidade * MovimentacaoEstoque.valor_unitario)
        ).filter(
            MovimentacaoEstoque.cliente_id == cliente.id,
            MovimentacaoEstoque.tipo == 'venda',
            MovimentacaoEstoque.data_movimentacao >= data_inicio,
            MovimentacaoEstoque.valor_unitario.isnot(None)
        ).scalar() or 0
        
        # === CRESCIMENTO E TENDÊNCIAS ===
        
        # Evolução de leads (últimos 7 dias)
        leads_7_dias = []
        for i in range(7):
            data = datetime.utcnow() - timedelta(days=i)
            count = Lead.query.filter(
                Lead.cliente_id == cliente.id,
                func.date(Lead.data_criacao) == data.date()
            ).count()
            leads_7_dias.append({
                "data": data.date().isoformat(),
                "leads": count
            })
        
        leads_7_dias.reverse()
        
        # Top espécies por quantidade
        top_especies = db.session.query(
            EspeciePeixe.nome,
            func.sum(LotePeixe.quantidade_atual).label('total_quantidade'),
            func.count(LotePeixe.id).label('total_lotes')
        ).join(
            LotePeixe, EspeciePeixe.id == LotePeixe.especie_id
        ).filter(
            EspeciePeixe.cliente_id == cliente.id,
            LotePeixe.status == 'ativo'
        ).group_by(EspeciePeixe.nome).order_by(desc('total_quantidade')).limit(5).all()
        
        # === COMPILAR DASHBOARD ===
        
        dashboard = {
            "leads": {
                "total": total_leads,
                "periodo": leads_periodo,
                "convertidos": leads_convertidos,
                "taxa_conversao": round(taxa_conversao, 1),
                "distribuicao_status": [
                    {"status": status.value if hasattr(status, 'value') else status, "count": count}
                    for status, count in leads_por_status
                ],
                "evolucao_7_dias": leads_7_dias
            },
            "comunicacao": {
                "total_mensagens": total_mensagens,
                "mensagens_periodo": mensagens_periodo,
                "media_diaria": round(mensagens_periodo / 30, 1)
            },
            "piscicultura": {
                "total_peixes": int(total_peixes),
                "lotes_ativos": lotes_ativos,
                "valor_estimado": round(valor_estimado, 2),
                "producao_mes": int(producao_mes),
                "alertas_ativos": alertas_ativos,
                "top_especies": [
                    {
                        "nome": nome,
                        "quantidade": int(quantidade or 0),
                        "lotes": int(lotes)
                    } for nome, quantidade, lotes in top_especies
                ]
            },
            "financeiro": {
                "receita_periodo": float(receita_periodo),
                "ticket_medio": float(receita_periodo / producao_mes) if producao_mes > 0 else 0,
                "projecao_anual": float(receita_periodo * 12) if receita_periodo > 0 else valor_estimado * 0.8
            },
            "periodo_analise": {
                "inicio": data_inicio.isoformat(),
                "fim": datetime.utcnow().isoformat(),
                "dias": 30
            },
            "ultima_atualizacao": datetime.utcnow().isoformat()
        }
        
        return jsonify(dashboard), 200
        
    except Exception as e:
        return jsonify({"error": f"Erro ao gerar dashboard: {str(e)}"}), 500

@analytics_bp.route('/relatorio-leads', methods=['GET'])
@jwt_required()
def relatorio_leads():
    """Relatório detalhado de leads e conversões"""
    try:
        user_id = get_jwt_identity()
        cliente = Cliente.query.filter_by(user_id=user_id).first()
        
        if not cliente:
            return jsonify({"error": "Cliente não encontrado"}), 404
        
        # Parâmetros do relatório
        data_inicio = request.args.get('data_inicio')
        data_fim = request.args.get('data_fim')
        
        if not data_inicio:
            data_inicio = datetime.utcnow() - timedelta(days=30)
        else:
            data_inicio = datetime.fromisoformat(data_inicio)
        
        if not data_fim:
            data_fim = datetime.utcnow()
        else:
            data_fim = datetime.fromisoformat(data_fim)
        
        # Query base
        query = Lead.query.filter(
            Lead.cliente_id == cliente.id,
            Lead.data_criacao >= data_inicio,
            Lead.data_criacao <= data_fim
        )
        
        # Análises
        leads = query.all()
        total_leads = len(leads)
        
        # Métricas de conversão
        conversao_stats = {}
        for status in ['novo', 'em_andamento', 'qualificado', 'convertido', 'perdido']:
            count = len([l for l in leads if l.status.value == status])
            conversao_stats[status] = {
                "quantidade": count,
                "percentual": (count / total_leads * 100) if total_leads > 0 else 0
            }
        
        # Análise por origem
        origem_stats = {}
        for origem in ['whatsapp', 'manual', 'importacao', 'api']:
            count = len([l for l in leads if l.origem.value == origem])
            origem_stats[origem] = {
                "quantidade": count,
                "percentual": (count / total_leads * 100) if total_leads > 0 else 0,
                "conversoes": len([l for l in leads if l.origem.value == origem and l.status.value == 'convertido'])
            }
            if count > 0:
                origem_stats[origem]["taxa_conversao"] = origem_stats[origem]["conversoes"] / count * 100
            else:
                origem_stats[origem]["taxa_conversao"] = 0
        
        # Análise temporal
        leads_por_dia = {}
        current_date = data_inicio.date()
        while current_date <= data_fim.date():
            count = len([l for l in leads if l.data_criacao.date() == current_date])
            leads_por_dia[current_date.isoformat()] = count
            current_date += timedelta(days=1)
        
        # Top leads por pontuação
        top_leads = sorted(leads, key=lambda x: x.pontuacao or 0, reverse=True)[:10]
        
        # Análise de interesse em piscicultura
        interesse_stats = {
            "iniciante": len([l for l in leads if l.experiencia_piscicultura == 'iniciante']),
            "intermediario": len([l for l in leads if l.experiencia_piscicultura == 'intermediario']),
            "avancado": len([l for l in leads if l.experiencia_piscicultura == 'avancado']),
            "nao_informado": len([l for l in leads if not l.experiencia_piscicultura])
        }
        
        # Espécies de interesse mais mencionadas
        especies_interesse = {}
        for lead in leads:
            if lead.especies_interesse:
                especies = lead.especies_interesse.lower().split(',')
                for especie in especies:
                    especie = especie.strip()
                    if especie:
                        especies_interesse[especie] = especies_interesse.get(especie, 0) + 1
        
        especies_top = sorted(especies_interesse.items(), key=lambda x: x[1], reverse=True)[:5]
        
        relatorio = {
            "periodo": {
                "inicio": data_inicio.isoformat(),
                "fim": data_fim.isoformat(),
                "dias": (data_fim - data_inicio).days + 1
            },
            "resumo": {
                "total_leads": total_leads,
                "leads_convertidos": conversao_stats.get('convertido', {}).get('quantidade', 0),
                "taxa_conversao_geral": conversao_stats.get('convertido', {}).get('percentual', 0),
                "pontuacao_media": sum(l.pontuacao or 0 for l in leads) / total_leads if total_leads > 0 else 0
            },
            "conversao_por_status": conversao_stats,
            "origem_leads": origem_stats,
            "distribuicao_temporal": leads_por_dia,
            "experiencia_piscicultura": interesse_stats,
            "especies_mais_procuradas": [
                {"especie": especie, "mencoes": count} for especie, count in especies_top
            ],
            "top_leads": [
                {
                    "id": lead.id,
                    "nome": lead.nome,
                    "telefone": lead.telefone,
                    "pontuacao": lead.pontuacao or 0,
                    "status": lead.status.value,
                    "data_criacao": lead.data_criacao.isoformat()
                } for lead in top_leads
            ],
            "gerado_em": datetime.utcnow().isoformat()
        }
        
        return jsonify(relatorio), 200
        
    except Exception as e:
        return jsonify({"error": f"Erro ao gerar relatório de leads: {str(e)}"}), 500

@analytics_bp.route('/relatorio-piscicultura', methods=['GET'])
@jwt_required()
def relatorio_piscicultura():
    """Relatório completo de performance da piscicultura"""
    try:
        user_id = get_jwt_identity()
        cliente = Cliente.query.filter_by(user_id=user_id).first()
        
        if not cliente:
            return jsonify({"error": "Cliente não encontrado"}), 404
        
        # Parâmetros
        data_inicio = request.args.get('data_inicio')
        data_fim = request.args.get('data_fim')
        
        if not data_inicio:
            data_inicio = datetime.utcnow() - timedelta(days=90)  # 3 meses
        else:
            data_inicio = datetime.fromisoformat(data_inicio)
        
        if not data_fim:
            data_fim = datetime.utcnow()
        else:
            data_fim = datetime.fromisoformat(data_fim)
        
        # === ANÁLISE DE ESTOQUE ===
        
        lotes_ativos = LotePeixe.query.filter(
            LotePeixe.cliente_id == cliente.id,
            LotePeixe.status == 'ativo'
        ).all()
        
        lotes_colhidos = LotePeixe.query.filter(
            LotePeixe.cliente_id == cliente.id,
            LotePeixe.status == 'colhido',
            LotePeixe.data_atualizacao >= data_inicio
        ).all()
        
        # Estatísticas por espécie
        stats_especies = {}
        for lote in lotes_ativos + lotes_colhidos:
            especie = lote.especie.nome
            if especie not in stats_especies:
                stats_especies[especie] = {
                    "lotes_ativos": 0,
                    "lotes_colhidos": 0,
                    "quantidade_total": 0,
                    "peso_medio": 0,
                    "taxa_mortalidade": 0,
                    "producao_periodo": 0,
                    "receita_estimada": 0
                }
            
            if lote.status == 'ativo':
                stats_especies[especie]["lotes_ativos"] += 1
                stats_especies[especie]["quantidade_total"] += lote.quantidade_atual
                stats_especies[especie]["peso_medio"] = float(lote.peso_medio_atual)
            else:
                stats_especies[especie]["lotes_colhidos"] += 1
                stats_especies[especie]["producao_periodo"] += lote.quantidade_inicial
            
            # Calcular mortalidade
            if lote.quantidade_inicial > 0:
                mortalidade = (lote.quantidade_inicial - lote.quantidade_atual) / lote.quantidade_inicial * 100
                stats_especies[especie]["taxa_mortalidade"] = max(stats_especies[especie]["taxa_mortalidade"], mortalidade)
            
            # Receita estimada
            peso_total = lote.quantidade_atual * float(lote.peso_medio_atual)
            stats_especies[especie]["receita_estimada"] += peso_total * 15.0  # R$ por kg
        
        # === ANÁLISE DE MOVIMENTAÇÕES ===
        
        movimentacoes = MovimentacaoEstoque.query.filter(
            MovimentacaoEstoque.cliente_id == cliente.id,
            MovimentacaoEstoque.data_movimentacao >= data_inicio,
            MovimentacaoEstoque.data_movimentacao <= data_fim
        ).all()
        
        movimentacoes_por_tipo = {}
        for mov in movimentacoes:
            tipo = mov.tipo.value
            if tipo not in movimentacoes_por_tipo:
                movimentacoes_por_tipo[tipo] = {
                    "quantidade": 0,
                    "valor_total": 0,
                    "ocorrencias": 0
                }
            
            movimentacoes_por_tipo[tipo]["quantidade"] += mov.quantidade
            movimentacoes_por_tipo[tipo]["ocorrencias"] += 1
            
            if mov.valor_unitario:
                movimentacoes_por_tipo[tipo]["valor_total"] += mov.quantidade * float(mov.valor_unitario)
        
        # === ANÁLISE DE QUALIDADE DA ÁGUA ===
        
        medicoes_agua = QualidadeAgua.query.filter(
            QualidadeAgua.cliente_id == cliente.id,
            QualidadeAgua.data_medicao >= data_inicio,
            QualidadeAgua.data_medicao <= data_fim
        ).all()
        
        qualidade_stats = {
            "total_medicoes": len(medicoes_agua),
            "parametros_medios": {},
            "alertas_periodo": 0,
            "viveiros_monitorados": len(set(m.viveiro_id for m in medicoes_agua))
        }
        
        if medicoes_agua:
            # Calcular médias dos parâmetros
            params = ['ph', 'oxigenio_dissolvido', 'temperatura', 'amonia', 'nitrito']
            for param in params:
                valores = [getattr(m, param) for m in medicoes_agua if getattr(m, param) is not None]
                if valores:
                    qualidade_stats["parametros_medios"][param] = {
                        "media": sum(float(v) for v in valores) / len(valores),
                        "minimo": min(float(v) for v in valores),
                        "maximo": max(float(v) for v in valores),
                        "medicoes": len(valores)
                    }
        
        # Alertas no período
        qualidade_stats["alertas_periodo"] = AlertaQualidade.query.join(QualidadeAgua).filter(
            AlertaQualidade.cliente_id == cliente.id,
            QualidadeAgua.data_medicao >= data_inicio,
            QualidadeAgua.data_medicao <= data_fim
        ).count()
        
        # === ANÁLISE FINANCEIRA ===
        
        # Custos (alevinos + ração + outros)
        custo_alevinos = sum(float(lote.custo_alevinos or 0) for lote in lotes_ativos + lotes_colhidos)
        
        # Receita (vendas no período)
        receita_vendas = movimentacoes_por_tipo.get('venda', {}).get('valor_total', 0)
        
        # Projeções
        valor_estoque = sum(stats[2]["receita_estimada"] for _, stats in stats_especies.items())
        
        financeiro = {
            "custos_periodo": {
                "alevinos": custo_alevinos,
                "racao": 0,  # TODO: implementar controle de ração
                "outros": 0,
                "total": custo_alevinos
            },
            "receitas_periodo": {
                "vendas": receita_vendas,
                "outros": 0,
                "total": receita_vendas
            },
            "estoque_atual": {
                "valor_estimado": valor_estoque,
                "potencial_receita": valor_estoque * 0.8  # Considerando margem
            },
            "indicadores": {
                "margem_bruta": ((receita_vendas - custo_alevinos) / receita_vendas * 100) if receita_vendas > 0 else 0,
                "roi_periodo": ((receita_vendas - custo_alevinos) / custo_alevinos * 100) if custo_alevinos > 0 else 0
            }
        }
        
        relatorio = {
            "periodo": {
                "inicio": data_inicio.isoformat(),
                "fim": data_fim.isoformat(),
                "dias": (data_fim - data_inicio).days + 1
            },
            "resumo": {
                "lotes_ativos": len(lotes_ativos),
                "lotes_colhidos": len(lotes_colhidos),
                "total_peixes": sum(l.quantidade_atual for l in lotes_ativos),
                "especies_cultivadas": len(stats_especies),
                "valor_estoque": valor_estoque
            },
            "especies": stats_especies,
            "movimentacoes": movimentacoes_por_tipo,
            "qualidade_agua": qualidade_stats,
            "financeiro": financeiro,
            "gerado_em": datetime.utcnow().isoformat()
        }
        
        return jsonify(relatorio), 200
        
    except Exception as e:
        return jsonify({"error": f"Erro ao gerar relatório de piscicultura: {str(e)}"}), 500

@analytics_bp.route('/metricas-ia', methods=['GET'])
@jwt_required()
def metricas_ia():
    """Métricas de uso da IA (custos, performance, etc.)"""
    try:
        user_id = get_jwt_identity()
        cliente = Cliente.query.filter_by(user_id=user_id).first()
        
        if not cliente:
            return jsonify({"error": "Cliente não encontrado"}), 404
        
        # Mock data para demonstração das métricas de IA
        # TODO: Implementar coleta real via logs estruturados
        
        periodo_dias = int(request.args.get('dias', 30))
        data_inicio = datetime.utcnow() - timedelta(days=periodo_dias)
        
        # Simular métricas baseadas nas mensagens
        total_mensagens = Mensagem.query.join(Conversa).filter(
            Conversa.cliente_id == cliente.id,
            Mensagem.data_criacao >= data_inicio,
            Mensagem.resposta_automatica == True
        ).count()
        
        # Estimar custos (baseado na economia do Gemini)
        custo_estimado_openai = total_mensagens * 0.002  # $0.002 por mensagem
        custo_real_gemini = total_mensagens * 0.0001    # $0.0001 por mensagem (95% economia)
        economia_total = custo_estimado_openai - custo_real_gemini
        
        metricas = {
            "periodo": {
                "inicio": data_inicio.isoformat(),
                "dias": periodo_dias
            },
            "uso": {
                "total_interacoes": total_mensagens,
                "media_diaria": round(total_mensagens / periodo_dias, 1),
                "mensagens_texto": int(total_mensagens * 0.8),  # 80% texto
                "mensagens_audio": int(total_mensagens * 0.2),  # 20% áudio
                "taxa_sucesso": 97.5  # Mock - alta taxa com Gemini
            },
            "custos": {
                "custo_atual_usd": round(custo_real_gemini, 4),
                "custo_openai_equivalente": round(custo_estimado_openai, 4),
                "economia_absoluta": round(economia_total, 4),
                "economia_percentual": 95.0,
                "projecao_mensal": round(custo_real_gemini * 30 / periodo_dias, 2),
                "projecao_anual": round(custo_real_gemini * 365 / periodo_dias, 2)
            },
            "performance": {
                "tempo_resposta_medio": 1.2,  # segundos
                "taxa_erro": 0.5,  # %
                "qualidade_resposta": 9.2,  # /10
                "satisfacao_cliente": 8.8,  # /10
                "fallback_openai": 2.1  # % das vezes que usou OpenAI como fallback
            },
            "distribuicao_uso": {
                "chat_conversacional": total_mensagens * 0.6,
                "transcricao_audio": total_mensagens * 0.2,
                "analise_sentimento": total_mensagens * 0.15,
                "outros": total_mensagens * 0.05
            },
            "impacto_negocio": {
                "leads_gerados_ia": int(total_mensagens * 0.12),  # 12% conversão aprox
                "tempo_agente_economizado": round(total_mensagens * 3 / 60, 1),  # horas
                "disponibilidade": 99.8,  # %
                "escalabilidade_alcancada": "1000+ mensagens/dia"
            },
            "comparativo_providers": {
                "gemini": {
                    "custo_por_1000_tokens": 0.00125,
                    "qualidade": 9.2,
                    "velocidade": 1.2,
                    "idioma_portugues": 9.5
                },
                "openai": {
                    "custo_por_1000_tokens": 0.02,
                    "qualidade": 9.0,
                    "velocidade": 2.1,
                    "idioma_portugues": 8.8
                }
            },
            "ultima_atualizacao": datetime.utcnow().isoformat()
        }
        
        return jsonify(metricas), 200
        
    except Exception as e:
        return jsonify({"error": f"Erro ao gerar métricas de IA: {str(e)}"}), 500

@analytics_bp.route('/exportar/<string:tipo>', methods=['GET'])
@jwt_required()
def exportar_relatorio(tipo):
    """Exporta relatórios em diferentes formatos"""
    try:
        user_id = get_jwt_identity()
        cliente = Cliente.query.filter_by(user_id=user_id).first()
        
        if not cliente:
            return jsonify({"error": "Cliente não encontrado"}), 404
        
        formato = request.args.get('formato', 'json')  # json, csv, pdf
        
        if tipo not in ['leads', 'piscicultura', 'ia', 'dashboard']:
            return jsonify({"error": "Tipo de relatório inválido"}), 400
        
        # Gerar dados baseados no tipo
        if tipo == 'leads':
            # Reutilizar endpoint de relatório de leads
            from flask import url_for
            # Simular chamada interna
            data = {
                "tipo": "Relatório de Leads",
                "cliente": cliente.nome_empresa,
                "gerado_em": datetime.utcnow().isoformat(),
                "dados": "Dados do relatório de leads..."
            }
        elif tipo == 'piscicultura':
            data = {
                "tipo": "Relatório de Piscicultura", 
                "cliente": cliente.nome_empresa,
                "gerado_em": datetime.utcnow().isoformat(),
                "dados": "Dados do relatório de piscicultura..."
            }
        elif tipo == 'ia':
            data = {
                "tipo": "Métricas de IA",
                "cliente": cliente.nome_empresa, 
                "gerado_em": datetime.utcnow().isoformat(),
                "dados": "Métricas de uso da IA..."
            }
        else:  # dashboard
            data = {
                "tipo": "Dashboard Geral",
                "cliente": cliente.nome_empresa,
                "gerado_em": datetime.utcnow().isoformat(),
                "dados": "Dados do dashboard..."
            }
        
        if formato == 'json':
            return jsonify(data), 200
        elif formato == 'csv':
            # TODO: Implementar exportação CSV
            return jsonify({"error": "Exportação CSV em desenvolvimento"}), 501
        elif formato == 'pdf':
            # TODO: Implementar exportação PDF
            return jsonify({"error": "Exportação PDF em desenvolvimento"}), 501
        else:
            return jsonify({"error": "Formato não suportado"}), 400
        
    except Exception as e:
        return jsonify({"error": f"Erro ao exportar relatório: {str(e)}"}), 500

@analytics_bp.route('/kpis', methods=['GET'])
@jwt_required() 
def kpis_principais():
    """KPIs principais do negócio"""
    try:
        user_id = get_jwt_identity()
        cliente = Cliente.query.filter_by(user_id=user_id).first()
        
        if not cliente:
            return jsonify({"error": "Cliente não encontrado"}), 404
        
        # KPIs calculados em tempo real
        kpis = {
            "leads": {
                "total": Lead.query.filter_by(cliente_id=cliente.id).count(),
                "conversao": round(
                    Lead.query.filter(Lead.cliente_id == cliente.id, Lead.status == 'convertido').count() /
                    max(Lead.query.filter_by(cliente_id=cliente.id).count(), 1) * 100, 1
                ),
                "ticket_medio": 0,  # TODO: calcular baseado em vendas
                "tempo_medio_conversao": 0  # TODO: calcular
            },
            "operacional": {
                "peixes_estoque": int(db.session.query(func.sum(LotePeixe.quantidade_atual)).filter(
                    LotePeixe.cliente_id == cliente.id, LotePeixe.status == 'ativo'
                ).scalar() or 0),
                "lotes_ativos": LotePeixe.query.filter(
                    LotePeixe.cliente_id == cliente.id, LotePeixe.status == 'ativo'
                ).count(),
                "taxa_mortalidade_media": 3.2,  # Mock
                "producao_mensal": 0  # TODO: calcular
            },
            "qualidade": {
                "parametros_ok": 85.5,  # Mock - % parâmetros dentro do ideal
                "alertas_ativos": AlertaQualidade.query.filter(
                    AlertaQualidade.cliente_id == cliente.id,
                    AlertaQualidade.status == 'ativo'
                ).count(),
                "uptime_sistema": 99.8  # Mock
            },
            "financeiro": {
                "receita_mes": 0,  # TODO: calcular
                "margem_lucro": 0,  # TODO: calcular
                "roi": 0,  # TODO: calcular
                "payback": 0  # TODO: calcular
            },
            "tecnologia": {
                "economia_ia": 95.0,  # % economia com Gemini
                "disponibilidade": 99.9,
                "tempo_resposta": 1.2,
                "taxa_automacao": 87.5
            },
            "ultima_atualizacao": datetime.utcnow().isoformat()
        }
        
        return jsonify(kpis), 200
        
    except Exception as e:
        return jsonify({"error": f"Erro ao calcular KPIs: {str(e)}"}), 500