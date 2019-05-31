#!/usr/bin/env bash
{
    echo "GIT update"
    ssh gituser@anychart.stg "cd internal.anychart.stg && git pull origin master && npm install"
} || {
    exit 1
}
{
    echo "restart app"
    ssh root@anychart.stg "supervisorctl internal.anychart.stg restart"
} || {
    exit 1
}

