#!/bin/bash
echo "Starting gateone"
/usr/local/bin/update_and_run_gateone --log_file_prefix=/gateone/logs/gateone.log &

echo "Starting dev server"
echo $(pip list)
cd /gateone/GateOne/gateone/tests/hello_embedded/
python ./hello_embedded_world.py --port=2443 --address="0.0.0.0"

sleep infinity


