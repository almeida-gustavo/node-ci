const puppeteer = require('puppeteer');
const sessionFactory = require('../factories/sessionFactory');
const userFactory = require('../factories/userFactory');

class CustomPage {
  static async build() {
    const browser = await puppeteer.launch({ headless: false, timeout: 30000 });
    const page = await browser.newPage();

    const customPage = new CustomPage(page);

    return new Proxy(customPage, {
      get: function (target, property) {
        return target[property] || browser[property] || page[property];
      },
    });
  }

  constructor(page) {
    this.page = page;
  }

  async login() {
    const user = await userFactory();
    const { session, sig } = await sessionFactory(user);

    // // Setting the key on the page
    await this.page.setCookie({ name: 'session', value: session });
    await this.page.setCookie({ name: 'session.sig', value: sig });
    await this.page.goto('localhost:3000/blogs');
    // // This is necessary because when the test is runing, it will atempt to run as fast as possible, and the this.page wont have loaded when it reaches the line below
    await this.page.waitFor('a[href="/auth/logout"]');
  }

  async getContentsOf(selector) {
    return this.page.$eval(selector, (el) => el.innerHTML);
  }

  async createApiFetch(path, method, body) {
    return this.evaluate(
      (_path, _method, _body) => {
        return fetch(_path, {
          method: _method,
          credentials: 'same-origin',
          headers: {
            'Content-Type': 'application/json',
          },
          body: _body ? JSON.stringify(_body) : null,
        }).then((res) => res.json());
      },
      path,
      method,
      body,
    );
  }

  execRequests(actions) {
    return Promise.all(
      actions.map(({ path, method, body }) => {
        return this.createApiFetch(path, method, body);
      }),
    );
  }
}

module.exports = CustomPage;
