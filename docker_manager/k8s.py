import json
import os
from kubernetes import client
from config import HOSTNAME_MAP
# 关闭 HTTPS Warning
import urllib3

urllib3.disable_warnings()

# 手动配置 Kubernetes API 客户端
configuration = client.Configuration()
configuration.host = os.getenv("KUBERNETES_API_SERVER", "")
configuration.verify_ssl = False
# 使用 Bearer Token 进行认证
token = os.getenv("KUBERNETES_TOKEN", "")
configuration.api_key = {
    "authorization": "Bearer " + token
}

client.Configuration.set_default(configuration)

# 创建 Kubernetes API 客户端
v1 = client.CoreV1Api()
apps_v1 = client.AppsV1Api()


def create_deployment(config):
    # 创建 Deployment
    container = client.V1Container(
        name=config['unique_container_name'],
        image=config['image'],
        ports=[
            client.V1ContainerPort(
                container_port=int(port.split('/')[0]),
                protocol=port.split('/')[1].upper()
            )
            for port in [p['port'] for p in config['ports']]],
        env=[client.V1EnvVar(name=env['name'], value=env['value']) for env in config['env']],
        resources=client.V1ResourceRequirements(
            limits={"memory": config['limits']['memory'], "cpu": config['limits']['cpu']}
        ),
        image_pull_policy="IfNotPresent"  # 如果本地有镜像则不拉取
    )

    template = client.V1PodTemplateSpec(
        metadata=client.V1ObjectMeta(labels={"app": config['unique_container_name']}),
        spec=client.V1PodSpec(containers=[container])
    )

    spec = client.V1DeploymentSpec(
        replicas=1,
        template=template,
        selector={'matchLabels': {'app': config['unique_container_name']}}
    )

    deployment = client.V1Deployment(
        api_version="apps/v1",
        kind="Deployment",
        metadata=client.V1ObjectMeta(name=config['unique_container_name']),
        spec=spec
    )

    apps_v1.create_namespaced_deployment(namespace="default", body=deployment)


def create_service(config):
    # 创建 Service 并使用 NodePort 类型
    ports = [client.V1ServicePort(
        port=int(port['port'].split('/')[0]),
        target_port=int(port['port'].split('/')[0]),
        name=port['port'].replace('/', '-'),
        node_port=0,
        protocol=port['port'].split('/')[1].upper()
    ) for port in config['ports']]

    service = client.V1Service(
        api_version="v1",
        kind="Service",
        metadata=client.V1ObjectMeta(name=config['unique_container_name']),
        spec=client.V1ServiceSpec(
            selector={"app": config['unique_container_name']},
            ports=ports,
            type="NodePort"
        )
    )

    created_service = v1.create_namespaced_service(namespace="default", body=service)
    return created_service


def delete_deployment_and_service(name):
    # 删除 Deployment
    apps_v1.delete_namespaced_deployment(
        name=name,
        namespace="default",
        body=client.V1DeleteOptions(
            propagation_policy='Foreground',
            grace_period_seconds=5))

    # 删除 Service
    v1.delete_namespaced_service(
        name=name,
        namespace="default",
        body=client.V1DeleteOptions(
            propagation_policy='Foreground',
            grace_period_seconds=5))


def get_node_port(service, port_name):
    for port in service.spec.ports:
        if port.name == port_name.replace('/', '-'):
            return port.node_port
    return None


def get_public_node_ip():
    nodes = v1.list_node()
    hostname = None
    for node in nodes.items:
        if node.metadata.annotations.get('flannel.alpha.coreos.com/public-ip') is not None:
            return node.metadata.annotations['flannel.alpha.coreos.com/public-ip']
        for address in node.status.addresses:
            if address.type == 'ExternalIP':
                return address.address
            if address.type == 'Hostname':
                hostname = address.address

    if hostname:
        return HOSTNAME_MAP.get(hostname, None)
    return None


def do_deployment(config):
    try:
        # 创建 Deployment 和 Service
        create_deployment(config)
        created_service = create_service(config)
    except Exception as e:
        delete_deployment_and_service(config['unique_container_name'])
        print(f"Failed to create Deployment and Service: {e}")
        return

    # 获取公共节点 IP 和映射的端口
    public_ip = get_public_node_ip()

    for port in config['ports']:
        node_port = get_node_port(created_service, port['port'])
        print(f"Service {config['unique_container_name']} is available at {public_ip}:{node_port}")

    # 等待一定时间后删除 Deployment 和 Service
    input("Press Enter to delete Deployment and Service")
    delete_deployment_and_service(config['unique_container_name'])


if __name__ == "__main__":
    print(json.dumps({
        "image": "nginx:alpine",
        "ports": [{"port": "80/tcp", "template": "http"}],
        "env": [{"name": "MYSQL_ROOT_PASSWORD", "value": "password"}],
        "limits": {"memory": "512M", "cpu": "0.5"},
    }))
    # 测试
    do_deployment({
        "image": "nginx:alpine",
        "ports": [{"port": "80/tcp", "template": "http"}],
        "env": [{"name": "MYSQL_ROOT_PASSWORD", "value": "password"}],
        "limits": {"memory": "512M", "cpu": "0.5"},
        "unique_container_name": "nginx-test",
    })
