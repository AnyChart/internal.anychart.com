#!/usr/bin/env bash

# print and exec command
function run(){
    echo ">$*"
    if eval "$@"; then
        echo [success]        
    else
        echo [FAILED]
        exit 1
    fi
    echo
}

function parse_config_file(){
    local line key val
    while IFS= read -r line; do
        read -r key <<< "${line% *}"
        read -r val <<< "${line#* }"
        if [[ -z "$val" ]]; then
            continue
        else
           key=$(echo $key | tr -d ':' | tr -d ' ' )
           val=$(echo $val | tr -d ':' | tr -d "'" | tr -d ' ' | tr -d ',')
           val=${val#${key}}
        fi
        case "$key" in 
            dbUser)
                DB_USER=${val};;

            dbPassword)
                DB_PASS=${val};;
            
            dbName)
                DB_NAME=${val};;
          
        esac
    done
}

function readConfig(){
    CONFIG_FILE=./config.local.js
    if [ ! -f "${CONFIG_FILE}" ]; then
        CONFIG_FILE=./config.js
    fi

    run "parse_config_file < ${CONFIG_FILE}"

    echo "DB_USER: ${DB_USER}"
    echo "DB_PASS: ${DB_PASS}"
    echo "DB_NAME: ${DB_NAME}"

    if [[ "$OSTYPE" == "darwin"* ]]; then
        MYSQL_prefix="/Applications/MAMP/Library/bin/"
    fi
}

case $1 in
    make)
        readConfig
        run "${MYSQL_prefix}mysqldump -u ${DB_USER} -p${DB_PASS} ${DB_NAME} > ./dump.sql"
    ;;
    restore)
        readConfig
        run "${MYSQL_prefix}mysql -u ${DB_USER} -p${DB_PASS} ${DB_NAME} < ./dump.sql"
    ;;
    *)
        echo "expected 'make' or 'restore'";
        exit 1
    ;;
esac