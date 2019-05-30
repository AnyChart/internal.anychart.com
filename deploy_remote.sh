#!/usr/bin/env bash
{
    echo "GIT update"
    ssh root@anychart.stg "cd internal.anychart.stg && git pull origin master "
} || {
    exit 1
}
{
    echo "restart app"
    ssh root@anychart.stg "npm install && supervisorctl internal.anychart.stg restart"
} || {
    exit 1
}

