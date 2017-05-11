
$(document).ready(function()
{
    for(var i = 0; i < config.connections.length; i++)
    {
        var name = config.connections[i].name;
        var $item = $('<li data-id="' + i + '">' + name + '</li>')
        $('#menu ul').append($item);

        if(config.connections[i].type == 'ssh')
            AddTab(i, name);

        $item.click(function()
        {
            var index = $(this).data('id');

            if(config.connections[index].type == 'ssh')
            {
                $('#tabContainer').show();
                $('#btMenu').hide();
            }

            $('#menu').hide();
            SelectItem(index);
        });
    }

    $(document).click(function()
    {
        $('#menu').hide();
    });

    $('#tabs > li').click(function()
    {
        var index = $(this).data('id');
        SelectItem(index);
    });

    $('#btMenu').click(function(e)
    {
        e.stopPropagation();
        $('#menu').css('left', 20).show();
    });

    $('#btMenuMin').click(function(e)
    {
        e.stopPropagation();
        $('#menu').css('left', 800).show();
    });

    $('#btMinimize').click(function()
    {
        $('#tabContainer').hide();
        $('#menu').hide();
        $('#btMenu').show();
    });
});

function InitGateOne(callback, index)
{
    GateOne.init({
        url: config.url,
        embedded: true,
        disableTermTransitions: true,
        terminalFontSize: '80%',
        columns: 160,
        showTitle: false,
        showToolbar: false,
        fillContainer: true,
        colors: 'gnome-terminal',
        auth: config.auth
    });

    var timer = setInterval(function ()
    {
        if (GateOne.Terminal)
        {
            clearTimeout(timer);
            AddTerminals();
            callback(index);
        }
    }, 1000);
}

function AddTab(index, title)
{
    var $li = $('<li ' + (index == 0 ? 'class="active" ' : '') + 'data-id="' + index +
        '"><a data-toggle="tab" href="#' + title + '">' + title + '</a></li>');
    $('#tabs').append($li);

    var $content = $('<div id="' + title + '" data-id="' + index +
        '" class="tab-pane fade' + (index == 0 ? ' in active' : '') + '"></div>');
    $('#tabs_content').append($content);
}

function SelectItem(index)
{
    var $li = $('#tabs > li[data-id=' + index + ']');
    if($li.length == 0)
    {
        var win = window.open(config.connections[index].url, '_blank');
        if (win)
            win.focus();
        else
            alert('Please allow popups for this website');
        return;
    }

    $li.find('a').tab('show');
    $('#tabs_content > div').hide();
    $('#tabs_content > div[data-id=' + index + ']').show();

    if(config.connections[index].type == 'ssh')
    {
        if(!GateOne.Terminal)
            InitGateOne(SelectTerminal, index);
        else
            SelectTerminal(index);
    }
}

function AddTerminals()
{
    for(var i = 0; i < config.connections.length; i++)
    {
        if(config.connections[i].type == 'ssh')
            AddTerminal(i + 1, config.connections[i]);
    }
}

function AddTerminal(termNum, connection)
{
    // Creates a new Gate One terminal in a new tab
    var go = GateOne,
        u = go.Utils,
        prefix = go.prefs.prefix,
        existingContainer = u.getNode('#' + prefix + 'tab_container'),
        container = u.createElement('div', {
            'id': 'tab_container',
            'style': {'height': '100%', 'width': '100%'}
        }),
        gateone = u.getNode('#gateone'),
        existingTerminals = u.getNodes(go.prefs.goDiv + ' .✈terminal');

    // Hide all existing terminals to ensure the user only sees the new one
    if (existingTerminals)
    {
        u.toArray(existingTerminals).forEach(function(termNode)
        {
            termNode.style.display = 'none';
        });
    }

    // Figure out if we need to add our terminal container or if we can use an existing one
    if (!existingContainer)
        gateone.appendChild(container);
    else
        container = existingContainer;

    GateOne.Terminal.getOpenTerminals();

    // Tell Gate One to create the new terminal
    if (termNum)
        GateOne.Terminal.newTerminal(termNum, null, container);
    else
        termNum = GateOne.Terminal.newTerminal(null, null, container);

    GateOne.Terminal.switchTerminal(termNum);
    GateOne.Terminal.clearScrollback(termNum);

    if(connection.identities != undefined)
    {
        GateOne.ws.send(JSON.stringify({
            'terminal:ssh_store_id_file': {
                'name': connection.identities[0],
                'private': get_identity_key()
            }
        }));

        GateOne.ws.send(JSON.stringify({
            'terminal:ssh_store_id_file': {
                'name': connection.identities[0],
                'public': get_identity_pub_key()
            }
        }));

        GateOne.ws.send(JSON.stringify({
            'terminal:ssh_gen_new_keypair': {
                'name': connection.identities[0],
                'passphrase': 'testing_passphrase'
            }
        }));

        GateOne.ws.send(JSON.stringify({'terminal:ssh_save_known_hosts': get_identity_pub_key()}));
    }

    GateOne.Terminal.sendString(connection.url, termNum);
    GateOne.Terminal.Input.capture(); // (re)start capturing keyboard input
}

function SelectTerminal(termNum)
{
    var $tab_content = $('#tabs_content > div[data-id=' + termNum + ']');
    $('#gateone_container').appendTo($tab_content).show();
    $tab_content.show();

    termNum += 1;

    // Switches to the terminal tab given by *termNum*
    var go = GateOne,
        u = go.Utils,
        prefix = go.prefs.prefix,
        terminals = u.getNodes(go.prefs.goDiv + ' .✈terminal');

    u.toArray(terminals).forEach(function(termNode)
    {
        // Hide all but the selected terminal...
        if (termNode.id == prefix + 'term' + termNum)
            termNode.style.display = ''; // Default to visible
        else
            termNode.style.display = 'none'; // Hide it
    });

    // This makes sure our keystrokes are sent to the correct terminal
    go.Terminal.switchTerminal(termNum); // Calls GateOne.Net.setTerminal()

    // This displays the terminal info in a transient pop-up
    go.Terminal.displayTermInfo(termNum);

    // Scroll the pre to the bottom (undoing display:none scrolls elements to the top)
    u.scrollToBottom('#' + prefix + 'term' + termNum + '_pre');

    // This makes sure that we (re)enable keyboard input after switching terminals
    go.Terminal.Input.capture();
}

function get_identity_key(id) {
    return '-----BEGIN RSA PRIVATE KEY-----' +
'MIIEowIBAAKCAQEAzpPwCB6A+HXHTS0E83ujlcLf4Dlz0DTo53SsGkJCQ7BiMwxh' +
'FHpuUN3yUFTEgtTXLN+pDK+WiFJgELKCKH0NDxFPnezDE0iwwDsszD+5KfT+mxPP' +
'ZLHUZQ5OvJ5oGSlYmrFhjTLqhrZTR1aa0Ml8/PvWbvu4MUuSK9JWGoa4wV5Og5GE' +
'Gy4U0ytP9MkDiDUOligAUA1QaHUyorUIG41x9Is7E4/1epFpETtwgi+4keZIBAI9' +
'4Cojd7f7tJk8WpmR18wchng8qLZ1PHLhncK5DwrYLcsK7P5WfOwm7fhVJW0oRZM4' +
'GaC8IHtUO79WphUYcQ5VGqDP1z+fURZNUNL+tQIDAQABAoIBABtZwO0CROcgiOux' +
'6zblhsocTBHe6XOGndOPQf4UCbv2jXneyLeyYgq46A00u/PqhDa/wh0Y3mBcL7Xm' +
'PI9pxyHYk+b/4vAZrrU04ICGa1ifxFn57HqThOCAXXJhsryqGb4ZgCX2uNBvMWV/' +
'lO3Rz4ebPE/jaga0z7yXk6jdb3bCbdOXsj0iPfHAuTZMJaVg43Mgr3Xmm8ozKGD4' +
'4Htd8oMsmX26lgI4kH1pLP/wZHhVZmW5CHphizijkAaioPmPOH1JKl6hLNZ8SPWx' +
'Lc4i6CDoyXk2k/YRHcUjyPDt6F97b96xZNXnyHENKhshci1ES2Htmq/0VQBqzq/m' +
'Cm5KrYECgYEA5pLj5bav0fX6+K3tta+weFEQBLczp+cSZ5KwL0HQhtttR1/lEszp' +
'Gz689ffmPw2FpaNLGk12o+HMOboWLiJICjeUg7hEoU0OLiIcAqX+nE+ptcGqEEpk' +
'NxGP1yBZVkAxVIupAe8q+/O3gf7BGjvVqmJxoGFro/FPqowAFNUuatUCgYEA5Vuk' +
'RWpowEDNPYyfD18vRMB48VeWQJm6SGsO+5kkggiIaOESIA0GT1ttvPpq3D5Ag13A' +
'moSgoMV8kdpVg5QY8Oh7HE7CxcOnHS3s6PXMP1SysyLPx+Zl9zp1EAaJkT/usfDu' +
'RHdTyDvw9OVaITElH5JfywLvkxQdmDoLvLyEdGECgYBo1DfQ5LIjH1avYURF6k6t' +
'JQ3HVxOhLqlrdYGsupt39KNGZA7d8VO6E1gN7Fs+J4OvvwISP03FTI9xX21eJC/k' +
'lUhsaoapX0MnLlLV0Wpk3sMl45rSNUBC2TUwdYCoeh7zdVutiXNdgXzZGV3p83I9' +
'OOy4IhKyQrAZtfUDg7jK0QKBgQC543hUOlYD24F8rQgNcVviIQzkrdQ9L1rnbr2J' +
'9Si9qyTDvAbwqx2+G5/pVhxdvKaU0dtUYMG/C9BWddpw9grw1btRyhPaLSS4ZYxp' +
'ky2i9oaO4Vv97CIgKeTOxD2i12oiFd9G5l+lHc/A7FIMLMSlvgCdjReW4OrLgeAZ' +
'a8D+gQKBgECz+ul/jNjYiNZ5nl47z2hqITd2M6fwBdH42A2ovgS+9a8zH2AUWFYx' +
'gvPCic2hujZtjZcNQ1RvAb7eG2I3WU3DXUIkNw4iJdLk9j258iPVV1K0rfm9PoTv' +
'NsvtJ40tn/X0uefyiO0CJDJTCgQqJkDH80SpeQbIpaqBjkHZoNPD' +
'-----END RSA PRIVATE KEY-----'
};

function get_identity_pub_key(id) {
    return 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDOk/AIHoD4dcdNLQTze6OVwt/gOXPQNOjndKwaQkJDsGIzDGEUem5Q3fJQVMSC1Ncs36kMr5aIUmAQsoIofQ0PEU+d7MMTSLDAOyzMP7kp9P6bE89ksdRlDk68nmgZKViasWGNMuqGtlNHVprQyXz8+9Zu+7gxS5Ir0lYahrjBXk6DkYQbLhTTK0/0yQOINQ6WKABQDVBodTKitQgbjXH0izsTj/V6kWkRO3CCL7iR5kgEAj3gKiN3t/u0mTxamZHXzByGeDyotnU8cuGdwrkPCtgtywrs/lZ87Cbt+FUlbShFkzgZoLwge1Q7v1amFRhxDlUaoM/XP59RFk1Q0v61'
}

// -----BEGIN PUBLIC KEY-----
// MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCBwsgKzlDWd6vMUG+BkHM+5C1f
// dqdC6ZJw5bwKfi8kDA35feVYK8SeRBf4E7zuDojDFSK5aaMm7g5ICWQD5rqQtk6Z
// wVTFBBOmpiC/GUfupDwfO5GVjSzgVH6c2OA4Ou0gceE9P9Y8O6qvx3VodNq6xMuk
// j0qijqSCRKpR4idL4wIDAQAB
// -----END PUBLIC KEY-----

