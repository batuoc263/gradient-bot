#!/bin/bash

for alias_name in $(alias | grep 'gradlog' | awk -F'=' '{print $1}'); do
  unalias $alias_name
done

counter=1

for container_id in $(docker ps --filter "ancestor=overtrue/gradient-bot" -q); do
  alias_name="gradlog$counter"
  alias $alias_name="docker exec -it $container_id pm2 logs"
  echo "Alias created: $alias_name -> docker exec -it $container_id pm2 logs"
  ((counter++))
done

echo "All aliases created. You can use gradlog1, gradlog2, ... to view logs."
