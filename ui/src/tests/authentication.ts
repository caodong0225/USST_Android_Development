import {Page} from 'puppeteer';
import {waitForExists} from './utils';
import * as selector from './selector';

const $loginForm = selector.form('#login-form');

export const login = async (page: Page, user = 'admin', pass = 'admin'): Promise<void> => {
    await waitForExists(page, selector.heading(), 'Login');
    expect(page.url()).toContain('/login');
    await page.type($loginForm.input('.name'), user);
    await page.type($loginForm.input('.password'), pass);
    await page.click($loginForm.button('.login'));
    await waitForExists(page, selector.heading(), '所有消息');
    await waitForExists(page, 'button', '登出');
};

export const logout = async (page: Page): Promise<void> => {
    await page.click('#logout');
    await waitForExists(page, selector.heading(), 'Login');
    expect(page.url()).toContain('/login');
};
