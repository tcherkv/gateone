Using this Image
----------------

To run the image in the foreground with pretty-printed log messages:

    git clone https://github.com/tcherkv/gateone.git
    cd gateone
    docker-compose up
    # Ctrl-C will stop viewing the output but leave the container running

To run the image in the background (e.g. as part of a script):

    docker-compose up -d

To rebuild image:

    docker-compose build


The development page will be available at https://servername:2002/static/main.html

Instraction to embed gateone will be available at https://servername:2002

GateOne server will be available at https://servername:2000

More documentation on GateOne server http://liftoff.github.io/GateOne/
Original GateOne server source https://github.com/liftoff/GateOne

