// @ts-ignore
import { createStore } from 'store/src/store-engine';
// @ts-ignore
import storages from 'store/storages/all';
// @ts-ignore
import plugin from 'store/plugins/json2';

export default createStore(storages, [plugin]);
