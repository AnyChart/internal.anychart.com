#!/usr/bin/env bash

case $1 in
    get)
        echo "make remote dump"
        ssh gituser@anychart.stg "cd internal.anychart.stg && ./dump.sh make"

        echo "get remote dump"
        scp gituser@anychart.stg:./internal.anychart.stg/dump.sql ./dump.sql

        ./db_dump.sh restore
    ;;
    push)
        ./db_dump.sh make

        echo "get remote dump"
        scp ./dump.sql gituser@anychart.stg:./internal.anychart.stg/dump.sql

        echo "make remote dump"
        ssh gituser@anychart.stg "cd internal.anychart.stg && ./dump.sh restore"
    ;;
    *)
        echo "expected 'push' or 'get'";
    ;;
esac

