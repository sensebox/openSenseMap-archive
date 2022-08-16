#!/bin/bash

DOCKER_COMPOSE_SERVICES=$(docker-compose ps --services | tr '\n' ',')
usage() { echo "Usage: $0 [-s <$DOCKER_COMPOSE_SERVICES>]" 1>&2; exit 1; }

while getopts ":s:" opt; do
  case $opt in
    s)
      echo "Checking if service is running: $OPTARG" >&2
      DOCKER_COMPOSE_SERVICE="$OPTARG"
      ;;
    \?)
      echo "Invalid option: -$OPTARG" >&2
      exit 1
      ;;
    :)
      echo "Option -$OPTARG requires an argument." >&2
      exit 1
      ;;
  esac
done
shift $((OPTIND-1))

if [ -z "${DOCKER_COMPOSE_SERVICE}" ]; then
    usage
fi

IS_RUNNING=$(docker-compose ps --services --filter "status=running" | grep "$DOCKER_COMPOSE_SERVICE")
if [ "$IS_RUNNING" != "" ]; then
    echo "The service is still running!!!"
else
    echo "The service is not running anymore!!!"
    echo "Going to shutdown all container..."
    docker-compose down
fi