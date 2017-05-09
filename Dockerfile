FROM liftoff/gateone
ENV TERM=xterm

RUN apt-get -y install nano
COPY 60docker.conf /etc/gateone/conf.d/60docker.conf
COPY main.html /gateone/GateOne/gateone/tests/hello_embedded/static/main.html
COPY hello_embedded_world.py /gateone/GateOne/gateone/tests/hello_embedded/hello_embedded_world.py
COPY connect.png /gateone/GateOne/gateone/tests/hello_embedded/static/connect.png
COPY menu.png /gateone/GateOne/gateone/tests/hello_embedded/static/menu.png
COPY minimize.png /gateone/GateOne/gateone/tests/hello_embedded/static/minimize.png
COPY site.js /gateone/GateOne/gateone/tests/hello_embedded/static/site.js
COPY site.css /gateone/GateOne/gateone/tests/hello_embedded/static/site.css
COPY cloud_deploy_id_rsa /gateone/users/test@example.com/.ssh/cloud_deploy_id_rsa
CMD chmod 600 /gateone/users/test@example.com/.ssh/cloud_deploy_id_rsa
ADD startup.sh /
CMD /startup.sh
