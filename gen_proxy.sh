#!/bin/bash

if [[ ! -f "gradient_config.txt" ]]; then
  echo "File gradient_config.txt does not exists."
  exit 1
fi

rm -f proxy_*.txt

i=1
while IFS="|" read -r user pass proxy; do
  proxy_file="proxy_$i.txt"
  echo "$proxy" > "$proxy_file"

  ((i++))
done < gradient_config.txt

echo "Created proxy_x.txt successfully."

