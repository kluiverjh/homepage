import m from 'mithril';
import background from './assets/dplus-sublogos-testbedTI.png';
import driverLogo from './assets/driver-logo-compact2.png';
import euLogo from './assets/eu-flag-logo.png';
import logo from './assets/ti.png';

const toList = (obj: { [key: string]: number }) =>
  m(
    'ul',
    Object.keys(obj)
      .filter(k => obj[k])
      .map(k => m('li', m('h5', m('a', { href: `/${k}/`, target: '_blank' }, k.toUpperCase()))))
  );

let state = {} as {
  title: string;
  services: { [key: string]: number };
  debugServices: { [key: string]: number };
  otherServices: { [key: string]: number };
};

export const HomePage = () => ({
  oninit: async () => {
    state = await m.request('/services');
    m.redraw();
  },
  view: () =>
    state && state.services
      ? [
          m('.row', [
            m(
              'nav.yellow.darken-3',
              m('.nav-wrapper', [
                m(
                  'a.brand-logo[href=#]',
                  { style: 'margin: 0 10px 0 20px; left: 20px' },
                  m(`img[width=136][height=60][src=${logo}]`, { style: 'margin-top: 5px; margin-left: -5px;' })
                ),
                m(
                  'h3.center.yellow.darken-3.hide-on-small-only',
                  { style: 'margin: 0 auto; padding: 10px 0;' },
                  state && state.title ? `Online ${state.title} services` : 'Online services'
                ),
              ])
            ),
            m(
              '.section.white',
              m('.row.container.center', [
                m('img', { src: background, width: 400 }),
                m('.row', [
                  m(
                    '.col.s12.m4',
                    m('.icon-block', [
                      m('.center', m('i.material-icons.large', 'event_seat')),
                      m('h5.center', 'Core services'),
                      m('p.light', toList(state.services)),
                    ])
                  ),
                  m(
                    '.col.s12.m4',
                    m('.icon-block', [
                      m('.center', m('i.material-icons.large', 'bug_report')),
                      m('h5.center', 'Debug services'),
                      m('p.light', toList(state.debugServices)),
                    ])
                  ),
                  m(
                    '.col.s12.m4',
                    m('.icon-block', [
                      m('.center', m('i.material-icons.large', 'apps')),
                      m('h5.center', 'Other services'),
                      m('p.light', toList(state.otherServices)),
                    ])
                  ),
                ]),
              ])
            ),
          ]),
          m(
            'footer.page-footer.yellow.darken-3',
            { style: 'height: 100px; padding: 5px 0; position: absolute; bottom: 0; width: 100%' },
            m(
              '.container',
              m('.clearfix', [
                m('div', { style: 'float: left; margin-right: 10px;' }, [
                  m('img', { src: euLogo, width: 100, height: 67, style: 'display: block; margin-left: 20px;' }),
                  m('span', 'v1.0, September 2019'),
                ]),
                m('div', { style: 'float: right; margin-left: 10px;' }, [
                  m('img', { src: driverLogo, width: 67, height: 67, style: 'display: block; margin-left: 40px;' }),
                  m(
                    'a.primary-text',
                    { style: 'display: block', href: 'https://www.project-driver.eu', target: '_blank' },
                    'www.project-driver.eu'
                  ),
                ]),
                m(
                  '.white-text',
                  `This project has received funding from the European Union's 7th Framework Programme for Research,
          Technological Development and Demonstration under Grant Agreement (GA)`
                ),
                m('span', '©DRIVER+'),
              ])
            )
          ),
        ]
      : undefined,
});
