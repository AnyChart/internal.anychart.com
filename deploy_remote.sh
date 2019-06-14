#!/usr/bin/env bash
BRANCH=$1

if [ -z ${BRANCH} ]; then
    echo '``./deploy BRANCH-NAME` expected' && exit 1
fi

{
    echo "GIT update"
    ssh gituser@anychart.stg "cd internal.anychart.stg && git clean -df && git checkout -- . && git pull origin ${BRANCH} && npm install"
} || {
    exit 1
}
{
    echo "restart app"
    ssh root@anychart.stg "supervisorctl restart internal.anychart.stg"
} || {
    exit 1
}

