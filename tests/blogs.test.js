const Page = require('./helpers/page');

let page;

beforeEach(async () => {
  page = await Page.build();
  await page.goto('http://localhost:3000');
});

afterEach(async () => {
  await page.close();
});

describe('When Logged in and clicked on the + button', () => {
  beforeEach(async () => {
    await page.login();
    await page.click('a.btn-floating');
  });

  test('Can see blog create form', async () => {
    await page.login();
    await page.click('a.btn-floating');
    const label = await page.getContentsOf('form label');
    expect(label).toEqual('Blog Title');
  });

  describe('And using valid inputs', () => {
    beforeEach(async () => {
      await page.type('.title input', 'Title from test');
      await page.type('.content input', 'Body from test');
      await page.click('form button');
    });

    test('Submiting takes user to review screen', async () => {
      const text = await page.getContentsOf('h5');
      expect(text).toEqual('Please confirm your entries');
    });

    test('Submiting then saving adds blog to index page', async () => {
      await page.click('button.green');
      await page.waitFor('.card');

      const title = await page.getContentsOf('.card-title');
      const content = await page.getContentsOf('p');

      expect(title).toEqual('Title from test');
      expect(content).toEqual('Body from test');
    });
  });

  describe('And using invalid inputs', () => {
    beforeEach(async () => {
      await page.click('form button');
    });

    test('the form shows an error message', async () => {
      const titleError = await page.getContentsOf('.title .red-text');
      const contentError = await page.getContentsOf('.content .red-text');

      expect(titleError).toEqual('You must provide a value');
      expect(contentError).toEqual('You must provide a value');
    });
  });
});

describe('When not loged in', () => {
  const actions = [
    {
      method: 'get',
      path: '/api/blogs',
    },
    {
      method: 'post',
      path: '/api/blogs',
      body: { title: 'My title', content: 'My content9' },
    },
  ];

  test('Blog related actions that are prohibited', async () => {
    const results = await page.execRequests(actions);

    for (let result of results) {
      expect(result).toEqual({ error: 'You must log in!' });
    }
  });

  // THESE TEST BELOW ARE THE SAME AS THE ABOVE BUT IN A DIFERENT WAY
  /* test('user cannot create blog posts', async () => {
    const path = '/api/blogs';
    const method = 'POST';
    const body = { title: 'My title', content: 'My content9' };

    const result = await page.createApiFetch(path, method, body);

    expect(result).toEqual({ error: 'You must log in!' });
  });

  test('user cannot get a list of posts', async () => {
    const path = '/api/blogs';
    const method = 'GET';
    const result = await page.createApiFetch(path, method, body);

    expect(result).toEqual({ error: 'You must log in!' });
  }); */
});
