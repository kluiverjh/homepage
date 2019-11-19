const path = require('path');
const Koa = require('koa');
const cors = require('@koa/cors');
const serve = require('koa-static');

const hostname = process.env.hostname || 'localhost'; // domain for homepage website
const port = process.env.port || '3050';

// In a docker env, use container_name:port. Running locally, use localhost:port
const tmt = process.env.tmt; // || 'localhost:3210';
const rest = process.env.rest; // || 'localhost:8082';
const topics = process.env.topics; // || 'localhost:3600';
const schemas = process.env.schemas; // || 'localhost:3601';
const admin = process.env.admin; // || 'localhost:8090';
const aar = process.env.aar; // || 'localhost:8095';
const ost = process.env.ost; // || 'localhost:8050';
const time = process.env.time; // || 'localhost:8100';
const lfs = process.env.lfs; // || 'localhost:9090';
const copper = process.env.copper; // || 'localhost:8088';
const copper_api = process.env.copper_api; // || 'localhost:3008';
const replayservice = process.env.replay_service; // || 'localhost:8080';
const replayservice_api = process.env.replay_service_api; // || 'localhost:8209';

const useSsl = process.env.ssl || false;

const replayservice_subdomain = process.env.subdomain_replayer || 'replay-service';
const replayservice_api_subdomain = process.env.subdomain_replayer_api || 'replay-service-api';
const copper_subdomain = process.env.subdomain_copper ||'copper';
const copper_api_subdomain = process.env.subdomain_copper_api ||'copper_api';

const replayservice_subdomain_full = `${replayservice_subdomain}.${hostname}`.toLocaleLowerCase();
const replayservice_api_subdomain_full = `${replayservice_api_subdomain}.${hostname}`.toLocaleLowerCase();
const copper_subdomain_full = `${copper_subdomain}.${hostname}`.toLocaleLowerCase();
const copper_api_subdomain_full = `${copper_api_subdomain}.${hostname}`.toLocaleLowerCase();


// Title on the home page
const title = process.env.title || 'Test-bed';
// Not used anymore?
// Let's encrypt certificates
const email = process.env.email || 'erik.vullings@tno.nl';
const ssl = useSsl
  ? {
    ssl: {
      letsencrypt: {
        email, // Domain owner/admin email
        production: true, // WARNING: Only use this flag when the proxy is verified to work correctly to avoid being banned!
      },
    },
  }
  : undefined;

const resolvers = [];

/** Setup webapp server */
const app = new Koa();
app.use(serve(path.resolve('./public'))); // This is the homepage website (created with npm run build)
app.use(cors());
app.use(async function (ctx, next) {
  // Redirect /replayservice/ to http://replayservice.<domain>
  if (ctx.path === `/replayservice/`) ctx.redirect('http://' +  replayservice_subdomain_full) ;
  if (ctx.path === `/copper/`) ctx.redirect('http://' +  copper_subdomain_full) ;
  // The homepage GUI needs to get the current configuration
  if (ctx.method !== 'GET' || ctx.path !== '/services') return await next();
  ctx.type = 'json';
  ctx.body = {
    title,
    services: {
      admin,
      tmt,
      aar,
      ost,
    },
    debugServices: {
      topics,
      schemas,
	  replayservice
    },
    otherServices: {
      time,
      lfs,
      copper
    },
  };
});
app.listen(port, () => console.log(`Homepage is listening on ${port}.`));
console.log(`${(useSsl) ? 'SSL is enabled' : 'SSL is not enabled'}`);


if (schemas) {
  console.log(`Map external '${hostname}/schemas/*' --> to internal '${schemas}/*'`);
  console.log(`Map external '${hostname}/api/schema-registry/*' --> to internal '${schemas}/api/schema-registry/*'`);
  const resolver = function (host, url, req) {
    if (/^\/schemas\//.test(url) || /\/api\/schema-registry/.test(url)) {
      req.url = url.replace(/^\/schemas/, '');
      return { url: `${schemas}/` };
    }
  };
  resolver.priority = 100;
  resolvers.push(resolver);
}

if (topics) {
  console.log(`Map external '${hostname}/topics/*' --> '${topics}/*'`);
  console.log(`Map external '${hostname}/api/kafka-rest-proxy/*' --> to internal '${topics}/api/kafka-rest-proxy/*'`);
  const resolver = function (host, url, req) {
    if (/^\/topics\//.test(url) || /\/api\/kafka-rest-proxy/.test(url)) {
      req.url = url.replace(/^\/topics/, '');
      console.log(`${req.url}  ${topics}`);
      return { url: `${topics}/` };
    }
  };
  resolver.priority = 100;
  resolvers.push(resolver);
} else console.log(`No proxy for topic website`);

if (admin) {
  console.log(`Map external '${hostname}/admin/*' --> to internal '${admin}/*'`);
  console.log(`Map external '${hostname}/AdminServiceWSEndpoint/*' --> to internal  '${topics}/AdminServiceWSEndpoint/*'`);
  console.log(`Map external '${hostname}/AdminService/*' --> to internal '${topics}/AdminService/*'`);
  const resolver = function (host, url, req) {
    if (/^\/admin\//.test(url) || /^\/AdminServiceWSEndpoint/.test(url) || /^\/AdminService/.test(url)) {
      req.url = url.replace(/^\/admin/, '');
      return { url: `${admin}/` };
    }
  };
  resolver.priority = 100;
  resolvers.push(resolver);
} else console.log(`No proxy for admin tool`);

if (aar) {
  console.log(`Map external '${hostname}/aar/*' --> to internal '${aar}'`);
  console.log(`Map external '${hostname}/static/js/*' --> to internal '${aar}/static/js/*'`);
  console.log(`Map external '${hostname}/AARService/*' --> to internal '${aar}/AARService/*'`);
  console.log(`Map external '${hostname}/static/img/*' --> to internal '${aar}/static/img/*'`);
  console.log(`Map external '${hostname}/static/css/*' --> to internal '${aar}/static/css/*'`);
  const resolver = function (host, url, req) {
    if (
      /^\/aar\//.test(url) ||
      /^\/static\/js/.test(url) ||
      /^\/AARService/.test(url) ||
      /^\/static\/img/.test(url) ||
      /^\/static\/css/.test(url)
    ) {
      req.url = url.replace(/^\/aar/, '');
      return { url: `${aar}/` };
    }
  };
  resolver.priority = 100;
  resolvers.push(resolver);
} else console.log(`No proxy for after action review.`);

const proxy = require('redbird')(
  useSsl
    ? {
      port: 80,
      letsencrypt: {
        path: 'certs',
        port: 3000,
      },
      ssl: {
        port: 443,
      },
      resolvers,
    }
    : { port: 80, resolvers }
);



if (copper) {
  
    // Redirect COPPER REST API url
    // An embedded REST url is used in the vue copper web application to connect to the server.
    // When this url is configured for the reserve proxy (e.g. http://<proxy_domain>/copper_api),
    // a problem occurs:
    // The sub-path 'copper_api' isn't used for the websocket communication 
    // The request from the vue webclient becomes http://<proxy>/socket.io, 
    // Fot the reverse proxy it is ambigue where to redirect the stream if there are multiple websockets
    // Using a subdomain is easiest solution to fix this problem
    // Not tested under SSL (subdomain requires own certificate?)
	console.log(`Map external '${copper_subdomain_full}/*' --> to internal '${copper}'`);
	console.log(`Map external '${copper_api_subdomain_full}/*' --> to internal '${copper_api}'`);
	proxy.register(`${copper_subdomain_full}`, `${copper}`);
    proxy.register(`${copper_api_subdomain_full}`, `${copper_api}`);
} else console.log(`No proxy for copper configured.`);


if (replayservice) {
   // All url's in web app are relative, use subdomain to prevent resolve all url's (e.g. app.*.js can be used by multiple applications)
   // Examples: app.<id>.css, chunk-vendors.<id>.css, app.<id>.js
   // Create subdomain for web-site and subdomain for rest calls (use different ports)
  console.log(`Map external '${replayservice_subdomain_full}/*' --> to internal '${replayservice}'`);
  console.log(`Map external '${replayservice_api_subdomain_full}/*' --> to internal '${replayservice_api}'`);
  proxy.register(`${replayservice_subdomain_full}`, `${replayservice}`);
  proxy.register(`${replayservice_api_subdomain_full}`, `${replayservice_api}`);
}

if (tmt) {
  console.log(`Map external '${hostname}/tmt/*' --> to internal '${tmt}/*'`);
  console.log(`Map external '${hostname}/socket.io' --> to internal '${tmt}/socket.io'`);
  proxy.register(`${hostname}/tmt`, `${tmt}`);
  proxy.register(`${hostname}/socket.io`, `${tmt}/socket.io`);
} else console.log(`No proxy for trail management tool configured.`);

if (rest) {
  console.log(`Map external '${hostname}/rest' --> '${rest}'`);
  proxy.register(`external ${hostname}/rest`, `${rest}`);
} else console.log(`No proxy for rest configured.`);

// Timeservice uses subpath /time-service' (and websocket with subpath '/time-service/socket.io')
// Therefore no subdomain is needed (the service is reserve proxy safe)
if (time) {
  console.log(`Map external '${hostname}/time' --> to internal '${time}/time-service'`);
  console.log(`Map external '${hostname}/time-service' --> to internal '${time}/time-service'`);
  proxy.register(`${hostname}/time`, `${time}`);
  proxy.register(`${hostname}/time-service`, `${time}`);
} else console.log(`No proxy for time service configured.`);

if (lfs) {
  console.log(`Map external '${hostname}/lfs/*' --> to internal '${lfs}/*'`);
  proxy.register(`${hostname}/lfs`, `${lfs}`);
} else console.log(`No proxy for large file service configured.`);

if (ost) {
  console.log(`Map '${hostname}/ost/*' --> '${ost}/*'`);
  proxy.register(`${hostname}/ost`, `${ost}`);
} else console.log(`No proxy for ost configured.`);



// For the homepage
console.log(`Map '${hostname}' --> 'localhost:${port}'`);
proxy.register(hostname, `localhost:${port}`);


console.log(`Open webbrowser on page http://${hostname}`);
// redbird.register(hostname, `localhost:${port}`, ssl);
