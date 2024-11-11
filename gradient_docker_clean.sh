#!/bin/bash

docker ps -a --filter "ancestor=overtrue/gradient-bot" -q | xargs -r docker rm -f

docker volume prune -f

docker images "overtrue/gradient-bot" -q | xargs -r docker rmi -f

docker network prune -f

echo "All containers, volumes, and images related to 'overtrue/gradient-bot' have been removed."
