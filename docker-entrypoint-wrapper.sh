#!/bin/sh
set -e
mkdir -p /data/pgdata /data/uploads
chown -R postgres:postgres /data/pgdata
exec /usr/bin/supervisord -c /etc/supervisord.conf
