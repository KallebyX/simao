#!/usr/bin/env python3
"""
Script de Migrations - Simão IA Rural
Sistema de versionamento e aplicação de migrations do banco de dados
Executa todas as migrations SQL em ordem sequencial
"""

import os
import sys
import psycopg2
from datetime import datetime
from typing import List, Tuple
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class MigrationRunner:
    """Executor de migrations SQL"""
    
    def __init__(self, database_url: str = None):
        self.database_url = database_url or os.getenv('DATABASE_URL')
        if not self.database_url:
            raise ValueError("DATABASE_URL não configurada")
        
        self.migrations_dir = os.path.join(os.path.dirname(__file__), 'migrations')
        if not os.path.exists(self.migrations_dir):
            self.migrations_dir = os.path.dirname(__file__)
        
        logger.info(f"Migrations directory: {self.migrations_dir}")
    
    def get_connection(self):
        """Cria conexão com banco de dados"""
        try:
            conn = psycopg2.connect(self.database_url)
            conn.autocommit = False
            return conn
        except Exception as e:
            logger.error(f"Erro ao conectar com banco: {e}")
            raise
    
    def get_applied_migrations(self, cursor) -> List[str]:
        """Retorna lista de migrations já aplicadas"""
        try:
            cursor.execute("SELECT version FROM schema_migrations ORDER BY version")
            return [row[0] for row in cursor.fetchall()]
        except psycopg2.Error as e:
            if "relation \"schema_migrations\" does not exist" in str(e):
                logger.info("Tabela schema_migrations não existe - primeira execução")
                return []
            raise
    
    def get_migration_files(self) -> List[Tuple[str, str]]:
        """Retorna lista de arquivos de migration ordenados"""
        migration_files = []
        
        # Procurar arquivos .sql na pasta de migrations
        for filename in os.listdir(self.migrations_dir):
            if filename.endswith('.sql') and filename[0].isdigit():
                filepath = os.path.join(self.migrations_dir, filename)
                version = filename.replace('.sql', '')
                migration_files.append((version, filepath))
        
        # Ordenar por versão
        migration_files.sort(key=lambda x: x[0])
        
        logger.info(f"Encontrados {len(migration_files)} arquivos de migration")
        for version, filepath in migration_files:
            logger.info(f"  - {version}: {os.path.basename(filepath)}")
        
        return migration_files
    
    def execute_migration(self, cursor, version: str, filepath: str) -> bool:
        """Executa uma migration específica"""
        try:
            logger.info(f"Aplicando migration: {version}")
            
            # Ler conteúdo do arquivo SQL
            with open(filepath, 'r', encoding='utf-8') as f:
                sql_content = f.read()
            
            # Executar SQL
            cursor.execute(sql_content)
            
            logger.info(f"Migration {version} aplicada com sucesso")
            return True
            
        except Exception as e:
            logger.error(f"Erro ao aplicar migration {version}: {e}")
            raise
    
    def run_migrations(self, dry_run: bool = False) -> None:
        """Executa todas as migrations pendentes"""
        
        logger.info("=" * 50)
        logger.info("INICIANDO EXECUÇÃO DE MIGRATIONS")
        logger.info("=" * 50)
        
        if dry_run:
            logger.info("🔍 MODO DRY RUN - Apenas verificação, sem aplicar changes")
        
        conn = None
        try:
            # Conectar ao banco
            conn = self.get_connection()
            cursor = conn.cursor()
            
            # Verificar migrations já aplicadas
            applied_migrations = self.get_applied_migrations(cursor)
            logger.info(f"Migrations já aplicadas: {len(applied_migrations)}")
            
            # Obter arquivos de migration
            migration_files = self.get_migration_files()
            
            if not migration_files:
                logger.info("Nenhum arquivo de migration encontrado")
                return
            
            # Filtrar migrations pendentes
            pending_migrations = [
                (version, filepath) for version, filepath in migration_files
                if version not in applied_migrations
            ]
            
            if not pending_migrations:
                logger.info("✅ Todas as migrations já foram aplicadas")
                return
            
            logger.info(f"📋 {len(pending_migrations)} migrations pendentes:")
            for version, _ in pending_migrations:
                logger.info(f"  📄 {version}")
            
            if dry_run:
                logger.info("🔍 Dry run concluído - não foram feitas alterações")
                return
            
            # Executar migrations pendentes
            for version, filepath in pending_migrations:
                try:
                    self.execute_migration(cursor, version, filepath)
                    conn.commit()
                    logger.info(f"✅ Migration {version} commitada")
                    
                except Exception as e:
                    conn.rollback()
                    logger.error(f"❌ Erro na migration {version}: {e}")
                    raise
            
            logger.info("=" * 50)
            logger.info("✅ TODAS AS MIGRATIONS APLICADAS COM SUCESSO!")
            logger.info("=" * 50)
            
        except Exception as e:
            if conn:
                conn.rollback()
            logger.error(f"❌ Erro durante execução de migrations: {e}")
            raise
        
        finally:
            if conn:
                conn.close()
    
    def show_status(self) -> None:
        """Mostra status atual das migrations"""
        
        logger.info("=" * 50)
        logger.info("STATUS DAS MIGRATIONS")
        logger.info("=" * 50)
        
        conn = None
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            # Migrations aplicadas
            applied_migrations = self.get_applied_migrations(cursor)
            migration_files = self.get_migration_files()
            
            logger.info(f"📁 Arquivos de migration encontrados: {len(migration_files)}")
            logger.info(f"✅ Migrations aplicadas: {len(applied_migrations)}")
            
            # Mostrar detalhes
            for version, filepath in migration_files:
                status = "✅ APLICADA" if version in applied_migrations else "⏳ PENDENTE"
                logger.info(f"  {status} - {version}")
            
            # Mostrar migrations pendentes
            pending = [v for v, _ in migration_files if v not in applied_migrations]
            if pending:
                logger.info(f"\n⏳ {len(pending)} migrations pendentes:")
                for version in pending:
                    logger.info(f"  - {version}")
            else:
                logger.info("\n🎉 Todas as migrations estão aplicadas!")
                
        except Exception as e:
            logger.error(f"Erro ao verificar status: {e}")
            raise
        
        finally:
            if conn:
                conn.close()

def main():
    """Função principal"""
    
    # Parse argumentos
    dry_run = '--dry-run' in sys.argv
    show_status = '--status' in sys.argv
    
    try:
        runner = MigrationRunner()
        
        if show_status:
            runner.show_status()
        else:
            runner.run_migrations(dry_run=dry_run)
            
    except Exception as e:
        logger.error(f"❌ Falha na execução: {e}")
        sys.exit(1)

if __name__ == "__main__":
    # Ajustar path para importar módulos do projeto
    sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
    
    print("""
🐟 SIMÃO IA RURAL - SISTEMA DE MIGRATIONS
==========================================
💰 Economia de 95% com Google Gemini
🛡️  Rate Limiting e Logs Estruturados  
📊 Sistema Completo de Piscicultura
==========================================

Uso:
  python run_migrations.py           # Executar migrations
  python run_migrations.py --status  # Ver status
  python run_migrations.py --dry-run # Verificar sem aplicar

""")
    
    main()