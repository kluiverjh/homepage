const path = require('path');
const Koa = require('koa');
const cors = require('@koa/cors');
const serve = require('koa-static');

const title = 'Test-bed';
const homepage = process.env.homepage || 3050;
const port = process.env.production ? 443 : 80;
const hostname = process.env.hostname || 'localhost';
const ip = process.env.ip || '127.0.0.1';

const tmt = process.env.tmt || 3210;
const rest = process.env.rest || 8082;
const topics = process.env.topics || 3600;
const schemas = process.env.schemas || 3601;
const admin = process.env.admin || 8090;
const aar = process.env.aar || 8095;
const time = process.env.time || 8100;
const lfs = process.env.lfs || 8100;

const resolvers = [];

/** Setup webapp server */
const app = new Koa();
app.use(serve(path.resolve('./public')));
app.use(cors());
app.use(async function(ctx, next) {
  if (ctx.method !== 'GET' || ctx.path !== '/services') return await next();
  ctx.type = 'json';
  ctx.body = {
    title,
    services: {
      admin,
      tmt,
      aar,
    },
    debugServices: {
      topics,
      schemas,
    },
    otherServices: {
      time,
      lfs,
    } 
  };
});
app.listen(homepage, () => `Homepage is listening on ${homepage}.`);

if (schemas) {
  const resolver = function(host, url, req) {
    if (/^\/schemas\//.test(url) || /\/api\/schema-registry/.test(url)) {
      req.url = url.replace(/^\/schemas/, '');
      return { url: `${ip}:${schemas}/` };
    }
  };
  resolver.priority = 100;
  resolvers.push(resolver);
}

if (topics) {
  const resolver = function(host, url, req) {
    if (/^\/topics\//.test(url) || /\/api\/kafka-rest-proxy/.test(url)) {
      req.url = url.replace(/^\/topics/, '');
      return { url: `${ip}:${topics}/` };
    }
  };
  resolver.priority = 100;
  resolvers.push(resolver);
}

if (admin) {
  const resolver = function(host, url, req) {
    if (/^\/admin\//.test(url) || /^\/AdminServiceWSEndpoint/.test(url) || /^\/AdminService/.test(url)) {
      req.url = url.replace(/^\/admin/, '');
      return { url: `${ip}:${admin}/` };
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
      return { url: `${ip}:${aar}/` };
    }
  };
  resolver.priority = 100;
  resolvers.push(resolver);
}

const proxy = require('redbird')({ port, resolvers });

if (tmt) {
  proxy.register(`${hostname}/tmt`, `${ip}:${tmt}`);
}

if (rest) {
  proxy.register(`${hostname}/rest`, `${ip}:${rest}`);
}

if (time) {
  proxy.register(`${hostname}/time`, `${ip}:${time}/time-service/`);
  proxy.register(`${hostname}/time-service`, `${ip}:${time}/time-service/`);
}

proxy.register(hostname, `${ip}:${homepage}`);
