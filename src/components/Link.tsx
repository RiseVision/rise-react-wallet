import { Overwrite } from '@material-ui/core';
import { inject, observer } from 'mobx-react';
import * as React from 'react';
import RouterStore, { RouteLink } from '../stores/router';

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
  onClick?(ev: React.MouseEvent<HTMLAnchorElement>): void;
}

interface PropsInjected extends Props {
  routerStore: RouterStore;
}

/**
 * Link component is intended to wrap various material-ui components that can render
 * themselves as other elements and configures them to render as anchor elements
 * and associates the navigation logic with the onClick handler and populates the
 * href attribute.
 */
@inject('routerStore')
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
    const { routerStore } = this.injected;
    const routeLink = this.routeLink;

    const isMiddleMouse = ev.button === 2;
    const isMetaOrCtrl = ev.metaKey || ev.ctrlKey;
    const openNewTab = isMiddleMouse || isMetaOrCtrl;
    const isBrowserNavigation = openNewTab;

    if (!isBrowserNavigation && routeLink) {
      ev.preventDefault();
      routerStore.navigateTo(routeLink);
    }
  }

  render() {
    const {
      route,
      params,
      queryParams,
      onBeforeNavigate,
      onAfterNavigate,
      onClick,
      children,
      routerStore,
      ...passthroughProps
    } = this.injected;

    const routeLink = this.routeLink;

    let overrideProps = {};
    if (routeLink) {
      overrideProps = {
        component: 'a',
        href: routerStore.linkUrl(routeLink),
        // compose onClick if a handler passed
        onClick: onClick
          ? (e: React.MouseEvent<HTMLAnchorElement>) => {
              onClick(e);
              this.handleClick(e);
            }
          : this.handleClick
      };
    }

    return React.cloneElement(children, {
      ...passthroughProps,
      ...overrideProps
    });
  }
}

export default Link;
