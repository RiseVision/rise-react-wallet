// @ts-ignore
// @ts-ignore
import plugin from 'store/plugins/json2';
import { createStore } from 'store/src/store-engine';
// @ts-ignore
import storages from 'store/storages/all';

export default createStore(storages, [plugin]);
