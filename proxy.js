const path = require("path");
const Koa = require("koa");
const cors = require("@koa/cors");
const serve = require("koa-static");

const hostname = process.env.hostname || "localhost"; // domain for homepage website
const port = process.env.port || "3050";

// In a docker env, use container_name:port. Running locally, use localhost:port

// The docker hostnames (internal address)
const tmt = process.env.tmt; // || 'localhost:3210';
const rest = process.env.rest; // || 'localhost:8082';
const topics = process.env.topics; // || 'localhost:3600';
const schemas = process.env.schemas; // || 'localhost:3601';
const admin = process.env.admin; // || 'localhost:8090';
const aar = process.env.aar; // || 'localhost:8095';
const ost = process.env.ost; // || 'localhost:8050';
const time = process.env.time; // || 'localhost:8100';
const lfs = process.env.lfs; // || 'localhost:9090';
const mailapi = process.env.mailapi; // || 'localhost:4200';
const mail = process.env.mail; // || 'localhost:3080';
const copper = process.env.copper; // || 'localhost:8088';
const copper_api = process.env.copper_api; // || 'localhost:3008';
const replayservice = process.env.replay_service; // || 'localhost:8080';
const replayservice_api = process.env.replay_service_api; // || 'localhost:8209';
// Geofencer service (and web management application)
const geofencer_webapp = process.env.geofencer_webapp; // || 'localhost:8080';  VUE WEB APPLICATION
const geofencer_api = process.env.geofencer_api; // || 'localhost:8209'; // REST CONNECTION FROM VUE APPLICATION TO MANAGE GEOFENCER SERVICE
const geofencer_notifications_api = process.env.geofencer_notifications_api; // || 'localhost:9995'; // REST CONNECTION FROM VUE APPLICATION TO GEOFENCER SERVICE (push)
const geofencer_cs_api = process.env.geofencer_cs_api; // || 'localhost:3007'; // REST CONNECTION FROM VUE APPLICATION TO COMMON SENSE
// Simulation service (and web management application)
const simulation_service_webapp = process.env.simulation_service_webapp; // || 'localhost:8080';
const simulation_service_api = process.env.simulation_service_api; // || 'localhost:8209';
const simulation_service_websocket = process.env.simulation_service_websocket; // || 'localhost:9995';

const useSsl = process.env.ssl || false;

// Sub DNS names
const subdomain_replayservice =
  process.env.subdomain_replayer || "replay-service";
const subdomain_replayservice_api =
  process.env.subdomain_replayer_api || "replay-service-api";
const subdomain_copper_webapp = process.env.subdomain_copper_webapp || "copper";
const subdomain_copper_api = process.env.subdomain_copper_api || "copper_api";
const subdomain_geofencer_webapp =
  process.env.subdomain_geofencer_management || "geofencer-webapp";
const subdomain_geofencer_api =
  process.env.subdomain_geofencer_management_api || "geofencer-api";
const subdomain_geofencer_notifications_api =
  process.env.subdomain_geofencer_notification_api ||
  "geofencer-notifications-api";
const subdomain_geofencer_cs_api =
  process.env.subdomain_geofencer_cs_api || "geofencer-cs-api";
const subdomain_simulation_service_webapp =
  process.env.subdomain_simulation_service_webapp ||
  "simulation-service-webapp";
const subdomain_simulation_service_api =
  process.env.subdomain_simulation_service_api || "simulation-service-api";
const subdomain_simulation_service_websocket =
  process.env.subdomain_simulation_service_websocket ||
  "simulation-service-websocket";

// Compose FQDN domain names (exposed outside proxy)
const fqdn_replayservice = `${subdomain_replayservice}.${hostname}`.toLocaleLowerCase();
const fqdn_replayservice_api = `${subdomain_replayservice_api}.${hostname}`.toLocaleLowerCase();
const fqdn_copper = `${subdomain_copper_webapp}.${hostname}`.toLocaleLowerCase();
const fqdn_copper_api = `${subdomain_copper_api}.${hostname}`.toLocaleLowerCase();
const fqdn_geofencer_webapp = `${subdomain_geofencer_webapp}.${hostname}`.toLocaleLowerCase();
const fqdn_geofencer_api = `${subdomain_geofencer_api}.${hostname}`.toLocaleLowerCase();
const fqdn_geofencer_notifications_api = `${subdomain_geofencer_notifications_api}.${hostname}`.toLocaleLowerCase();
const fqdn_geofencer_cs_api = `${subdomain_geofencer_cs_api}.${hostname}`.toLocaleLowerCase();
const fqdn_simulation_service_webapp = `${subdomain_simulation_service_webapp}.${hostname}`.toLocaleLowerCase();
const fqdn_simulation_service_api = `${subdomain_simulation_service_api}.${hostname}`.toLocaleLowerCase();
const fqdn_simulation_service_websocket = `${subdomain_simulation_service_websocket}.${hostname}`.toLocaleLowerCase();

// Title on the home page
const title = process.env.title || "Testbed";
// Not used anymore?
// Let's encrypt certificates
const email = process.env.email || "erik.vullings@tno.nl";
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
app.use(serve(path.resolve("./public"))); // This is the homepage website (created with npm run build)
app.use(cors());
app.use(async function (ctx, next) {
  // Redirect /replayservice/ to http://replayservice.<domain>
  // This are the names auto assigned by proxy.js
  if (ctx.path === `/replayservice/`)
    ctx.redirect("http://" + fqdn_replayservice);
  if (ctx.path === `/copper/`) ctx.redirect("http://" + fqdn_copper);
  if (ctx.path === `/geofencer_webapp/`)
    ctx.redirect("http://" + fqdn_geofencer_webapp);
  if (ctx.path === `/geofencer_management/`)
    ctx.redirect("http://" + fqdn_geofencer_webapp);
  if (ctx.path === `/simulation_service_webapp/`)
    ctx.redirect("http://" + fqdn_simulation_service_webapp);
  if (ctx.path === `/simulation_service_api/`)
    ctx.redirect("http://" + fqdn_simulation_service_api);
  if (ctx.path === `/simulation_service_management/`)
    ctx.redirect("http://" + fqdn_simulation_service_webapp);
  // The homepage GUI needs to get the current configuration
  if (ctx.method !== "GET" || ctx.path !== "/services") return await next();
  ctx.type = "json";
  ctx.body = {
    title,
    services: {
      admin,
      tmt,
      aar,
      ost,
      mail,
    },
    debugServices: {
      topics,
      schemas,
      replayservice,
      geofencer_webapp,
      simulation_service_webapp,
    },
    otherServices: {
      time,
      lfs,
      mailapi,
      copper,
    },
  };
});
app.listen(port, () => console.log(`Homepage is listening on ${port}.`));
console.log(`${useSsl ? "SSL is enabled" : "SSL is not enabled"}`);

if (schemas) {
  console.log(
    `Map external '${hostname}/schemas/*' --> to internal '${schemas}/*'`
  );
  console.log(
    `Map external '${hostname}/api/schema-registry/*' --> to internal '${schemas}/api/schema-registry/*'`
  );
  const resolver = function (host, url, req) {
    if (/^\/schemas\//.test(url) || /\/api\/schema-registry/.test(url)) {
      req.url = url.replace(/^\/schemas/, "");
      return { url: `${schemas}/` };
    }
  };
  resolver.priority = 100;
  resolvers.push(resolver);
}

if (topics) {
  console.log(`Map external '${hostname}/topics/*' --> '${topics}/*'`);
  console.log(
    `Map external '${hostname}/api/kafka-rest-proxy/*' --> to internal '${topics}/api/kafka-rest-proxy/*'`
  );
  const resolver = function (host, url, req) {
    if (/^\/topics\//.test(url) || /\/api\/kafka-rest-proxy/.test(url)) {
      req.url = url.replace(/^\/topics/, "");
      console.log(`${req.url}  ${topics}`);
      return { url: `${topics}/` };
    }
  };
  resolver.priority = 100;
  resolvers.push(resolver);
} else console.log(`No proxy for topic website`);

if (admin) {
  console.log(
    `Map external '${hostname}/admin/*' --> to internal '${admin}/*'`
  );
  console.log(
    `Map external '${hostname}/AdminServiceWSEndpoint/*' --> to internal  '${topics}/AdminServiceWSEndpoint/*'`
  );
  console.log(
    `Map external '${hostname}/AdminService/*' --> to internal '${topics}/AdminService/*'`
  );
  const resolver = function (host, url, req) {
    if (
      /^\/admin\//.test(url) ||
      /^\/AdminServiceWSEndpoint/.test(url) ||
      /^\/AdminService/.test(url)
    ) {
      req.url = url.replace(/^\/admin/, "");
      return { url: `${admin}/` };
    }
  };
  resolver.priority = 100;
  resolvers.push(resolver);
} else console.log(`No proxy for admin tool`);

if (aar) {
  console.log(`Map external '${hostname}/aar/*' --> to internal '${aar}'`);
  console.log(
    `Map external '${hostname}/static/js/*' --> to internal '${aar}/static/js/*'`
  );
  console.log(
    `Map external '${hostname}/AARService/*' --> to internal '${aar}/AARService/*'`
  );
  console.log(
    `Map external '${hostname}/static/img/*' --> to internal '${aar}/static/img/*'`
  );
  console.log(
    `Map external '${hostname}/static/css/*' --> to internal '${aar}/static/css/*'`
  );
  const resolver = function (host, url, req) {
    if (
      /^\/aar\//.test(url) ||
      /^\/static\/js/.test(url) ||
      /^\/AARService/.test(url) ||
      /^\/static\/img/.test(url) ||
      /^\/static\/css/.test(url)
    ) {
      req.url = url.replace(/^\/aar/, "");
      return { url: `${aar}/` };
    }
  };
  resolver.priority = 100;
  resolvers.push(resolver);
} else console.log(`No proxy for after action review.`);

if (mailapi) {
  console.log(`Map external '${hostname}/mailapi/*' --> to internal '${mailapi}/*'`);
  proxy.register(`${hostname}/mailapi`, `${mailapi}`);
  
} else console.log(`No proxy for mail api service configured.`);

const proxy = require("redbird")(
  useSsl
    ? {
        port: 80,
        letsencrypt: {
          path: "certs",
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
  console.log(`Map external '${fqdn_copper}/*' --> to internal '${copper}'`);
  console.log(
    `Map external '${fqdn_copper_api}/*' --> to internal '${copper_api}'`
  );
  proxy.register(`${fqdn_copper}`, `${copper}`);
  proxy.register(`${fqdn_copper_api}`, `${copper_api}`);
} else console.log(`No proxy for copper configured.`);

if (replayservice) {
  // All url's in web app are relative, use subdomain to prevent resolve all url's (e.g. app.*.js can be used by multiple applications)
  // Examples: app.<id>.css, chunk-vendors.<id>.css, app.<id>.js
  // Create subdomain for web-site and subdomain for rest calls (use different ports)
  console.log(
    `Map external '${fqdn_replayservice}/*' --> to internal '${replayservice}'`
  );
  console.log(
    `Map external '${fqdn_replayservice_api}/*' --> to internal '${replayservice_api}'`
  );
  proxy.register(`${fqdn_replayservice}`, `${replayservice}`);
  proxy.register(`${fqdn_replayservice_api}`, `${replayservice_api}`);
}

if (simulation_service_api) {
  if (
    !fqdn_simulation_service_api ||
    !fqdn_simulation_service_websocket ||
    !fqdn_simulation_service_webapp ||
    !simulation_service_webapp ||
    !simulation_service_api ||
    !simulation_service_websocket
  ) {
    console.log(
      `Quit application: simulation services is enabled, but not all environment variables are set.`
    );
    process.exit(1);
  }
  console.log(
    `Map external '${fqdn_simulation_service_webapp}/*' --> to internal '${simulation_service_webapp}'`
  );
  console.log(
    `Map external '${fqdn_simulation_service_api}/*' --> to internal '${simulation_service_api}'`
  );
  console.log(
    `Map external '${fqdn_simulation_service_websocket}/*' --> to internal '${simulation_service_websocket}'`
  );

  proxy.register(
    `${fqdn_simulation_service_webapp}`,
    `${simulation_service_webapp}`
  );
  proxy.register(`${fqdn_simulation_service_api}`, `${simulation_service_api}`);
  proxy.register(
    `${fqdn_simulation_service_websocket}`,
    `${simulation_service_websocket}`
  );
} else console.log(`No proxy for simulation service configured.`);

if (geofencer_webapp) {
  if (
    !fqdn_geofencer_api ||
    !fqdn_geofencer_notifications_api ||
    !fqdn_geofencer_cs_api ||
    !geofencer_webapp ||
    !geofencer_api ||
    !geofencer_notifications_api ||
    !geofencer_cs_api
  ) {
    console.log(
      `Quit application: geofencer services is enabled, but not all environment variables are set.`
    );
    process.exit(1);
  }
  console.log(
    `Map external '${fqdn_geofencer_webapp}/*' --> to internal '${geofencer_webapp}'`
  );
  console.log(
    `Map external '${fqdn_geofencer_api}/*' --> to internal '${geofencer_api}'`
  );
  console.log(
    `Map external '${fqdn_geofencer_notifications_api}/*' --> to internal '${geofencer_notifications_api}'`
  );
  console.log(
    `Map external '${fqdn_geofencer_cs_api}/*' --> to internal '${geofencer_cs_api}'`
  );
  proxy.register(`${fqdn_geofencer_webapp}`, `${geofencer_webapp}`);
  proxy.register(`${fqdn_geofencer_api}`, `${geofencer_api}`);
  proxy.register(
    `${fqdn_geofencer_notifications_api}`,
    `${geofencer_notifications_api}`
  );
  proxy.register(`${fqdn_geofencer_cs_api}`, `${geofencer_cs_api}`);
} else console.log(`No proxy for geofencer configured.`);

if (tmt) {
  console.log(`Map external '${hostname}/tmt/*' --> to internal '${tmt}/*'`);
  proxy.register(`${hostname}/tmt`, `${tmt}`);
} else console.log(`No proxy for trail management tool configured.`);

if (rest) {
  console.log(`Map external '${hostname}/rest' --> '${rest}'`);
  proxy.register(`${hostname}/rest`, `${rest}`);
} else console.log(`No proxy for rest configured.`);

// Timeservice uses subpath / (and websocket with subpath '/socket.io')
// Therefore no subdomain is needed (the service is reserve proxy safe)
if (time) {
  console.log(`Map external '${hostname}/time' --> to internal '${time}'`);
  proxy.register(`${hostname}/time`, `${time}`);
  // proxy.register(`${hostname}`, `${time}`);
} else console.log(`No proxy for time service configured.`);

if (lfs) {
  console.log(`Map external '${hostname}/lfs/*' --> to internal '${lfs}/*'`);
  proxy.register(`${hostname}/lfs`, `${lfs}`);
} else console.log(`No proxy for large file service configured.`);

if (mail) {
  console.log(`Map external '${hostname}/email/*' --> to internal '${mail}/*'`);
  proxy.register(`${hostname}/mail`, mail);
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
