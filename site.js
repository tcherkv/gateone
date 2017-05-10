
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
    var $li = $('<li data-id="' + index + '">' + title + '</li>');
    $('#tabs').append($li);

    var $content = $('<div data-id="' + index + '"></div>');
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

    $('.current-tab').removeClass('current-tab');
    $li.addClass('current-tab');

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

    // Tell Gate One to create the new terminal
    if (termNum)
        GateOne.Terminal.newTerminal(termNum, null, container);
    else
        termNum = GateOne.Terminal.newTerminal(null, null, container);

    GateOne.Terminal.switchTerminal(termNum);
    GateOne.Terminal.clearScrollback(termNum);
    GateOne.ws.send(JSON.stringify({ 'terminal:ssh_save_known_hosts': get_identity_key() }));
    GateOne.Terminal.sendString(connection.url, termNum);

    GateOne.Terminal.Input.capture(); // (re)start capturing keyboard input
}

function SelectTerminal(termNum)
{
    $('#gateone_container').appendTo($('#tabs_content > div:nth(' + termNum + ')')).show();
    $('#tabs_content > div:nth(' + termNum + ')').show();

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
        'MIICXAIBAAKBgQCBwsgKzlDWd6vMUG+BkHM+5C1fdqdC6ZJw5bwKfi8kDA35feVY' +
        'K8SeRBf4E7zuDojDFSK5aaMm7g5ICWQD5rqQtk6ZwVTFBBOmpiC/GUfupDwfO5GV' +
        'jSzgVH6c2OA4Ou0gceE9P9Y8O6qvx3VodNq6xMukj0qijqSCRKpR4idL4wIDAQAB' +
        'AoGAMuGP0zznUdGHGgyITMO5jPWoHQDHwWMZOw+6Vlr4XSgk6qnFHne7F1wYEfyb' +
        'XrVwRx6oiQ+1G/TIwNJ911HH4ZVG/mIqsdX4PP64gj9WHuv2WUJi6ukvzNlya/os' +
        'LwtZ7i5Mf55xnzd2byGLeRkz4JZXlmKGHi+H+EjIUu1xkTECQQD2OzBp2LMSD7D/' +
        'nljypsG1G92D1ygrbfsu/YBhN+Qg7u/xxBa3yj+BcaF4E+8PmZCKnw2dKDryWaTl' +
        'OPVvUo1HAkEAhuitsEEJO2nra4UopdveRj1kmMjwUcyzrvILbTxeoDqz1dvcfEeK' +
        '6YuS9mU2pPDk80ON8G+VCkUWtLC9zFfqhQJAJWy/ogbeyMr7ww5lRJRV8toGZCiK' +
        'oXc46156acxd7yeB7sQ4E704w8rqmN6mwj87+eXM4usfcoBvkKuEmmP4twJAXycd' +
        '2oMEj/NVKLDyyokZbVE/8sNHPWq0EWCGzrUVyM2eqeg4yy9quu7G6SLaN9vwn+O1' +
        '6S/KX0P7j9ZZCBe6QQJBAKCz8M9epVtX6zESZCK8PV2HfWjiFcU7EIM8JzGBrH+X' +
        '9EaTtXHMcqMWRw6mxUR/CX9m4TPoDgKMpGMvABm8iNU=' +
        '-----END RSA PRIVATE KEY-----'
};

// -----BEGIN PUBLIC KEY-----
// MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCBwsgKzlDWd6vMUG+BkHM+5C1f
// dqdC6ZJw5bwKfi8kDA35feVYK8SeRBf4E7zuDojDFSK5aaMm7g5ICWQD5rqQtk6Z
// wVTFBBOmpiC/GUfupDwfO5GVjSzgVH6c2OA4Ou0gceE9P9Y8O6qvx3VodNq6xMuk
// j0qijqSCRKpR4idL4wIDAQAB
// -----END PUBLIC KEY-----

