#!/usr/bin/env bash

case $1 in
    get)
        {
            echo "make remote dump"
            ssh gituser@anychart.stg "cd internal.anychart.stg && ./dump.sh make"
        } || {
            exit 1
        }

        {
            echo "get remote dump"
            scp gituser@anychart.stg:./internal.anychart.stg/dump.sql ./dump.sql
        } || {
            exit 1
        }

        {
            echo "restore to local"
            ./dump.sh restore
        } || {
            exit 1
        }
    ;;
    push)
        {
            echo "get local dump"
            ./dump.sh make
        } || {
            exit 1
        }

        {
            echo "push local dump"        
            scp ./dump.sql gituser@anychart.stg:./internal.anychart.stg/dump.sql
        } || {
            exit 1
        }

        {
            echo "restore to remote"
            ssh gituser@anychart.stg "cd internal.anychart.stg && ./dump.sh restore"
        } || {
            exit 1
        }
    ;;
    *)
        echo "expected 'push' or 'get'";
        exit 1
    ;;
esac

