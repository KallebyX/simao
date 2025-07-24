from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
import bcrypt
from datetime import datetime, timedelta
import logging

from src.models.user import db, Cliente, ConfiguracaoBot
from src.models.cliente import PlanoEnum, StatusEnum

logger = logging.getLogger(__name__)

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    """
    Registra um novo cliente
    """
    try:
        data = request.get_json()
        
        # Validar dados obrigatórios
        required_fields = ['nome', 'email', 'senha']
        for field in required_fields:
            if not data.get(field):
                return jsonify({"error": f"Campo '{field}' é obrigatório"}), 400
        
        # Verificar se email já existe
        if Cliente.query.filter_by(email=data['email']).first():
            return jsonify({"error": "Email já cadastrado"}), 409
        
        # Hash da senha
        senha_hash = bcrypt.hashpw(data['senha'].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Criar cliente
        cliente = Cliente(
            nome=data['nome'],
            email=data['email'],
            senha_hash=senha_hash,
            empresa=data.get('empresa'),
            telefone=data.get('telefone'),
            plano=PlanoEnum.TRIAL,
            status=StatusEnum.TRIAL
        )
        
        db.session.add(cliente)
        db.session.flush()  # Para obter o ID
        
        # Criar configuração padrão do bot
        config = ConfiguracaoBot(cliente_id=cliente.id)
        db.session.add(config)
        
        db.session.commit()
        
        # Gerar token
        access_token = create_access_token(
            identity=cliente.id,
            expires_delta=timedelta(days=7)
        )
        
        logger.info(f"Novo cliente registrado: {cliente.email}")
        
        return jsonify({
            "message": "Cliente registrado com sucesso",
            "access_token": access_token,
            "cliente": cliente.to_dict()
        }), 201
        
    except Exception as e:
        logger.error(f"Erro no registro: {e}")
        db.session.rollback()
        return jsonify({"error": "Erro interno do servidor"}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Autentica um cliente
    """
    try:
        data = request.get_json()
        
        email = data.get('email')
        senha = data.get('senha')
        
        if not email or not senha:
            return jsonify({"error": "Email e senha são obrigatórios"}), 400
        
        # Buscar cliente
        cliente = Cliente.query.filter_by(email=email).first()
        
        if not cliente:
            return jsonify({"error": "Credenciais inválidas"}), 401
        
        # Verificar senha
        if not bcrypt.checkpw(senha.encode('utf-8'), cliente.senha_hash.encode('utf-8')):
            return jsonify({"error": "Credenciais inválidas"}), 401
        
        # Verificar se cliente está ativo
        if cliente.status == StatusEnum.INATIVO:
            return jsonify({"error": "Conta inativa. Entre em contato com o suporte"}), 403
        
        # Atualizar último login
        cliente.data_ultimo_login = datetime.utcnow()
        db.session.commit()
        
        # Gerar token
        access_token = create_access_token(
            identity=cliente.id,
            expires_delta=timedelta(days=7)
        )
        
        logger.info(f"Cliente logado: {cliente.email}")
        
        return jsonify({
            "message": "Login realizado com sucesso",
            "access_token": access_token,
            "cliente": cliente.to_dict()
        }), 200
        
    except Exception as e:
        logger.error(f"Erro no login: {e}")
        return jsonify({"error": "Erro interno do servidor"}), 500

@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """
    Obtém perfil do cliente autenticado
    """
    try:
        cliente_id = get_jwt_identity()
        cliente = Cliente.query.get(cliente_id)
        
        if not cliente:
            return jsonify({"error": "Cliente não encontrado"}), 404
        
        return jsonify(cliente.to_dict()), 200
        
    except Exception as e:
        logger.error(f"Erro ao obter perfil: {e}")
        return jsonify({"error": "Erro interno do servidor"}), 500

@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """
    Atualiza perfil do cliente
    """
    try:
        cliente_id = get_jwt_identity()
        cliente = Cliente.query.get(cliente_id)
        
        if not cliente:
            return jsonify({"error": "Cliente não encontrado"}), 404
        
        data = request.get_json()
        
        # Campos que podem ser atualizados
        updatable_fields = ['nome', 'empresa', 'telefone', 'logo_url', 'cor_primaria', 'cor_secundaria']
        
        for field in updatable_fields:
            if field in data:
                setattr(cliente, field, data[field])
        
        cliente.data_atualizacao = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            "message": "Perfil atualizado com sucesso",
            "cliente": cliente.to_dict()
        }), 200
        
    except Exception as e:
        logger.error(f"Erro ao atualizar perfil: {e}")
        db.session.rollback()
        return jsonify({"error": "Erro interno do servidor"}), 500

@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """
    Altera senha do cliente
    """
    try:
        cliente_id = get_jwt_identity()
        cliente = Cliente.query.get(cliente_id)
        
        if not cliente:
            return jsonify({"error": "Cliente não encontrado"}), 404
        
        data = request.get_json()
        senha_atual = data.get('senha_atual')
        senha_nova = data.get('senha_nova')
        
        if not senha_atual or not senha_nova:
            return jsonify({"error": "Senha atual e nova senha são obrigatórias"}), 400
        
        # Verificar senha atual
        if not bcrypt.checkpw(senha_atual.encode('utf-8'), cliente.senha_hash.encode('utf-8')):
            return jsonify({"error": "Senha atual incorreta"}), 401
        
        # Validar nova senha
        if len(senha_nova) < 6:
            return jsonify({"error": "Nova senha deve ter pelo menos 6 caracteres"}), 400
        
        # Atualizar senha
        nova_senha_hash = bcrypt.hashpw(senha_nova.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        cliente.senha_hash = nova_senha_hash
        cliente.data_atualizacao = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({"message": "Senha alterada com sucesso"}), 200
        
    except Exception as e:
        logger.error(f"Erro ao alterar senha: {e}")
        db.session.rollback()
        return jsonify({"error": "Erro interno do servidor"}), 500

@auth_bp.route('/validate-token', methods=['GET'])
@jwt_required()
def validate_token():
    """
    Valida se o token JWT ainda é válido
    """
    try:
        cliente_id = get_jwt_identity()
        cliente = Cliente.query.get(cliente_id)
        
        if not cliente:
            return jsonify({"valid": False, "error": "Cliente não encontrado"}), 404
        
        if cliente.status == StatusEnum.INATIVO:
            return jsonify({"valid": False, "error": "Conta inativa"}), 403
        
        return jsonify({
            "valid": True,
            "cliente_id": cliente_id,
            "email": cliente.email
        }), 200
        
    except Exception as e:
        logger.error(f"Erro na validação do token: {e}")
        return jsonify({"valid": False, "error": "Token inválido"}), 401

