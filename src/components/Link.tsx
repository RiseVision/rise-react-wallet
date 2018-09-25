import { inject, observer } from 'mobx-react';
import { Route, RouteParams, RouterStore } from 'mobx-router';
import * as React from 'react';
import RootStore from '../stores/root';

interface Props {
  view?: Route<{}>;
  params?: RouteParams;
  queryParams?: RouteParams;
  onBeforeNavigate?: (view: Route<{}>, params: RouteParams, queryParams: RouteParams) => void;
  children: React.ReactElement<React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    component: React.ReactType;
  }>;
}

interface PropsInjected extends Props {
  store: RootStore;
  routerStore: RouterStore;
}

/**
 * Link component is intended to wrap various material-ui components that can render
 * themselves as other elements and configures them to render as anchor elements
 * and associates the navigation logic with the onClick handler and populates the
 * href attribute.
 */
@inject('store')
@inject('routerStore')
@observer
class Link extends React.Component<Props> {
  get injected(): PropsInjected {
    return this.props as PropsInjected;
  }

  handleClick = (ev: React.MouseEvent<HTMLAnchorElement>) => {
    const { store, routerStore, view, onBeforeNavigate } = this.injected;
    const params = this.injected.params || {};
    const queryParams = this.injected.queryParams || {};

    const isMiddleMouse = ev.button === 2;
    const isMetaOrCtrl = ev.metaKey || ev.ctrlKey;
    const openNewTab = isMiddleMouse || isMetaOrCtrl;
    const isBrowserNavigation = openNewTab;

    if (!isBrowserNavigation && view) {
      ev.preventDefault();
      if (onBeforeNavigate) {
        onBeforeNavigate(view, params, queryParams);
      }
      routerStore.goTo(view, params, store, queryParams);
    }
  }

  render() {
    const {
      view,
      params,
      queryParams,
      children,
      onBeforeNavigate,
      store,
      routerStore,
      ...passthroughProps
    } = this.injected;

    let overrideProps = {};
    if (view) {
      overrideProps = {
        component: 'a',
        href: view.replaceUrlParams(params || {}, queryParams || {}),
        onClick: this.handleClick,
      };
    }

    return React.cloneElement(children, {
      ...passthroughProps,
      ...overrideProps,
    });
  }
}

export default Link;
