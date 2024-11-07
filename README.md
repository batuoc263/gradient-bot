# Gradient Network Bot Script

- Register: https://app.gradient.network/signup?code=I73KCM
- Documentation: <https://mirror.xyz/0xe8224b3E9C8d35b34D088BB5A216B733a5A6D9EA/jFFUw6Ew3rWThwMxXMoLaa1UMnV8axoQoMVN0EKEthY>

> Skip the following if not needed

## Start a Single Proxy for Testing

```bash
sudo APP_USER=example@gmail.com APP_PASS='password' PROXY=socks5://username:password@proxyhost:port node app.js
```

## Start with Docker
Save your proxy addresses in a `proxies.txt` file with the format:

> socks5://username@proxyhost

Then start the container:

```bash
docker run -d \
  -e APP_USER=user@mail.com \
  -e APP_PASS=password \
  -v ./proxies.txt:/app/proxies.txt \
  overtrue/gradient-bot
```
Note: Replace the proxies.txt path with the correct path, or navigate to the directory where proxies.txt is located before running the Docker command.

## View Logs
```bash
docker ps
```
This command lists all containers. Find the corresponding container ID (from the "CONTAINER ID" column) and then run:

```bash
docker exec -it <container_id> pm2 logs
```
Remove Container
```bash
docker rm -f <container_id>
```
