#!/bin/bash

if [[ ! -f "gradient_config.txt" ]]; then
  echo "File gradient_config.txt does not exists."
  exit 1
fi

rm -f proxy_*.txt
proxy_counter=1

while IFS="|" read -r email password proxy; do
    proxy_file="proxy_${proxy_counter}.txt"
    
    echo "$proxy" > "$proxy_file"
    
    docker run -d \
      -e APP_USER="$email" \
      -e APP_PASS="$password" \
      -v ./"$proxy_file":/app/proxies.txt \
      --shm-size=1g \
      --name gradient_$proxy_counter \
      --entrypoint "/bin/bash" \
      overtrue/gradient-bot -c "Xvfb :99 -screen 0 1280x1024x16 & /app/entrypoint.sh"

    ((proxy_counter++))

done < gradient_config.txt
