const path = require('path');
const Koa = require('koa');
const cors = require('@koa/cors');
const serve = require('koa-static');

const hostname = process.env.hostname || 'localhost';
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
app.use(async function(ctx, next) {
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
    },
    otherServices: {
      time,
      lfs,
    },
  };
});
app.listen(port, () => console.log(`Homepage is listening on ${port}.`));
console.log(`${(useSsl) ? 'SSL is enabled' : 'SSL is not enabled'}`);


if (schemas) {
  console.log(`Map '${hostname}/schemas' --> '${schemas}'`);
  console.log(`Map '${hostname}/api/schema-registry/*' --> '${schemas}/api/schema-registry/*'`);
  const resolver = function(host, url, req) {
    if (/^\/schemas\//.test(url) || /\/api\/schema-registry/.test(url)) {
      req.url = url.replace(/^\/schemas/, '');
      return { url: `${schemas}/` };
    }
  };
  resolver.priority = 100;
  resolvers.push(resolver);
}

if (topics) {
  console.log(`Map '${hostname}/topics' --> '${topics}'`);
  console.log(`Map '${hostname}/api/kafka-rest-proxy/*' --> '${topics}/api/kafka-rest-proxy/*'`);
  const resolver = function(host, url, req) {
    console.log(` Redirect ${host} ${url} ${req}`);
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
  console.log(`Map '${hostname}/admin' --> '${admin}'`);
  console.log(`Map '${hostname}/AdminServiceWSEndpoint/*' --> '${topics}/AdminServiceWSEndpoint/*'`);
  console.log(`Map '${hostname}/AdminService/*' --> '${topics}/AdminService/*'`);
  const resolver = function(host, url, req) {
    if (/^\/admin\//.test(url) || /^\/AdminServiceWSEndpoint/.test(url) || /^\/AdminService/.test(url)) {
      req.url = url.replace(/^\/admin/, '');
      return { url: `${admin}/` };
    }
  };
  resolver.priority = 100;
  resolvers.push(resolver);
} else console.log(`No proxy for admin tool`);

if (aar) {
  console.log(`Map '${hostname}/aar' --> '${aar}'`);
  const resolver = function(host, url, req) {
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
if (tmt) {
  console.log(`Map '${hostname}/tmt' --> '${tmt}'`);
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
  proxy.register(`${hostname}/time`, `${time}/time-service/`);
  proxy.register(`${hostname}/time-service`, `${time}/time-service/`);
} else console.log(`No proxy for time service configured.`);

if (lfs) {
  console.log(`Map '${hostname}/lfs' --> '${lfs}'`);
  proxy.register(`${hostname}/lfs`, `${lfs}`);
} else console.log(`No proxy for large file service configured.`);

if (ost) {
  console.log(`Map '${hostname}/ost' --> '${ost}'`);
  proxy.register(`${hostname}/ost`, `${ost}`);
}

// For the homepage
console.log(`Map '${hostname}' --> 'localhost:${port}'`);
proxy.register(hostname, `localhost:${port}`);


console.log(`Open webbrowser on page http://${hostname}`);
// redbird.register(hostname, `localhost:${port}`, ssl);
