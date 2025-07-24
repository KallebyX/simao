#!/usr/bin/env python3
"""
🔄 Sistema de Restore - Simão IA Rural
Restauração completa de backup do sistema
"""

import os
import sys
import subprocess
import json
import gzip
import shutil
import logging
import argparse
from datetime import datetime
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
        logging.FileHandler('/var/log/simao-restore.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

class RestoreManager:
    """Gerenciador de restore do Simão IA Rural"""
    
    def __init__(self):
        self.config = self._load_config()
        self.restore_dir = Path('/tmp/simao-restore')
        self.restore_dir.mkdir(parents=True, exist_ok=True)
        
        # S3 para download de backups
        self.s3_client = self._setup_s3_client()
    
    def _load_config(self) -> Dict:
        """Carregar configurações de restore"""
        return {
            'database_url': os.getenv('DATABASE_URL'),
            'redis_url': os.getenv('REDIS_URL', 'redis://localhost:6379/0'),
            's3_bucket': os.getenv('BACKUP_S3_BUCKET', 'simao-ia-rural-backups'),
            's3_region': os.getenv('AWS_REGION', 'us-east-1'),
            'notification_webhook': os.getenv('BACKUP_NOTIFICATION_WEBHOOK'),
        }
    
    def _setup_s3_client(self):
        """Configurar cliente S3"""
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
    
    def list_available_backups(self, source: str = 'local') -> List[Dict]:
        """Listar backups disponíveis"""
        logger.info(f"📋 Listando backups disponíveis ({source})...")
        
        backups = []
        
        if source == 'local':
            backups = self._list_local_backups()
        elif source == 's3':
            backups = self._list_s3_backups()
        else:
            # Listar ambos
            backups.extend(self._list_local_backups())
            backups.extend(self._list_s3_backups())
        
        # Ordenar por data (mais recente primeiro)
        backups.sort(key=lambda x: x['timestamp'], reverse=True)
        
        return backups
    
    def _list_local_backups(self) -> List[Dict]:
        """Listar backups locais"""
        backups = []
        backup_dir = Path(os.getenv('BACKUP_DIR', '/tmp/simao-backups'))
        
        if not backup_dir.exists():
            return backups
        
        for backup_file in backup_dir.glob('simao_full_backup_*.tar.gz'):
            try:
                # Extrair timestamp do nome
                parts = backup_file.stem.split('_')
                timestamp_str = f"{parts[-2]}_{parts[-1]}"
                timestamp = datetime.strptime(timestamp_str, '%Y%m%d_%H%M%S')
                
                backups.append({
                    'id': backup_file.stem,
                    'timestamp': timestamp,
                    'source': 'local',
                    'file_path': str(backup_file),
                    'size': backup_file.stat().st_size,
                    'size_mb': round(backup_file.stat().st_size / 1024 / 1024, 1)
                })
                
            except Exception as e:
                logger.warning(f"Erro ao processar backup {backup_file}: {e}")
        
        return backups
    
    def _list_s3_backups(self) -> List[Dict]:
        """Listar backups no S3"""
        backups = []
        
        if not self.s3_client:
            return backups
        
        try:
            response = self.s3_client.list_objects_v2(
                Bucket=self.config['s3_bucket'],
                Prefix='',  # Listar todos os objetos
            )
            
            if 'Contents' not in response:
                return backups
            
            for obj in response['Contents']:
                if obj['Key'].startswith('simao_full_backup_') and obj['Key'].endswith('.tar.gz'):
                    try:
                        # Extrair timestamp do nome
                        filename = Path(obj['Key']).stem
                        parts = filename.split('_')
                        timestamp_str = f"{parts[-2]}_{parts[-1]}"
                        timestamp = datetime.strptime(timestamp_str, '%Y%m%d_%H%M%S')
                        
                        backups.append({
                            'id': filename,
                            'timestamp': timestamp,
                            'source': 's3',
                            's3_key': obj['Key'],
                            'size': obj['Size'],
                            'size_mb': round(obj['Size'] / 1024 / 1024, 1),
                            'last_modified': obj['LastModified']
                        })
                        
                    except Exception as e:
                        logger.warning(f"Erro ao processar backup S3 {obj['Key']}: {e}")
            
        except Exception as e:
            logger.error(f"Erro ao listar backups S3: {e}")
        
        return backups
    
    def download_backup_from_s3(self, s3_key: str) -> Path:
        """Download de backup do S3"""
        if not self.s3_client:
            raise Exception("S3 não configurado")
        
        logger.info(f"⬇️ Baixando backup do S3: {s3_key}")
        
        local_file = self.restore_dir / Path(s3_key).name
        
        try:
            self.s3_client.download_file(
                self.config['s3_bucket'],
                s3_key,
                str(local_file)
            )
            
            logger.info(f"✅ Download concluído: {local_file}")
            return local_file
            
        except ClientError as e:
            logger.error(f"Erro no download: {e}")
            raise
    
    def extract_backup(self, backup_file: Path) -> Path:
        """Extrair backup comprimido"""
        logger.info(f"📦 Extraindo backup: {backup_file}")
        
        extract_dir = self.restore_dir / f"extracted_{backup_file.stem}"
        extract_dir.mkdir(exist_ok=True)
        
        try:
            # Extrair arquivo tar.gz
            cmd = ['tar', '-xzf', str(backup_file), '-C', str(extract_dir)]
            subprocess.run(cmd, check=True)
            
            logger.info(f"✅ Backup extraído em: {extract_dir}")
            return extract_dir
            
        except subprocess.CalledProcessError as e:
            logger.error(f"Erro na extração: {e}")
            raise
    
    def load_backup_manifest(self, extract_dir: Path) -> Dict:
        """Carregar manifesto do backup"""
        manifest_files = list(extract_dir.glob('*_manifest.json'))
        
        if not manifest_files:
            raise Exception("Manifesto do backup não encontrado")
        
        manifest_file = manifest_files[0]
        
        with open(manifest_file, 'r') as f:
            manifest = json.load(f)
        
        logger.info(f"📋 Manifesto carregado: {manifest['backup_id']}")
        return manifest
    
    def restore_full_system(self, backup_id: str, components: List[str] = None, 
                           confirm_destructive: bool = False) -> Dict:
        """Restaurar sistema completo"""
        
        if not confirm_destructive:
            logger.error("❌ Operação destrutiva requer confirmação explícita")
            return {'status': 'error', 'error': 'Confirmação necessária'}
        
        logger.info(f"🔄 Iniciando restore completo: {backup_id}")
        
        # Buscar backup
        backups = self.list_available_backups('both')
        backup_info = None
        
        for backup in backups:
            if backup['id'] == backup_id:
                backup_info = backup
                break
        
        if not backup_info:
            raise Exception(f"Backup não encontrado: {backup_id}")
        
        results = {
            'backup_id': backup_id,
            'timestamp': datetime.now().isoformat(),
            'components': {}
        }
        
        try:
            # 1. Download/localizar arquivo de backup
            if backup_info['source'] == 's3':
                backup_file = self.download_backup_from_s3(backup_info['s3_key'])
            else:
                backup_file = Path(backup_info['file_path'])
            
            # 2. Extrair backup
            extract_dir = self.extract_backup(backup_file)
            
            # 3. Carregar manifesto
            manifest = self.load_backup_manifest(extract_dir)
            
            # 4. Determinar componentes para restaurar
            available_components = list(manifest['components'].keys())
            if components is None:
                components = available_components
            
            logger.info(f"🔧 Componentes para restaurar: {', '.join(components)}")
            
            # 5. Criar backup de segurança antes do restore
            self._create_pre_restore_backup()
            
            # 6. Restaurar cada componente
            for component in components:
                if component not in available_components:
                    logger.warning(f"Componente '{component}' não disponível no backup")
                    continue
                
                logger.info(f"🔄 Restaurando componente: {component}")
                
                if component == 'database':
                    results['components'][component] = self._restore_database(extract_dir, backup_id)
                elif component == 'redis':
                    results['components'][component] = self._restore_redis(extract_dir, backup_id)
                elif component == 'config':
                    results['components'][component] = self._restore_config(extract_dir, backup_id)
                elif component == 'uploads':
                    results['components'][component] = self._restore_user_files(extract_dir, backup_id)
                else:
                    logger.warning(f"Componente '{component}' não suportado para restore")
            
            # 7. Verificar integridade pós-restore
            integrity_check = self._verify_restore_integrity()
            results['integrity_check'] = integrity_check
            
            results['status'] = 'success'
            logger.info(f"✅ Restore completo finalizado: {backup_id}")
            
        except Exception as e:
            results['status'] = 'error'
            results['error'] = str(e)
            logger.error(f"❌ Falha no restore: {e}")
            
        finally:
            # Limpeza
            if 'extract_dir' in locals():
                shutil.rmtree(extract_dir, ignore_errors=True)
            
            # Notificar resultado
            self._send_notification(results)
        
        return results
    
    def _create_pre_restore_backup(self):
        """Criar backup de segurança antes do restore"""
        logger.info("💾 Criando backup de segurança pré-restore...")
        
        try:
            # Usar o sistema de backup para criar backup de segurança
            from backup_system import BackupManager
            
            backup_manager = BackupManager()
            pre_restore_backup = backup_manager.create_full_backup()
            
            if pre_restore_backup['status'] == 'success':
                logger.info(f"✅ Backup pré-restore criado: {pre_restore_backup['backup_id']}")
            else:
                logger.warning(f"⚠️ Falha no backup pré-restore: {pre_restore_backup.get('error')}")
                
        except Exception as e:
            logger.warning(f"⚠️ Não foi possível criar backup pré-restore: {e}")
    
    def _restore_database(self, extract_dir: Path, backup_id: str) -> Dict:
        """Restaurar banco de dados"""
        logger.info("🗄️ Restaurando banco de dados...")
        
        try:
            # Encontrar arquivo de banco
            db_files = list(extract_dir.glob(f'{backup_id}_database.sql.gz'))
            
            if not db_files:
                return {'status': 'error', 'error': 'Arquivo de banco não encontrado'}
            
            db_file_compressed = db_files[0]
            db_file = extract_dir / f'{backup_id}_database.sql'
            
            # Descomprimir
            with gzip.open(db_file_compressed, 'rb') as f_in:
                with open(db_file, 'wb') as f_out:
                    shutil.copyfileobj(f_in, f_out)
            
            # AVISO: Operação destrutiva
            logger.warning("⚠️ ATENÇÃO: Restaurando banco de dados (operação destrutiva)")
            
            # Usar psql para restaurar
            cmd = [
                'psql',
                self.config['database_url'],
                '--file', str(db_file),
                '--quiet'
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            
            # Limpar arquivo descomprimido
            db_file.unlink()
            
            return {
                'status': 'success',
                'message': 'Banco de dados restaurado com sucesso'
            }
            
        except subprocess.CalledProcessError as e:
            logger.error(f"Erro no restore do banco: {e.stderr}")
            return {'status': 'error', 'error': e.stderr}
        except Exception as e:
            logger.error(f"Erro no restore do banco: {e}")
            return {'status': 'error', 'error': str(e)}
    
    def _restore_redis(self, extract_dir: Path, backup_id: str) -> Dict:
        """Restaurar Redis"""
        logger.info("🔴 Restaurando Redis...")
        
        try:
            # Encontrar arquivo Redis
            redis_files = list(extract_dir.glob(f'{backup_id}_redis.rdb.gz'))
            
            if not redis_files:
                return {'status': 'skipped', 'reason': 'Backup Redis não encontrado'}
            
            redis_file_compressed = redis_files[0]
            redis_file = extract_dir / f'{backup_id}_redis.rdb'
            
            # Descomprimir
            with gzip.open(redis_file_compressed, 'rb') as f_in:
                with open(redis_file, 'wb') as f_out:
                    shutil.copyfileobj(f_in, f_out)
            
            # Para restaurar Redis, geralmente precisamos parar o serviço,
            # substituir o arquivo RDB e reiniciar
            logger.warning("⚠️ Restore Redis requer intervenção manual")
            logger.info(f"Arquivo RDB disponível em: {redis_file}")
            
            return {
                'status': 'manual_intervention_required',
                'message': f'Arquivo RDB em {redis_file}. Pare Redis, substitua dump.rdb e reinicie.',
                'file_location': str(redis_file)
            }
            
        except Exception as e:
            logger.error(f"Erro no restore Redis: {e}")
            return {'status': 'error', 'error': str(e)}
    
    def _restore_config(self, extract_dir: Path, backup_id: str) -> Dict:
        """Restaurar arquivos de configuração"""
        logger.info("⚙️ Restaurando configurações...")
        
        try:
            # Encontrar arquivo de configurações
            config_files = list(extract_dir.glob(f'{backup_id}_config.tar.gz'))
            
            if not config_files:
                return {'status': 'skipped', 'reason': 'Backup de config não encontrado'}
            
            config_file = config_files[0]
            config_extract_dir = extract_dir / 'config_extracted'
            config_extract_dir.mkdir(exist_ok=True)
            
            # Extrair configurações
            cmd = ['tar', '-xzf', str(config_file), '-C', str(config_extract_dir)]
            subprocess.run(cmd, check=True)
            
            # Listar arquivos extraídos
            extracted_files = []
            for item in config_extract_dir.rglob('*'):
                if item.is_file():
                    extracted_files.append(str(item))
            
            logger.info(f"⚠️ Arquivos de configuração extraídos em: {config_extract_dir}")
            logger.info("📋 Revisar e aplicar manualmente conforme necessário")
            
            return {
                'status': 'manual_review_required',
                'message': f'Configurações extraídas em {config_extract_dir}',
                'files_count': len(extracted_files),
                'extract_location': str(config_extract_dir)
            }
            
        except Exception as e:
            logger.error(f"Erro no restore de config: {e}")
            return {'status': 'error', 'error': str(e)}
    
    def _restore_user_files(self, extract_dir: Path, backup_id: str) -> Dict:
        """Restaurar arquivos de usuário"""
        logger.info("📁 Restaurando arquivos de usuário...")
        
        try:
            # Encontrar arquivo de uploads
            upload_files = list(extract_dir.glob(f'{backup_id}_user_files.tar.gz'))
            
            if not upload_files:
                return {'status': 'skipped', 'reason': 'Backup de arquivos não encontrado'}
            
            upload_file = upload_files[0]
            
            # Extrair na raiz do projeto
            current_dir = Path.cwd()
            
            cmd = ['tar', '-xzf', str(upload_file), '-C', str(current_dir)]
            subprocess.run(cmd, check=True)
            
            return {
                'status': 'success',
                'message': 'Arquivos de usuário restaurados'
            }
            
        except Exception as e:
            logger.error(f"Erro no restore de arquivos: {e}")
            return {'status': 'error', 'error': str(e)}
    
    def _verify_restore_integrity(self) -> Dict:
        """Verificar integridade pós-restore"""
        logger.info("🔍 Verificando integridade do restore...")
        
        checks = {}
        
        # Verificar banco de dados
        try:
            conn = psycopg2.connect(self.config['database_url'])
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'")
            table_count = cursor.fetchone()[0]
            conn.close()
            
            checks['database'] = {
                'status': 'ok' if table_count > 0 else 'error',
                'tables_count': table_count
            }
            
        except Exception as e:
            checks['database'] = {'status': 'error', 'error': str(e)}
        
        # Verificar Redis (opcional)
        try:
            import redis
            r = redis.from_url(self.config['redis_url'])
            r.ping()
            checks['redis'] = {'status': 'ok'}
        except Exception as e:
            checks['redis'] = {'status': 'warning', 'error': str(e)}
        
        # Verificar arquivos essenciais
        essential_files = ['.env', 'requirements.txt', 'CLAUDE.md']
        files_ok = 0
        
        for file_path in essential_files:
            if Path(file_path).exists():
                files_ok += 1
        
        checks['essential_files'] = {
            'status': 'ok' if files_ok > 0 else 'warning',
            'found': files_ok,
            'total': len(essential_files)
        }
        
        return checks
    
    def _send_notification(self, results: Dict):
        """Enviar notificação do resultado do restore"""
        if not self.config.get('notification_webhook'):
            return
        
        try:
            import requests
            
            status_emoji = "✅" if results['status'] == 'success' else "❌"
            
            payload = {
                "text": f"{status_emoji} Restore Simão IA Rural - {results['status'].upper()}",
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
            
            if 'error' in results:
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
    parser = argparse.ArgumentParser(description='Sistema de Restore - Simão IA Rural')
    
    subparsers = parser.add_subparsers(dest='command', help='Comandos disponíveis')
    
    # Comando list
    list_parser = subparsers.add_parser('list', help='Listar backups disponíveis')
    list_parser.add_argument('--source', choices=['local', 's3', 'both'], 
                           default='both', help='Origem dos backups')
    
    # Comando restore
    restore_parser = subparsers.add_parser('restore', help='Restaurar backup')
    restore_parser.add_argument('backup_id', help='ID do backup para restaurar')
    restore_parser.add_argument('--components', nargs='+', 
                              choices=['database', 'redis', 'config', 'uploads'],
                              help='Componentes para restaurar (padrão: todos)')
    restore_parser.add_argument('--confirm', action='store_true',
                              help='Confirmar operação destrutiva')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    try:
        restore_manager = RestoreManager()
        
        if args.command == 'list':
            backups = restore_manager.list_available_backups(args.source)
            
            if not backups:
                print("❌ Nenhum backup encontrado")
                return
            
            print(f"\n📋 Backups disponíveis ({len(backups)}):")
            print("="*80)
            
            for backup in backups:
                source_icon = "💾" if backup['source'] == 'local' else "☁️"
                print(f"{source_icon} {backup['id']}")
                print(f"   Data: {backup['timestamp'].strftime('%Y-%m-%d %H:%M:%S')}")
                print(f"   Tamanho: {backup['size_mb']} MB")
                print(f"   Origem: {backup['source']}")
                print()
        
        elif args.command == 'restore':
            if not args.confirm:
                print("❌ ATENÇÃO: Operação destrutiva!")
                print("   Use --confirm para prosseguir")
                print("   Isso irá sobrescrever dados existentes")
                return
            
            results = restore_manager.restore_full_system(
                args.backup_id,
                args.components,
                args.confirm
            )
            
            # Imprimir resumo
            print("\n" + "="*60)
            print("📋 RESUMO DO RESTORE")
            print("="*60)
            print(f"Status: {results['status']}")
            print(f"Backup ID: {results['backup_id']}")
            print(f"Timestamp: {results['timestamp']}")
            
            if results['status'] == 'success':
                print("\nComponentes restaurados:")
                for component, info in results['components'].items():
                    status_icon = "✅" if info['status'] == 'success' else "⚠️" if info['status'] in ['skipped', 'manual_intervention_required'] else "❌"
                    print(f"  {status_icon} {component}: {info['status']}")
                    if 'message' in info:
                        print(f"      {info['message']}")
                
                if 'integrity_check' in results:
                    print("\nVerificação de integridade:")
                    for check, result in results['integrity_check'].items():
                        status_icon = "✅" if result['status'] == 'ok' else "⚠️" if result['status'] == 'warning' else "❌"
                        print(f"  {status_icon} {check}: {result['status']}")
            else:
                print(f"Erro: {results.get('error', 'Erro desconhecido')}")
            
            print("="*60)
            
            sys.exit(0 if results['status'] == 'success' else 1)
            
    except Exception as e:
        logger.error(f"❌ Erro crítico: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()