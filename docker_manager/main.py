import datetime
import json
import logging
import time

import pymysql
import redis
from config import (REDIS_HOST,
                    REDIS_PORT,
                    REDIS_DB,
                    MYSQL_HOST,
                    MYSQL_PORT,
                    MYSQL_USER,
                    MYSQL_PASSWORD,
                    MYSQL_DB)
from k8s import create_deployment, create_service, get_public_node_ip, get_node_port, delete_deployment_and_service
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


def get_sql_connection():
    return pymysql.connect(host=MYSQL_HOST, port=MYSQL_PORT, user=MYSQL_USER, password=MYSQL_PASSWORD, db=MYSQL_DB)


def update_container_status(container_id, status):
    connection = get_sql_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute("UPDATE container_start_logs SET start_status = %s WHERE id = %s", (status, container_id))
            connection.commit()
    finally:
        connection.close()


def update_container_expire_time(container_id, expire_time):
    expire_time = datetime.datetime.fromtimestamp(expire_time, tz=datetime.timezone.utc)
    connection = get_sql_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute("UPDATE container_start_logs SET expiration_time = %s WHERE id = %s",
                           (expire_time, container_id))
            connection.commit()
    finally:
        connection.close()


def update_container_port(container_id, port):
    connection = get_sql_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute("UPDATE container_start_logs SET port_mapping = %s WHERE id = %s", (port, container_id))
            connection.commit()
    finally:
        connection.close()


def expire_containers():
    logger.info("Checking for expired containers...")
    connection = get_sql_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT id, container_name FROM container_start_logs WHERE expiration_time < %s AND start_status in ('pending', 'starting', 'running')",
                (datetime.datetime.now(tz=datetime.timezone.utc),))
            container_ids = cursor.fetchall()
            logger.info(f"Found {len(container_ids)} expired containers.")
            for container_id in container_ids:
                container_stop_handler(json.dumps({"container_id": container_id[0], "container_name": container_id[1]}))
                logger.info(f"Container {container_id} is stopped.")
    finally:
        connection.close()
    logger.info("Finished checking for expired containers.")


def container_start_handler(message):
    try:
        data = json.loads(message)
        container_id = data.get("container_id")
        if not container_id:
            return
        update_container_status(container_id, "starting")

        dynamic_flag = data.get("dynamic_flag")
        docker_config = json.loads(data.get("docker_config"))
        if docker_config.get("env") is None:
            docker_config['env'] = []
        docker_config['env'].append({"name": "FLAG", "value": dynamic_flag})
        docker_config['unique_container_name'] = data['container_name']

        # 创建 Deployment 和 Service
        try:
            create_deployment(docker_config)
            created_service = create_service(docker_config)
        except Exception as e:
            update_container_status(container_id, "failed")
            logger.error(f"Failed to create Deployment and Service: {e}", exc_info=True)
            return

        # 获取公共节点 IP 和映射的端口
        public_ip = get_public_node_ip()

        port_mapping = []
        if docker_config.get("ports") is None:
            docker_config['ports'] = []
        for port in docker_config['ports']:
            node_port = get_node_port(created_service, port['port'])
            port_mapping.append({
                "ip": public_ip,
                "port": node_port,
                "internal_port": port['port'],
                "template": port['template']
            })

        update_container_port(container_id, json.dumps(port_mapping))
        update_container_status(container_id, "running")
        update_container_expire_time(container_id, int(time.time()) + 3600)

        logger.info(f"Service {docker_config['unique_container_name']} is available.")
    except Exception as e:
        update_container_status(container_id, "failed")
        logger.error(f"Failed to start container: {e}", exc_info=True)


def container_stop_handler(message):
    try:
        message = json.loads(message)
        container_id = message.get("container_id")
        if not container_id:
            return

        update_container_status(container_id, "stopping")
    except Exception as e:
        logger.info(f"Failed to stop container: {e}")
        return

    # 删除 Deployment 和 Service
    try:
        delete_deployment_and_service(message.get('container_name'))
        update_container_status(container_id, "stopped")
        logger.info(f"Service {container_id} is stopped.")
    except Exception as e:
        logger.info(f"Failed to stop container: {e}")


def container_extend_handler(message):
    try:
        message = json.loads(message)
        container_id = message.get("container_id")
        if not container_id:
            return
    except Exception as e:
        logger.info(f"Failed to extend container: {e}")
        return

    # 延长容器的过期时间
    try:
        update_container_expire_time(container_id, int(time.time()) + 3600)
        update_container_status(container_id, "running")
        logger.info(f"Service {container_id} is extended.")
    except Exception as e:
        logger.info(f"Failed to extend container: {e}")


def main():
    # 连接到Redis服务器
    redis_client = redis.StrictRedis(host=REDIS_HOST, port=REDIS_PORT, db=REDIS_DB)
    # 创建订阅者对象
    pubsub = redis_client.pubsub()

    pubsub.subscribe('container_start_queue')
    pubsub.subscribe('container_stop_queue')
    pubsub.subscribe('container_extend_queue')

    logger.info("Listening for messages...")
    # 处理消息
    for message in pubsub.listen():
        try:
            logger.info(f"Received message: {message}")
            if message["type"] != "message":
                continue
            if message["channel"] == b"container_start_queue":
                container_start_handler(message["data"].decode())
            elif message["channel"] == b"container_stop_queue":
                container_stop_handler(message["data"].decode())
            elif message["channel"] == b"container_extend_queue":
                container_extend_handler(message["data"].decode())
        except Exception as e:
            logger.error(f"Failed to handle message: {e}", exc_info=True)


if __name__ == "__main__":
    scheduler = BackgroundScheduler()
    scheduler.add_job(
        func=expire_containers,
        trigger=IntervalTrigger(seconds=5),
        id='expire_containers',
        name='Check for expired containers every 5 seconds',
        replace_existing=True
    )
    scheduler.start()
    main()
