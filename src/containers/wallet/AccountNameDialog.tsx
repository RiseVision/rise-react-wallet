import * as React from 'react';
import { action } from 'mobx';
import { inject, observer } from 'mobx-react';
import { RouterStore } from 'mobx-router';
import { accountSettingsNameRoute } from '../../routes';
import Dialog from '../../components/Dialog';
import AccountStore from '../../stores/account';
import AccountNameDialogContent from '../../components/content/AccountNameDialogContent';

interface Props {
  account: AccountStore;
  onNavigateBack: () => void;
}

interface InjectedProps extends Props {
  routerStore: RouterStore;
}

@inject('routerStore')
@observer
class AccountNameDialog extends React.Component<Props> {
  private get injected(): InjectedProps {
    return this.props as InjectedProps;
  }

  @action
  handleChange = (data: { name: string }) => {
    const { account, onNavigateBack } = this.injected;
    account.name = data.name;
    onNavigateBack();
  }

  render() {
    const { account, onNavigateBack, routerStore } = this.injected;

    const isOpen = routerStore.currentView === accountSettingsNameRoute;

    return (
      <Dialog
        open={isOpen}
        onClose={onNavigateBack}
      >
        <AccountNameDialogContent
          account={{
            name: account.name,
            address: account.id,
          }}
          onChange={this.handleChange}
        />
      </Dialog>
    );
  }
}

export default AccountNameDialog;
