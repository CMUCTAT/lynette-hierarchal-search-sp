TransactionMailerUsers =
{
    process_transactions_url: "",
    process_detectors_url: "",
    authenticity_token: "",
    mailerURL: "mail-worker.js",
    mailer: null,
    mailerPort: null,
    scripts: ["Detectors/Lumilo/idle.js", 
    "Detectors/Lumilo/system_misuse.js", 
    "Detectors/Lumilo/struggle__moving_average.js", 
    "Detectors/Lumilo/student_doing_well__moving_average.js", 
    "Detectors/Lumilo/critical_struggle.js"],
    active: []
};

var init = "";


TransactionMailerUsers.create = function(path, txDestURL, scriptsDestURL, authToken, scriptsInitzer, xApiKeyHeader)
{

    console.log("TransactionMailerUsers.create(): at entry, init", init );

    TransactionMailerUsers.mailer = new Worker(path+'/'+TransactionMailerUsers.mailerURL);
    
    TransactionMailerUsers.process_transactions_url = txDestURL;
    TransactionMailerUsers.authenticity_token = authToken;
    TransactionMailerUsers.process_detectors_url = scriptsDestURL;
    TransactionMailerUsers.x_api_key_header = (xApiKeyHeader? xApiKeyHeader : "");

    TransactionMailerUsers.mailer.postMessage({
        command: "process_transactions_url",
        process_transactions_url: TransactionMailerUsers.process_transactions_url,
        process_detectors_url: TransactionMailerUsers.process_detectors_url,
        x_api_key_header: TransactionMailerUsers.x_api_key_header,
        authenticity_token: TransactionMailerUsers.authenticity_token
    });

    var channel = new MessageChannel();
    TransactionMailerUsers.mailer.postMessage(
            { command: "connectTransactionAssembler" },
            [ channel.port1 ]
    );
    TransactionMailerUsers.mailerPort = channel.port2;
    TransactionMailerUsers.mailerPort.onmessage = function(event) {
            console.log("From mailer: "+event);
    };
 
    //initialization
    for(var i = 0; i < TransactionMailerUsers.scripts.length; ++i)
    {
        var s = path + '/' + TransactionMailerUsers.scripts[i];
        var detector = new Worker(s);
        var mc = new MessageChannel();
        TransactionMailerUsers.mailer.postMessage({ command: "connectDetector" }, [ mc.port1 ]);
        detector.postMessage({ command: "connectMailer" }, [ mc.port2 ]);

        detector.postMessage({ command: "initialize", initializer: init });
                console.log("TransactionMailerUsers.create(): sent command: initialize, init ", init );

        detector.onmessage = function (e) {
            console.log("transaction_mailer_users received broadcast command");
            CTATCommShell.commShell.processComponentAction(
                new CTATSAI(e.data.name, "UpdateVariable", JSON.stringify(e.data)), false, true, null, "ATTEMPT", "DATA"
            );
        };

        TransactionMailerUsers.active.push(detector);
        console.log("TransactionMailerUsers.create(): s, active["+i+"]=", s, TransactionMailerUsers.active[i]);
    }

    return TransactionMailerUsers;
};

TransactionMailerUsers.sendTransaction = function(tx)
{
    TransactionMailerUsers.mailerPort.postMessage(tx);  // post to listener in other thread

    var tmUsers = TransactionMailerUsers.active;
    for(var i = 0; i < tmUsers; ++i)
    {
	tmUsers[i].postMessage(tx);
    }
};

