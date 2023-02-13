var api_key = process.env.API_KEY

if (!api_key) {
    throw("No API_KEY set")
}

const fastify = require('fastify')({
    logger: true
})
DexcomParser = require('./dexcom_parser.js')
parser = new DexcomParser()

fastify.get('/', function (request, reply) {
    reply.code(200).send("")
})

// Declare a route
fastify.get('/read_data', function (request, reply) {
    if (request.headers['x-api-key'] !== api_key) {
        reply.code(401).send(Error("Wrong API Key"))
        return;
    }
    parser.read_data_from_dexcom(function(err, entries){
        if (err) {
            fastify.log.error(err)
            reply.code(500).send(err)
        } else {
            reply.send({ entries: entries })
        }
    })   
})

// Run the server!
fastify.listen({ host: '0.0.0.0', port: readEnv("FASTIFY_PORT", 8080) }, function (err, address) {
    if (err) {
        fastify.log.error(err)
        process.exit(1)
    }
  // Server is now listening on ${address}
})

function readEnv(varName, defaultValue) {
    //for some reason Azure uses this prefix, maybe there is a good reason
    var value = process.env['CUSTOMCONNSTR_' + varName]
        || process.env['CUSTOMCONNSTR_' + varName.toLowerCase()]
        || process.env['APPSETTING_' + varName]
        || process.env[varName]
        || process.env[varName.toLowerCase()];

    return value || defaultValue;
}