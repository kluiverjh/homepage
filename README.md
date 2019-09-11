# Homepage

A reverse proxy and home page combined, offering easy access to all services.

## Installation

Just run:

```bash
npm i
# Or, for a smaller footprint, uses `pnpm i`
```

## Production

```bash
npm run production
```

## Development

```bash
npm start
```

### Proxy configuration

The reverse proxy functionality is based on [Redbird](https://github.com/OptimalBits/redbird), using custom resolvers for most test-bed services. Since the subdomain is used to indicate the test-bed, relative paths are used for the services. In case the service is accessing hard-coded paths, e.g. `/static/js/...`, and you are getting error messages about routes that cannot be resolved, you may need to add explicit rules for those files too. See the examples provided.

To add a new service, decide what path you want to use and to what port address you want to redirect it, and start with a standard proxy, e.g.:

```js
const my_service = process.env.my_service; // Port of the service

if (my_service) {
  proxy.register(`${hostname}/my_service`, `${ip}:${my_service}`);
}
```

Sometimes, this is sufficient, but a web service often requires many files that cannot be found in this way, for example to access an API. In that case, you need a custom resolver that redirects traffic accordingly. For example, the After-Action-Review service requires the following:

```js
if (aar) {
  var aarUI = function(host, url, req) {
    if (
      /^\/aar\//.test(url) ||
      /\/AARService/.test(url) ||
      /\/static\/js/.test(url) ||
      /\/static\/img/.test(url) ||
      /\/static\/css/.test(url)
    ) {
      req.url = url.replace(/^\/aar/, '');
      return { url: `${ip}:${aar}/` };
    }
  };
  aarUI.priority = 100;
  resolvers.push(aarUI);
}
```

Since this custom resolver redirects all `/static/js`, `/static/img`, `/static/css` this is also somewhat of a red flag, as you may have multiple services that want you to redirect those specific paths, and if they are not unique, how can you distinguish between them.

### Home page

At the same time, a website is created to have easy access to all these services.
