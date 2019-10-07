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
const replayservice = process.env.replayservice; // || 'localhost:8080';
const replayservice_api = process.env.replayservice_api; // || 'localhost:8209';

const useSsl = process.env.ssl || false;


// Title on the home page
const title = process.env.title || 'Test-bed';
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
	  replayerservice
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
  console.log(`Map '${hostname}/schemas/*' --> '${schemas}/*'`);
  console.log(`Map '${hostname}/api/schema-registry/*' --> '${schemas}/api/schema-registry/*'`);
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
  console.log(`Map '${hostname}/topics/*' --> '${topics}/*'`);
  console.log(`Map '${hostname}/api/kafka-rest-proxy/*' --> '${topics}/api/kafka-rest-proxy/*'`);
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
  console.log(`Map '${hostname}/admin/*' --> '${admin}/*'`);
  console.log(`Map '${hostname}/AdminServiceWSEndpoint/*' --> '${topics}/AdminServiceWSEndpoint/*'`);
  console.log(`Map '${hostname}/AdminService/*' --> '${topics}/AdminService/*'`);
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
  console.log(`Map '${hostname}/aar/*' --> '${aar}'`);
  console.log(`Map '${hostname}/static/js/*' --> '${aar}/static/js/*'`);
  console.log(`Map '${hostname}/AARService/*' --> '${aar}/AARService/*'`);
  console.log(`Map '${hostname}/static/img/*' --> '${aar}/static/img/*'`);
  console.log(`Map '${hostname}/static/css/*' --> '${aar}/static/css/*'`);
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

if (copper) {
  console.log(`Map '${hostname}/copper/*' --> '${copper}'`);
  console.log(`Map '${hostname}/sockjs-node/*' --> '${copper}/sockjs-node/*'`);

  const resolver = function (host, url, req) {
    // const guid_regex = /^\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i;  // Check for /<guid> in url
    // blob:http://localhost/<guid> is generated by javascript and refers to local browser cache
    const copper_regex = /^\/copper\//; // Check for /copper/ in url
    const sockjs_regex = /^\/sockjs-node\//; // Check for /sockjs-node/ in url

    if (copper_regex.test(url) || sockjs_regex.test(url)) {
      req.url = url.replace(/^\/copper/, '');
      return { url: `${copper}/` };
    }


  };
  resolver.priority = 100;
  resolvers.push(resolver);
} else console.log(`No proxy for copper configured.`);


if (replayservice) {
  console.log(`Map '${hostname}/replayservice/*' --> '${replayservice}'`);
  const resolver = function (host, url, req) {
    const replayservice_regex = /^\/replayservice\//; // Check for /replayservice/ in url
    if (replayservice_regex.test(url) || sockjs_regex.test(url)) {
      req.url = url.replace(/^\/replayservice/, '');
      return { url: `${copper}/` };
    }
  };
  resolver.priority = 100;
  resolvers.push(resolver);
} else console.log(`No proxy for replayservice configured.`);

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


const copper_api_subdomain = 'copper_api';
const copper_api_subdomain_full = `${copper_api_subdomain}.${hostname}`.toLocaleLowerCase();
if (copper) {
  console.log(`Map '${copper_api_subdomain_full}/*' --> '${copper_api}'`);
    // Redirect COPPER REST API url
    // An embedded REST url is used in the vue copper web application to connect to the server.
    // When this url is configured for the reserve proxy (e.g. http://<proxy_domain>/copper_api),
    // a problem occurs:
    // The sub-path 'copper_api' isn't used for the websocket communication 
    // The request from the vue webclient becomes http://<proxy>/socket.io, 
    // Fot the reverse proxy it is ambigue where to redirect the stream if there are multiple websockets
    // Using a subdomain is easiest solution to fix this problem
    // Not tested under SSL (subdomain requires own certificate?)
  proxy.register(`${copper_api_subdomain_full}`, `${copper_api}`);
}

const replayservice_api_subdomain = 'replayservice_api';
const replayservice_api_subdomain_full = `${replayservice_api_subdomain}.${hostname}`.toLocaleLowerCase();
if (replayservice) {
  console.log(`Map '${replayservice_api_subdomain_full}/*' --> '${replayservice_api}'`);
  proxy.register(`${replayservice_api_subdomain_full}`, `${replayservice_api}`);
}

if (tmt) {
  console.log(`Map '${hostname}/tmt/*' --> '${tmt}/*'`);
  console.log(`Map '${hostname}/socket.io' --> '${tmt}/socket.io'`);
  proxy.register(`${hostname}/tmt`, `${tmt}`);
  proxy.register(`${hostname}/socket.io`, `${tmt}/socket.io`);
} else console.log(`No proxy for trail management tool configured.`);

if (rest) {
  console.log(`Map '${hostname}/rest' --> '${rest}'`);
  proxy.register(`${hostname}/rest`, `${rest}`);
} else console.log(`No proxy for rest configured.`);

if (time) {
  console.log(`Map '${hostname}/time' --> '${time}'`);
  console.log(`Map '${hostname}/time-service' --> '${time}'`);
  proxy.register(`${hostname}/time`, `${time}`);
  proxy.register(`${hostname}/time-service`, `${time}`);
} else console.log(`No proxy for time service configured.`);

if (lfs) {
  console.log(`Map '${hostname}/lfs/*' --> '${lfs}/*'`);
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
