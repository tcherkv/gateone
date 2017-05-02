FROM liftoff/gateone
ENV TERM=xterm

RUN apt-get -y install nano
COPY 60docker.conf /etc/gateone/conf.d/60docker.conf
COPY main.html /gateone/GateOne/gateone/tests/hello_embedded/static/main.html
COPY hello_embedded_world.py /gateone/GateOne/gateone/tests/hello_embedded/hello_embedded_world.py
COPY connect.png /gateone/GateOne/gateone/tests/hello_embedded/static/connect.png
ADD startup.sh /
CMD /startup.sh
