import { Overwrite } from '@material-ui/core';
import { inject, observer } from 'mobx-react';
import * as React from 'react';
import RootStore, { RouteLink } from '../stores/root';

type BaseProps = Overwrite<
  RouteLink,
  {
    route?: RouteLink['route'];
  }
>;

interface Props extends BaseProps {
  children: React.ReactElement<
    React.AnchorHTMLAttributes<HTMLAnchorElement> & {
      component: React.ReactType;
    }
  >;
}

interface PropsInjected extends Props {
  store: RootStore;
}

/**
 * Link component is intended to wrap various material-ui components that can render
 * themselves as other elements and configures them to render as anchor elements
 * and associates the navigation logic with the onClick handler and populates the
 * href attribute.
 */
@inject('store')
@observer
class Link extends React.Component<Props> {
  get injected(): PropsInjected {
    return this.props as PropsInjected;
  }

  get routeLink(): RouteLink | null {
    const {
      route,
      params,
      queryParams,
      onBeforeNavigate,
      onAfterNavigate
    } = this.injected;

    if (route) {
      return {
        route,
        params,
        queryParams,
        onBeforeNavigate,
        onAfterNavigate
      };
    } else {
      return null;
    }
  }

  handleClick = (ev: React.MouseEvent<HTMLAnchorElement>) => {
    const { store } = this.injected;
    const routeLink = this.routeLink;

    const isMiddleMouse = ev.button === 2;
    const isMetaOrCtrl = ev.metaKey || ev.ctrlKey;
    const openNewTab = isMiddleMouse || isMetaOrCtrl;
    const isBrowserNavigation = openNewTab;

    if (!isBrowserNavigation && routeLink) {
      ev.preventDefault();
      store.navigateTo(routeLink);
    }
  }

  render() {
    const {
      route,
      params,
      queryParams,
      onBeforeNavigate,
      onAfterNavigate,
      children,
      store,
      ...passthroughProps
    } = this.injected;

    const routeLink = this.routeLink;

    let overrideProps = {};
    if (routeLink) {
      overrideProps = {
        component: 'a',
        href: store.linkUrl(routeLink),
        onClick: this.handleClick
      };
    }

    return React.cloneElement(children, {
      ...passthroughProps,
      ...overrideProps
    });
  }
}

export default Link;
