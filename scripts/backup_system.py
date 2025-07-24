#!/usr/bin/env python3
"""
🔄 Sistema de Backup Automático - Simão IA Rural
Backup completo de banco de dados, arquivos e configurações
"""

import os
import sys
import subprocess
import json
import gzip
import shutil
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional
import boto3
import psycopg2
from botocore.exceptions import ClientError

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/var/log/simao-backup.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

class BackupManager:
    """Gerenciador de backups do Simão IA Rural"""
    
    def __init__(self):
        self.config = self._load_config()
        self.backup_dir = Path(self.config.get('backup_dir', '/tmp/simao-backups'))
        self.backup_dir.mkdir(parents=True, exist_ok=True)
        
        # S3 para backup remoto
        self.s3_client = self._setup_s3_client()
        
        # Configurações de retenção
        self.retention_daily = 7    # 7 dias
        self.retention_weekly = 4   # 4 semanas  
        self.retention_monthly = 12 # 12 meses
    
    def _load_config(self) -> Dict:
        """Carregar configurações de backup"""
        config = {
            'database_url': os.getenv('DATABASE_URL'),
            'redis_url': os.getenv('REDIS_URL', 'redis://localhost:6379/0'),
            's3_bucket': os.getenv('BACKUP_S3_BUCKET', 'simao-ia-rural-backups'),
            's3_region': os.getenv('AWS_REGION', 'us-east-1'),
            'backup_dir': os.getenv('BACKUP_DIR', '/tmp/simao-backups'),
            'notification_webhook': os.getenv('BACKUP_NOTIFICATION_WEBHOOK'),
        }
        
        # Validar configurações essenciais
        if not config['database_url']:
            raise ValueError("DATABASE_URL não configurada")
            
        return config
    
    def _setup_s3_client(self):
        """Configurar cliente S3 para backup remoto"""
        try:
            return boto3.client(
                's3',
                region_name=self.config['s3_region'],
                aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
                aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
            )
        except Exception as e:
            logger.warning(f"S3 não configurado: {e}")
            return None
    
    def create_full_backup(self) -> Dict:
        """Criar backup completo do sistema"""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_id = f"simao_full_backup_{timestamp}"
        
        logger.info(f"🔄 Iniciando backup completo: {backup_id}")
        
        results = {
            'backup_id': backup_id,
            'timestamp': timestamp,
            'components': {}
        }
        
        try:
            # 1. Backup do PostgreSQL
            results['components']['database'] = self._backup_database(backup_id)
            
            # 2. Backup do Redis
            results['components']['redis'] = self._backup_redis(backup_id)
            
            # 3. Backup de arquivos de configuração
            results['components']['config'] = self._backup_config_files(backup_id)
            
            # 4. Backup de logs importantes
            results['components']['logs'] = self._backup_logs(backup_id)
            
            # 5. Backup de uploads/arquivos do usuário (se existirem)
            results['components']['uploads'] = self._backup_user_files(backup_id)
            
            # 6. Criar manifesto do backup
            manifest = self._create_backup_manifest(backup_id, results)
            
            # 7. Comprimir backup completo
            compressed_file = self._compress_backup(backup_id)
            results['compressed_file'] = str(compressed_file)
            results['file_size'] = compressed_file.stat().st_size
            
            # 8. Upload para S3 (se configurado)
            if self.s3_client:
                s3_key = self._upload_to_s3(compressed_file)
                results['s3_location'] = s3_key
            
            # 9. Limpeza de backups antigos
            self._cleanup_old_backups()
            
            results['status'] = 'success'
            logger.info(f"✅ Backup completo finalizado: {backup_id}")
            
        except Exception as e:
            results['status'] = 'error'
            results['error'] = str(e)
            logger.error(f"❌ Falha no backup: {e}")
            
        finally:
            # Notificar resultado
            self._send_notification(results)
            
        return results
    
    def _backup_database(self, backup_id: str) -> Dict:
        """Backup do banco de dados PostgreSQL"""
        logger.info("📦 Fazendo backup do banco de dados...")
        
        try:
            backup_file = self.backup_dir / f"{backup_id}_database.sql"
            
            # Usar pg_dump para backup completo
            cmd = [
                'pg_dump',
                self.config['database_url'],
                '--verbose',
                '--clean',
                '--no-acl',
                '--no-owner',
                '--file', str(backup_file)
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            
            # Comprimir arquivo SQL
            compressed_file = f"{backup_file}.gz"
            with open(backup_file, 'rb') as f_in:
                with gzip.open(compressed_file, 'wb') as f_out:
                    shutil.copyfileobj(f_in, f_out)
            
            # Remover arquivo não comprimido
            backup_file.unlink()
            
            return {
                'status': 'success',
                'file': compressed_file,
                'size': Path(compressed_file).stat().st_size,
                'rows_backed_up': self._count_database_rows()
            }
            
        except subprocess.CalledProcessError as e:
            logger.error(f"Erro no pg_dump: {e.stderr}")
            return {'status': 'error', 'error': e.stderr}
        except Exception as e:
            logger.error(f"Erro no backup do banco: {e}")
            return {'status': 'error', 'error': str(e)}
    
    def _backup_redis(self, backup_id: str) -> Dict:
        """Backup do Redis"""
        logger.info("📦 Fazendo backup do Redis...")
        
        try:
            backup_file = self.backup_dir / f"{backup_id}_redis.rdb"
            
            # Usar redis-cli para salvar snapshot
            redis_url_parts = self.config['redis_url'].replace('redis://', '').split(':')
            host = redis_url_parts[0] if redis_url_parts else 'localhost'
            port = redis_url_parts[1].split('/')[0] if len(redis_url_parts) > 1 else '6379'
            
            # Comando para salvar snapshot
            cmd = ['redis-cli', '-h', host, '-p', port, '--rdb', str(backup_file)]
            
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            
            # Comprimir arquivo RDB
            compressed_file = f"{backup_file}.gz"
            if backup_file.exists():
                with open(backup_file, 'rb') as f_in:
                    with gzip.open(compressed_file, 'wb') as f_out:
                        shutil.copyfileobj(f_in, f_out)
                
                backup_file.unlink()
                
                return {
                    'status': 'success',
                    'file': compressed_file,
                    'size': Path(compressed_file).stat().st_size
                }
            else:
                return {'status': 'skipped', 'reason': 'Redis não disponível'}
                
        except Exception as e:
            logger.warning(f"Erro no backup do Redis: {e}")
            return {'status': 'error', 'error': str(e)}
    
    def _backup_config_files(self, backup_id: str) -> Dict:
        """Backup de arquivos de configuração"""
        logger.info("📦 Fazendo backup das configurações...")
        
        try:
            config_backup_dir = self.backup_dir / f"{backup_id}_config"
            config_backup_dir.mkdir(exist_ok=True)
            
            # Arquivos de configuração para backup
            config_files = [
                '.env',
                'CLAUDE.md',
                'requirements.txt',
                'docker-compose.yml',
                'Dockerfile',
                'migrations/',
                'scripts/',
                '.github/workflows/'
            ]
            
            backed_up_files = []
            
            for config_item in config_files:
                source_path = Path(config_item)
                if source_path.exists():
                    dest_path = config_backup_dir / source_path.name
                    
                    if source_path.is_file():
                        shutil.copy2(source_path, dest_path)
                        backed_up_files.append(str(source_path))
                    elif source_path.is_dir():
                        shutil.copytree(source_path, dest_path, dirs_exist_ok=True)
                        backed_up_files.append(str(source_path))
            
            # Comprimir diretório de configurações
            compressed_file = f"{config_backup_dir}.tar.gz"
            shutil.make_archive(
                str(config_backup_dir),
                'gztar',
                root_dir=str(config_backup_dir.parent),
                base_dir=config_backup_dir.name
            )
            
            # Remover diretório não comprimido
            shutil.rmtree(config_backup_dir)
            
            return {
                'status': 'success',
                'file': compressed_file,
                'size': Path(compressed_file).stat().st_size,
                'files_count': len(backed_up_files),
                'files': backed_up_files
            }
            
        except Exception as e:
            logger.error(f"Erro no backup de configurações: {e}")
            return {'status': 'error', 'error': str(e)}
    
    def _backup_logs(self, backup_id: str) -> Dict:
        """Backup de logs importantes"""
        logger.info("📦 Fazendo backup dos logs...")
        
        try:
            logs_backup_dir = self.backup_dir / f"{backup_id}_logs"
            logs_backup_dir.mkdir(exist_ok=True)
            
            # Diretórios de logs para backup
            log_paths = [
                '/var/log/simao-ia-rural/',
                'logs/',
                'backend/simao_backend/logs/',
            ]
            
            backed_up_logs = []
            
            for log_path in log_paths:
                source_path = Path(log_path)
                if source_path.exists() and source_path.is_dir():
                    for log_file in source_path.glob('*.log'):
                        # Apenas logs dos últimos 30 dias
                        if log_file.stat().st_mtime > (datetime.now() - timedelta(days=30)).timestamp():
                            dest_file = logs_backup_dir / log_file.name
                            shutil.copy2(log_file, dest_file)
                            backed_up_logs.append(str(log_file))
            
            if backed_up_logs:
                # Comprimir logs
                compressed_file = f"{logs_backup_dir}.tar.gz"
                shutil.make_archive(
                    str(logs_backup_dir),
                    'gztar',
                    root_dir=str(logs_backup_dir.parent),
                    base_dir=logs_backup_dir.name
                )
                
                shutil.rmtree(logs_backup_dir)
                
                return {
                    'status': 'success',
                    'file': compressed_file,
                    'size': Path(compressed_file).stat().st_size,
                    'files_count': len(backed_up_logs)
                }
            else:
                return {'status': 'skipped', 'reason': 'Nenhum log encontrado'}
                
        except Exception as e:
            logger.warning(f"Erro no backup de logs: {e}")
            return {'status': 'error', 'error': str(e)}
    
    def _backup_user_files(self, backup_id: str) -> Dict:
        """Backup de arquivos de usuário/uploads"""
        logger.info("📦 Fazendo backup de arquivos de usuário...")
        
        try:
            # Diretórios de uploads (se existirem)
            upload_paths = [
                'uploads/',
                'media/',
                'static/uploads/',
                'backend/simao_backend/uploads/'
            ]
            
            user_files_backup_dir = self.backup_dir / f"{backup_id}_user_files"
            user_files_backup_dir.mkdir(exist_ok=True)
            
            backed_up_files = []
            total_size = 0
            
            for upload_path in upload_paths:
                source_path = Path(upload_path)
                if source_path.exists() and source_path.is_dir():
                    for file_path in source_path.rglob('*'):
                        if file_path.is_file():
                            relative_path = file_path.relative_to(source_path)
                            dest_path = user_files_backup_dir / upload_path.rstrip('/') / relative_path
                            dest_path.parent.mkdir(parents=True, exist_ok=True)
                            
                            shutil.copy2(file_path, dest_path)
                            backed_up_files.append(str(file_path))
                            total_size += file_path.stat().st_size
            
            if backed_up_files:
                # Comprimir arquivos de usuário
                compressed_file = f"{user_files_backup_dir}.tar.gz"
                shutil.make_archive(
                    str(user_files_backup_dir),
                    'gztar',
                    root_dir=str(user_files_backup_dir.parent),
                    base_dir=user_files_backup_dir.name
                )
                
                shutil.rmtree(user_files_backup_dir)
                
                return {
                    'status': 'success',
                    'file': compressed_file,
                    'size': Path(compressed_file).stat().st_size,
                    'files_count': len(backed_up_files),
                    'original_size': total_size
                }
            else:
                return {'status': 'skipped', 'reason': 'Nenhum arquivo de usuário encontrado'}
                
        except Exception as e:
            logger.warning(f"Erro no backup de arquivos: {e}")
            return {'status': 'error', 'error': str(e)}
    
    def _create_backup_manifest(self, backup_id: str, results: Dict) -> Dict:
        """Criar manifesto do backup"""
        manifest = {
            'backup_id': backup_id,
            'timestamp': datetime.now().isoformat(),
            'version': '1.0',
            'system_info': {
                'hostname': os.uname().nodename,
                'system': os.uname().sysname,
                'python_version': sys.version,
            },
            'components': results['components'],
            'retention_policy': {
                'daily': self.retention_daily,
                'weekly': self.retention_weekly,
                'monthly': self.retention_monthly
            }
        }
        
        manifest_file = self.backup_dir / f"{backup_id}_manifest.json"
        with open(manifest_file, 'w') as f:
            json.dump(manifest, f, indent=2)
        
        logger.info(f"📋 Manifesto criado: {manifest_file}")
        return manifest
    
    def _compress_backup(self, backup_id: str) -> Path:
        """Comprimir backup completo"""
        logger.info("🗜️ Comprimindo backup completo...")
        
        # Encontrar todos os arquivos do backup
        backup_files = list(self.backup_dir.glob(f"{backup_id}_*"))
        
        if not backup_files:
            raise Exception("Nenhum arquivo de backup encontrado para comprimir")
        
        # Criar arquivo comprimido final
        compressed_file = self.backup_dir / f"{backup_id}.tar.gz"
        
        # Usar tar para comprimir todos os arquivos do backup
        cmd = ['tar', '-czf', str(compressed_file)] + [str(f) for f in backup_files]
        
        subprocess.run(cmd, check=True, cwd=str(self.backup_dir))
        
        # Remover arquivos individuais após compressão
        for file_path in backup_files:
            if file_path.is_file():
                file_path.unlink()
        
        logger.info(f"✅ Backup comprimido: {compressed_file}")
        return compressed_file
    
    def _upload_to_s3(self, backup_file: Path) -> str:
        """Upload do backup para S3"""
        if not self.s3_client:
            logger.warning("S3 não configurado, pulando upload")
            return None
        
        logger.info(f"☁️ Fazendo upload para S3: {backup_file.name}")
        
        try:
            # Estrutura de chaves S3: ano/mês/arquivo
            now = datetime.now()
            s3_key = f"{now.year:04d}/{now.month:02d}/{backup_file.name}"
            
            # Upload com progresso
            self.s3_client.upload_file(
                str(backup_file),
                self.config['s3_bucket'],
                s3_key,
                ExtraArgs={
                    'ServerSideEncryption': 'AES256',
                    'Metadata': {
                        'system': 'simao-ia-rural',
                        'backup_type': 'full',
                        'timestamp': now.isoformat()
                    }
                }
            )
            
            logger.info(f"✅ Upload concluído: s3://{self.config['s3_bucket']}/{s3_key}")
            return f"s3://{self.config['s3_bucket']}/{s3_key}"
            
        except ClientError as e:
            logger.error(f"Erro no upload S3: {e}")
            raise
    
    def _cleanup_old_backups(self):
        """Limpeza de backups antigos"""
        logger.info("🧹 Limpando backups antigos...")
        
        try:
            # Limpeza local
            now = datetime.now()
            
            for backup_file in self.backup_dir.glob("simao_full_backup_*.tar.gz"):
                try:
                    # Extrair timestamp do nome do arquivo
                    timestamp_str = backup_file.stem.split('_')[-2] + '_' + backup_file.stem.split('_')[-1]
                    file_date = datetime.strptime(timestamp_str, '%Y%m%d_%H%M%S')
                    
                    days_old = (now - file_date).days
                    
                    # Política de retenção
                    should_delete = False
                    
                    if days_old > self.retention_daily and file_date.weekday() != 6:  # Não é domingo
                        should_delete = True
                    elif days_old > (self.retention_weekly * 7) and file_date.day != 1:  # Não é primeiro do mês
                        should_delete = True
                    elif days_old > (self.retention_monthly * 30):  # Mais antigo que retenção mensal
                        should_delete = True
                    
                    if should_delete:
                        backup_file.unlink()
                        logger.info(f"🗑️ Backup removido: {backup_file.name}")
                        
                except Exception as e:
                    logger.warning(f"Erro ao processar {backup_file}: {e}")
            
            # Limpeza S3 (se configurado)
            if self.s3_client:
                self._cleanup_s3_backups()
                
        except Exception as e:
            logger.error(f"Erro na limpeza: {e}")
    
    def _cleanup_s3_backups(self):
        """Limpeza de backups no S3"""
        try:
            response = self.s3_client.list_objects_v2(
                Bucket=self.config['s3_bucket'],
                Prefix='simao_full_backup_'
            )
            
            if 'Contents' not in response:
                return
            
            now = datetime.now()
            
            for obj in response['Contents']:
                try:
                    # Extrair data do objeto
                    last_modified = obj['LastModified']
                    days_old = (now - last_modified.replace(tzinfo=None)).days
                    
                    # Aplicar mesma política de retenção
                    should_delete = False
                    
                    if days_old > self.retention_daily and last_modified.weekday() != 6:
                        should_delete = True
                    elif days_old > (self.retention_weekly * 7) and last_modified.day != 1:
                        should_delete = True
                    elif days_old > (self.retention_monthly * 30):
                        should_delete = True
                    
                    if should_delete:
                        self.s3_client.delete_object(
                            Bucket=self.config['s3_bucket'],
                            Key=obj['Key']
                        )
                        logger.info(f"🗑️ Backup S3 removido: {obj['Key']}")
                        
                except Exception as e:
                    logger.warning(f"Erro ao processar objeto S3 {obj['Key']}: {e}")
                    
        except Exception as e:
            logger.error(f"Erro na limpeza S3: {e}")
    
    def _count_database_rows(self) -> int:
        """Contar total de linhas no banco"""
        try:
            conn = psycopg2.connect(self.config['database_url'])
            cursor = conn.cursor()
            
            # Buscar todas as tabelas
            cursor.execute("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
            """)
            
            tables = cursor.fetchall()
            total_rows = 0
            
            for table in tables:
                table_name = table[0]
                cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
                count = cursor.fetchone()[0]
                total_rows += count
            
            conn.close()
            return total_rows
            
        except Exception as e:
            logger.warning(f"Erro ao contar linhas: {e}")
            return 0
    
    def _send_notification(self, results: Dict):
        """Enviar notificação do resultado do backup"""
        if not self.config.get('notification_webhook'):
            return
        
        try:
            import requests
            
            # Preparar payload da notificação
            status_emoji = "✅" if results['status'] == 'success' else "❌"
            
            payload = {
                "text": f"{status_emoji} Backup Simão IA Rural - {results['status'].upper()}",
                "attachments": [
                    {
                        "color": "good" if results['status'] == 'success' else "danger",
                        "fields": [
                            {
                                "title": "Backup ID",
                                "value": results['backup_id'],
                                "short": True
                            },
                            {
                                "title": "Timestamp",
                                "value": results['timestamp'],
                                "short": True
                            }
                        ]
                    }
                ]
            }
            
            if results['status'] == 'success':
                payload['attachments'][0]['fields'].extend([
                    {
                        "title": "Tamanho",
                        "value": f"{results.get('file_size', 0) / 1024 / 1024:.1f} MB",
                        "short": True
                    },
                    {
                        "title": "Localização S3",
                        "value": results.get('s3_location', 'Local apenas'),
                        "short": True
                    }
                ])
            elif 'error' in results:
                payload['attachments'][0]['fields'].append({
                    "title": "Erro",
                    "value": results['error'],
                    "short": False
                })
            
            response = requests.post(
                self.config['notification_webhook'],
                json=payload,
                timeout=10
            )
            response.raise_for_status()
            
            logger.info("📧 Notificação enviada com sucesso")
            
        except Exception as e:
            logger.error(f"Erro ao enviar notificação: {e}")

def main():
    """Função principal"""
    logger.info("🚀 Iniciando sistema de backup do Simão IA Rural...")
    
    try:
        backup_manager = BackupManager()
        results = backup_manager.create_full_backup()
        
        # Imprimir resumo
        print("\n" + "="*60)
        print("📋 RESUMO DO BACKUP")
        print("="*60)
        print(f"Status: {results['status']}")
        print(f"Backup ID: {results['backup_id']}")
        print(f"Timestamp: {results['timestamp']}")
        
        if results['status'] == 'success':
            print(f"Arquivo: {results.get('compressed_file', 'N/A')}")
            print(f"Tamanho: {results.get('file_size', 0) / 1024 / 1024:.1f} MB")
            print(f"S3: {results.get('s3_location', 'Não enviado')}")
            
            print("\nComponentes:")
            for component, info in results['components'].items():
                status_icon = "✅" if info['status'] == 'success' else "⚠️" if info['status'] == 'skipped' else "❌"
                print(f"  {status_icon} {component}: {info['status']}")
        else:
            print(f"Erro: {results.get('error', 'Erro desconhecido')}")
        
        print("="*60)
        
        sys.exit(0 if results['status'] == 'success' else 1)
        
    except Exception as e:
        logger.error(f"❌ Erro crítico no backup: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()