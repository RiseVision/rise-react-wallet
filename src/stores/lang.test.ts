// tslint:disable:no-unused-expression
// tslint:disable:no-shadowed-variable
import sinon from 'sinon';
import { SinonStub } from 'sinon';
import lstore from '../utils/store';
import { stub } from '../utils/testHelpers';
import LangStore from './lang';
import delay from 'delay';

let stubs: sinon.SinonStub[];

beforeEach(() => {
  // array to keep stubs to restore them later
  stubs = [];
  // stub methods making network requests
  stub(stubs, LangStore.prototype, 'loadTranslation', () => {
    // empty
  });
});

afterEach(() => {
  lstore.clearAll();
  // check if a test has failed
  if (!stubs) {
    return;
  }
  // dispose all the stubs
  for (const fn of stubs) {
    fn.restore();
  }
});

describe('LangStore.constructor', () => {
  let langStub: SinonStub;
  beforeEach(() => {
    if (!navigator) {
      // @ts-ignore mock for the node env
      navigator = {};
    }
    langStub = stub(
      stubs,
      navigator,
      'languages',
      () => ['en-US', 'en', 'zh-CN', 'ja-JP'],
      true
    );
  });

  it('fallback to en', () => {
    langStub.restore();
    stub(stubs, navigator, 'languages', () => ['ja-JP'], true);
    const store = new LangStore();
    expect(store.locale).toEqual('en');
  });

  it('loadTranslation', async () => {
    const data = {
      default: {
        data: [],
        messages: { test: 'test' }
      }
    };
    // @ts-ignore sinon stub
    LangStore.prototype.loadTranslation.restore();
    stub(stubs, LangStore.prototype, 'importTranslation', async () => data);
    const store = new LangStore();
    // jump to the next tick
    await delay(1);
    // @ts-ignore
    expect(store.translations.get('en').default.messages.test).toEqual('test');
  });

  it('store the locale', () => {
    langStub.restore();
    stub(stubs, navigator, 'languages', () => ['et'], true);
    new LangStore();
    expect(lstore.get('locale')).toEqual('et');
  });

  it('read the locale', () => {
    lstore.set('locale', 'et');
    const store = new LangStore();
    expect(store.locale).toEqual('et');
  });
});

describe('LangStore', () => {
  let store: LangStore;

  beforeEach(async () => {
    const data = {
      default: {
        data: [],
        messages: { test: 'test' }
      }
    };
    stub(
      stubs,
      LangStore.prototype,
      'importTranslation',
      () => data.default.messages
    );
    // @ts-ignore sinon stub
    LangStore.prototype.loadTranslation.restore();
    store = new LangStore();
    await delay(1);
  });

  it('loadTranslation', async () => {
    await store.loadTranslation('et');
    // jump to the next tick
    await delay(100);
    // @ts-ignore sinon stub
    expect(store.translations.get('et').test).toEqual('test');
  });

  it('changeLanguage', async () => {
    await store.changeLanguage('et');
    expect(store.locale).toEqual('et');
    expect(lstore.get('locale')).toEqual('et');
  });

  it('get', () => {
    const msg1 = {
      id: 'test',
      description: 'test desc',
      defaultMessage: 'default'
    };
    const msg2 = {
      id: 'non-existing',
      description: 'test desc',
      defaultMessage: 'default'
    };
    expect(store.get(msg1)).toEqual('test');
    expect(store.get(msg2)).toEqual('default');
  });
});
