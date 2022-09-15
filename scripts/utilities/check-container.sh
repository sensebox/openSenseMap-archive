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

check_archiver () {
  IS_RUNNING=$(docker-compose ps --services --filter "status=running" | grep "$DOCKER_COMPOSE_SERVICE")

  # Set date
  ARCHIVE_DATE='yesterday'
  ARCHIVE_FOLDER="./archive/$(date -u --date "$ARCHIVE_DATE" +%F)"

  if [ "$IS_RUNNING" != "" ]; then
      echo "The service is still running!!!"
  else
      echo "The service is not running anymore!!!"
      echo "Going to shutdown all container..."
      docker-compose down

      if [ -d "$ARCHIVE_FOLDER" ]; then
        echo "Copying archive files from  ${ARCHIVE_FOLDER}..."
        cp -r "$ARCHIVE_FOLDER" /home/ubuntu/archive-data/data
      fi

      echo "Cleanup generated archive files..."
      rm -rf "$ARCHIVE_FOLDER"

      echo "Cleanup resources..."
      rm -f ./dumps/boxes
      rm -f ./dumps/measurements
  fi
}

check_archiver