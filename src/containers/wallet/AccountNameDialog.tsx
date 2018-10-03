import * as React from 'react';
import { action } from 'mobx';
import { inject, observer } from 'mobx-react';
import { RouterStore } from 'mobx-router-rise';
import { accountSettingsNameRoute } from '../../routes';
import Dialog from '../../components/Dialog';
import RootStore, { RouteLink } from '../../stores/root';
import AccountStore from '../../stores/account';
import AccountNameDialogContent from '../../components/content/AccountNameDialogContent';

interface Props {
  account: AccountStore;
  navigateBackLink: RouteLink;
  open?: boolean;
}

interface InjectedProps extends Props {
  store: RootStore;
  routerStore: RouterStore;
}

@inject('store')
@inject('routerStore')
@observer
class AccountNameDialog extends React.Component<Props> {
  private get injected(): InjectedProps {
    return this.props as InjectedProps;
  }

  @action
  handleChange = (data: { name: string }) => {
    const { account, navigateBackLink, store } = this.injected;
    account.name = data.name;
    store.navigateTo(navigateBackLink);
  }

  render() {
    const { account, navigateBackLink, routerStore, open } = this.injected;

    const isOpen = open || routerStore.currentView === accountSettingsNameRoute;

    return (
      <Dialog open={isOpen} closeLink={navigateBackLink}>
        <AccountNameDialogContent
          account={{
            name: account.name,
            address: account.id
          }}
          onChange={this.handleChange}
        />
      </Dialog>
    );
  }
}

export default AccountNameDialog;
