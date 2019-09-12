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
app.use(serve(path.resolve('./public')));
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

if (schemas) {
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
  const resolver = function(host, url, req) {
    if (/^\/topics\//.test(url) || /\/api\/kafka-rest-proxy/.test(url)) {
      req.url = url.replace(/^\/topics/, '');
      return { url: `${topics}/` };
    }
  };
  resolver.priority = 100;
  resolvers.push(resolver);
}

if (admin) {
  const resolver = function(host, url, req) {
    if (/^\/admin\//.test(url) || /^\/AdminServiceWSEndpoint/.test(url) || /^\/AdminService/.test(url)) {
      req.url = url.replace(/^\/admin/, '');
      return { url: `${admin}/` };
    }
  };
  resolver.priority = 100;
  resolvers.push(resolver);
}

if (aar) {
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
}

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
  proxy.register(`${hostname}/tmt`, `${tmt}`, ssl);
  proxy.register(`${hostname}/socket.io`, `${tmt}/socket.io`, ssl);
}

if (rest) {
  proxy.register(`${hostname}/rest`, `${rest}`, ssl);
}

if (time) {
  proxy.register(`${hostname}/time`, `${time}/time-service/`, ssl);
  proxy.register(`${hostname}/time-service`, `${time}/time-service/`, ssl);
}

if (lfs) {
  proxy.register(`${hostname}/lfs`, `${lfs}`, ssl);
}

if (ost) {
  proxy.register(`${hostname}/ost`, `${ost}`, ssl);
}

// For the homepage
proxy.register(hostname, `localhost:${port}`, ssl);
